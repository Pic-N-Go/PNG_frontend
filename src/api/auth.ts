const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

if (__DEV__ && !BASE) {
  console.warn('[auth] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

export type UserResponse = {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  role: 'USER' | 'ADMIN';
  provider: 'LOCAL' | 'KAKAO';
  spotCategories: string[];
};

export type TokenResponse = {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  user: UserResponse;
};

export type EmailVerificationResponse = {
  email: string;
  verified: boolean;
  expiresIn: number | null;
  verificationCode: string | null;
};

const TIMEOUT_MS = 30_000;

// 백엔드가 응답한 에러(ErrorResponse.message)만 이 타입으로 던져짐 — 네트워크 단절/타임아웃 등
// fetch 자체 실패는 일반 Error/DOMException이라 구분되고, 사용자에게 영어 원문 대신 한글 기본 메시지를 보여줄 수 있음.
export class ApiError extends Error {
  /**
   * HTTP 상태코드. 401(만료·미인증)·413(용량 초과)처럼 호출부가 다르게 대응해야 하는 경우가 있어
   * 메시지만으로는 부족하다. 서버가 본문 없이 응답하면 message가 `HTTP 401`이 되어버려
   * 사용자에게 그대로 노출됐다. 상태코드를 모르는 실패(네트워크 단절 등)는 undefined.
   */
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * 상태코드별 사용자 메시지. Spring Security의 401·403은 필터 단계라 GlobalExceptionHandler에
 * 도달하지 않고, Boot 기본 에러 본문(timestamp/status/error/path)이 나가 `message` 키가 없다.
 * 그래서 여기서 채우지 않으면 `요청에 실패했어요. (403)`만 보인다.
 * 413은 이제 서버가 400 + message로 바꿔 보내지만, 톰캣 커넥터 단계에서 잘리는 경우가 남아 폴백으로 둔다.
 */
const MESSAGE_BY_STATUS: Record<number, string> = {
  401: '로그인이 만료됐어요. 다시 로그인해 주세요.',
  403: '권한이 없어요. 다시 로그인해 주세요.',
  413: '사진 용량이 너무 커요. 더 작은 사진으로 시도해 주세요.',
};

/**
 * 401을 받았을 때 실행할 처리. 구현은 스토어 쪽에 있다(순환 참조 회피).
 * 배경·설계 근거 → `docs/guide/api/token-refresh-plan.md`
 *
 * @param fn 인자는 그 401을 유발한 요청이 보낸 토큰. 모르면 생략 가능.
 */
let onUnauthorized: ((token?: string) => void) | null = null;
export function setUnauthorizedHandler(fn: (token?: string) => void) {
  onUnauthorized = fn;
}

/**
 * 실패 응답을 ApiError로 변환한다. 서버가 준 message를 항상 우선하고(백엔드 ErrorResponse의
 * message는 이미 사용자용 한국어다), 본문이 없을 때만 상태코드 기반 문구로 채운다.
 * 모든 api 모듈이 이 함수를 공유해 도메인마다 처리가 갈리지 않게 한다.
 *
 * 부수효과 있음: 401이면 onUnauthorized 핸들러를 부른다(= 로그아웃). 변환만 하는 함수가
 * 아니므로 호출부를 옮길 때 주의할 것. 403은 대상이 아니다(토큰이 멀쩡해도 나는 정상 거절).
 *
 * @param requestToken 이 요청이 Authorization 헤더로 보낸 토큰. 알 수 있으면 넘긴다.
 */
export async function toHttpError(res: Response, requestToken?: string): Promise<ApiError> {
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  const message = body.message ?? MESSAGE_BY_STATUS[res.status] ?? `요청에 실패했어요. (${res.status})`;
  if (res.status === 401) onUnauthorized?.(requestToken);
  return new ApiError(message, res.status);
}

/** Authorization 헤더에서 토큰만 꺼낸다. 헤더를 options로 받는 래퍼용. */
export function tokenFromHeaders(headers: HeadersInit | undefined): string | undefined {
  const value = new Headers(headers).get('Authorization');
  return (value?.startsWith('Bearer ') ? value.slice(7) : undefined) || undefined;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res);
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

async function get<T>(path: string, accessToken?: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      signal: controller.signal,
    });
    if (!res.ok) throw await toHttpError(res, accessToken);
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export const authApi = {
  login: (email: string, password: string) =>
    post<TokenResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, nickname: string, spotCategories: string[]) =>
    post<TokenResponse>('/auth/register', { email, password, nickname, spotCategories }),

  sendEmailVerification: (email: string) =>
    post<EmailVerificationResponse>('/auth/email/verify', { email }),

  confirmEmailVerification: (email: string, code: string) =>
    post<EmailVerificationResponse>('/auth/email/confirm', { email, code }),

  checkNickname: (value: string) =>
    get<{ nickname: string; available: boolean }>(`/auth/nickname/check?value=${encodeURIComponent(value)}`),

  me: (accessToken: string) => get<UserResponse>('/users/me', accessToken),

  loginWithKakao: (accessToken: string) =>
    post<TokenResponse>('/auth/login/social', { accessToken }),

  sendPasswordResetCode: (email: string) =>
    post<EmailVerificationResponse>('/auth/password/reset/code', { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    post<void>('/auth/password/reset', { email, code, newPassword }),
};
