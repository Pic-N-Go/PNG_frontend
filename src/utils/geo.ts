export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * 수치 유효성, 위경도 범위(-90~90, -180~180), 및 0 센티널 제외를 엄격히 검증하는 공유 좌표 파서
 */
export function parseValidCoordinate(latVal: any, lngVal: any): Coordinate | null {
  const parseNum = (val: any): number | null => {
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'string') {
      const p = parseFloat(val);
      if (Number.isFinite(p)) return p;
    }
    return null;
  };

  const lat = parseNum(latVal);
  const lng = parseNum(lngVal);

  if (lat === null || lng === null) return null;
  if (lat === 0 && lng === 0) return null; // (0, 0) 센티널 제외
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;

  return { latitude: lat, longitude: lng };
}
