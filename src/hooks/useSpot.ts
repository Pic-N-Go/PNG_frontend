// 스팟 상세 화면 서버 상태 훅 (TanStack Query)
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/auth';
import { spotApi } from '@/api/spot';
import type { ReviewPhotoUpload, MapSpotsParams, GetSpotsParams, SearchSpotsParams } from '@/api/spot';
import { useAuthStore } from '@/store/useAuthStore';
import { mapMyReviewPages, mapPhotogenicScore, mapReviewExif, mapReviewPages, mapSpotDetail, toHttps } from '@/utils/spotMappers';
import type { ReviewCreateRequest, ReviewSortApi } from '@/types/spot';


export function useSpotDetail(id: string) {
  // 응답에 유저별 값(myReviewId·isBookmarked)이 섞여 있어 토큰까지 키에 넣는다. 목록류와 같은 패턴.
  // 무효화(invalidateReviewCaches)는 ['spot', id, 'detail'] prefix로 걸려 있어 그대로 매칭된다.
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['spot', id, 'detail', token ?? 'guest'],
    queryFn: () => spotApi.getDetail(id, token ?? undefined),
    enabled: !!id,
    select: mapSpotDetail,
  });
}

// 히어로 풀스크린 뷰어용 실제 사진 URL 목록 (TourAPI 사진만, stats.photoCount보다 적을 수 있음)
export function useSpotPhotos(id: string) {
  return useQuery({
    queryKey: ['spot', id, 'photos'],
    queryFn: () => spotApi.getPhotos(id),
    enabled: !!id,
    select: (res) => res.photos.map((p) => toHttps(p.originUrl)),
  });
}

/**
 * 리뷰 사진의 EXIF (photoId → 표시 모델). 라이트박스에서 정보 버튼을 눌렀을 때만 부른다 —
 * 리뷰 목록에 심으면 사진 수만큼 응답이 커지고, 대부분의 사용자는 열지 않는다.
 * 업로드 시점에 고정되는 값이라 재조회할 이유가 없어 stale 처리하지 않는다.
 */
export function useReviewExif(reviewId: string | number | null, enabled: boolean) {
  // 호출부마다 id 타입이 다르다 — 리뷰 탭은 Review.id(string), 마이페이지는 MyReview.reviewId(number).
  // 그대로 키에 넣으면 같은 리뷰가 두 캐시로 갈리고, number 키를 쓰는 reviewKey() 무효화가
  // string 쪽엔 걸리지 않는다(staleTime: Infinity라 사진 추가 후에도 옛 응답이 남는다).
  const key = reviewId != null ? Number(reviewId) : null;
  return useQuery({
    queryKey: ['review', key, 'exif'],
    queryFn: () => spotApi.getReviewExif(key!),
    enabled: enabled && reviewId != null,
    staleTime: Infinity,
    select: mapReviewExif,
  });
}

export function useSpotSummary(id?: string | number | null) {
  return useQuery({
    queryKey: ['spot', id ? String(id) : null, 'summary'],
    queryFn: () => spotApi.getSummary(id!),
    enabled: !!id,
    staleTime: SPOTS_STALE_TIME,
  });
}

// 스팟 목록류는 자주 바뀌지 않으므로 1분간 fresh로 취급한다.
// 지도 이동마다 마운트/재조회가 반복되는 것을 막는 용도.
const SPOTS_STALE_TIME = 60 * 1000;

type QueryToggle = { enabled?: boolean };

export function useMapSpots(params?: MapSpotsParams, options?: QueryToggle) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['spots', 'map', params?.southWestLat, params?.southWestLng, params?.northEastLat, params?.northEastLng, params?.category, params?.size, token ?? 'guest'],
    queryFn: () => spotApi.getMapSpots({ ...params, token: token ?? undefined }),
    enabled: options?.enabled ?? true,
    staleTime: SPOTS_STALE_TIME,
    // 지도를 옮기는 동안 이전 핀을 유지해 마커가 깜빡이지 않게 한다.
    placeholderData: keepPreviousData,
  });
}

export function useSpots(params?: GetSpotsParams, options?: QueryToggle) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['spots', 'list', params?.category ?? 'ALL', params?.sort ?? 'latest', params?.page ?? 0, params?.size ?? 50, token ?? 'guest'],
    queryFn: () => spotApi.getSpots({ ...params, token: token ?? undefined }),
    enabled: options?.enabled ?? true,
    staleTime: SPOTS_STALE_TIME,
  });
}

// 관심 테마 기반 추천 스팟. 서버가 userDetails.getId()를 그대로 쓰므로 로그인 필수다.
export function useRecommendedSpots(limit = 10, options?: QueryToggle) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['spots', 'recommended', limit, token ?? 'guest'],
    queryFn: () => spotApi.getRecommendedSpots(limit, token ?? undefined),
    enabled: !!token && (options?.enabled ?? true),
    staleTime: SPOTS_STALE_TIME,
  });
}

export function useSearchSpots(params: SearchSpotsParams, options?: QueryToggle) {
  const token = useAuthStore((s) => s.accessToken);
  const hasKeyword = !!params.keyword && params.keyword.trim().length > 0;
  return useQuery({
    queryKey: ['spots', 'search', params.keyword, params.category ?? 'ALL', params.page ?? 0, params.size ?? 20, token ?? 'guest'],
    queryFn: () => spotApi.searchSpots({ ...params, token: token ?? undefined }),
    enabled: hasKeyword && (options?.enabled ?? true),
    staleTime: SPOTS_STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export interface UseNearbySpotsParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  limit?: number;
}

export function useNearbySpots(params: UseNearbySpotsParams, options?: QueryToggle) {
  const token = useAuthStore((s) => s.accessToken);
  const { lat, lng, radiusKm = 5.0, limit = 20 } = params;
  const isCoordValid = lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng);

  return useQuery({
    queryKey: ['spots', 'nearby', lat, lng, radiusKm, limit, token ?? 'guest'],
    queryFn: () => spotApi.getNearbySpots({ lat: lat!, lng: lng!, radiusKm, limit, token: token ?? undefined }),
    enabled: isCoordValid && (options?.enabled ?? true),
    staleTime: SPOTS_STALE_TIME,
  });
}

// 리뷰 카드가 세로로 길어(본문+사진+장비) 20건이면 "더보기"가 화면 한참 아래로 밀린다.
const REVIEW_PAGE_SIZE = 10;

export function useSpotReviews(id: string, sort: ReviewSortApi) {
  return useInfiniteQuery({
    queryKey: ['spot', id, 'reviews', sort],
    queryFn: ({ pageParam }) => spotApi.getReviews(id, { sort, page: pageParam, size: REVIEW_PAGE_SIZE }),
    initialPageParam: 0,
    // 서버가 0-based page(number)와 totalPages를 내려준다.
    getNextPageParam: (last) =>
      last.reviews.number + 1 < last.reviews.totalPages ? last.reviews.number + 1 : undefined,
    enabled: !!id,
    select: mapReviewPages,
  });
}

export function useCreateReview(id: string) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, photos = [] }: { body: ReviewCreateRequest; photos?: ReviewPhotoUpload[] }) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.createReview(id, body, photos, token);
    },
    onSuccess: () => invalidateReviewCaches(qc, id),
  });
}

const myReviewsKey = ['users', 'me', 'reviews'] as const;
/** 수정 폼 시드 단건 캐시. 사진·본문이 바뀌면 함께 버려야 다음 진입이 옛 값을 쓰지 않는다. */
const reviewKey = (reviewId: number) => ['review', reviewId] as const;

// 작성·수정·삭제가 모두 같은 캐시를 건드려 무효화 대상이 동일하다.
/** 같은 리뷰가 두 목록에 동시에 노출된다 — 스팟 상세 리뷰 탭과 마이페이지 내 리뷰. */
function invalidateReviewLists(qc: ReturnType<typeof useQueryClient>, id: string) {
  // 정렬별로 캐시가 갈리므로 sort까지 특정하지 않고 리뷰 목록 전체를 무효화.
  qc.invalidateQueries({ queryKey: ['spot', id, 'reviews'] });
  qc.invalidateQueries({ queryKey: myReviewsKey });
}

function invalidateReviewCaches(qc: ReturnType<typeof useQueryClient>, id: string) {
  invalidateReviewLists(qc, id);
  // 평점·리뷰수·사진수가 헤더에 걸려 있어 상세도 함께 갱신.
  qc.invalidateQueries({ queryKey: ['spot', id, 'detail'] });
}

export function useUpdateReview(id: string) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, body }: { reviewId: number; body: ReviewCreateRequest }) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.updateReview(reviewId, body, token);
    },
    onSuccess: (_data, { reviewId }) => {
      invalidateReviewCaches(qc, id);
      qc.invalidateQueries({ queryKey: reviewKey(reviewId) });
    },
  });
}

/**
 * 삭제는 스팟 상세와 마이페이지 양쪽에서 호출된다. 어느 스팟의 리뷰인지는 항목마다 달라
 * 훅 인자가 아니라 mutate 인자로 받고, 내 리뷰 목록까지 함께 무효화한다.
 */
export function useDeleteReview() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId }: { reviewId: number; spotId: string }) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.deleteReview(reviewId, token);
    },
    onSuccess: (_data, { reviewId, spotId }) => {
      invalidateReviewCaches(qc, spotId);
      // 지운 리뷰의 시드가 남아 있으면 다음 진입에서 없는 리뷰를 수정하려 든다.
      qc.removeQueries({ queryKey: reviewKey(reviewId) });
    },
  });
}

/**
 * 사진 추가·삭제는 텍스트 저장과 달리 즉시 서버에 반영된다(전용 엔드포인트).
 * 평점·리뷰수는 그대로지만 헤더의 사진수(stats.photoCount)가 바뀌므로 상세도 함께 무효화한다.
 */
export function useAddReviewPhotos(spotId: string) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, photos }: { reviewId: number; photos: ReviewPhotoUpload[] }) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.addReviewPhotos(reviewId, photos, token);
    },
    onSuccess: (_data, { reviewId }) => {
      invalidateReviewCaches(qc, spotId);
      qc.invalidateQueries({ queryKey: reviewKey(reviewId) });
    },
  });
}

/**
 * 수정 폼 시드를 탭 시점에 가져온다. presigned URL 만료(환경 설정값, 로컬 60분)가 있어 캐시를
 * 재사용하지 않고 매번 새로 받는다. staleTime을 명시하는 이유: QueryClient 전역 기본값이 나중에
 * 바뀌면 만료된 URL로 수정 화면이 열려 사진만 안 보이는, 추적하기 어려운 증상이 된다.
 */
export function useFetchReview() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return (reviewId: number) => {
    if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
    return qc.fetchQuery({
      queryKey: reviewKey(reviewId),
      queryFn: () => spotApi.getReview(reviewId, token),
      staleTime: 0,
    });
  };
}

export function useDeleteReviewPhoto(spotId: string) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, photoId }: { reviewId: number; photoId: number }) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.deleteReviewPhoto(reviewId, photoId, token);
    },
    onSuccess: (_data, { reviewId }) => {
      invalidateReviewCaches(qc, spotId);
      qc.invalidateQueries({ queryKey: reviewKey(reviewId) });
    },
  });
}

export function useMyReviews(sort: ReviewSortApi = 'LATEST') {
  const token = useAuthStore((s) => s.accessToken);
  return useInfiniteQuery({
    queryKey: [...myReviewsKey, sort],
    queryFn: ({ pageParam }) => spotApi.getMyReviews(token as string, { sort, page: pageParam, size: REVIEW_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.number + 1 < last.totalPages ? last.number + 1 : undefined),
    enabled: !!token,
    select: mapMyReviewPages,
  });
}

export function useSpotPhotogenicScore(id: string, date?: string, time?: string) {
  return useQuery({
    queryKey: ['spot', id, 'photogenic', date ?? null, time ?? null],
    queryFn: () => spotApi.getPhotogenicScore(id, { date, time }),
    enabled: !!id,
    select: mapPhotogenicScore,
    // 날짜/시간 변경 시 이전 결과 유지 → 카드가 스피너로 무너지지 않고 재조회 오버레이만 표시
    placeholderData: keepPreviousData,
  });
}

const bookmarkKey = (id: string) => ['bookmark-collections', id] as const;

// 화면(별표)과 시트가 같은 키로 공유 → 한 번만 fetch, 캐시 공유
export function useBookmarkCollections(id: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: bookmarkKey(id),
    queryFn: () => spotApi.getBookmarkCollections(id, token as string),
    enabled: !!id && !!token,
  });
}

export function useCreateBookmarkCollection() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; color: string; icon: string }) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.createBookmarkCollection(body, token);
    },
    // 새 컬렉션은 모든 스팟의 목록에 나타나므로 prefix로 무효화
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmark-collections'] }),
  });
}

export function useSyncSpotBookmarks(id: string) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (collectionIds: number[]) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.syncSpotBookmarks(id, collectionIds, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookmarkKey(id) });
      // 카드의 채워짐 상태는 목록 응답의 isBookmarked에서 온다. 화면이 아니라 여기서 무효화해야
      // 상세에서 해제한 게 스택 아래 홈 카드에도 반영된다 (홈은 refetch 트리거가 없다).
      qc.invalidateQueries({ queryKey: ['spots', 'list'] });
    },
  });
}
