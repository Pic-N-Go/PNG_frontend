// 스팟 상세 화면 서버 상태 훅 (TanStack Query)
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/auth';
import { spotApi } from '@/api/spot';
import type { ReviewPhotoUpload } from '@/api/spot';
import { useAuthStore } from '@/store/useAuthStore';
import { mapPhotogenicScore, mapReviewPages, mapSpotDetail } from '@/utils/spotMappers';
import type { ReviewCreateRequest, ReviewSortApi } from '@/types/spot';

const checklistKey = (id: string) => ['spot', id, 'checklist'] as const;

export function useSpotDetail(id: string) {
  return useQuery({
    queryKey: ['spot', id, 'detail'],
    queryFn: () => spotApi.getDetail(id),
    enabled: !!id,
    select: mapSpotDetail,
  });
}

export function useSpots() {
  return useQuery({
    queryKey: ['spots', 'list'],
    queryFn: () => spotApi.getSpots(),
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
    onSuccess: () => {
      // 정렬별로 캐시가 갈리므로 sort까지 특정하지 않고 리뷰 목록 전체를 무효화.
      qc.invalidateQueries({ queryKey: ['spot', id, 'reviews'] });
      // 평점·리뷰수·사진수가 헤더에 걸려 있어 상세도 함께 갱신.
      qc.invalidateQueries({ queryKey: ['spot', id, 'detail'] });
    },
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

export function useChecklist(id: string) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: checklistKey(id),
    queryFn: () => spotApi.getChecklist(id, token as string),
    enabled: !!id && !!token,
  });
}

export function useAddChecklistItem(id: string) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.addChecklistItem(id, content, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: checklistKey(id) }),
  });
}

export function useDeleteChecklistItem(id: string) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: number) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.deleteChecklistItem(id, itemId, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: checklistKey(id) }),
  });
}

export function useHideDefaultChecklistItem(id: string) {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (defaultItemId: number) => {
      if (!token) return Promise.reject(new ApiError('로그인이 필요합니다.'));
      return spotApi.hideDefaultChecklistItem(id, defaultItemId, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: checklistKey(id) }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: bookmarkKey(id) }),
  });
}
