const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

if (__DEV__ && !BASE) {
  console.warn('[auth] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

export type UserResponse = {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  provider: string | null;
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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const authApi = {
  login: (email: string, password: string) =>
    post<TokenResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, nickname: string) =>
    post<TokenResponse>('/auth/register', { email, password, nickname }),

  sendEmailVerification: (email: string) =>
    post<EmailVerificationResponse>('/auth/email/verify', { email }),

  confirmEmailVerification: (email: string, code: string) =>
    post<EmailVerificationResponse>('/auth/email/confirm', { email, code }),

  checkNickname: async (value: string): Promise<{ nickname: string; available: boolean }> => {
    const res = await fetch(`${BASE}/auth/nickname/check?value=${encodeURIComponent(value)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new Error(err.message ?? `HTTP ${res.status}`);
    }
    return res.json();
  },

  loginWithKakao: (code: string) =>
    post<TokenResponse>('/auth/login/social', { code }),
};
