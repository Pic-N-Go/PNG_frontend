import { Linking, Alert, Platform } from 'react-native';
import { SpotLocation } from './kakaoNavi';
import { parseValidCoordinate } from './geo';

/**
 * Apple 지도 (Apple Maps) 딥링크 길안내 실행 유틸리티
 * 
 * - iOS 전용 내장 맵 딥링크 (https://maps.apple.com/...)
 * - saddr: 출발지 좌표
 * - daddr: 경유지 및 도착지 좌표 (반복 파라미터)
 * - dirflg=d: 차량 네비게이션 모드
 */
export const openAppleMap = async (spots: SpotLocation[]) => {
  if (Platform.OS === 'android') {
    Alert.alert('알림', 'Apple 지도는 iOS(아이폰) 전용 기기에서만 지원됩니다.');
    return;
  }

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

  const startSpot = validSpots.length > 1 ? validSpots[0] : null;
  const destSpot = validSpots[validSpots.length - 1];
  const viaSpots = validSpots.length > 2 ? validSpots.slice(1, validSpots.length - 1) : [];

  let url = 'https://maps.apple.com/?dirflg=d';

  if (startSpot) {
    url += `&saddr=${startSpot.latitude},${startSpot.longitude}`;
  }

  // 중간 경유지 반복 지정
  viaSpots.forEach((spot) => {
    url += `&daddr=${spot.latitude},${spot.longitude}`;
  });

  url += `&daddr=${destSpot.latitude},${destSpot.longitude}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(url);
    }
  } catch (error) {
    console.error('Apple 지도 실행 오류:', error);
    Alert.alert('오류', 'Apple 지도를 실행할 수 없습니다.');
  }
};
