import type { UserResponse } from '@/types/user';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

if (__DEV__ && !BASE) {
  console.warn('[auth] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

/**
 * `/users/me` 응답. 정의는 `@/types/user`에 둔다 — 여기에 한 벌 더 두면 손으로 동기화해야 하고,
 * 구조가 같아 한쪽만 바뀌어도 TS가 알려주지 않는다(bio 추가 때 실제로 양쪽을 고쳐야 했다).
 */
export type { UserResponse };

export type TokenResponse = {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
  user: UserResponse;
  /**
   * 이번 요청으로 계정이 처음 만들어졌는지. 소셜 로그인에서 true면 온보딩으로 보낸다 —
   * 카카오 닉네임은 중복·특수문자가 흔해 서버가 다듬은 값이 그대로 굳지 않게 확인받는다.
   */
  isNewUser: boolean;
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

  /**
   * 백엔드 ErrorResponse.code (예: `ACCOUNT_WITHDRAWN`, `ACCESS_TOKEN_EXPIRED`). 상태코드만으로는
   * 구분할 수 없는 실패를 호출부가 분기하는 데 쓴다 — 메시지 문자열 매칭은 문구를 고치면 조용히 깨진다.
   */
  readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** 특정 에러 코드인지. 문구 변경에 영향받지 않는 분기용. */
export function isErrorCode(err: unknown, code: string): boolean {
  return err instanceof ApiError && err.code === code;
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

type RefreshedAccessToken = {
  accessToken: string;
  sessionRevision: number;
};

/** Access Token 만료 시 실행할 갱신 처리. 구현은 순환 참조를 피하려고 스토어가 주입한다. */
type AccessTokenExpiredHandler = (
  requestToken: string,
  requestSessionRevision: number,
) => Promise<RefreshedAccessToken | null>;
type SessionRevisionResolver = (requestToken: string) => number | null;

// 스토어를 여기서 직접 import하면 순환 참조가 생기므로 갱신 동작만 주입받는다.
let onAccessTokenExpired: AccessTokenExpiredHandler | null = null;
let resolveSessionRevision: SessionRevisionResolver | null = null;
export function setAccessTokenExpiredHandler(
  resolver: SessionRevisionResolver,
  handler: AccessTokenExpiredHandler,
) {
  resolveSessionRevision = resolver;
  onAccessTokenExpired = handler;
}

/**
 * 실패 응답을 ApiError로 변환한다. 서버가 준 message를 항상 우선하고(백엔드 ErrorResponse의
 * message는 이미 사용자용 한국어다), 본문이 없을 때만 상태코드 기반 문구로 채운다.
 * 모든 api 모듈이 이 함수를 공유해 도메인마다 처리가 갈리지 않게 한다.
 * `code`도 보존하므로 호출부가 상태코드가 같은 인증 오류를 구분할 수 있다.
 */
export async function toHttpError(res: Response, _requestToken?: string): Promise<ApiError> {
  const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  const message = body.message ?? MESSAGE_BY_STATUS[res.status] ?? `요청에 실패했어요. (${res.status})`;
  return new ApiError(message, res.status, body.code);
}

/** Authorization 헤더에서 토큰만 꺼낸다. 헤더를 options로 받는 래퍼용. */
export function tokenFromHeaders(headers: HeadersInit | undefined): string | undefined {
  const value = new Headers(headers).get('Authorization');
  return (value?.startsWith('Bearer ') ? value.slice(7) : undefined) || undefined;
}

async function getErrorCode(res: Response): Promise<string | undefined> {
  const body = (await res.clone().json().catch(() => ({}))) as { code?: string };
  return body.code;
}

/** 만료된 Access Token 요청만 갱신 후 정확히 한 번 재시도한다. */
export async function fetchWithAuthRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const requestToken = tokenFromHeaders(init.headers);
  // 네트워크 응답을 기다리는 동안 로그아웃/새 로그인이 발생할 수 있으므로 요청 시작 시점을 고정한다.
  const requestSessionRevision = requestToken
    ? (resolveSessionRevision?.(requestToken) ?? null)
    : null;
  const res = await fetch(input, init);

  if (
    !requestToken ||
    requestSessionRevision === null ||
    res.status !== 401 ||
    (await getErrorCode(res)) !== 'ACCESS_TOKEN_EXPIRED' ||
    !onAccessTokenExpired
  ) {
    return res;
  }

  const refreshed = await onAccessTokenExpired(requestToken, requestSessionRevision);
  if (!refreshed || refreshed.sessionRevision !== requestSessionRevision) return res;

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set('Authorization', `Bearer ${refreshed.accessToken}`);
  return fetch(input, { ...init, headers: retryHeaders });
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
    const res = await fetchWithAuthRetry(`${BASE}${path}`, {
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

  refreshToken: (refreshToken: string) =>
    post<TokenResponse>('/auth/token/refresh', { refreshToken }),

  /**
   * 탈퇴 대기 중(30일 이내) 계정 복구. 탈퇴 계정은 토큰을 받을 수 없어 인증이 필요한
   * 경로로는 복구를 시작할 수 없다 — 그래서 로그인과 같은 자격증명을 그대로 보낸다.
   */
  restore: (email: string, password: string) =>
    post<TokenResponse>('/auth/restore', { email, password }),

  restoreWithKakao: (accessToken: string) =>
    post<TokenResponse>('/auth/restore/social', { accessToken }),

  sendPasswordResetCode: (email: string) =>
    post<EmailVerificationResponse>('/auth/password/reset/code', { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    post<void>('/auth/password/reset', { email, code, newPassword }),
};
