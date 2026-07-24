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

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  deepLink?: string;
  spotId?: number | string;
  createdAt: string;
}

export interface NotificationSettingResponse {
  isWishlistPushEnabled: boolean;
  isGoldenHourPushEnabled: boolean;
  isCommunityPushEnabled: boolean;
  isDndEnabled?: boolean;
  dndStartTime?: string | null;
  dndEndTime?: string | null;
}

export interface NotificationSettingUpdateRequest {
  isWishlistPushEnabled: boolean;
  isGoldenHourPushEnabled: boolean;
  isCommunityPushEnabled: boolean;
  isDndEnabled: boolean;
  dndStartTime?: string;
  dndEndTime?: string;
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

  getSettings: async (accessToken: string): Promise<NotificationSettingResponse> => {
    const res = await fetchWithTimeout(`${BASE}/notifications/settings`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.json();
  },

  updateSettings: async (data: NotificationSettingUpdateRequest, accessToken: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/notifications/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
  },

  getNotifications: async (accessToken: string): Promise<NotificationItem[]> => {
    const res = await fetchWithTimeout(`${BASE}/notifications`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.json();
  },

  markRead: async (id: number, accessToken: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  markAllRead: async (accessToken: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};

