// 커뮤니티 서버 상태 훅 (TanStack Query). 매핑은 utils/communityMappers.ts에 맡기고
// 여기서는 캐시 키·낙관적 갱신·무효화만 다룬다.
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { communityApi } from '@/api/community';
import type { PostImageUpload } from '@/api/community';
import { useAuthStore } from '@/store/useAuthStore';
import { mapComment, mapPostDetail, mapPosts } from '@/utils/communityMappers';
import type { PostMapContext } from '@/utils/communityMappers';
import type {
  PostCreateRequestDTO,
  PostPageResponseDTO,
  PostResponseDTO,
  PostSortApi,
  ReactionResponseDTO,
} from '@/types/community';

const PAGE_SIZE = 20;

const feedKey = (sort: PostSortApi, keyword: string | undefined, token: string | null) =>
  ['community', 'posts', sort, keyword?.trim() || '', token ?? 'guest'] as const;
const postKey = (id: string, token: string | null) => ['community', 'post', id, token ?? 'guest'] as const;
const commentsKey = (postId: string) => ['community', 'comments', postId] as const;
const followingKey = (userId: string | number) => ['community', 'following', String(userId)] as const;

function useAuth() {
  const token = useAuthStore((s) => s.accessToken);
  const myUserId = useAuthStore((s) => s.user?.id ?? null);
  return { token, myUserId };
}

/**
 * 내가 팔로우 중인 사용자 id 집합. 게시글 응답에 팔로우 여부가 없어 목록으로 판정한다.
 * ponytail: 팔로잉이 수천 명이면 이 전체 조회가 무거워진다 — 그때는 서버가 PostResponse에
 * isFollowingAuthor를 넣어주는 게 맞고, 그러면 이 훅은 통째로 지우면 된다.
 */
export function useMyFollowing() {
  const { token, myUserId } = useAuth();
  return useQuery({
    queryKey: followingKey(myUserId ?? 'guest'),
    queryFn: () => communityApi.getFollowing(myUserId!, token ?? undefined),
    // `/users/**`는 조회에도 인증이 필요하다 — 토큰이 없으면 요청해봐야 401이다.
    enabled: myUserId != null && !!token,
    staleTime: 5 * 60 * 1000,
    select: (list) => new Set(list.map((u) => String(u.id))),
  });
}

/** 피드 — 정렬·검색·페이징 모두 서버가 처리한다. */
export function useCommunityFeed(sort: PostSortApi, keyword?: string) {
  const { token, myUserId } = useAuth();
  const { data: followingIds } = useMyFollowing();
  const ctx: PostMapContext = { myUserId, followingIds };

  // MY_POSTS·FOLLOWING은 서버가 토큰을 요구한다. 비로그인이면 요청 자체를 막는다(400 방지).
  const needsAuth = sort === 'MY_POSTS' || sort === 'FOLLOWING';

  return useInfiniteQuery({
    queryKey: feedKey(sort, keyword, token),
    queryFn: ({ pageParam }) =>
      communityApi.getPosts({ sort, keyword, page: pageParam, size: PAGE_SIZE, token: token ?? undefined }),
    initialPageParam: 0,
    getNextPageParam: (last: PostPageResponseDTO) => (last.hasNext ? last.page + 1 : undefined),
    enabled: !needsAuth || !!token,
    placeholderData: keepPreviousData,
    select: (data) => ({
      posts: data.pages.flatMap((p) => mapPosts(p.posts, ctx)),
      totalElements: data.pages[0]?.totalElements ?? 0,
    }),
  });
}

export function usePost(postId: string | undefined) {
  const { token, myUserId } = useAuth();
  const { data: followingIds } = useMyFollowing();
  // EXIF는 게시글과 수명이 같고(사진이 바뀌면 게시글도 바뀐다) 따로 무효화할 일이 없어 함께 받는다.
  return useQuery({
    queryKey: postKey(postId ?? '', token),
    queryFn: async () => {
      const post = await communityApi.getPost(postId!, token ?? undefined);
      // EXIF가 없는 사진도 있다 — 실패해도 게시글은 보여준다.
      const exif = await communityApi.getExif(postId!).catch(() => undefined);
      return { post, exif };
    },
    enabled: !!postId,
    select: ({ post, exif }) => mapPostDetail(post, exif, { myUserId, followingIds }),
  });
}

export function useComments(postId: string | undefined) {
  const { myUserId } = useAuth();
  return useInfiniteQuery({
    queryKey: commentsKey(postId ?? ''),
    queryFn: ({ pageParam }) => communityApi.getComments(postId!, pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: !!postId,
    select: (data) => ({
      comments: data.pages.flatMap((p) => p.comments.map((c) => mapComment(c, myUserId))),
      totalElements: data.pages[0]?.totalElements ?? 0,
    }),
  });
}

// ── 좋아요 · 북마크 ────────────────────────────────────────────────────────
// 서버 응답(active/count)이 최종값이다. 탭 반응을 즉시 보여주려고 먼저 캐시를 고치고,
// 응답이 오면 서버 값으로 덮는다. 실패하면 되돌린다.

type Reaction = 'like' | 'bookmark';

function patchPostCaches(qc: QueryClient, postId: string, patch: (dto: PostResponseDTO) => PostResponseDTO) {
  qc.setQueriesData<{ pages: PostPageResponseDTO[]; pageParams: unknown[] }>(
    { queryKey: ['community', 'posts'] },
    (old) =>
      old && {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((p) => (String(p.id) === postId ? patch(p) : p)),
        })),
      },
  );
  qc.setQueriesData<{ post: PostResponseDTO; exif: unknown }>({ queryKey: ['community', 'post', postId] }, (old) =>
    old && { ...old, post: patch(old.post) },
  );
}

function applyReaction(dto: PostResponseDTO, kind: Reaction, active: boolean, count: number): PostResponseDTO {
  return kind === 'like'
    ? { ...dto, liked: active, likeCount: count }
    : { ...dto, bookmarked: active, bookmarkCount: count };
}

function useReactionMutation(kind: Reaction) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, next }: { postId: string; next: boolean }) => {
      if (!token) throw new Error('로그인이 필요해요.');
      if (kind === 'like') return next ? communityApi.like(postId, token) : communityApi.unlike(postId, token);
      return next ? communityApi.bookmark(postId, token) : communityApi.removeBookmark(postId, token);
    },
    onMutate: async ({ postId, next }) => {
      await qc.cancelQueries({ queryKey: ['community', 'posts'] });
      await qc.cancelQueries({ queryKey: ['community', 'post', postId] });
      // 서버 count를 모르는 상태라 ±1로 근사하고, 응답이 오면 정확한 값으로 덮는다.
      const delta = next ? 1 : -1;
      patchPostCaches(qc, postId, (dto) =>
        applyReaction(
          dto,
          kind,
          next,
          Math.max(0, (kind === 'like' ? dto.likeCount : dto.bookmarkCount) + delta),
        ),
      );
      return { previousActive: !next };
    },
    onSuccess: (res: ReactionResponseDTO, { postId }) => {
      patchPostCaches(qc, postId, (dto) => applyReaction(dto, kind, res.active, res.count));
    },
    onError: (_err, { postId }, context) => {
      // 되돌릴 땐 서버에서 다시 받는 게 가장 확실하다(±1 근사가 두 번 겹치면 값이 어긋난다).
      void context;
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
      qc.invalidateQueries({ queryKey: ['community', 'post', postId] });
    },
  });
}

export const useToggleLike = () => useReactionMutation('like');
export const useToggleBookmark = () => useReactionMutation('bookmark');

// ── 게시글 CRUD ───────────────────────────────────────────────────────────

export function useCreatePost() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ request, images }: { request: PostCreateRequestDTO; images: PostImageUpload[] }) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return communityApi.createPost(request, images, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

export function useDeletePost() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return communityApi.deletePost(postId, token);
    },
    onSuccess: (_res, postId) => {
      qc.removeQueries({ queryKey: ['community', 'post', postId] });
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

// ── 댓글 ─────────────────────────────────────────────────────────────────

export function useCreateComment(postId: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return communityApi.createComment(postId, content, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsKey(postId) });
      // 댓글 수는 게시글 응답에 들어 있어 목록·상세도 같이 갱신해야 숫자가 맞는다.
      qc.invalidateQueries({ queryKey: ['community', 'post', postId] });
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

export function useDeleteComment(postId: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return communityApi.deleteComment(postId, commentId, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsKey(postId) });
      qc.invalidateQueries({ queryKey: ['community', 'post', postId] });
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}

// ── 프로필 · 팔로우 ────────────────────────────────────────────────────────

/**
 * `/users/{id}/profile`은 닉네임·프로필사진·관심카테고리만 준다(자기소개·게시글 수 없음).
 * 조회에도 토큰이 필요하다 — `/users/**`는 SecurityConfig의 공개 경로가 아니다.
 */
export function useUserProfile(userId: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['community', 'profile', userId ?? '', token ?? 'guest'],
    queryFn: () => communityApi.getUserProfile(userId!, token ?? undefined),
    enabled: !!userId && !!token,
  });
}

/** 팔로워/팔로잉 수는 전용 카운트 API가 없어 목록 길이로 센다. */
export function useFollowCounts(userId: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['community', 'followCounts', userId ?? '', token ?? 'guest'],
    queryFn: async () => {
      const [followers, following] = await Promise.all([
        communityApi.getFollowers(userId!, token ?? undefined),
        communityApi.getFollowing(userId!, token ?? undefined),
      ]);
      return { followerCount: followers.length, followingCount: following.length };
    },
    enabled: !!userId && !!token,
  });
}

export function useToggleFollow() {
  const { token, myUserId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, next }: { userId: string; next: boolean }) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return next ? communityApi.follow(userId, token) : communityApi.unfollow(userId, token);
    },
    onSuccess: (_res, { userId }) => {
      if (myUserId != null) qc.invalidateQueries({ queryKey: followingKey(myUserId) });
      qc.invalidateQueries({ queryKey: ['community', 'followCounts', userId] });
      // 팔로잉 피드는 팔로우 관계가 바뀌면 내용이 달라진다.
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
}
