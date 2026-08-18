import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inquiryApi } from '@/api/inquiry';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  InquiryItem,
  InquiryPageResponse,
  InquiryCreateRequest,
  AdminInquiryFilterParams,
} from '@/types/inquiry';

export const INQUIRY_KEYS = {
  all: ['inquiries'] as const,
  my: (page: number, size: number) => [...INQUIRY_KEYS.all, 'my', { page, size }] as const,
  detail: (id: number) => [...INQUIRY_KEYS.all, 'detail', id] as const,
  admin: (params?: AdminInquiryFilterParams) => [...INQUIRY_KEYS.all, 'admin', params] as const,
};

// ── 1. 사용자 1:1 문의 훅 ──────────────────────────────────────────

// 1.1 내 문의 목록 조회 훅
export function useMyInquiries(page = 0, size = 20) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<InquiryPageResponse, Error>({
    queryKey: INQUIRY_KEYS.my(page, size),
    queryFn: () => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return inquiryApi.getMyInquiries(page, size, accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 15,
  });
}

// 1.2 문의 상세 조회 훅
export function useInquiryDetail(id: number | null) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<InquiryItem, Error>({
    queryKey: INQUIRY_KEYS.detail(id ?? 0),
    queryFn: () => {
      if (!accessToken || !id) throw new Error('문의 정보를 찾을 수 없습니다.');
      return inquiryApi.getInquiryDetail(id, accessToken);
    },
    enabled: !!accessToken && !!id && id > 0,
  });
}

// 1.3 신규 문의 등록 뮤테이션
export function useCreateInquiry() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<InquiryItem, Error, InquiryCreateRequest>({
    mutationFn: (data) => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return inquiryApi.createInquiry(data, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...INQUIRY_KEYS.all, 'my'] });
    },
  });
}

// 1.4 문의 해결 상태 변경 뮤테이션 (사용자 해결 완료)
export function useResolveInquiry() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<InquiryItem, Error, { id: number; isResolved?: boolean }>({
    mutationFn: ({ id, isResolved = true }) => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return inquiryApi.resolveInquiry(id, accessToken, isResolved);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...INQUIRY_KEYS.all, 'my'] });
      queryClient.invalidateQueries({ queryKey: INQUIRY_KEYS.detail(variables.id) });
    },
  });
}

// ── 2. 관리자 1:1 문의 훅 ──────────────────────────────────────────

// 2.1 관리자 전체 문의 목록 조회 훅
export function useAdminInquiries(params: AdminInquiryFilterParams) {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<InquiryPageResponse, Error>({
    queryKey: INQUIRY_KEYS.admin(params),
    queryFn: () => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return inquiryApi.getAdminInquiries(params, accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 15,
  });
}

// 2.2 관리자 답변 작성 및 수정 뮤테이션
export function useAnswerInquiry() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  return useMutation<InquiryItem, Error, { id: number; answer: string }>({
    mutationFn: ({ id, answer }) => {
      if (!accessToken) throw new Error('관리자 권한이 필요합니다.');
      return inquiryApi.answerInquiry(id, answer, accessToken);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...INQUIRY_KEYS.all, 'admin'] });
      queryClient.invalidateQueries({ queryKey: INQUIRY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: [...INQUIRY_KEYS.all, 'my'] });
    },
  });
}

// ── 3. 레거시 지원 훅 ───────────────────────────────────────────────
export function useInquiries() {
  const { data } = useMyInquiries(0, 10);
  const unreadCount = data?.content.filter((i) => i.status === 'ANSWERED' && !i.isResolved).length ?? 0;
  return { unreadCount };
}
