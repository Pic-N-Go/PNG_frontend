// 스팟 상세 관련 API (순수 fetch). 매핑은 hooks/useSpot.ts에서 처리.
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md
import { ApiError } from '@/api/auth';
import type {
  BookmarkCollectionDTO,
  ChecklistResponse,
  ChecklistUserItemDTO,
  PhotogenicScoreResponse,
  ReviewListResponse,
  ReviewSortApi,
  SpotDetailResponse,
  PageSpotResponse,
  SpotMapResponse,
} from '@/types/spot';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

if (__DEV__ && !BASE) {
  console.warn('[spot] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

const TIMEOUT_MS = 10_000;

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

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
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new ApiError(err.message ?? `HTTP ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function buildCategoryQuery(category?: string | string[]): string {
  if (!category) return '';
  if (Array.isArray(category)) {
    const valid = category.filter((c) => c && c !== 'ALL' && c !== 'all');
    if (valid.length === 0) return '';
    return `category=${valid.map((c) => encodeURIComponent(c)).join(',')}&`;
  }
  if (category === 'ALL' || category === 'all') return '';
  return `category=${encodeURIComponent(category)}&`;
}

interface ReviewQuery {
  sort?: ReviewSortApi;
  page?: number;
  size?: number;
}

export interface MapSpotsParams {
  southWestLat?: number;
  southWestLng?: number;
  northEastLat?: number;
  northEastLng?: number;
  category?: string | string[];
  size?: number;
  token?: string;
}

export interface GetSpotsParams {
  category?: string | string[];
  sort?: 'latest' | 'popular' | 'score';
  page?: number;
  size?: number;
  token?: string;
}

export interface SearchSpotsParams {
  keyword: string;
  category?: string | string[];
  page?: number;
  size?: number;
  token?: string;
}

export const spotApi = {
  // 1. 지도 영역 스팟 핀 목록 조회 (GET /spots/map)
  getMapSpots: (params: MapSpotsParams = {}) => {
    const { southWestLat, southWestLng, northEastLat, northEastLng, category, size = 100, token } = params;
    const catQs = buildCategoryQuery(category);
    const boundsQs = (southWestLat !== undefined && southWestLng !== undefined && northEastLat !== undefined && northEastLng !== undefined)
      ? `southWestLat=${southWestLat}&southWestLng=${southWestLng}&northEastLat=${northEastLat}&northEastLng=${northEastLng}&`
      : '';
    return request<SpotMapResponse[]>(`/spots/map?${boundsQs}${catQs}size=${size}`, { token });
  },

  // 2. 스팟 목록 조회 (페이징 & 필터) (GET /spots)
  getSpots: (params: GetSpotsParams = {}) => {
    const { category, sort = 'latest', size = 50, page = 0, token } = params;
    const catQs = buildCategoryQuery(category);
    return request<PageSpotResponse>(`/spots?${catQs}sort=${sort}&size=${size}&page=${page}`, { token });
  },

  // 3. 스팟 키워드 검색 (GET /spots/search)
  searchSpots: (params: SearchSpotsParams) => {
    const { keyword, category, size = 20, page = 0, token } = params;
    const catQs = buildCategoryQuery(category);
    const kwQs = `keyword=${encodeURIComponent(keyword.trim())}&`;
    return request<PageSpotResponse>(`/spots/search?${kwQs}${catQs}size=${size}&page=${page}`, { token });
  },

  // 4. 스팟 상세 정보 조회 (GET /spots/{id})
  getDetail: (id: string | number) => request<SpotDetailResponse>(`/spots/${id}`),

  getReviews: (id: string | number, { sort = 'LATEST', page = 0, size = 20 }: ReviewQuery = {}) =>
    request<ReviewListResponse>(`/spots/${id}/reviews?sort=${sort}&page=${page}&size=${size}`),

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
