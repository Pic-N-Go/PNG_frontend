export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);  
  const dLon = deg2rad(lon2 - lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

type CourseStatSpot = {
  lat?: number | null;
  lng?: number | null;
  travelTimeMinutes?: number | null;
};

/**
 * 코스 한 구간(= Day 하나 또는 여러 Day를 이어붙인 목록)의 총 이동거리·이동시간.
 * 거리는 좌표 직선거리, 시간은 서버가 준 travelTimeMinutes를 쓰고
 * 없으면 평균 35km/h로 추정한다.
 *
 * distanceKm은 반올림하지 않은 값이다. Day별로 구해 합산하는 곳(지도 전체 보기)이 있어
 * 여기서 미리 반올림하면 Day 수만큼 오차가 쌓인다. 반올림은 표시하는 쪽에서 한다.
 */
export function getCourseStats(spots?: CourseStatSpot[] | null) {
  if (!spots || spots.length === 0) return { distanceKm: 0, durationText: "0분" };

  let distance = 0;
  let durationMins = 0;

  for (let i = 0; i < spots.length - 1; i++) {
    const current = spots[i];
    const next = spots[i + 1];
    if (current.lat && current.lng && next.lat && next.lng) {
      const legDist = getDistanceFromLatLonInKm(current.lat, current.lng, next.lat, next.lng);
      distance += legDist;
      if (next.travelTimeMinutes != null) {
        durationMins += next.travelTimeMinutes;
      } else if (legDist > 0) {
        durationMins += Math.max(1, Math.round((legDist / 35) * 60));
      }
    } else if (next.travelTimeMinutes != null) {
      durationMins += next.travelTimeMinutes;
    }
  }

  const h = Math.floor(durationMins / 60);
  const m = durationMins % 60;
  const durationText = durationMins > 0
    ? (h > 0 ? (m > 0 ? `약 ${h}시간 ${m}분` : `약 ${h}시간`) : `약 ${m}분`)
    : "0분";

  return { distanceKm: distance, durationText };
}
