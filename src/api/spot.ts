// 스팟 상세 관련 API (순수 fetch). 매핑은 hooks/useSpot.ts에서 처리.
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md
import { ApiError, toHttpError } from '@/api/auth';
import type {
  BookmarkCollectionDTO,
  PhotogenicScoreResponse,
  ReviewCreateRequest,
  MyReviewListResponse,
  ReviewListResponse,
  ReviewPhotoDTO,
  ReviewResponseDTO,
  ReviewSortApi,
  SpotDetailResponse,
  SpotPhotosResponse,
  PageSpotResponse,
  SpotMapResponse,
  SpotSummaryResponse,
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

// 204 말고도 본문 없는 성공 응답이 있다(DELETE의 200/202). res.json()을 그대로 부르면
// 파싱 오류가 toApiError를 타고 "네트워크 연결을 확인해 주세요"로 바뀌어, 성공한 요청이
// 실패로 보인다. 본문이 있을 때만 파싱한다.
async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
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
    if (!res.ok) throw await toHttpError(res, token);
    return await parseBody<T>(res);
  } catch (err) {
    throw toApiError(err);
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
    if (!res.ok) throw await toHttpError(res, token);
    return await parseBody<T>(res);
  } catch (err) {
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
  }
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
  // 비로그인도 조회되지만 토큰이 없으면 서버가 "나"를 몰라 myReviewId가 항상 null로 온다.
  // 리뷰 탭의 작성/수정 분기가 이 값에 걸려 있어 로그인 상태면 반드시 보낸다.
  // (응답의 isBookmarked도 유저별 값이지만 mapSpotDetail이 버리고 SpotDetailScreen이
  //  useBookmarkCollections로 따로 구하므로 여기에 걸려 있지 않다.)
  getDetail: (id: string | number, token?: string) => request<SpotDetailResponse>(`/spots/${id}`, { token }),

  // 5. 스팟 요약 카드 조회 (GET /spots/{id}/summary)
  getSummary: (id: string | number) => request<SpotSummaryResponse>(`/spots/${id}/summary`),

  getPhotos: (id: string | number) => request<SpotPhotosResponse>(`/spots/${id}/photos`),

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

  /**
   * 사진 추가. 파트 이름은 반드시 `photos`이고, 응답은 추가된 것만이 아니라
   * 그 리뷰의 **전체** 사진 목록이다 — 받은 값으로 화면을 갈아끼우면 된다.
   * 상한은 합계 기준(기존 + 신규 > 5 → 400 REVIEW_PHOTO_TOO_MANY).
   */
  addReviewPhotos: (reviewId: number, photos: ReviewPhotoUpload[], token: string) => {
    const form = new FormData();
    photos.forEach((photo) => form.append('photos', photo as unknown as Blob));
    return upload<ReviewPhotoDTO[]>(`/reviews/${reviewId}/photos`, form, token);
  },

  /**
   * 리뷰 단건. 수정 폼 시드 전용이라 탭한 시점에만 부른다 — 스팟 상세에 리뷰를 심으면
   * 사진 presigned URL을 스팟 조회마다 서명해야 한다. 본인 리뷰가 아니면 403, 없으면 404.
   */
  getReview: (reviewId: number, token: string) =>
    request<ReviewResponseDTO>(`/reviews/${reviewId}`, { token }),

  // 개별 삭제(204). 다른 리뷰의 photoId는 404 REVIEW_PHOTO_NOT_FOUND로 거부된다.
  deleteReviewPhoto: (reviewId: number, photoId: number, token: string) =>
    request<void>(`/reviews/${reviewId}/photos/${photoId}`, { method: 'DELETE', token }),

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
