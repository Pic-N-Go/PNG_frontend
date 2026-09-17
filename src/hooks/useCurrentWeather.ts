import { useQuery } from '@tanstack/react-query';
import { weatherApi } from '@/api/weather';
import { useAuthStore } from '@/store/useAuthStore';

/** 실제 관측값이 바뀌는 주기보다 촘촘히 물어봐야 소용이 없다. 서버도 같은 값을 캐시해 돌려준다. */
const WEATHER_STALE_TIME = 10 * 60 * 1000;

/**
 * 홈 히어로의 "서울 · 맑음 · 미세먼지 좋음 · 골든아워 18:42" 한 줄.
 * 좌표가 없으면(위치 권한 거부 등) 요청하지 않는다 — 서버가 lat·lng를 필수로 받는다.
 */
export function useCurrentWeather(lat?: number, lng?: number) {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    // 좌표를 소수점 둘째 자리로 뭉갠다. 1km 남짓이라 날씨는 같은데, 그대로 두면
    // GPS가 미세하게 흔들릴 때마다 키가 바뀌어 매번 새로 요청한다.
    queryKey: ['weather', 'current', lat?.toFixed(2), lng?.toFixed(2), token ?? 'guest'],
    queryFn: () => weatherApi.getCurrentWeather(lat!, lng!, token ?? undefined),
    enabled: lat !== undefined && lng !== undefined,
    staleTime: WEATHER_STALE_TIME,
  });
}
