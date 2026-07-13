const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 10_000;

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

export type WeatherCondition = 'CLEAR' | 'CLOUDY' | 'RAINY' | 'SNOWY' | 'NONE';
export type TimeCondition = 'SUNRISE' | 'SUNSET' | 'DAWN' | 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'NONE';
export type AirQualityCondition = 'GOOD' | 'NORMAL_OR_BETTER' | 'NONE';

export interface ExpectedMatchDay {
  dayLabel: string;
  date: string;
  weatherStatus: string;
  isMatched: boolean;
}

export interface WishlistSettingResponse {
  spotId: number;
  spotName: string;
  address: string;
  photogenicScore: number;
  tags: string[];
  memo: string;
  weatherConditions: WeatherCondition[];
  timeConditions: TimeCondition[];
  airQualityCondition: AirQualityCondition;
  isAlertEnabled: boolean;
  alertTimingDays: number;
  dndStartTime: string;
  dndEndTime: string;
  expectedMatchDays: ExpectedMatchDay[];
}

export interface WishlistSettingUpdateRequest {
  memo: string;
  weatherConditions: WeatherCondition[];
  timeConditions: TimeCondition[];
  airQualityCondition: AirQualityCondition;
  isAlertEnabled: boolean;
  alertTimingDays: number;
  dndStartTime: string;
  dndEndTime: string;
}

export const wishlistApi = {
  getWishlists: async (accessToken: string): Promise<WishlistSettingResponse[]> => {
    const res = await fetchWithTimeout(`${BASE}/wishlist`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.json();
  },

  getWishlist: async (spotId: number, accessToken: string): Promise<WishlistSettingResponse> => {
    const res = await fetchWithTimeout(`${BASE}/wishlist/${spotId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.json();
  },

  updateWishlist: async (spotId: number, data: WishlistSettingUpdateRequest, accessToken: string): Promise<WishlistSettingResponse> => {
    const res = await fetchWithTimeout(`${BASE}/wishlist/${spotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteWishlist: async (spotId: number, accessToken: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/wishlist/${spotId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },
};
