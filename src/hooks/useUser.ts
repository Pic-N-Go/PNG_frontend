import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/user';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  UserResponse,
  UserStatsResponse,
  FollowUserResponse,
  MyReviewListResponse,
  AlbumResponse,
} from '@/types/user';

export const USER_KEYS = {
  all: ['user'] as const,
  profile: () => [...USER_KEYS.all, 'profile'] as const,
  stats: () => [...USER_KEYS.all, 'stats'] as const,
  following: (userId?: number) => [...USER_KEYS.all, userId, 'following'] as const,
  followers: (userId?: number) => [...USER_KEYS.all, userId, 'followers'] as const,
  reviews: (params?: any) => [...USER_KEYS.all, 'reviews', params] as const,
  userProfile: (userId?: number) => [...USER_KEYS.all, 'other', userId] as const,
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
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, string[]>({
    mutationFn: (categories: string[]) => {
      if (!accessToken) throw new Error('로그인이 필요합니다.');
      return userApi.updateSpotCategories(categories, accessToken);
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(USER_KEYS.profile(), updatedUser);
      queryClient.invalidateQueries({ queryKey: USER_KEYS.profile() });
    },
  });
}

// 7. 내 앨범 목록 조회 훅
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
