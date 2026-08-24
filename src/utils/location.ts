/**
 * 대한민국 영토 유효 좌표 범위 (위도 33.0 ~ 39.0, 경도 124.0 ~ 132.5)
 * iOS 시뮬레이터(미국 캘리포니아 Cupertino)나 해외 접속 시 카카오맵 타일 누락 및 에러를 방지합니다.
 */
export const DEFAULT_SEOUL_LOCATION = {
  lat: 37.5665,
  lng: 126.9780,
};

/**
 * 주어진 위경도가 대한민국 영토(국내) 내에 위치하는지 검증합니다.
 */
export function isLocationInKorea(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  return lat >= 33.0 && lat <= 39.0 && lng >= 124.0 && lng <= 132.5;
}

/**
 * 좌표가 대한민국 내에 있지 않은 경우(해외, iOS 시뮬레이터 기본값 등) 기본 서울시청 좌표로 안전하게 보정합니다.
 */
export function sanitizeKoreaLocation(
  lat?: number | null,
  lng?: number | null,
): { lat: number; lng: number; isFallback: boolean } {
  if (isLocationInKorea(lat, lng)) {
    return { lat: lat!, lng: lng!, isFallback: false };
  }
  return { lat: DEFAULT_SEOUL_LOCATION.lat, lng: DEFAULT_SEOUL_LOCATION.lng, isFallback: true };
}
