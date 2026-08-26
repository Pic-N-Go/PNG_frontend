import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  AdminUser,
  AdminUserPageResponse,
  AdminUserFilterParams,
  RoleUpdateRequest,
  EmbeddingStatusResponse,
  EmbeddingBackfillResponse,
  EmbeddingSingleResponse,
  TourSyncStatusResponse,
} from '@/types/admin';

export const ADMIN_KEYS = {
  all: ['admin'] as const,
  users: (params?: AdminUserFilterParams) => [...ADMIN_KEYS.all, 'users', params] as const,
  userDetail: (userId: number) => [...ADMIN_KEYS.all, 'user', userId] as const,
  embeddings: () => [...ADMIN_KEYS.all, 'embeddings'] as const,
  tourSyncStatus: () => [...ADMIN_KEYS.all, 'tour-sync-status'] as const,
};

// ── 1. 회원 및 권한 관리 훅 ──────────────────────────────────────────

// 1.1 회원 목록 및 검색 조회 훅
export function useAdminUsers(params: AdminUserFilterParams) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AdminUserPageResponse, Error>({
    queryKey: ADMIN_KEYS.users(params),
    queryFn: () => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.getUsers(params, accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 15, // 15초
  });
}

// 1.2 회원 단건 상세 조회 훅
export function useAdminUserDetail(userId: number | null) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AdminUser, Error>({
    queryKey: ADMIN_KEYS.userDetail(userId ?? 0),
    queryFn: () => {
      if (!accessToken || !userId) throw new Error('회원 정보가 유효하지 않습니다.');
      return adminApi.getUserDetail(userId, accessToken);
    },
    enabled: !!accessToken && !!userId && userId > 0,
  });
}

// 1.3 회원 권한 변경 뮤테이션 (USER <-> ADMIN)
export function useUpdateUserRole() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<AdminUser, Error, { userId: number; roleData: RoleUpdateRequest }>({
    mutationFn: ({ userId, roleData }) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.updateUserRole(userId, roleData, accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'users'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.userDetail(variables.userId) });
    },
  });
}

// ── 2. AI 의미 검색 임베딩 관리 훅 ───────────────────────────────────

// 2.1 임베딩 커버리지 현황 조회 훅
export function useEmbeddingStatus() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<EmbeddingStatusResponse, Error>({
    queryKey: ADMIN_KEYS.embeddings(),
    queryFn: () => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.getEmbeddingStatus(accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 30, // 30초
  });
}

// 2.2 미임베딩 스팟 일괄 백필 뮤테이션
export function useBackfillEmbeddings() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<EmbeddingBackfillResponse, Error, void>({
    mutationFn: () => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.backfillEmbeddings(accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.embeddings() });
    },
  });
}

// 2.3 특정 스팟 임베딩 강제 재계산 뮤테이션
export function useRecalculateSpotEmbedding() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<EmbeddingSingleResponse, Error, number>({
    mutationFn: (spotId: number) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.recalculateSpotEmbedding(spotId, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.embeddings() });
    },
  });
}

// ── 3. 한국관광공사 TourAPI 동기화 훅 ───────────────────────────────

// 3.1 한국관광공사 특정 지역 데이터 수동 동기화 뮤테이션
export function useSyncAreaTourApi() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<
    string,
    Error,
    { areaCode: number; startPage?: number; endPage?: number }
  >({
    mutationFn: ({ areaCode, startPage, endPage }) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.syncAreaTourApi(areaCode, accessToken, startPage, endPage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.tourSyncStatus() });
    },
  });
}

// 3.2 한국관광공사 전국 17개 지역 전체 데이터 동기화 뮤테이션
export function useSyncAllTourApi() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<string, Error, void>({
    mutationFn: () => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.syncAllTourApi(accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.tourSyncStatus() });
    },
  });
}

// 3.3 테스트/개발용 샘플 동기화 (타입별 소량 동기화) 뮤테이션
export function useSyncSampleTourApi() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<string, Error, number | undefined>({
    mutationFn: (countPerType = 7) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.syncSampleTourApi(countPerType, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.tourSyncStatus() });
    },
  });
}

// 3.4 실시간 TourAPI 동기화 진행 상태 조회 훅 (GET /admin/tour-api/sync/status)
export function useTourSyncStatus() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<TourSyncStatusResponse, Error>({
    queryKey: ADMIN_KEYS.tourSyncStatus(),
    queryFn: () => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.getTourSyncStatus(accessToken);
    },
    enabled: !!accessToken,
    refetchInterval: (query) => {
      // 백그라운드 진행 중(isRunning)일 때는 3초마다 폴링, 대기 중일 때는 10초마다 갱신
      return query.state.data?.isRunning ? 3000 : 10000;
    },
    staleTime: 2000,
  });
}
