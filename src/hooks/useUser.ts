import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/user';
import { useAuthStore } from '@/store/useAuthStore';
import { RECOMMENDED_SPOTS_KEY } from '@/hooks/useSpot';
import type {
  UserResponse,
  UserStatsResponse,
  FollowUserResponse,
  MyReviewListResponse,
  UserProfileUpdateRequest,
  UserSearchPageResponse,
  AlbumResponse,
  PasswordChangeRequest,
  ProfileImageUpload,
} from '@/types/user';

export const USER_KEYS = {
  all: ['user'] as const,
  search: (keyword: string) => [...USER_KEYS.all, 'search', keyword] as const,
  profile: () => [...USER_KEYS.all, 'profile'] as const,
  stats: () => [...USER_KEYS.all, 'stats'] as const,
  following: (userId?: number) => [...USER_KEYS.all, userId, 'following'] as const,
  followers: (userId?: number) => [...USER_KEYS.all, userId, 'followers'] as const,
  reviews: (params?: any) => [...USER_KEYS.all, 'reviews', params] as const,
};

// 1. 내 프로필 조회 훅
export function useMyProfile() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<UserResponse, Error>({
    queryKey: USER_KEYS.profile(),
    queryFn: () => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.getMyProfile(accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

// 2. 내 활동 통계 조회 훅 (팔로워, 팔로잉, 리뷰, 방문 스팟 수)
export function useMyStats() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<UserStatsResponse, Error>({
    queryKey: USER_KEYS.stats(),
    queryFn: () => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.getMyStats(accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 2, // 2분
  });
}

// 3. 특정 유저 팔로잉 목록 조회 훅
export function useUserFollowing(userId?: number) {
  const accessToken = useAuthStore((s) => s.accessToken) ?? undefined;

  return useQuery<FollowUserResponse[], Error>({
    queryKey: USER_KEYS.following(userId),
    queryFn: () => {
      if (!userId) throw new Error('유저 ID가 필요합니다.');
      return userApi.getFollowing(userId, accessToken);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

// 4. 특정 유저 팔로워 목록 조회 훅
export function useUserFollowers(userId?: number) {
  const accessToken = useAuthStore((s) => s.accessToken) ?? undefined;

  return useQuery<FollowUserResponse[], Error>({
    queryKey: USER_KEYS.followers(userId),
    queryFn: () => {
      if (!userId) throw new Error('유저 ID가 필요합니다.');
      return userApi.getFollowers(userId, accessToken);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

// 5. 내 리뷰 목록 무한 스크롤 조회 훅
export function useInfiniteMyReviews(options?: {
  sort?: 'LATEST' | 'RATING_HIGH' | 'RATING_LOW';
  size?: number;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const sort = options?.sort ?? 'LATEST';
  const size = options?.size ?? 20;

  return useInfiniteQuery<MyReviewListResponse, Error>({
    queryKey: USER_KEYS.reviews({ sort, size }),
    queryFn: ({ pageParam = 0 }) => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.getMyReviews(accessToken, { sort, page: pageParam as number, size });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.number + 1 < lastPage.totalPages) {
        return lastPage.number + 1;
      }
      return undefined;
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 2,
  });
}

// 6. 내 관심 테마 수정 뮤테이션
export function useUpdateSpotCategories() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, string[]>({
    mutationFn: (categories: string[]) => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.updateSpotCategories(categories, accessToken);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(USER_KEYS.profile(), updatedUser);
      // 스토어의 user도 갱신한다 — 설정 화면은 profile 쿼리가 아니라 authUser를 읽어서,
      // 여기서 안 맞춰주면 시트를 다시 열었을 때 저장 전 선택이 그대로 보인다.
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: USER_KEYS.profile() });
      // 관심 테마가 추천 쿼리의 입력이다 — 안 지우면 staleTime(60초) 동안 홈이 이전 결과를 보여준다.
      queryClient.invalidateQueries({ queryKey: RECOMMENDED_SPOTS_KEY });
    },
  });
}

// 7. 내 프로필 수정 뮤테이션 (닉네임·프로필 이미지·자기소개)
export function useUpdateMyProfile() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, UserProfileUpdateRequest>({
    mutationFn: (request) => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.updateMyProfile(request, accessToken);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(USER_KEYS.profile(), updatedUser);
      // 스토어의 user도 갱신한다 — 화면 여러 곳이 profile 대신 authUser를 폴백으로 읽는다.
      setUser(updatedUser);
      // 커뮤니티 쪽 타 유저 프로필 캐시에도 내 닉네임·자기소개가 실려 있다.
      queryClient.invalidateQueries({ queryKey: ['community', 'profile'] });
    },
  });
}

// 7-1. 비밀번호 변경 뮤테이션 (설정 > 비밀번호 변경)
export function useChangePassword() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation<void, Error, PasswordChangeRequest>({
    mutationFn: (request) => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.changePassword(request, accessToken);
    },
    // 204라 캐시에 담을 값이 없다. 성공 처리는 호출부에서 한다.
  });
}

// 7-2. 프로필 사진 교체·삭제 뮤테이션
//      응답이 UserResponse라 프로필 수정과 같은 방식으로 캐시·스토어를 갱신한다.
function useProfileImageMutation<TVariables>(
  call: (vars: TVariables, token: string) => Promise<UserResponse>,
) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, TVariables>({
    mutationFn: (vars) => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return call(vars, accessToken);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(USER_KEYS.profile(), updatedUser);
      setUser(updatedUser);
      // 아바타는 피드·댓글·팔로우 목록에도 실려 있다.
      queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });
}

export function useUpdateProfileImage() {
  return useProfileImageMutation<ProfileImageUpload>((file, token) =>
    userApi.updateProfileImage(file, token),
  );
}

export function useDeleteProfileImage() {
  return useProfileImageMutation<void>((_vars, token) => userApi.deleteProfileImage(token));
}

// 8. 사용자 검색 훅 (닉네임 부분일치)
export function useSearchUsers(keyword: string, enabled = true) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const trimmed = keyword.trim();

  return useQuery<UserSearchPageResponse, Error>({
    queryKey: USER_KEYS.search(trimmed),
    queryFn: () => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.searchUsers(trimmed, accessToken);
    },
    // 서버가 빈 검색어를 400으로 막는다 — 보내기 전에 걸러야 오버레이에 에러가 뜬다.
    enabled: enabled && !!accessToken && trimmed.length > 0,
    staleTime: 1000 * 60,
  });
}

// 9. 회원 탈퇴 뮤테이션
export function useWithdraw() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation<void, Error, void>({
    mutationFn: () => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.withdraw(accessToken);
    },
    // clearAuth가 쿼리 캐시까지 비우므로 남의 계정처럼 내 데이터가 남지 않는다.
    // RootNavigator가 accessToken을 보고 트리를 갈아끼워 로그인 화면으로 나간다.
    onSuccess: () => clearAuth(),
  });
}

// 10. 내 앨범 목록 조회 훅
export function useMyAlbums() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery<AlbumResponse[], Error>({
    queryKey: ['user', 'me', 'albums'],
    queryFn: () => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.getMyAlbums(accessToken);
    },
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 2,
  });
}
