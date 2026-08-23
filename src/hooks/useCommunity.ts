// 커뮤니티 서버 상태 훅 (TanStack Query). 매핑은 utils/communityMappers.ts에 맡기고
// 여기서는 캐시 키·낙관적 갱신·무효화만 다룬다.
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { communityApi } from '@/api/community';
import type { PostImageUpload } from '@/api/community';
import { useAuthStore } from '@/store/useAuthStore';
import { USER_KEYS } from '@/hooks/useUser';
import { mapComment, mapPostDetail, mapPosts } from '@/utils/communityMappers';
import type { PostMapContext } from '@/utils/communityMappers';
import type {
  CommentPageResponseDTO,
  PostCreateRequestDTO,
  PostPageResponseDTO,
  PostResponseDTO,
  PostSortApi,
  PostUpdateRequestDTO,
  ReactionResponseDTO,
} from '@/types/community';

/**
 * 용도별 페이지 크기. 화면마다 한 번에 보기 좋은 양이 달라 하나로 묶지 않는다.
 * 이 프로젝트는 무한스크롤이 아니라 "더보기" 버튼이라, 값이 작으면 그만큼 더 눌러야 한다.
 */
/** 카드가 커서 10개면 금방 바닥난다. */
const FEED_PAGE_SIZE = 20;
/** 3열 격자라 3의 배수여야 마지막 줄이 비지 않는다(4줄). */
const PROFILE_POSTS_PAGE_SIZE = 12;
/** 상세 화면에서 20개는 스크롤이 길다. */
const COMMENTS_PAGE_SIZE = 10;

const feedKey = (sort: PostSortApi, keyword: string | undefined, token: string | null) =>
  ['community', 'posts', sort, keyword?.trim() || '', token ?? 'guest'] as const;
const postKey = (id: string, token: string | null) => ['community', 'post', id, token ?? 'guest'] as const;
const commentsKey = (postId: string) => ['community', 'comments', postId] as const;
const repliesKey = (postId: string, commentId: string) =>
  ['community', 'replies', postId, commentId] as const;
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
/**
 * 피드 목록. `options.enabled=false`로 요청을 막을 수 있다 —
 * 검색 오버레이의 "전체" 미리보기가 검색어 없을 때 전체 피드를 받아오지 않게 하려고 열어뒀다.
 */
export function useCommunityFeed(sort: PostSortApi, keyword?: string, options?: { enabled?: boolean }) {
  const { token, myUserId } = useAuth();
  const { data: followingIds } = useMyFollowing();
  const ctx: PostMapContext = { myUserId, followingIds };

  // MY_POSTS·FOLLOWING·BOOKMARKED는 서버가 토큰을 요구한다. 비로그인이면 요청 자체를 막는다(400 방지).
  const needsAuth = sort === 'MY_POSTS' || sort === 'FOLLOWING' || sort === 'BOOKMARKED';

  return useInfiniteQuery({
    queryKey: feedKey(sort, keyword, token),
    queryFn: ({ pageParam }) =>
      communityApi.getPosts({ sort, keyword, page: pageParam, size: FEED_PAGE_SIZE, token: token ?? undefined }),
    initialPageParam: 0,
    getNextPageParam: (last: PostPageResponseDTO) => (last.hasNext ? last.page + 1 : undefined),
    enabled: (!needsAuth || !!token) && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
    select: (data) => ({
      posts: data.pages.flatMap((p) => mapPosts(p.posts, ctx)),
      totalElements: data.pages[0]?.totalElements ?? 0,
    }),
  });
}

/**
 * 특정 사용자가 쓴 글. 프로필 화면의 게시글 탭에서 쓴다.
 * 정렬은 LATEST 고정 — 프로필에서는 최신순이 자연스럽고, 인기순은 피드의 몫이다.
 */
export function useUserPosts(userId: string | undefined) {
  const { token, myUserId } = useAuth();
  const { data: followingIds } = useMyFollowing();
  const ctx: PostMapContext = { myUserId, followingIds };
  return useInfiniteQuery({
    queryKey: ['community', 'posts', 'author', userId ?? '', token ?? 'guest'],
    queryFn: ({ pageParam }) =>
      communityApi.getPosts({
        sort: 'LATEST',
        authorId: userId,
        page: pageParam,
        size: PROFILE_POSTS_PAGE_SIZE,
        token: token ?? undefined,
      }),
    initialPageParam: 0,
    getNextPageParam: (last: PostPageResponseDTO) => (last.hasNext ? last.page + 1 : undefined),
    enabled: !!userId,
    select: (data) => ({
      posts: data.pages.flatMap((p) => mapPosts(p.posts, ctx)),
      totalElements: data.pages[0]?.totalElements ?? 0,
    }),
  });
}

/**
 * 게시글 상세 쿼리의 공통 부분. `usePost`(화면용 매핑)와 `usePostForEdit`(원본 DTO)이
 * 같은 캐시를 공유하도록 select만 갈아끼운다 — 상세에서 수정으로 들어갈 때 재요청이 없다.
 */
function postDetailQuery(postId: string | undefined, token: string | null) {
  return {
    queryKey: postKey(postId ?? '', token),
    // EXIF는 게시글과 수명이 같고(사진이 바뀌면 게시글도 바뀐다) 따로 무효화할 일이 없어 함께 받는다.
    queryFn: async () => {
      const post = await communityApi.getPost(postId!, token ?? undefined);
      // EXIF가 없는 사진도 있다 — 실패해도 게시글은 보여준다.
      const exif = await communityApi.getExif(postId!).catch(() => undefined);
      return { post, exif };
    },
    enabled: !!postId,
  };
}

export function usePost(postId: string | undefined) {
  const { token, myUserId } = useAuth();
  const { data: followingIds } = useMyFollowing();
  return useQuery({
    ...postDetailQuery(postId, token),
    select: ({ post, exif }) => mapPostDetail(post, exif, { myUserId, followingIds }),
  });
}

/**
 * 수정 화면 폼 채우기용. 매핑된 `Post`에는 이미지 id·spotId·tags·원본 weather가 없어
 * PATCH 요청을 만들 수 없다. 그래서 여기서는 서버 DTO를 그대로 넘긴다.
 */
export function usePostForEdit(postId: string | undefined) {
  const { token } = useAuth();
  return useQuery({
    ...postDetailQuery(postId, token),
    select: ({ post }) => post,
  });
}

/** 최상위 댓글만 온다. 답글은 useReplies로 따로 받는다("답글 N개 보기"). */
export function useComments(postId: string | undefined) {
  const { token, myUserId } = useAuth();
  return useInfiniteQuery({
    // 토큰이 키에 없으면 로그아웃 후에도 이전 사용자의 liked가 그대로 보인다.
    queryKey: [...commentsKey(postId ?? ''), token ?? 'guest'],
    queryFn: ({ pageParam }) => communityApi.getComments(postId!, pageParam, COMMENTS_PAGE_SIZE, token ?? undefined),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: !!postId,
    select: (data) => ({
      comments: data.pages.flatMap((p) => p.comments.map((c) => mapComment(c, myUserId))),
      totalElements: data.pages[0]?.totalElements ?? 0,
    }),
  });
}

/** enabled=false로 두면 "답글 N개 보기"를 누르기 전까지 요청하지 않는다. */
export function useReplies(postId: string | undefined, commentId: string | undefined, enabled: boolean) {
  const { token, myUserId } = useAuth();
  return useInfiniteQuery({
    queryKey: [...repliesKey(postId ?? '', commentId ?? ''), token ?? 'guest'],
    queryFn: ({ pageParam }) =>
      communityApi.getReplies(postId!, commentId!, pageParam, COMMENTS_PAGE_SIZE, token ?? undefined),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: enabled && !!postId && !!commentId,
    select: (data) => ({
      replies: data.pages.flatMap((p) => p.comments.map((c) => mapComment(c, myUserId))),
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

/**
 * 글 개수가 바뀌면 마이페이지 통계도 다시 받아야 한다 — /users/me/stats의 postCount가
 * staleTime 2분이라, 무효화하지 않으면 글을 쓰거나 지운 뒤에도 이전 개수가 남는다.
 */
function invalidatePostLists(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: ['community', 'posts'] });
  qc.invalidateQueries({ queryKey: USER_KEYS.stats() });
}

export function useCreatePost() {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ request, images }: { request: PostCreateRequestDTO; images: PostImageUpload[] }) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return communityApi.createPost(request, images, token);
    },
    onSuccess: () => {
      invalidatePostLists(qc);
    },
  });
}

export function useUpdatePost(postId: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ request, newImages }: { request: PostUpdateRequestDTO; newImages: PostImageUpload[] }) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return communityApi.updatePost(postId, request, newImages, token);
    },
    onSuccess: () => {
      // 상세는 토큰별로 키가 갈리므로 id까지만 지정해 전부 무효화한다.
      qc.invalidateQueries({ queryKey: ['community', 'post', postId] });
      // 수정은 개수가 그대로라 통계까지 건드릴 필요는 없지만, 목록 갱신 경로를 하나로 둔다.
      invalidatePostLists(qc);
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
      invalidatePostLists(qc);
    },
  });
}

// ── 댓글 ─────────────────────────────────────────────────────────────────

export function useCreateComment(postId: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: string }) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return communityApi.createComment(postId, content, token, parentId);
    },
    onSuccess: (newCommentDTO, { parentId }) => {
      // 1. 게시글 상세 및 목록 캐시의 commentCount만 +1 (게시글/사진 전체 재조회 제거 -> 상단 사진 깜빡임 원천 차단)
      patchPostCaches(qc, postId, (dto) => ({
        ...dto,
        commentCount: dto.commentCount + 1,
      }));

      // 2. 새 댓글을 댓글 캐시 목록에 직접 주입 (새로고침 없이 0초 즉시 화면 반영)
      if (parentId) {
        // 답글인 경우: 답글 캐시에 추가
        qc.setQueriesData<{ pages: CommentPageResponseDTO[]; pageParams: unknown[] }>(
          { queryKey: ['community', 'replies', postId, parentId] },
          (old) => {
            if (!old) return old;
            const pages = [...old.pages];
            if (pages[0]) {
              pages[0] = {
                ...pages[0],
                comments: [...pages[0].comments, newCommentDTO],
                totalElements: (pages[0].totalElements ?? 0) + 1,
              };
            } else {
              pages.push({
                comments: [newCommentDTO],
                totalElements: 1,
                page: 0,
                size: COMMENTS_PAGE_SIZE,
                hasNext: false,
              });
            }
            return { ...old, pages };
          },
        );
        // 부모 댓글의 replyCount +1
        qc.setQueriesData<{ pages: CommentPageResponseDTO[]; pageParams: unknown[] }>(
          { queryKey: commentsKey(postId) },
          (old) =>
            old && {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                comments: page.comments.map((c) =>
                  String(c.id) === parentId ? { ...c, replyCount: (c.replyCount ?? 0) + 1 } : c,
                ),
              })),
            },
        );
      } else {
        // 최상위 댓글인 경우: 댓글 목록 첫 페이지 맨 뒤에 새 댓글 추가
        qc.setQueriesData<{ pages: CommentPageResponseDTO[]; pageParams: unknown[] }>(
          { queryKey: commentsKey(postId) },
          (old) => {
            if (!old) return old;
            const pages = [...old.pages];
            if (pages[0]) {
              pages[0] = {
                ...pages[0],
                comments: [...pages[0].comments, newCommentDTO],
                totalElements: (pages[0].totalElements ?? 0) + 1,
              };
            } else {
              pages.push({
                comments: [newCommentDTO],
                totalElements: 1,
                page: 0,
                size: COMMENTS_PAGE_SIZE,
                hasNext: false,
              });
            }
            return { ...old, pages };
          },
        );
      }
    },
  });
}

/**
 * 댓글 좋아요. 게시글 좋아요와 달리 목록 캐시가 무한스크롤 페이지 구조라, 해당 댓글만
 * 찾아 고친다. 최상위 목록과 답글 목록 어느 쪽에 있든 동작하도록 두 캐시를 모두 훑는다.
 */
export function useToggleCommentLike(postId: string) {
  const { token } = useAuth();
  const qc = useQueryClient();

  const patch = (commentId: string, liked: boolean, likeCount: number) => {
    const apply = (old: { pages: CommentPageResponseDTO[]; pageParams: unknown[] } | undefined) =>
      old && {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          comments: page.comments.map((c) => (String(c.id) === commentId ? { ...c, liked, likeCount } : c)),
        })),
      };
    qc.setQueriesData({ queryKey: commentsKey(postId) }, apply);
    qc.setQueriesData({ queryKey: ['community', 'replies', postId] }, apply);
  };

  return useMutation({
    mutationFn: ({ commentId, next }: { commentId: string; next: boolean; likeCount: number }) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return next
        ? communityApi.likeComment(postId, commentId, token)
        : communityApi.unlikeComment(postId, commentId, token);
    },
    onMutate: async ({ commentId, next, likeCount }) => {
      await qc.cancelQueries({ queryKey: commentsKey(postId) });
      // patch가 답글 캐시도 고치므로 진행 중인 답글 요청도 함께 취소해야 한다.
      await qc.cancelQueries({ queryKey: ['community', 'replies', postId] });
      // 서버 count를 모르는 상태라 ±1로 근사하고, 응답이 오면 정확한 값으로 덮는다.
      patch(commentId, next, Math.max(0, likeCount + (next ? 1 : -1)));
    },
    onSuccess: (res, { commentId }) => patch(commentId, res.active, res.count),
    onError: () => {
      // ±1 근사가 어긋날 수 있어 되돌릴 땐 서버에서 다시 받는다.
      qc.invalidateQueries({ queryKey: commentsKey(postId) });
      qc.invalidateQueries({ queryKey: ['community', 'replies', postId] });
    },
  });
}

/** 댓글·답글 수정. 서버는 내용만 바꾸므로 부모·좋아요 수는 그대로다. */
export function useUpdateComment(postId: string) {
  const { token } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return communityApi.updateComment(postId, commentId, content, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsKey(postId) });
      // 답글을 고쳤을 수도 있어 답글 목록도 함께 갱신한다.
      qc.invalidateQueries({ queryKey: ['community', 'replies', postId] });
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
    onSuccess: (_res, commentId) => {
      // 1. 게시글 상세 및 목록 캐시의 commentCount만 -1 (게시글/사진 전체 재조회 제거)
      patchPostCaches(qc, postId, (dto) => ({
        ...dto,
        commentCount: Math.max(0, dto.commentCount - 1),
      }));

      // 2. 댓글 및 답글 캐시에서 삭제된 댓글 제거
      const remove = (old: { pages: CommentPageResponseDTO[]; pageParams: unknown[] } | undefined) =>
        old && {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            comments: page.comments.filter((c) => String(c.id) !== commentId),
            totalElements: Math.max(0, (page.totalElements ?? 1) - 1),
          })),
        };
      qc.setQueriesData({ queryKey: commentsKey(postId) }, remove);
      qc.setQueriesData({ queryKey: ['community', 'replies', postId] }, remove);
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
      // 팔로워·팔로잉 수는 프로필 응답에 실려 온다 — 프로필을 무효화해야 숫자가 갱신된다.
      // 상대의 팔로워 수뿐 아니라 내 팔로잉 수도 바뀌므로 내 프로필도 함께 지운다.
      qc.invalidateQueries({ queryKey: ['community', 'profile', userId] });
      if (myUserId != null) qc.invalidateQueries({ queryKey: ['community', 'profile', String(myUserId)] });
      // 팔로잉 피드는 팔로우 관계가 바뀌면 내용이 달라진다.
      qc.invalidateQueries({ queryKey: ['community', 'posts'] });
      // 마이페이지 팔로워·팔로잉 타일(/users/me/stats)과 팔로우 목록 화면도 같은 값을 본다.
      // 여기서 지우지 않으면 staleTime 2분 동안 이전 숫자가 남고, FollowScreen의 목록에서
      // 방금 팔로우 취소한 사람이 그대로 보인다.
      qc.invalidateQueries({ queryKey: USER_KEYS.stats() });
      if (myUserId != null) {
        qc.invalidateQueries({ queryKey: USER_KEYS.following(myUserId) });
        qc.invalidateQueries({ queryKey: USER_KEYS.followers(myUserId) });
      }
      qc.invalidateQueries({ queryKey: USER_KEYS.followers(Number(userId)) });
    },
  });
}
