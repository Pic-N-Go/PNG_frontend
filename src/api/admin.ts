import { toHttpError, tokenFromHeaders } from '@/api/auth';
import type {
  AdminUser,
  AdminUserPageResponse,
  AdminUserFilterParams,
  RoleUpdateRequest,
  EmbeddingStatusResponse,
  EmbeddingBackfillResponse,
  EmbeddingSingleResponse,
} from '@/types/admin';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 60_000;

if (__DEV__ && !BASE) {
  console.warn('[admin] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

export { ApiError } from '@/api/auth';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw await toHttpError(res, tokenFromHeaders(options.headers));
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export const adminApi = {
  // ── 1. 회원 및 권한 관리 API (/admin/users) ───────────────────────

  // 1.1 회원 목록 및 검색 페이징 조회
  getUsers: async (
    params: AdminUserFilterParams,
    accessToken: string
  ): Promise<AdminUserPageResponse> => {
    const query = new URLSearchParams();
    if (params.keyword?.trim()) query.set('keyword', params.keyword.trim());
    if (params.role) query.set('role', params.role);
    if (params.page !== undefined) query.set('page', String(params.page));
    if (params.size !== undefined) query.set('size', String(params.size));

    const queryString = query.toString();
    const url = `${BASE}/admin/users${queryString ? `?${queryString}` : ''}`;

    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;
    return body as AdminUserPageResponse;
  },

  // 1.2 회원 단건 상세 조회
  getUserDetail: async (userId: number, accessToken: string): Promise<AdminUser> => {
    const res = await fetchWithTimeout(`${BASE}/admin/users/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;
    return body as AdminUser;
  },

  // 1.3 회원 권한 변경 (USER <-> ADMIN)
  updateUserRole: async (
    userId: number,
    roleData: RoleUpdateRequest,
    accessToken: string
  ): Promise<AdminUser> => {
    const res = await fetchWithTimeout(`${BASE}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(roleData),
    });

    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;
    return body as AdminUser;
  },

  // ── 2. AI 의미 검색 임베딩 관리 API (/admin/embeddings) ──────────────

  // 2.1 AI 임베딩 커버리지 현황 조회
  getEmbeddingStatus: async (accessToken: string): Promise<EmbeddingStatusResponse> => {
    const res = await fetchWithTimeout(`${BASE}/admin/embeddings`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;

    const total = Number(
      body?.total ?? body?.totalSpots ?? body?.totalCount ?? body?.totalSpotCount ?? 0
    );
    const withEmbedding = Number(
      body?.withEmbedding ??
        body?.embeddedSpots ??
        body?.embeddedCount ??
        body?.embedded ??
        body?.completedCount ??
        body?.completedSpots ??
        0
    );
    const missing = Number(
      body?.missing ??
        body?.missingSpots ??
        (total >= withEmbedding ? total - withEmbedding : 0)
    );

    let coveragePercentage = Number(
      body?.coveragePercentage ??
        body?.coveragePercent ??
        body?.coverageRate ??
        body?.coverage ??
        body?.rate ??
        body?.percentage ??
        0
    );

    if (coveragePercentage > 0 && coveragePercentage <= 1 && total > 1) {
      coveragePercentage = coveragePercentage * 100;
    } else if (total > 0) {
      coveragePercentage = (withEmbedding / total) * 100;
    }

    return {
      total,
      withEmbedding,
      missing,
      totalSpots: total,
      embeddedSpots: withEmbedding,
      missingSpots: missing,
      coveragePercentage,
    };
  },

  // 2.2 미임베딩 스팟 일괄 백필 실행
  backfillEmbeddings: async (accessToken: string): Promise<EmbeddingBackfillResponse> => {
    const res = await fetchWithTimeout(`${BASE}/admin/embeddings/backfill`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;

    const saved = Number(body?.saved ?? body?.successCount ?? body?.processedCount ?? 0);
    const failed = Number(body?.failed ?? body?.failureCount ?? 0);

    return {
      saved,
      failed,
      processedCount: saved + failed,
      successCount: saved,
      failureCount: failed,
    };
  },

  // 2.3 특정 스팟 1개 임베딩 강제 재계산
  recalculateSpotEmbedding: async (
    spotId: number,
    accessToken: string
  ): Promise<EmbeddingSingleResponse> => {
    const res = await fetchWithTimeout(`${BASE}/admin/embeddings/spots/${spotId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const json = (await res.json()) as any;
    const body = json?.data !== undefined && json.data !== null ? json.data : json;

    const isSaved = Boolean(body?.saved ?? body?.success ?? (res.status >= 200 && res.status < 300));

    return {
      spotId: Number(body?.spotId ?? spotId),
      saved: isSaved,
      success: isSaved,
      spotName: String(body?.spotName ?? body?.name ?? ''),
      message: String(body?.message ?? (isSaved ? '재계산이 완료되었습니다.' : '실패했습니다.')),
    };
  },

  // ── 3. 한국관광공사 TourAPI 동기화 API (/admin/tour-api 또는 /tour-api) ─

  // 3.1 특정 지역 관광공사 스팟 동기화
  syncAreaTourApi: async (
    areaCode: number,
    accessToken: string,
    startPage?: number,
    endPage?: number
  ): Promise<string> => {
    const query = new URLSearchParams();
    query.set('areaCode', String(areaCode));
    if (startPage !== undefined) query.set('startPage', String(startPage));
    if (endPage !== undefined) query.set('endPage', String(endPage));

    const pathQuery = `?${query.toString()}`;

    try {
      const res = await fetchWithTimeout(`${BASE}/admin/tour-api/sync${pathQuery}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const text = await res.text();
      return text || '동기화 완료';
    } catch {
      // /admin/tour-api/sync 가 404일 경우 기존 /tour-api/sync 시도
      const resFallback = await fetchWithTimeout(`${BASE}/tour-api/sync${pathQuery}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const text = await resFallback.text();
      return text || '동기화 완료';
    }
  },

  // 3.2 전체 지역 관광공사 스팟 동기화
  syncAllTourApi: async (accessToken: string): Promise<string> => {
    try {
      const res = await fetchWithTimeout(
        `${BASE}/admin/tour-api/sync/all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        180_000
      );
      const text = await res.text();
      return text || '전체 지역 동기화 완료';
    } catch {
      // /admin/tour-api/sync/all 가 404일 경우 기존 /tour-api/sync/all 시도
      const resFallback = await fetchWithTimeout(
        `${BASE}/tour-api/sync/all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        180_000
      );
      const text = await resFallback.text();
      return text || '전체 지역 동기화 완료';
    }
  },
};
