// 스팟 상세 화면 서버 상태 훅 (TanStack Query)
// 스펙: docs/ai/specs/feature/spot-detail-screen/spot-detail-api.md
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/auth';
import { spotApi, type MapSpotsParams, type GetSpotsParams, type SearchSpotsParams } from '@/api/spot';
import { useAuthStore } from '@/store/useAuthStore';
import { mapPhotogenicScore, mapReviewList, mapSpotDetail } from '@/utils/spotMappers';
import type { ReviewSortApi } from '@/types/spot';

const checklistKey = (id: string) => ['spot', id, 'checklist'] as const;

export function useSpotDetail(id: string) {
  return useQuery({
    queryKey: ['spot', id, 'detail'],
    queryFn: () => spotApi.getDetail(id),
    enabled: !!id,
    select: mapSpotDetail,
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

export function useSpotReviews(id: string, sort: ReviewSortApi) {
  return useQuery({
    queryKey: ['spot', id, 'reviews', sort],
    queryFn: () => spotApi.getReviews(id, { sort }),
    enabled: !!id,
    select: mapReviewList,
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
