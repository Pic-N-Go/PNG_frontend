import { fetchWithAuthRetry, toHttpError, tokenFromHeaders } from '@/api/auth';
import type {
  UserResponse,
  UserStatsResponse,
  FollowUserResponse,
  MyReviewListResponse,
  UserProfileUpdateRequest,
  PasswordChangeRequest,
  ProfileImageUpload,
  UserSearchPageResponse,
  AlbumResponse,
} from '@/types/user';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 30_000;
// 사진 업로드는 느린 회선에서 수십 초가 걸린다. 공용 타임아웃으로는 정상 업로드가 끊긴다
// (community.ts의 UPLOAD_TIMEOUT_MS와 같은 값).
const UPLOAD_TIMEOUT_MS = 180_000;

if (__DEV__ && !BASE) {
  console.warn('[user] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

export { ApiError } from '@/api/auth';

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchWithAuthRetry(url, { ...options, signal: controller.signal });
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

  // 타 유저 프로필 조회는 communityApi.getUserProfile을 쓴다 —
  // 같은 엔드포인트를 두 곳에 두면 한쪽만 필드가 추가돼(followerCount·withdrawn 등) 조용히 틀린다.

  // 6. 내 관심 테마 수정
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

  // 7. 내 프로필 수정 (닉네임·프로필 이미지·자기소개)
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

  // 8. 사용자 검색 (닉네임 부분일치)
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

  // 9. 회원 탈퇴 (소프트 삭제 — 30일 이내 authApi.restore로 복구 가능)
  withdraw: async (accessToken: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/users/me`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  // 10. 내 앨범 목록 조회
  /**
   * 프로필 사진 교체. multipart part 이름은 서버 @RequestPart("image")와 맞춘다.
   * 업로드는 느릴 수 있어 공용 30초 대신 UPLOAD_TIMEOUT_MS를 쓴다 — 없으면 멈춘 업로드가
   * 영원히 pending으로 남아 저장 버튼이 돌아오지 않는다.
   */
  updateProfileImage: async (file: ProfileImageUpload, accessToken: string): Promise<UserResponse> => {
    const form = new FormData();
    form.append('image', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);

    const res = await fetchWithTimeout(
      `${BASE}/users/me/profile-image`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      },
      UPLOAD_TIMEOUT_MS,
    );
    return (await res.json()) as UserResponse;
  },

  /** 프로필 사진 삭제(기본 이미지로). */
  deleteProfileImage: async (accessToken: string): Promise<UserResponse> => {
    const res = await fetchWithTimeout(`${BASE}/users/me/profile-image`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return (await res.json()) as UserResponse;
  },

  /**
   * 비밀번호 변경. 204라 본문이 없다.
   * 소셜 계정은 서버가 400(소셜 계정은 비밀번호를 사용하지 않습니다)으로 거부한다.
   */
  changePassword: async (request: PasswordChangeRequest, accessToken: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/users/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
    });
  },

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
