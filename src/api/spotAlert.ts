import { fetchWithAuthRetry, toHttpError, tokenFromHeaders } from '@/api/auth';
const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
const TIMEOUT_MS = 30_000;

export { ApiError } from '@/api/auth';

async function fetchWithTimeout(url: string, options: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetchWithAuthRetry(url, { ...options, signal: controller.signal });
    if (!res.ok) throw await toHttpError(res, tokenFromHeaders(options.headers));
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

export interface SpotAlertSettingResponse {
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

export interface SpotAlertSettingUpdateRequest {
  memo: string;
  weatherConditions: WeatherCondition[];
  timeConditions: TimeCondition[];
  airQualityCondition: AirQualityCondition;
  isAlertEnabled: boolean;
  alertTimingDays: number;
  dndStartTime: string;
  dndEndTime: string;
}

// 하위 호환성을 위한 별칭
export type WishlistSettingResponse = SpotAlertSettingResponse;
export type WishlistSettingUpdateRequest = SpotAlertSettingUpdateRequest;

export const spotAlertApi = {
  getSpotAlerts: async (accessToken: string): Promise<SpotAlertSettingResponse[]> => {
    const res = await fetchWithTimeout(`${BASE}/spot-alerts`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.json();
  },

  getSpotAlert: async (spotId: number, accessToken: string): Promise<SpotAlertSettingResponse> => {
    const res = await fetchWithTimeout(`${BASE}/spot-alerts/${spotId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.json();
  },

  updateSpotAlert: async (spotId: number, data: SpotAlertSettingUpdateRequest, accessToken: string): Promise<SpotAlertSettingResponse> => {
    const res = await fetchWithTimeout(`${BASE}/spot-alerts/${spotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteSpotAlert: async (spotId: number, accessToken: string): Promise<void> => {
    await fetchWithTimeout(`${BASE}/spot-alerts/${spotId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  },

  toggleSpotAlertActive: async (spotId: number, isAlertEnabled: boolean, accessToken: string): Promise<{ spotId: number; isAlertEnabled: boolean }> => {
    const res = await fetchWithTimeout(`${BASE}/spot-alerts/${spotId}/active`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ isAlertEnabled }),
    });
    return res.json();
  },
};

// 하위 호환성 객체
export const wishlistApi = {
  getWishlists: spotAlertApi.getSpotAlerts,
  getWishlist: spotAlertApi.getSpotAlert,
  updateWishlist: spotAlertApi.updateSpotAlert,
  deleteWishlist: spotAlertApi.deleteSpotAlert,
};
