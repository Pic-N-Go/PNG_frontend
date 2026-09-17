import { ApiError, fetchWithAuthRetry, toHttpError } from '@/api/auth';
import type { ReportCreateRequest, ReportCreateResponse } from '@/types/report';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 10_000;

if (__DEV__ && !BASE) {
  console.warn('[report] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (__DEV__) console.warn('[report] 원본 오류:', error);
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('응답이 늦어 중단했어요. 신고가 접수됐는지 확인한 뒤 다시 시도해 주세요.');
  }
  return new ApiError('네트워크 연결을 확인해 주세요.');
}

async function request<T>(path: string, body: unknown, token: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetchWithAuthRetry(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) throw await toHttpError(response, token);
    return (await response.json()) as T;
  } catch (error) {
    throw toApiError(error);
  } finally {
    clearTimeout(timer);
  }
}

export const reportApi = {
  reportPost: (
    postId: string | number,
    requestBody: ReportCreateRequest,
    token: string,
  ) => request<ReportCreateResponse>(`/reports/posts/${postId}`, requestBody, token),

  reportReview: (
    reviewId: string | number,
    requestBody: ReportCreateRequest,
    token: string,
  ) => request<ReportCreateResponse>(`/reports/reviews/${reviewId}`, requestBody, token),
};
