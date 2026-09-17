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
  AdminPageResponse,
  ContestCreateRequest,
  ContestUpdateRequest,
  AdminContestSummaryResponse,
  AdminContestDetailResponse,
  AdminContestEntryResponse,
  AdminContestReportResponse,
  AdminReportDetailResponse,
  AdminReportFilter,
  AdminReportListResponse,
  AdminReportProcessRequest,
  AdminReportProcessResponse,
  AdminReportTargetDeleteRequest,
} from '@/types/admin';

export const ADMIN_KEYS = {
  all: ['admin'] as const,
  users: (params?: AdminUserFilterParams) => [...ADMIN_KEYS.all, 'users', params] as const,
  userDetail: (userId: number) => [...ADMIN_KEYS.all, 'user', userId] as const,
  embeddings: () => [...ADMIN_KEYS.all, 'embeddings'] as const,
  tourSyncStatus: () => [...ADMIN_KEYS.all, 'tour-sync-status'] as const,
  contests: (page?: number, size?: number) => [...ADMIN_KEYS.all, 'contests', page, size] as const,
  contestDetail: (contestId: number) => [...ADMIN_KEYS.all, 'contest', contestId] as const,
  contestEntries: (contestId: number, page?: number, size?: number) =>
    [...ADMIN_KEYS.all, 'contest-entries', contestId, page, size] as const,
  contestReports: (page?: number, size?: number) =>
    [...ADMIN_KEYS.all, 'contest-reports', page, size] as const,
  reports: (filter: AdminReportFilter, page: number, size: number) =>
    [...ADMIN_KEYS.all, 'reports', filter, page, size] as const,
  reportDetail: (reportId: number) => [...ADMIN_KEYS.all, 'reports', 'detail', reportId] as const,
};

export function useAdminReports(filter: AdminReportFilter, page = 0, size = 10) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<AdminPageResponse<AdminReportListResponse>, Error>({
    queryKey: ADMIN_KEYS.reports(filter, page, size),
    queryFn: () => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.getReports(filter, page, size, accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 15,
  });
}

export function useAdminReportDetail(reportId: number | null) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery<AdminReportDetailResponse, Error>({
    queryKey: ADMIN_KEYS.reportDetail(reportId ?? 0),
    queryFn: () => {
      if (!accessToken || !reportId) throw new Error('신고 정보가 유효하지 않습니다.');
      return adminApi.getReportDetail(reportId, accessToken);
    },
    enabled: !!accessToken && !!reportId,
  });
}

export function useProcessAdminReport() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  return useMutation<AdminReportProcessResponse, Error, { reportId: number; request: AdminReportProcessRequest }>({
    mutationFn: ({ reportId, request }) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.processReport(reportId, request, accessToken);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'reports'] }),
  });
}

export function useDeleteAdminReportTarget() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  return useMutation<AdminReportProcessResponse, Error, { reportId: number; request: AdminReportTargetDeleteRequest }>({
    mutationFn: ({ reportId, request }) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.deleteReportedTarget(reportId, request, accessToken);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'reports'] }),
  });
}

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

// ── 4. 콘테스트 운영 관리 훅 ─────────────────────────────────────────

// 4.1 콘테스트 전체 목록 조회 훅
export function useAdminContests(page = 0, size = 20) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AdminPageResponse<AdminContestSummaryResponse>, Error>({
    queryKey: ADMIN_KEYS.contests(page, size),
    queryFn: () => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.getAdminContests(page, size, accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 15,
  });
}

// 4.2 콘테스트 상세 조회 훅
export function useAdminContestDetail(contestId: number | null) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AdminContestDetailResponse, Error>({
    queryKey: ADMIN_KEYS.contestDetail(contestId ?? 0),
    queryFn: () => {
      if (!accessToken || !contestId) throw new Error('콘테스트 정보가 유효하지 않습니다.');
      return adminApi.getAdminContestDetail(contestId, accessToken);
    },
    enabled: !!accessToken && !!contestId && contestId > 0,
    staleTime: 1000 * 15,
  });
}

// 4.3 콘테스트 신규 개설 뮤테이션
export function useCreateContest() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<any, Error, ContestCreateRequest>({
    mutationFn: (data) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.createContest(data, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'contests'] });
    },
  });
}

// 4.4 콘테스트 정보 및 시작 일정 수정 뮤테이션
export function useUpdateContest() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<
    AdminContestDetailResponse,
    Error,
    { contestId: number; data: ContestUpdateRequest }
  >({
    mutationFn: ({ contestId, data }) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.updateContest(contestId, data, accessToken);
    },
    onSuccess: (_, { contestId }) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'contests'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.contestDetail(contestId) });
    },
  });
}

// 4.5 콘테스트 테마 대표 사진 업로드 뮤테이션
export function useUploadContestThemeImage() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation<
    { imageUrl: string; key?: string },
    Error,
    { uri: string; name?: string; type?: string }
  >({
    mutationFn: (file) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.uploadContestThemeImage(file, accessToken);
    },
  });
}

// 4.6 출품 시작 알림 수동 발송 뮤테이션
export function useSendContestStartNotification() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<{ message?: string; sentCount?: number; [key: string]: any }, Error, number>({
    mutationFn: (contestId) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.sendContestStartNotification(contestId, accessToken);
    },
    onSuccess: (_, contestId) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'contests'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.contestDetail(contestId) });
    },
  });
}

// 4.5 콘테스트 강제 마감 및 즉시 결과 발표 뮤테이션
export function usePublishContestResult() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<AdminContestDetailResponse, Error, number>({
    mutationFn: (contestId) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.publishContestResult(contestId, accessToken);
    },
    onSuccess: (_, contestId) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'contests'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.contestDetail(contestId) });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.contestEntries(contestId) });
    },
  });
}

// 4.6 결과 발표 알림 수동 발송 뮤테이션
export function useSendContestResultNotification() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<{ message?: string; sentCount?: number; [key: string]: any }, Error, number>({
    mutationFn: (contestId) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.sendContestResultNotification(contestId, accessToken);
    },
    onSuccess: (_, contestId) => {
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'contests'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.contestDetail(contestId) });
    },
  });
}

// 4.7 콘테스트 출품작 목록 조회 훅
export function useAdminContestEntries(contestId: number | null, page = 0, size = 20) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AdminPageResponse<AdminContestEntryResponse>, Error>({
    queryKey: ADMIN_KEYS.contestEntries(contestId ?? 0, page, size),
    queryFn: () => {
      if (!accessToken || !contestId) throw new Error('출품작 조회를 위한 콘테스트 ID가 필요합니다.');
      return adminApi.getAdminContestEntries(contestId, page, size, accessToken);
    },
    enabled: !!accessToken && !!contestId && contestId > 0,
    staleTime: 1000 * 10,
  });
}

// 4.6 부적격 출품작 관리자 강제 삭제 뮤테이션
export function useDeleteAdminContestEntry() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<void, Error, { entryId: number; reason?: string; contestId?: number }>({
    mutationFn: ({ entryId, reason }) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.deleteAdminContestEntry(entryId, reason, accessToken);
    },
    onSuccess: (_, variables) => {
      if (variables.contestId) {
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.contestEntries(variables.contestId) });
        queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.contestDetail(variables.contestId) });
      } else {
        queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'contest-entries'] });
      }
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'contest-reports'] });
      queryClient.invalidateQueries({ queryKey: [...ADMIN_KEYS.all, 'contests'] });
    },
  });
}

// 4.7 접수된 출품작 신고 목록 조회 훅
export function useAdminContestReports(page = 0, size = 20) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AdminPageResponse<AdminContestReportResponse>, Error>({
    queryKey: ADMIN_KEYS.contestReports(page, size),
    queryFn: () => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return adminApi.getAdminContestReports(page, size, accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 15,
  });
}

