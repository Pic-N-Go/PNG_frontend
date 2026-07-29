// 스팟 상세 관련 API (순수 fetch). 매핑은 hooks/useSpot.ts에서 처리.
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md
import { ApiError, toHttpError } from '@/api/auth';
import type {
  BookmarkCollectionDTO,
  ChecklistResponse,
  ChecklistUserItemDTO,
  PhotogenicScoreResponse,
  ReviewCreateRequest,
  MyReviewListResponse,
  ReviewListResponse,
  ReviewResponseDTO,
  ReviewSortApi,
  SpotDetailResponse,
  PageSpotResponse,
} from '@/types/spot';

/** RN이 파일 파트로 인식하는 최소 형태 (expo/RN 이미지 피커 결과 그대로) */
export interface ReviewPhotoUpload {
  uri: string;
  name: string;
  type: string;
}

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

if (__DEV__ && !BASE) {
  console.warn('[spot] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

const TIMEOUT_MS = 10_000;
// 사진 최대 5장. 60초는 약한 회선에서 자주 걸렸고, 중단 시 서버엔 저장돼 중복 위험이 있어
// 넉넉하게 잡는다. 진행률 표시는 fetch로 불가해 별도 과제(XHR 전환).
const UPLOAD_TIMEOUT_MS = 180_000;

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

// fetch는 타임아웃(abort)·전송 실패를 'Aborted' / 'Network request failed' 같은 영문으로 던진다.
// 그대로 Alert에 노출되므로 한국어 메시지로 바꿔서 올린다.
function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  // 사용자에게는 한국어 메시지를 보여주되, 원인을 잃으면 디버깅이 불가능해 dev에서는 원본을 남긴다.
  if (__DEV__) console.warn('[api] 원본 오류:', err);
  if (err instanceof Error && err.name === 'AbortError') {
    // 서버가 이미 처리를 끝냈을 수 있어 "다시 시도"를 권하지 않는다(멱등 키가 없어 중복이 생긴다).
    return new ApiError('응답이 늦어 중단했어요. 등록됐는지 확인한 뒤 다시 시도해 주세요.');
  }
  return new ApiError('네트워크 연결을 확인해 주세요.');
}

async function request<T>(path: string, opts: { method?: Method; body?: unknown; token?: string } = {}): Promise<T> {
  const { method = 'GET', body, token } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res);
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
  }
}

interface ReviewQuery {
  sort?: ReviewSortApi;
  page?: number;
  size?: number;
}

/**
 * multipart 전용 경로. request()는 Content-Type을 application/json으로 고정하므로 쓸 수 없고,
 * FormData를 보낼 땐 boundary를 런타임이 붙이도록 Content-Type을 아예 지정하지 않아야 한다.
 */
async function upload<T>(path: string, form: FormData, token: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res);
    return (await res.json()) as T;
  } catch (err) {
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
  }
}

export const spotApi = {
  getSpots: (params: { category?: string; size?: number; page?: number } = {}) => {
    const { category, size = 50, page = 0 } = params;
    const categoryQuery = (category && category !== 'ALL') ? `category=${category}&` : '';
    return request<PageSpotResponse>(`/spots?${categoryQuery}size=${size}&page=${page}`);
  },

  getDetail: (id: string | number) => request<SpotDetailResponse>(`/spots/${id}`),

  getReviews: (id: string | number, { sort = 'LATEST', page = 0, size = 20 }: ReviewQuery = {}) =>
    request<ReviewListResponse>(`/spots/${id}/reviews?sort=${sort}&page=${page}&size=${size}`),

  // multipart/form-data — JSON은 `request` 파트, 사진은 `photos` 파트.
  // 서버 상한 5장, 초과 시 400 REVIEW_PHOTO_TOO_MANY (스펙 2026-07-29 변경: 10장 → 5장).
  createReview: (id: string | number, body: ReviewCreateRequest, photos: ReviewPhotoUpload[], token: string) => {
    const form = new FormData();
    // @RequestPart("request")가 파트별 Content-Type으로 컨버터를 고른다. RN FormData는 {string, type}
    // 형태를 넘겨야 그 헤더가 붙고, JSON.stringify만 넘기면 text/plain으로 나가 415가 난다.
    form.append('request', { string: JSON.stringify(body), type: 'application/json' } as unknown as Blob);
    photos.forEach((photo) => form.append('photos', photo as unknown as Blob));
    return upload<ReviewResponseDTO>(`/spots/${id}/reviews`, form, token);
  },

  // 내가 쓴 리뷰. 스팟별 조회와 달리 페이징 필드가 최상위에 온다(content/totalElements/...).
  getMyReviews: (token: string, { sort = 'LATEST', page = 0, size = 20 }: ReviewQuery = {}) =>
    request<MyReviewListResponse>(`/users/me/reviews?sort=${sort}&page=${page}&size=${size}`, { token }),

  // 작성과 달리 JSON. 서버가 사진을 다루지 않아 기존 사진은 그대로 유지된다(변경 불가).
  // 경로가 /spots/{spotId}가 아니라 /reviews/{reviewId}인 점에 주의.
  updateReview: (reviewId: number, body: ReviewCreateRequest, token: string) =>
    request<ReviewResponseDTO>(`/reviews/${reviewId}`, { method: 'PUT', body, token }),

  // 204. 서버가 S3 사진 삭제와 스팟 통계 재계산까지 처리한다.
  deleteReview: (reviewId: number, token: string) =>
    request<void>(`/reviews/${reviewId}`, { method: 'DELETE', token }),

  getChecklist: (id: string | number, token: string) =>
    request<ChecklistResponse>(`/spots/${id}/checklist`, { token }),

  addChecklistItem: (id: string | number, content: string, token: string) =>
    request<ChecklistUserItemDTO>(`/spots/${id}/checklist`, { method: 'POST', body: { content }, token }),

  deleteChecklistItem: (id: string | number, itemId: number, token: string) =>
    request<void>(`/spots/${id}/checklist/${itemId}`, { method: 'DELETE', token }),

  // 기본 항목 숨김 (멱등, 204). userItem 삭제와 달리 defaultItemId 사용.
  hideDefaultChecklistItem: (id: string | number, defaultItemId: number, token: string) =>
    request<void>(`/spots/${id}/checklist/default/${defaultItemId}`, { method: 'DELETE', token }),

  getPhotogenicScore: (id: string | number, { date, time }: { date?: string; time?: string } = {}) => {
    const qs: string[] = [];
    if (date) qs.push(`date=${date}`);
    if (time) qs.push(`time=${encodeURIComponent(time)}`);
    const suffix = qs.length ? `?${qs.join('&')}` : '';
    return request<PhotogenicScoreResponse>(`/spots/${id}/photogenic-score${suffix}`);
  },

  // 북마크 컬렉션 — 유저별. 최초 조회 시 서버가 "내 즐겨찾기" 자동 생성.
  getBookmarkCollections: (spotId: string | number, token: string) =>
    request<BookmarkCollectionDTO[]>(`/bookmark-collections?spotId=${spotId}`, { token }),

  createBookmarkCollection: (body: { name: string; color: string; icon: string }, token: string) =>
    request<BookmarkCollectionDTO>('/bookmark-collections', { method: 'POST', body, token }),

  // 스팟 소속 통째 동기화 (체크된 집합 → 추가+제거, 빈 배열=전체 제거). 204.
  syncSpotBookmarks: (spotId: string | number, collectionIds: number[], token: string) =>
    request<void>(`/spots/${spotId}/bookmark-collections`, { method: 'PUT', body: { collectionIds }, token }),
};
