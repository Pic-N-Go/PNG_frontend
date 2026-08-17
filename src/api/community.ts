// 커뮤니티(게시글·댓글)와 팔로우 API (순수 fetch). 매핑은 utils/communityMappers.ts,
// 캐싱·낙관적 갱신은 hooks/useCommunity.ts에서 처리한다.
// 백엔드: PNG_backend `community` 모듈(PostController·PostCommentController) + `user` 모듈(UserController).
import { ApiError, toHttpError } from '@/api/auth';
import type {
  CommentPageResponseDTO,
  CommentResponseDTO,
  FollowUserDTO,
  PostCreateRequestDTO,
  PostExifResponseDTO,
  PostPageResponseDTO,
  PostResponseDTO,
  PostSortApi,
  PostUpdateRequestDTO,
  ReactionResponseDTO,
  UserProfileDTO,
} from '@/types/community';

/** RN이 파일 파트로 인식하는 최소 형태 (expo-image-picker 결과 그대로) */
export interface PostImageUpload {
  uri: string;
  name: string;
  type: string;
}

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

if (__DEV__ && !BASE) {
  console.warn('[community] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

const TIMEOUT_MS = 10_000;
// 사진 최대 5장 — spot.ts의 리뷰 사진 업로드와 같은 이유로 넉넉히 잡는다.
const UPLOAD_TIMEOUT_MS = 180_000;

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

// fetch의 영문 오류(Aborted / Network request failed)가 그대로 Alert에 노출되지 않도록 한국어로 바꾼다.
function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (__DEV__) console.warn('[community] 원본 오류:', err);
  if (err instanceof Error && err.name === 'AbortError') {
    return new ApiError('응답이 늦어 중단했어요. 등록됐는지 확인한 뒤 다시 시도해 주세요.');
  }
  return new ApiError('네트워크 연결을 확인해 주세요.');
}

// DELETE는 204(본문 없음)로 오고, 팔로우/언팔로우는 200 + 빈 본문으로 온다.
// res.json()을 무조건 부르면 성공한 요청이 파싱 오류로 실패 처리된다.
async function parseBody<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function request<T>(path: string, opts: { method?: Method; body?: unknown; token?: string } = {}): Promise<T> {
  const { method = 'GET', body, token } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res, token);
    return await parseBody<T>(res);
  } catch (err) {
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * multipart 전용. FormData를 보낼 땐 boundary를 런타임이 붙이도록 Content-Type을 지정하지 않는다.
 * 게시글 등록/수정은 JSON 파트("request")와 파일 파트를 함께 보내는 형태다.
 */
async function upload<T>(path: string, method: 'POST' | 'PATCH', form: FormData, token: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      body: form,
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res, token);
    return await parseBody<T>(res);
  } catch (err) {
    throw toApiError(err);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @RequestPart("request")는 JSON 파트다. RN의 FormData는 Blob을 지원하지 않아 part별
 * Content-Type을 붙일 수 없는데, Spring은 파트에 타입이 없으면 application/octet-stream으로
 * 보고 415를 던진다. 그래서 문자열 대신 `type: 'application/json'`을 붙인 가짜 파일로 넣는다.
 */
function appendJsonPart(form: FormData, name: string, value: unknown) {
  form.append(name, {
    string: JSON.stringify(value),
    name: `${name}.json`,
    type: 'application/json',
  } as unknown as Blob);
}

function appendImages(form: FormData, name: string, images: PostImageUpload[]) {
  images.forEach((img) => {
    form.append(name, { uri: img.uri, name: img.name, type: img.type } as unknown as Blob);
  });
}

export interface GetPostsParams {
  sort?: PostSortApi;
  keyword?: string;
  page?: number;
  size?: number;
  token?: string;
}

export const communityApi = {
  // 1. 게시글 목록 (GET /posts) — 정렬·검색·페이징 모두 서버가 처리한다.
  //    MY_POSTS·FOLLOWING은 토큰이 없으면 서버가 400을 던지므로 훅에서 비로그인 시 막는다.
  getPosts: ({ sort = 'POPULAR', keyword, page = 0, size = 20, token }: GetPostsParams = {}) => {
    const kwQs = keyword?.trim() ? `keyword=${encodeURIComponent(keyword.trim())}&` : '';
    return request<PostPageResponseDTO>(`/posts?${kwQs}sort=${sort}&page=${page}&size=${size}`, { token });
  },

  // 2. 게시글 상세 (GET /posts/{id}) — 토큰이 있어야 liked·bookmarked가 내 기준으로 온다.
  getPost: (id: string | number, token?: string) => request<PostResponseDTO>(`/posts/${id}`, { token }),

  // 3. 게시글 등록 (POST /posts, multipart) — images 파트는 서버에서 필수다.
  createPost: (request_: PostCreateRequestDTO, images: PostImageUpload[], token: string) => {
    const form = new FormData();
    appendJsonPart(form, 'request', request_);
    appendImages(form, 'images', images);
    return upload<PostResponseDTO>('/posts', 'POST', form, token);
  },

  // 4. 게시글 수정 (PATCH /posts/{id}, multipart) — retainedImageIds에 없는 기존 이미지는 삭제된다.
  updatePost: (id: string | number, request_: PostUpdateRequestDTO, newImages: PostImageUpload[], token: string) => {
    const form = new FormData();
    appendJsonPart(form, 'request', request_);
    if (newImages.length > 0) appendImages(form, 'newImages', newImages);
    return upload<PostResponseDTO>(`/posts/${id}`, 'PATCH', form, token);
  },

  deletePost: (id: string | number, token: string) => request<void>(`/posts/${id}`, { method: 'DELETE', token }),

  // 5. 좋아요·북마크 — 응답의 count가 서버 기준 최신값이라 낙관적 갱신 후 이 값으로 덮는다.
  like: (id: string | number, token: string) => request<ReactionResponseDTO>(`/posts/${id}/like`, { method: 'POST', token }),
  unlike: (id: string | number, token: string) => request<ReactionResponseDTO>(`/posts/${id}/like`, { method: 'DELETE', token }),
  bookmark: (id: string | number, token: string) => request<ReactionResponseDTO>(`/posts/${id}/bookmark`, { method: 'POST', token }),
  removeBookmark: (id: string | number, token: string) => request<ReactionResponseDTO>(`/posts/${id}/bookmark`, { method: 'DELETE', token }),

  // 6. EXIF (GET /posts/{id}/exif) — 라이트박스에서 열 때만 조회한다(인증 불필요).
  getExif: (id: string | number) => request<PostExifResponseDTO>(`/posts/${id}/exif`),

  // 7. 댓글 (GET/POST /posts/{postId}/comments, PATCH/DELETE .../{commentId})
  getComments: (postId: string | number, page = 0, size = 20) =>
    request<CommentPageResponseDTO>(`/posts/${postId}/comments?page=${page}&size=${size}`),
  createComment: (postId: string | number, content: string, token: string) =>
    request<CommentResponseDTO>(`/posts/${postId}/comments`, { method: 'POST', body: { content }, token }),
  updateComment: (postId: string | number, commentId: string | number, content: string, token: string) =>
    request<CommentResponseDTO>(`/posts/${postId}/comments/${commentId}`, { method: 'PATCH', body: { content }, token }),
  deleteComment: (postId: string | number, commentId: string | number, token: string) =>
    request<void>(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE', token }),

  // 8. 유저 프로필·팔로우 — `/users` 모듈이지만 커뮤니티 화면에서만 쓰므로 여기에 둔다.
  //    프로필 응답에 팔로우 여부가 없어, 내 팔로잉 목록으로 판정한다(useMyFollowing).
  //    /posts와 달리 `/users/**`는 SecurityConfig의 PUBLIC_ENDPOINTS에 없어 조회에도 토큰이 필요하다
  //    (anyRequest().authenticated()). 토큰을 빼면 401이 떨어진다.
  getUserProfile: (userId: string | number, token?: string) => request<UserProfileDTO>(`/users/${userId}/profile`, { token }),
  getFollowers: (userId: string | number, token?: string) => request<FollowUserDTO[]>(`/users/${userId}/followers`, { token }),
  getFollowing: (userId: string | number, token?: string) => request<FollowUserDTO[]>(`/users/${userId}/following`, { token }),
  follow: (userId: string | number, token: string) => request<void>(`/users/${userId}/follow`, { method: 'POST', token }),
  unfollow: (userId: string | number, token: string) => request<void>(`/users/${userId}/follow`, { method: 'DELETE', token }),
};
