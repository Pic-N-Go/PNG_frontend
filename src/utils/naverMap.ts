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
    const coord = parseValidCoordinate(s.latitude, s.longitude);
    if (coord) {
      validSpots.push({
        name: s.name || '스팟',
        latitude: coord.latitude,
        longitude: coord.longitude,
      });
    }
  });

  if (validSpots.length === 0) {
    Alert.alert('알림', '유효한 위치(위경도) 정보가 없습니다.');
    return;
  }

  // 상위 5개 스팟까지 선택 (경유지 최대 4개 + 최종 목적지 1개)
  const limitedSpots = validSpots.slice(0, 5);
  if (validSpots.length > 5) {
    Alert.alert('길안내 안내', '길안내 앱 제약으로 상위 5개 스팟까지만 길안내에 포함됩니다.');
  }

  const destSpot = limitedSpots[limitedSpots.length - 1];
  const viaSpots = limitedSpots.length > 1 ? limitedSpots.slice(0, limitedSpots.length - 1) : [];

  // 출발지(slat, slng)를 생략하면 네이버 지도가 현재 위치를 출발지로 자동 설정합니다.
  let scheme = `nmap://route/car?dlat=${destSpot.latitude}&dlng=${destSpot.longitude}&dname=${encodeURIComponent(destSpot.name)}&appname=com.picngo.app`;

  // 중간 경유지 추가 (v1lat, v1lng, v1name, v2lat, ...)
  viaSpots.forEach((spot, idx) => {
    const wayIdx = idx + 1;
    scheme += `&v${wayIdx}lat=${spot.latitude}&v${wayIdx}lng=${spot.longitude}&v${wayIdx}name=${encodeURIComponent(spot.name)}`;
  });

  try {
    const supported = await Linking.canOpenURL('nmap://');
    if (supported) {
      await Linking.openURL(scheme);
    } else {
      // 네이버 지도 미설치 시 네이버 지도 웹 폴백 (현재위치 -> 경유지들 -> 목적지)
      let fallbackUrl = '';
      if (viaSpots.length > 0) {
        const viaPath = viaSpots.map((s) => `${s.longitude},${s.latitude},${encodeURIComponent(s.name)}`).join('/');
        fallbackUrl = `https://map.naver.com/v5/directions/-/${viaPath}/${destSpot.longitude},${destSpot.latitude},${encodeURIComponent(destSpot.name)}/-/car`;
      } else {
        fallbackUrl = `https://map.naver.com/v5/directions/-/${destSpot.longitude},${destSpot.latitude},${encodeURIComponent(destSpot.name)}/-/car`;
      }
      await Linking.openURL(fallbackUrl);
    }
  } catch (error) {
    console.error('네이버 지도 실행 오류:', error);
    Alert.alert('오류', '네이버 지도 앱을 실행할 수 없습니다.');
  }
};
