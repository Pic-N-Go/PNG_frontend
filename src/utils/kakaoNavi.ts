import { Linking, Alert } from 'react-native';
import { parseValidCoordinate } from './geo';

export interface SpotLocation {
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * 카카오내비 / 카카오맵 앱 공식 딥링크(Deep Link) 길안내 실행 유틸리티
 * 
 * - kakaonavi://navigate 공식 스킴: name, x(경도), y(위도), coord_type=wgs84
 * - 미설치 시: 카카오맵 웹 URL 폴백 실행
 */
export const openKakaoNavi = async (spots: SpotLocation[]) => {
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

  // 카카오맵 공식 URL Scheme: kakaomap://route?vp=위도,경도&vp2=위도,경도&ep=위도,경도&by=car
  // (sp 출발지 생략 시 현재 위치 자동 적용, ep 도착지는 경유지 파라미터 뒤에 위치해야 함)
  let scheme = `kakaomap://route?by=car`;
  let webUrl = `http://m.map.kakao.com/scheme/route?by=car`;

  viaSpots.forEach((spot, idx) => {
    const vpParam = idx === 0 ? `&vp=${spot.latitude},${spot.longitude}` : `&vp${idx + 1}=${spot.latitude},${spot.longitude}`;
    scheme += vpParam;
    webUrl += vpParam;
  });

  scheme += `&ep=${destSpot.latitude},${destSpot.longitude}`;
  webUrl += `&ep=${destSpot.latitude},${destSpot.longitude}`;

  try {
    const supported = await Linking.canOpenURL('kakaomap://');
    if (supported) {
      await Linking.openURL(scheme);
    } else {
      // 카카오맵 앱 미설치 시 카카오맵 모바일 웹 길찾기 실행
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('카카오맵 실행 오류:', error);
    Alert.alert('오류', '카카오맵을 실행할 수 없습니다.');
  }
};
