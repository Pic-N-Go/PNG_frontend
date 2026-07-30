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

  // 상위 5개 스팟까지 선택 (경유지 최대 4개 + 최종 목적지 1개)
  const limitedSpots = validSpots.slice(0, 5);
  if (validSpots.length > 5) {
    Alert.alert('길안내 안내', '길안내 앱 제약으로 상위 5개 스팟까지만 길안내에 포함됩니다.');
  }

  const destSpot = limitedSpots[limitedSpots.length - 1];
  const viaSpots = limitedSpots.length > 1 ? limitedSpots.slice(0, limitedSpots.length - 1) : [];

  // 현대 Apple 지도 공식 /directions 규격 (iOS 16+): waypoint 반복 지정 + destination 1개 지정
  let modernUrl = 'https://maps.apple.com/directions?dirflg=d';
  viaSpots.forEach((spot) => {
    modernUrl += `&waypoint=${spot.latitude},${spot.longitude}`;
  });
  modernUrl += `&destination=${destSpot.latitude},${destSpot.longitude}`;

  // 구형 iOS 지원용 폴백 URL 규격 (daddr 반복 지정)
  let legacyUrl = 'https://maps.apple.com/?dirflg=d';
  viaSpots.forEach((spot) => {
    legacyUrl += `&daddr=${spot.latitude},${spot.longitude}`;
  });
  legacyUrl += `&daddr=${destSpot.latitude},${destSpot.longitude}`;

  try {
    const supported = await Linking.canOpenURL(modernUrl);
    if (supported) {
      await Linking.openURL(modernUrl);
    } else {
      await Linking.openURL(legacyUrl);
    }
  } catch (error) {
    console.error('Apple 지도 실행 오류:', error);
    Alert.alert('오류', 'Apple 지도를 실행할 수 없습니다.');
  }
};
