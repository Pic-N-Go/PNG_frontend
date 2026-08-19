import { toHttpError, tokenFromHeaders } from '@/api/auth';
import type {
  UserResponse,
  UserStatsResponse,
  FollowUserResponse,
  MyReviewListResponse,
  UserProfileResponse,
  UserProfileUpdateRequest,
  UserSearchPageResponse,
  AlbumResponse,
} from '@/types/user';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 30_000;

if (__DEV__ && !BASE) {
  console.warn('[user] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

export { ApiError } from '@/api/auth';

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw await toHttpError(res, tokenFromHeaders(options.headers));
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export const userApi = {
  // 1. 내 프로필 조회
  getMyProfile: async (accessToken: string): Promise<UserResponse> => {
    const res = await fetchWithTimeout(`${BASE}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return (await res.json()) as UserResponse;
  },

  // 2. 내 활동 통계 조회 (팔로워 수, 팔로잉 수, 리뷰 수, 방문 장소 수)
  getMyStats: async (accessToken: string): Promise<UserStatsResponse> => {
    const res = await fetchWithTimeout(`${BASE}/users/me/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return (await res.json()) as UserStatsResponse;
  },

  // 3. 팔로잉 목록 조회
  getFollowing: async (userId: number, accessToken?: string): Promise<FollowUserResponse[]> => {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetchWithTimeout(`${BASE}/users/${userId}/following`, {
      method: 'GET',
      headers,
    });
    return (await res.json()) as FollowUserResponse[];
  },

  // 4. 팔로워 목록 조회
  getFollowers: async (userId: number, accessToken?: string): Promise<FollowUserResponse[]> => {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetchWithTimeout(`${BASE}/users/${userId}/followers`, {
      method: 'GET',
      headers,
    });
    return (await res.json()) as FollowUserResponse[];
  },

  // 5. 내 리뷰 목록 조회
  getMyReviews: async (
    accessToken: string,
    params?: { sort?: 'LATEST' | 'RATING_HIGH' | 'RATING_LOW'; page?: number; size?: number }
  ): Promise<MyReviewListResponse> => {
    const query = new URLSearchParams();
    if (params?.sort) query.append('sort', params.sort);
    if (params?.page !== undefined) query.append('page', String(params.page));
    if (params?.size !== undefined) query.append('size', String(params.size));

    const qs = query.toString();
    const url = `${BASE}/users/me/reviews${qs ? `?${qs}` : ''}`;
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return (await res.json()) as MyReviewListResponse;
  },

  // 6. 타 유저 프로필 조회
  getUserProfile: async (userId: number, accessToken?: string): Promise<UserProfileResponse> => {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetchWithTimeout(`${BASE}/users/${userId}/profile`, {
      method: 'GET',
      headers,
    });
    return (await res.json()) as UserProfileResponse;
  },

  // 7. 내 관심 테마 수정
  updateSpotCategories: async (
    categories: string[],
    accessToken: string
  ): Promise<UserResponse> => {
    const res = await fetchWithTimeout(`${BASE}/users/me/spot-categories`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ spotCategories: categories }),
    });
    return (await res.json()) as UserResponse;
  },

  // 8. 내 프로필 수정 (닉네임·프로필 이미지·자기소개)
  updateMyProfile: async (
    request: UserProfileUpdateRequest,
    accessToken: string
  ): Promise<UserResponse> => {
    const res = await fetchWithTimeout(`${BASE}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
    return (await res.json()) as UserResponse;
  },

  // 9. 사용자 검색 (닉네임 부분일치)
  searchUsers: async (
    keyword: string,
    accessToken: string,
    page = 0,
    size = 20
  ): Promise<UserSearchPageResponse> => {
    const res = await fetchWithTimeout(
      `${BASE}/users/search?keyword=${encodeURIComponent(keyword.trim())}&page=${page}&size=${size}`,
      { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return (await res.json()) as UserSearchPageResponse;
  },

  // 10. 내 앨범 목록 조회
  getMyAlbums: async (accessToken: string): Promise<AlbumResponse[]> => {
    const res = await fetchWithTimeout(`${BASE}/users/me/albums`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return (await res.json()) as AlbumResponse[];
  },
};
