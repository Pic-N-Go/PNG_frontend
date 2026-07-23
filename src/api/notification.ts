const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 30_000;

if (__DEV__ && !BASE) {
  console.warn('[notification] EXPO_PUBLIC_API_URL 환경 변수가 설정되지 않았습니다. API 요청이 실패할 수 있습니다.');
}

export class ApiError extends Error {}

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      throw new ApiError(err.message ?? `HTTP ${res.status}`);
    }
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export const notificationApi = {
  postToken: async (token: string, accessToken: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/notifications/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });
  },
};
