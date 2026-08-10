import { WeatherCondition, TimeCondition, AirQualityCondition, SpotAlertSettingResponse } from '@/api/spotAlert';

// 조건 값은 화면 state에서도 API enum 그대로 들고 다닌다.
// 예전에는 한글 UI 문자열을 state에 담고 저장 직전에 enum으로 되돌렸는데,
// 그 역방향 맵(UI_TO_API)의 키가 화면 상수와 어긋나면 `|| 기본값` 폴백에 걸려
// 서로 다른 조건이 같은 enum으로 붕괴하며 중복 저장됐다. 역방향 맵 자체를 없앤다.
// 아래 맵은 오직 "enum → 화면에 보여줄 한글 라벨" 용도다.

// Weather — NONE은 "날씨 조건 없음"을 의미하므로 UI에 표시하지 않음
export const WEATHER_API_TO_UI: Partial<Record<WeatherCondition, string>> = {
  CLEAR: '맑음',
  CLOUDY: '흐림',
  RAINY: '비',
  SNOWY: '눈',
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

// Dust — NORMAL_OR_BETTER는 "보통 이상"이다(기존 '보통 이하'는 의미가 반대였음).
export const DUST_API_TO_UI: Record<AirQualityCondition, string> = {
  GOOD: '좋음',
  NORMAL_OR_BETTER: '보통 이상',
  NONE: '상관없음',
};

// Forecast status string to icon mapping
export const FORECAST_STATUS_MAP: Record<string, string> = {
  맑음: 'clear',
  흐림: 'overcast',
  비: 'rain',
  눈: 'snow',
  안개: 'partly-cloudy',
  구름조금: 'partly-cloudy',
};

export const mapSpotAlertToUI = (data: SpotAlertSettingResponse) => {
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

  // 예전 버전이 중복 조건을 저장해 둔 계정이 있어 조회 시에도 한 번 걸러 준다.
  // (명세상 weatherConditions/timeConditions는 uniqueItems: true)
  const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

  const conditions = [
    ...uniq(data.weatherConditions || [])
      .filter((w) => w !== 'NONE' && !!WEATHER_API_TO_UI[w])
      .map((w) => ({
        type: 'weather',
        text: WEATHER_API_TO_UI[w] as string,
        active: true,
      })),
    ...uniq(data.timeConditions || [])
      .filter((t) => t !== 'NONE' && !!TIME_API_TO_UI[t])
      .map((t) => ({
        type: 'time',
        text: TIME_API_TO_UI[t] as string,
        active: true,
      })),
    ...(data.airQualityCondition && data.airQualityCondition !== 'NONE' && DUST_API_TO_UI[data.airQualityCondition]
      ? [
          {
            type: 'dust',
            text: `미세먼지 ${DUST_API_TO_UI[data.airQualityCondition]}`,
            active: true,
          },
        ]
      : []),
  ];

  const forecast = (data.expectedMatchDays || []).map((d) => ({
    day: d.dayLabel,
    status: FORECAST_STATUS_MAP[d.weatherStatus] || 'clear',
    hit: d.isMatched,
  }));

  const thumbnails = ['#2c3e50', '#34495e', '#7f8c8d'];
  const shortLoc = data.address ? data.address.split(' ').slice(0, 2).join(' ') : '위치 정보 없음';

  return {
    id: data.spotId,
    title: data.spotName,
    loc: `${shortLoc} · 포토제닉 ${data.photogenicScore}점`,
    status,
    statusText,
    conditions,
    forecast,
    notifText: data.isAlertEnabled ? '설정한 조건에 맞춰 알림 설정됨' : null,
    isAlertEnabled: data.isAlertEnabled,
    thumbnails,
    rawData: data,
  };
};

export const mapWishlistToUI = mapSpotAlertToUI;
