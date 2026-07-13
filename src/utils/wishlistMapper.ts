import { WeatherCondition, TimeCondition, AirQualityCondition, WishlistSettingResponse } from '@/api/wishlist';

// Weather
export const WEATHER_API_TO_UI: Record<WeatherCondition, string> = {
  CLEAR: '맑음',
  CLOUDY: '흐림',
  RAINY: '비',
  SNOWY: '눈',
  NONE: '안개', // Mapped based on generic options, adjust if backend has FOG
};

export const WEATHER_UI_TO_API: Record<string, WeatherCondition> = {
  맑음: 'CLEAR',
  흐림: 'CLOUDY',
  비: 'RAINY',
  눈: 'SNOWY',
  안개: 'NONE',
  뇌우: 'NONE', // Fallback
};

// Time
export const TIME_API_TO_UI: Record<TimeCondition, string> = {
  SUNRISE: '일출',
  SUNSET: '일몰',
  DAWN: '새벽',
  MORNING: '오전',
  AFTERNOON: '오후',
  NIGHT: '야간',
  NONE: '시간 무관',
};

export const TIME_UI_TO_API: Record<string, TimeCondition> = {
  일출: 'SUNRISE',
  일몰: 'SUNSET',
  새벽: 'DAWN',
  오전: 'MORNING',
  오후: 'AFTERNOON',
  야간: 'NIGHT',
};

// Dust
export const DUST_API_TO_UI: Record<AirQualityCondition, string> = {
  GOOD: '좋음',
  NORMAL_OR_BETTER: '보통 이하',
  NONE: '상관 없음',
};

export const DUST_UI_TO_API: Record<string, AirQualityCondition> = {
  좋음: 'GOOD',
  '보통 이하': 'NORMAL_OR_BETTER',
  '상관 없음': 'NONE',
};

// Forecast status string to icon mapping
export const FORECAST_STATUS_MAP: Record<string, string> = {
  맑음: 'clear',
  흐림: 'overcast',
  비: 'rain',
  눈: 'snow',
  안개: 'partly-cloudy', // approximation
  구름조금: 'partly-cloudy',
};

export const mapWishlistToUI = (data: WishlistSettingResponse) => {
  const isHitToday = data.expectedMatchDays?.find((d) => d.dayLabel === '오늘')?.isMatched;
  const isHitTomorrow = data.expectedMatchDays?.find((d) => d.dayLabel === '내일')?.isMatched;

  let status = 'wait';
  let statusText = '대기 중';
  if (isHitToday) {
    status = 'hit';
    statusText = '오늘 충족';
  } else if (isHitTomorrow) {
    status = 'soon';
    statusText = '내일 충족 예상';
  }

  const conditions = [
    ...(data.weatherConditions || []).map((w) => ({
      type: 'weather',
      text: WEATHER_API_TO_UI[w] || w,
      active: true,
    })),
    ...(data.timeConditions || []).map((t) => ({
      type: 'time',
      text: TIME_API_TO_UI[t] || t,
      active: true,
    })),
    {
      type: 'dust',
      text: `미세먼지 ${DUST_API_TO_UI[data.airQualityCondition] || '좋음'}`,
      active: true,
    },
  ];

  const forecast = (data.expectedMatchDays || []).map((d) => ({
    day: d.dayLabel,
    status: FORECAST_STATUS_MAP[d.weatherStatus] || 'clear',
    hit: d.isMatched,
  }));

  // Fallback thumbnails
  const thumbnails = ['#2c3e50', '#34495e', '#7f8c8d'];

  // short location
  const shortLoc = data.address ? data.address.split(' ').slice(0, 2).join(' ') : '위치 정보 없음';

  return {
    id: data.spotId,
    title: data.spotName,
    loc: `${shortLoc} · 포토제닉 ${data.photogenicScore}점`,
    status,
    statusText,
    conditions,
    forecast,
    notifText: data.isAlertEnabled ? (data.memo || '설정한 조건에 맞춰 알림 설정됨') : null,
    thumbnails,
  };
};
