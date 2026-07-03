const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

if (__DEV__ && !BASE) {
  console.warn('[auth] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

export type UserResponse = {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
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

const TIMEOUT_MS = 10_000;

// 백엔드가 응답한 에러(ErrorResponse.message)만 이 타입으로 던져짐 — 네트워크 단절/타임아웃 등
// fetch 자체 실패는 일반 Error/DOMException이라 구분되고, 사용자에게 영어 원문 대신 한글 기본 메시지를 보여줄 수 있음.
export class ApiError extends Error {}

export function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new ApiError(err.message ?? `HTTP ${res.status}`);
    }
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new ApiError(err.message ?? `HTTP ${res.status}`);
    }
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
