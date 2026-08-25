import { useQuery } from '@tanstack/react-query';
import { festivalApi } from '@/api/festival';
import { FestivalListParams } from '@/types/festival';

export const FESTIVAL_KEYS = {
  all: ['festivals'] as const,
  list: (params?: FestivalListParams) => ['festivals', 'list', params] as const,
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

export function useFestival(id?: string | number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: FESTIVAL_KEYS.detail(id!),
    queryFn: () => festivalApi.getFestival(id!),
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
}
