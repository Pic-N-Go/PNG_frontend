import { request } from '@/api/http';

/** 미세먼지·오존처럼 등급과 수치가 같이 오는 항목. 둘 다 서버가 못 구하면 항목째 null이다. */
export interface AirGrade {
  grade: string | null;
  value: number | null;
}

/**
 * GET /weather/current 응답.
 *
 * 서버가 기상청·에어코리아·카카오 역지오코딩을 각각 감싸서 부르기 때문에, 하나가 실패해도
 * 나머지는 온다 — 실패한 필드만 null이 된다. 화면에서 필드별로 있는 것만 그릴 것.
 */
export interface CurrentWeather {
  region: string | null;
  weatherStatus: string | null;
  temperature: number | null;
  fineDust: AirGrade | null;
  ozone: AirGrade | null;
  goldenHour: string | null;
}

export const weatherApi = {
  getCurrentWeather: (lat: number, lng: number, token?: string) =>
    request<CurrentWeather>(`/weather/current?lat=${lat}&lng=${lng}`, { token }),
};
