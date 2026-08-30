import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Client, type IFrame, type IMessage } from '@stomp/stompjs';
import {
  keepPreviousData,
  type InfiniteData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { chatApi, getChatWebSocketUrl } from '@/api/chat';
import {
  refreshAccessTokenForWebSocket,
  useAuthStore,
} from '@/store/useAuthStore';
import type { ChatConnectionStatus, ChatMessageResponse } from '@/types/chat';

const RECONNECT_DELAY_MS = 3_000;
const SEND_TIMEOUT_MS = 15_000;
const MESSAGE_PAGE_SIZE = 20;
const ACCESS_TOKEN_EXPIRED_MARKERS = [
  '만료된 WebSocket Access Token입니다.',
  'ACCESS_TOKEN_EXPIRED',
];

type PendingMessage = {
  content: string;
  retryCount: number;
};

function authorizationHeaders(accessToken: string): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

function isAccessTokenExpiredFrame(frame: IFrame): boolean {
  const errorText = `${frame.headers.message ?? ''}\n${frame.body ?? ''}`;
  return ACCESS_TOKEN_EXPIRED_MARKERS.some((marker) => errorText.includes(marker));
}

function mergeMessages(
  history: ChatMessageResponse[],
  liveMessages: ChatMessageResponse[],
): ChatMessageResponse[] {
  const byId = new Map<number, ChatMessageResponse>();
  for (const message of [...history, ...liveMessages]) byId.set(message.id, message);

  return [...byId.values()].sort((a, b) => {
    const timeDifference = Date.parse(a.createdAt) - Date.parse(b.createdAt);
    return Number.isNaN(timeDifference) || timeDifference === 0
      ? a.id - b.id
      : timeDifference;
  });
}

function parseMessage(frame: IMessage): ChatMessageResponse | null {
  try {
    const parsed = JSON.parse(frame.body) as Partial<ChatMessageResponse>;
    if (
      typeof parsed.id !== 'number' ||
      typeof parsed.senderId !== 'number' ||
      typeof parsed.senderNickname !== 'string' ||
      parsed.type !== 'TEXT' ||
      typeof parsed.content !== 'string' ||
      typeof parsed.createdAt !== 'string'
    ) {
      return null;
    }
    return parsed as ChatMessageResponse;
  } catch {
    return null;
  }
}

export function useChat(spotId: number) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const [liveMessages, setLiveMessages] = useState<ChatMessageResponse[]>([]);
  const [liveParticipantCount, setLiveParticipantCount] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ChatConnectionStatus>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const pendingMessageRef = useRef<PendingMessage | null>(null);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messagesQuery = useInfiniteQuery({
    queryKey: ['chat', spotId, 'messages', accessToken ?? 'guest'],
    queryFn: ({ pageParam }) =>
      chatApi.getMessages(spotId, accessToken!, {
        beforeId: pageParam,
        size: MESSAGE_PAGE_SIZE,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < MESSAGE_PAGE_SIZE) return undefined;
      return lastPage[0]?.id;
    },
    enabled: !!accessToken && Number.isFinite(spotId),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });

  const participantCountQuery = useQuery({
    queryKey: ['chat', spotId, 'participants', 'count', accessToken ?? 'guest'],
    queryFn: () => chatApi.getParticipantCount(spotId, accessToken!),
    enabled: !!accessToken && Number.isFinite(spotId),
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });

  const clearPendingTimeout = useCallback(() => {
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  }, []);

  const clearPendingMessage = useCallback(() => {
    clearPendingTimeout();
    pendingMessageRef.current = null;
    setIsSending(false);
  }, [clearPendingTimeout]);

  const startPendingTimeout = useCallback(() => {
    clearPendingTimeout();
    pendingTimeoutRef.current = setTimeout(() => {
      pendingMessageRef.current = null;
      setIsSending(false);
      setConnectionError('메시지 전송 결과를 확인하지 못했어요. 다시 확인해 주세요.');
    }, SEND_TIMEOUT_MS);
  }, [clearPendingTimeout]);

  useEffect(() => {
    setLiveMessages([]);
    setLiveParticipantCount(null);
    clearPendingMessage();
  }, [clearPendingMessage, spotId]);

  useEffect(() => {
    if (!accessToken || !Number.isFinite(spotId)) {
      setConnectionStatus('disconnected');
      return;
    }

    let disposed = false;
    let pausedInBackground = false;
    const tokenForConnection = accessToken;

    const publishWithAuth = (
      client: Client,
      destination: string,
      token: string,
      body = '{}',
    ) => {
      client.publish({
        destination,
        headers: {
          ...authorizationHeaders(token),
          'content-type': 'application/json',
        },
        body,
      });
    };

    const publishWithCurrentAuth = (
      client: Client,
      destination: string,
      body = '{}',
    ): boolean => {
      const currentToken = useAuthStore.getState().accessToken;
      if (!currentToken) return false;

      publishWithAuth(client, destination, currentToken, body);
      return true;
    };

    const publishPendingRetry = (client: Client) => {
      const pending = pendingMessageRef.current;
      if (!pending || pending.retryCount !== 1) return;

      const published = publishWithCurrentAuth(
        client,
        `/app/chats/${spotId}/messages`,
        JSON.stringify({ content: pending.content }),
      );
      if (!published) {
        clearPendingMessage();
        setConnectionError('채팅 인증 정보를 확인할 수 없어요.');
        return;
      }
      startPendingTimeout();
    };

    const client = new Client({
      brokerURL: getChatWebSocketUrl(),
      connectHeaders: authorizationHeaders(tokenForConnection),
      reconnectDelay: RECONNECT_DELAY_MS,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      connectionTimeout: 10_000,
      // Preserve STOMP's trailing NULL byte when React Native sends frames.
      forceBinaryWSFrames: true,
      // React Native WebSocket may remove STOMP's trailing NULL byte.
      appendMissingNULLonIncoming: true,
      onConnect: () => {
        if (disposed) return;
        setConnectionStatus('connected');
        setConnectionError(null);

        client.subscribe(`/topic/chats/${spotId}`, (frame) => {
          const message = parseMessage(frame);
          if (!message) return;

          setLiveMessages((current) => mergeMessages(current, [message]));

          const pending = pendingMessageRef.current;
          if (
            pending &&
            message.senderId === useAuthStore.getState().user?.id &&
            message.content === pending.content
          ) {
            clearPendingMessage();
          }
        });

        client.subscribe(`/topic/chats/${spotId}/participants/count`, (frame) => {
          const count = Number(frame.body);
          if (Number.isFinite(count) && count >= 0) setLiveParticipantCount(count);
        });

        const entered = publishWithCurrentAuth(client, `/app/chats/${spotId}/enter`);
        if (!entered) {
          setConnectionStatus('disconnected');
          setConnectionError('채팅 인증 정보를 확인할 수 없어요.');
          void client.deactivate({ force: true });
          return;
        }
        publishPendingRetry(client);

        // 재연결 때 무한 쿼리 전체를 다시 요청하면 커서 구간이 밀려 이미 조회한 과거 메시지가
        // 캐시에서 사라질 수 있다. 최신 페이지 하나만 받아 기존 첫 페이지와 병합한다.
        // TODO(chat-sync): 연결이 끊긴 동안 20개를 초과한 메시지가 생기면 중간 메시지를 놓칠 수 있다.
        // 백엔드 afterId 커서 또는 기존 캐시와 겹칠 때까지 beforeId를 반복 조회하는 동기화가 필요하다.
        void chatApi
          .getMessages(spotId, tokenForConnection, { size: MESSAGE_PAGE_SIZE })
          .then((latestMessages) => {
            queryClient.setQueryData<InfiniteData<ChatMessageResponse[], number | undefined>>(
              ['chat', spotId, 'messages', tokenForConnection],
              (cached) => {
                if (!cached) {
                  return { pages: [latestMessages], pageParams: [undefined] };
                }

                return {
                  ...cached,
                  pages: [
                    mergeMessages(cached.pages[0] ?? [], latestMessages),
                    ...cached.pages.slice(1),
                  ],
                };
              },
            );
          })
          .catch((error: unknown) => {
            if (__DEV__) console.warn('[chat] 재연결 후 최신 메시지 동기화 실패:', error);
          });

        void queryClient.invalidateQueries({
          queryKey: ['chat', spotId, 'participants', 'count', tokenForConnection],
          exact: true,
        });
      },
      onStompError: (frame) => {
        if (disposed) return;

        if (isAccessTokenExpiredFrame(frame)) {
          const pending = pendingMessageRef.current;
          const shouldRetryPendingMessage = !!pending && pending.retryCount === 0;
          if (pending && !shouldRetryPendingMessage) {
            clearPendingMessage();
            setConnectionError('메시지를 전송하지 못했어요. 다시 시도해 주세요.');
          }

          clearPendingTimeout();
          if (shouldRetryPendingMessage) pending.retryCount = 1;
          setConnectionStatus('reconnecting');
          // 만료된 토큰으로 자동 재접속이 먼저 실행되지 않게 멈춘다.
          client.reconnectDelay = 0;
          void client.deactivate({ force: true });

          void refreshAccessTokenForWebSocket(tokenForConnection)
            .then((refreshedToken) => {
              if (!refreshedToken && !disposed) {
                clearPendingMessage();
                setConnectionStatus('error');
                setConnectionError('채팅 인증을 갱신하지 못했어요.');
              }
            })
            .catch((error) => {
              if (__DEV__) console.warn('[chat] Access Token 갱신 실패:', error);
              if (!disposed) {
                clearPendingMessage();
                setConnectionStatus('error');
                setConnectionError('채팅 인증을 갱신하지 못했어요.');
              }
            });
          return;
        }

        clearPendingMessage();
        setConnectionStatus('error');
        setConnectionError('채팅 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');
      },
      onWebSocketClose: (event) => {
        if (disposed) return;

        const isExpectedClose = event.code === 1000 || event.code === 4001;
        if (__DEV__ && !isExpectedClose) {
          console.warn('[chat] WebSocket 비정상 종료:', {
            code: event.code,
            reason: event.reason || '(이유 없음)',
          });
        }
        setConnectionStatus(pausedInBackground ? 'disconnected' : 'reconnecting');
      },
      onWebSocketError: () => {
        if (disposed) return;
        setConnectionStatus('reconnecting');
        setConnectionError('채팅 서버에 다시 연결하고 있어요.');
      },
    });

    clientRef.current = client;
    setConnectionStatus('connecting');
    client.activate();

    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        pausedInBackground = false;
        if (!disposed && !client.active) {
          setConnectionStatus('connecting');
          client.activate();
        }
        return;
      }

      pausedInBackground = true;
      if (client.connected) {
        try {
          publishWithCurrentAuth(client, `/app/chats/${spotId}/leave`);
        } catch (error) {
          if (__DEV__) console.warn('[chat] 백그라운드 전환 중 퇴장 전송 실패:', error);
        }
      }
      void client.deactivate();
    });

    return () => {
      disposed = true;
      appStateSubscription.remove();
      if (client.connected) {
        try {
          const latestToken = useAuthStore.getState().accessToken;
          if (latestToken) {
            publishWithAuth(client, `/app/chats/${spotId}/leave`, latestToken);
          }
        } catch (error) {
          if (__DEV__) console.warn('[chat] 채팅방 퇴장 전송 실패:', error);
        }
      }
      if (clientRef.current === client) clientRef.current = null;
      void client.deactivate();
    };
  }, [
    accessToken,
    clearPendingMessage,
    clearPendingTimeout,
    queryClient,
    spotId,
    startPendingTimeout,
  ]);

  useEffect(() => clearPendingTimeout, [clearPendingTimeout]);

  const sendMessage = useCallback(
    (rawContent: string): boolean => {
      const content = rawContent.trim();
      const client = clientRef.current;
      const latestToken = useAuthStore.getState().accessToken;

      if (!content || content.length > 1_000 || !client?.connected || !latestToken || isSending) {
        return false;
      }

      pendingMessageRef.current = { content, retryCount: 0 };
      setIsSending(true);
      setConnectionError(null);

      try {
        client.publish({
          destination: `/app/chats/${spotId}/messages`,
          headers: {
            ...authorizationHeaders(latestToken),
            'content-type': 'application/json',
          },
          body: JSON.stringify({ content }),
        });
        startPendingTimeout();
        return true;
      } catch (error) {
        if (__DEV__) console.warn('[chat] 메시지 전송 실패:', error);
        clearPendingMessage();
        setConnectionError('메시지를 전송하지 못했어요. 연결을 확인해 주세요.');
        return false;
      }
    },
    [clearPendingMessage, isSending, spotId, startPendingTimeout],
  );

  const historyMessages = useMemo(
    () => messagesQuery.data?.pages.flat() ?? [],
    [messagesQuery.data],
  );

  const messages = useMemo(
    () => mergeMessages(historyMessages, liveMessages),
    [historyMessages, liveMessages],
  );

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = messagesQuery;

  const fetchOlderMessages = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    await fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    messages,
    participantCount: liveParticipantCount ?? participantCountQuery.data ?? 0,
    connectionStatus,
    connectionError,
    isSending,
    isLoading: messagesQuery.isLoading || participantCountQuery.isLoading,
    isHistoryError: messagesQuery.isError || participantCountQuery.isError,
    hasOlderMessages: hasNextPage,
    isFetchingOlderMessages: isFetchingNextPage,
    isOlderMessagesError: messagesQuery.isFetchNextPageError,
    currentUserId,
    sendMessage,
    fetchOlderMessages,
    refetch: async () => {
      await Promise.all([messagesQuery.refetch(), participantCountQuery.refetch()]);
    },
  };
}
