import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { festivalApi } from '@/api/festival';
import { FestivalListParams } from '@/types/festival';

export const FESTIVAL_KEYS = {
  all: ['festivals'] as const,
  list: (params?: FestivalListParams) => ['festivals', 'list', params] as const,
  infinite: (params?: Omit<FestivalListParams, 'page'>) => ['festivals', 'infinite', params] as const,
  detail: (id: string | number) => ['festivals', 'detail', String(id)] as const,
};

export function useFestivals(params?: FestivalListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: FESTIVAL_KEYS.list(params),
    queryFn: () => festivalApi.getFestivals(params),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
}

export function useInfiniteFestivals(params?: Omit<FestivalListParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: FESTIVAL_KEYS.infinite(params),
    queryFn: ({ pageParam = 0 }) => festivalApi.getFestivals({ ...params, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.number + 1 >= lastPage.totalPages) {
        return undefined;
      }
      return lastPage.number + 1;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFestival(id?: string | number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: FESTIVAL_KEYS.detail(id!),
    queryFn: () => festivalApi.getFestival(id!),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
}
