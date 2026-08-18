import { ApiError, toHttpError, tokenFromHeaders } from '@/api/auth';
import type {
  InquiryItem,
  InquiryPageResponse,
  InquiryCreateRequest,
  InquiryResolveRequest,
  AdminInquiryFilterParams,
  AdminInquiryAnswerRequest,
} from '@/types/inquiry';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 15_000;

if (__DEV__ && !BASE) {
  console.warn('[inquiry] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

export { ApiError };

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw await toHttpError(res, tokenFromHeaders(options.headers));
    return res;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError('요청 시간이 초과되었습니다. 다시 시도해 주세요.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const inquiryApi = {
  // ── 1. 사용자 1:1 문의 API (/inquiries) ──────────────────────────

  // 1.1 신규 문의 등록
  createInquiry: async (
    data: InquiryCreateRequest,
    accessToken: string
  ): Promise<InquiryItem> => {
    const res = await fetchWithTimeout(`${BASE}/inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;
    return body as InquiryItem;
  },

  // 1.2 내 문의 목록 조회
  getMyInquiries: async (
    page = 0,
    size = 20,
    accessToken: string
  ): Promise<InquiryPageResponse> => {
    const res = await fetchWithTimeout(`${BASE}/inquiries/me?page=${page}&size=${size}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;
    return body as InquiryPageResponse;
  },

  // 1.3 문의 상세 조회
  getInquiryDetail: async (id: number, accessToken: string): Promise<InquiryItem> => {
    const res = await fetchWithTimeout(`${BASE}/inquiries/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;
    return body as InquiryItem;
  },

  // 1.4 문의 해결 상태 변경
  resolveInquiry: async (
    id: number,
    accessToken: string,
    isResolved = true
  ): Promise<InquiryItem> => {
    const data: InquiryResolveRequest = { isResolved };
    const res = await fetchWithTimeout(`${BASE}/inquiries/${id}/resolve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;
    return body as InquiryItem;
  },

  // ── 2. 관리자 1:1 문의 관리 API (/admin/inquiries) ─────────────────

  // 2.1 관리자 전체 문의 목록 및 필터 검색
  getAdminInquiries: async (
    params: AdminInquiryFilterParams,
    accessToken: string
  ): Promise<InquiryPageResponse> => {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.status) query.set('status', params.status);
    if (params.isResolved !== undefined) query.set('isResolved', String(params.isResolved));
    if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));

    const queryString = query.toString();
    const url = `${BASE}/admin/inquiries${queryString ? `?${queryString}` : ''}`;

    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;
    return body as InquiryPageResponse;
  },

  // 2.2 관리자 1:1 문의 답변 작성 및 수정
  answerInquiry: async (
    id: number,
    answer: string,
    accessToken: string
  ): Promise<InquiryItem> => {
    const data: AdminInquiryAnswerRequest = { answer };
    const res = await fetchWithTimeout(`${BASE}/admin/inquiries/${id}/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });

    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;
    return body as InquiryItem;
  },
};
