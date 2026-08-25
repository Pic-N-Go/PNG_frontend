import { ApiError, fetchWithAuthRetry, toHttpError } from '@/api/auth';
import type { FestivalListParams, FestivalResponse, PageFestivalResponse } from '@/types/festival';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 10_000;

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (__DEV__) console.warn('[festival-api] 오류:', err);
  if (err instanceof Error) {
    if (err.name === 'AbortError') return new ApiError('요청 시간이 초과되었습니다.', 408);
    return new ApiError('네트워크 연결을 확인해주세요.', 0);
  }
  return new ApiError('알 수 없는 오류가 발생했습니다.', 0);
}

async function parseBody<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

async function request<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchWithAuthRetry(`${BASE}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res);
    return await parseBody<T>(res);
  } catch (err) {
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
  }
}

export const festivalApi = {
  getFestivals: (params: FestivalListParams = {}) => {
    const { status, date, page = 0, size = 20 } = params;
    const queryParams: string[] = [];
    if (status) queryParams.push(`status=${status}`);
    if (date) queryParams.push(`date=${encodeURIComponent(date)}`);
    if (page > 0) queryParams.push(`page=${page}`);
    if (size !== 20) queryParams.push(`size=${size}`);

    const qs = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    return request<PageFestivalResponse>(`/festivals${qs}`);
  },

  getFestival: (id: number | string) => {
    return request<FestivalResponse>(`/festivals/${id}`);
  },
};
