import { ApiError, fetchWithAuthRetry, toHttpError } from '@/api/auth';
import type { ChatMessageResponse, ChatParticipantResponse } from '@/types/chat';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 10_000;

if (__DEV__ && !BASE) {
  console.warn('[chat] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. 채팅 연결이 실패할 수 있습니다.');
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (__DEV__) console.warn('[chat] 원본 API 오류:', error);
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('채팅 응답이 늦어 요청을 중단했어요.');
  }
  return new ApiError('네트워크 연결을 확인해 주세요.');
}

async function get<T>(path: string, accessToken: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetchWithAuthRetry(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res, accessToken);
    return res.json() as Promise<T>;
  } catch (error) {
    throw toApiError(error);
  } finally {
    clearTimeout(timer);
  }
}

export const chatApi = {
  getMessages: (spotId: number, accessToken: string) =>
    get<ChatMessageResponse[]>(`/chats/${spotId}/messages`, accessToken),

  getParticipantCount: (spotId: number, accessToken: string) =>
    get<number>(`/chats/${spotId}/participants/count`, accessToken),

  getParticipants: (spotId: number, accessToken: string) =>
    get<ChatParticipantResponse[]>(`/chats/${spotId}/participants`, accessToken),
};

export function getChatWebSocketUrl(): string {
  const normalizedBase = BASE.replace(/\/+$/, '');
  return `${normalizedBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')}/ws`;
}
