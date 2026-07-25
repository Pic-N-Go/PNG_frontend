import { Linking, Alert } from 'react-native';
import { SpotLocation } from './kakaoNavi';

/**
 * 네이버 지도 (Naver Map) 앱 딥링크(Deep Link) 길안내 실행 유틸리티
 * 
 * - 앱 URI Scheme: nmap://route/car
 * - slat, slng, sname: 출발지 정보
 * - dlat, dlng, dname: 도착지 정보
 * - appname: com.project.picngo
 * - 미설치 시: 네이버 지도 웹/스토어 URL 폴백 실행
 */
export const openNaverMap = async (spots: SpotLocation[]) => {
  if (!spots || spots.length === 0) {
    Alert.alert('알림', '길안내를 시작할 스팟 정보가 없습니다.');
    return;
  }

  const parseCoord = (val: any): number => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  };

  const validSpots = spots
    .map((s) => ({
      name: s.name || '스팟',
      latitude: parseCoord(s.latitude),
      longitude: parseCoord(s.longitude),
    }))
    .filter((s) => s.latitude !== 0 && s.longitude !== 0);

  if (validSpots.length === 0) {
    Alert.alert('알림', '유효한 위치(위경도) 정보가 없습니다.');
    return;
  }

  const startSpot = validSpots.length > 1 ? validSpots[0] : null;
  const destSpot = validSpots[validSpots.length - 1];

  // 네이버 지도 URI Scheme 생성
  let scheme = `nmap://route/car?dlat=${destSpot.latitude}&dlng=${destSpot.longitude}&dname=${encodeURIComponent(destSpot.name)}&appname=com.project.picngo`;

  if (startSpot) {
    scheme += `&slat=${startSpot.latitude}&slng=${startSpot.longitude}&sname=${encodeURIComponent(startSpot.name)}`;
  }

  try {
    const supported = await Linking.canOpenURL('nmap://');
    if (supported) {
      await Linking.openURL(scheme);
    } else {
      // 네이버 지도 미설치 시 네이버 지도 웹 폴백
      let fallbackUrl = '';
      if (startSpot) {
        fallbackUrl = `https://map.naver.com/v5/directions/${startSpot.longitude},${startSpot.latitude},${encodeURIComponent(startSpot.name)}/${destSpot.longitude},${destSpot.latitude},${encodeURIComponent(destSpot.name)}/-/car`;
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
