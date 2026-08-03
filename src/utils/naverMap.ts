import { Linking, Alert } from 'react-native';
import { SpotLocation } from './kakaoNavi';
import { parseValidCoordinate } from './geo';

/**
 * 네이버 지도 (Naver Map) 앱 딥링크(Deep Link) 길안내 실행 유틸리티
 * 
 * - 앱 URI Scheme: nmap://route/car
 * - slat, slng, sname: 출발지 정보
 * - dlat, dlng, dname: 도착지 정보
 * - v1lat, v1lng, v1name ... : 중간 경유지 정보
 * - appname: com.picngo.app
 * - 미설치 시: 네이버 지도 웹/스토어 URL 폴백 실행
 */
export const openNaverMap = async (spots: SpotLocation[]) => {
  if (!spots || spots.length === 0) {
    Alert.alert('알림', '길안내를 시작할 스팟 정보가 없습니다.');
    return;
  }

  const validSpots: SpotLocation[] = [];
  spots.forEach((s) => {
    const targetLat = s.navigation?.latitude ?? s.latitude;
    const targetLng = s.navigation?.longitude ?? s.longitude;
    const targetName = s.navigation?.name || s.name || '스팟';
    const coord = parseValidCoordinate(targetLat, targetLng);
    if (coord) {
      validSpots.push({
        name: targetName,
        latitude: coord.latitude,
        longitude: coord.longitude,
        navigation: s.navigation,
      });
    }
  });

  if (validSpots.length === 0) {
    Alert.alert('알림', '유효한 위치(위경도) 정보가 없습니다.');
    return;
  }

  // 상위 5개 스팟 선택 (경유지 최대 4개 + 최종 목적지 1개)
  const limitedSpots = validSpots.slice(0, 5);
  if (validSpots.length > 5) {
    Alert.alert('길안내 안내', '길안내 앱 제약으로 상위 5개 스팟까지만 길안내에 포함됩니다.');
  }

  const destSpot = limitedSpots[limitedSpots.length - 1];
  const viaSpots = limitedSpots.length > 1 ? limitedSpots.slice(0, limitedSpots.length - 1) : [];

  // 네이버 클라우드 공식 URL Scheme 규격:
  // - 출발지(slat/slng/sname) 생략 시 기기의 현재 GPS 위치가 출발지(초록색 핀)로 자동 설정됩니다.
  // - 1번 스팟부터 v1(경유지1), v2(경유지2)..로 들어가서 1번 스팟이 출발지로 먹히는 현상을 해결합니다.
  let viaParams = '';
  viaSpots.forEach((spot, idx) => {
    const wayIdx = idx + 1;
    viaParams += `&v${wayIdx}lng=${spot.longitude}&v${wayIdx}lat=${spot.latitude}&v${wayIdx}name=${encodeURIComponent(spot.name)}`;
  });

  const scheme = `nmap://route/car?dlng=${destSpot.longitude}&dlat=${destSpot.latitude}&dname=${encodeURIComponent(destSpot.name)}${viaParams}&appname=com.picngo.app`;

  const viaPath = viaSpots.length > 0
    ? `/${viaSpots.map((s) => `${s.longitude},${s.latitude},${encodeURIComponent(s.name)}`).join('/')}`
    : '';
  const fallbackUrl = `https://map.naver.com/v5/directions/-${viaPath}/${destSpot.longitude},${destSpot.latitude},${encodeURIComponent(destSpot.name)}/-/car`;

  try {
    const supported = await Linking.canOpenURL('nmap://');
    if (supported) {
      await Linking.openURL(scheme);
    } else {
      await Linking.openURL(fallbackUrl);
    }
  } catch (error) {
    console.error('네이버 지도 실행 오류:', error);
    Alert.alert('오류', '네이버 지도 앱을 실행할 수 없습니다.');
  }
};
