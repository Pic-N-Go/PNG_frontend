import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Client, type IFrame, type IMessage } from '@stomp/stompjs';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, getChatWebSocketUrl } from '@/api/chat';
import {
  refreshAccessTokenForWebSocket,
  useAuthStore,
} from '@/store/useAuthStore';
import type { ChatConnectionStatus, ChatMessageResponse } from '@/types/chat';

const RECONNECT_DELAY_MS = 3_000;
const SEND_TIMEOUT_MS = 15_000;
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

function debugStomp(message: string): void {
  if (!__DEV__) return;
  const sanitized = message.replace(
    /^(authorization:\s*bearer\s+)[^\r\n]+/gim,
    '$1[REDACTED]',
  );
  console.debug('[chat:stomp]', sanitized);
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

  const messagesQuery = useQuery({
    queryKey: ['chat', spotId, 'messages', accessToken ?? 'guest'],
    queryFn: () => chatApi.getMessages(spotId, accessToken!),
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

    const publishPendingRetry = (client: Client) => {
      const pending = pendingMessageRef.current;
      if (!pending || pending.retryCount !== 1) return;

      publishWithAuth(
        client,
        `/app/chats/${spotId}/messages`,
        tokenForConnection,
        JSON.stringify({ content: pending.content }),
      );
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
      debug: debugStomp,
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

        publishWithAuth(client, `/app/chats/${spotId}/enter`, tokenForConnection);
        publishPendingRetry(client);

        void queryClient.invalidateQueries({
          queryKey: ['chat', spotId],
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
        if (__DEV__) {
          console.warn('[chat] WebSocket 종료:', {
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
          publishWithAuth(client, `/app/chats/${spotId}/leave`, tokenForConnection);
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

  const messages = useMemo(
    () => mergeMessages(messagesQuery.data ?? [], liveMessages),
    [liveMessages, messagesQuery.data],
  );

  return {
    messages,
    participantCount: liveParticipantCount ?? participantCountQuery.data ?? 0,
    connectionStatus,
    connectionError,
    isSending,
    isLoading: messagesQuery.isLoading || participantCountQuery.isLoading,
    isHistoryError: messagesQuery.isError || participantCountQuery.isError,
    currentUserId,
    sendMessage,
    refetch: async () => {
      await Promise.all([messagesQuery.refetch(), participantCountQuery.refetch()]);
    },
  };
}
