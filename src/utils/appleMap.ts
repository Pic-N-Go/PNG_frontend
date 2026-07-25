import { Linking, Alert, Platform } from 'react-native';
import { SpotLocation } from './kakaoNavi';

/**
 * Apple 지도 (Apple Maps) 딥링크 길안내 실행 유틸리티
 * 
 * - iOS 전용 내장 맵 딥링크 (http://maps.apple.com/...)
 * - saddr: 출발지 좌표
 * - daddr: 목적지 좌표
 * - dirflg=d: 차량 네비게이션 모드
 */
export const openAppleMap = async (spots: SpotLocation[]) => {
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

  let url = `http://maps.apple.com/?daddr=${destSpot.latitude},${destSpot.longitude}&dirflg=d`;

  if (startSpot) {
    url += `&saddr=${startSpot.latitude},${startSpot.longitude}`;
  }

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      if (Platform.OS === 'android') {
        Alert.alert('알림', 'Apple 지도는 iOS(아이폰) 전용 기기에서만 지원됩니다.');
      } else {
        await Linking.openURL(url);
      }
    }
  } catch (error) {
    console.error('Apple 지도 실행 오류:', error);
    Alert.alert('오류', 'Apple 지도를 실행할 수 없습니다.');
  }
};
