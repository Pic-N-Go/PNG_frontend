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

  const startSpot = validSpots.length > 1 ? validSpots[0] : null;
  const destSpot = validSpots[validSpots.length - 1];

  // 카카오내비 공식 URI Scheme 생성 (kakaonavi://navigate?name=목적지명&x=경도&y=위도)
  const scheme = `kakaonavi://navigate?name=${encodeURIComponent(destSpot.name)}&x=${destSpot.longitude}&y=${destSpot.latitude}&coord_type=wgs84`;

  try {
    const supported = await Linking.canOpenURL('kakaonavi://');
    if (supported) {
      await Linking.openURL(scheme);
    } else {
      // 카카오내비 미설치 시 카카오맵 웹 폴백 (출발지가 존재할 경우 출발지->목적지 경로 표시)
      let fallbackUrl = '';
      if (startSpot) {
        fallbackUrl = `https://map.kakao.com/link/from/${encodeURIComponent(startSpot.name)},${startSpot.latitude},${startSpot.longitude}/to/${encodeURIComponent(destSpot.name)},${destSpot.latitude},${destSpot.longitude}`;
      } else {
        fallbackUrl = `https://map.kakao.com/link/to/${encodeURIComponent(destSpot.name)},${destSpot.latitude},${destSpot.longitude}`;
      }
      await Linking.openURL(fallbackUrl);
    }
  } catch (error) {
    console.error('카카오내비 실행 오류:', error);
    Alert.alert('오류', '카카오내비 앱을 실행할 수 없습니다.');
  }
};
