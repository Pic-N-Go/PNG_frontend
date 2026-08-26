import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { IconMapPin } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_2XS, MAP_MINI_PIN_SIZE } from '@/constants/layout';
import { BRAND, TEXT_SUB } from '@/constants/colors';
import { isLocationInKorea, sanitizeKoreaLocation } from '@/utils/location';
import { PIN_SPOT_IMAGE } from '@/constants/pins';

export interface SpotPin {
  latitude: number;
  longitude: number;
  id: number | string;
}

interface Props {
  onPress: () => void;
  spotCount?: number;
  isLoading?: boolean;
  userLocation?: { lat: number; lng: number };
  spots?: SpotPin[];
}

export default function MapBanner({ onPress, spotCount = 0, isLoading, userLocation, spots }: Props) {
  const sanitized = sanitizeKoreaLocation(userLocation?.lat, userLocation?.lng);
  const centerLat = sanitized.lat;
  const centerLng = sanitized.lng;

  const validSpots = (spots || []).filter((s) => isLocationInKorea(s.latitude, s.longitude));

  // 네이티브 지도가 준비되기 전에는 마커를 렌더하지 않는다.
  // 지도 생성 전 추가된 오버레이는 native overlays 리스트에 바로 안 들어가는데 RN은 들어간 줄
  // 알고 인덱싱해서 `Index n out of bounds for length 0`로 죽는다(TravelPlanScreen 참고).
  // 이 배너는 React Query 캐시가 있으면 마운트 즉시 spots가 채워져 특히 위험하다.
  const [isMapReady, setMapReady] = useState(false);

  return (
    <View style={{ width: '100%', height: normalize(160), borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: '#e8e8ed', position: 'relative' }}>
      {/* 1. 네이티브 네이버 지도 미니 뷰 */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <NaverMapView
          style={{ flex: 1 }}
          // initialCamera가 아니라 제어형 camera를 쓴다.
          // 이 배너는 GPS가 도착하기 전에 먼저 마운트되는데, initialCamera는 "mount 후 변경해도
          // 동작하지 않는다"(라이브러리 문서). 그래서 마운트 시점의 폴백(서울시청)에 카메라가
          // 그대로 고정돼, 위치 권한을 허용해도 계속 서울이 보였다.
          camera={{
            latitude: centerLat,
            longitude: centerLng,
            zoom: 12,
          }}
          onInitialized={() => setMapReady(true)}
          isScrollGesturesEnabled={false}
          isZoomGesturesEnabled={false}
          isTiltGesturesEnabled={false}
          isRotateGesturesEnabled={false}
          isStopGesturesEnabled={false}
          isShowCompass={false}
          isShowScaleBar={false}
          isShowZoomControls={false}
          isShowLocationButton={false}
          logoMargin={{ bottom: 4, left: 4 }}
          locationOverlay={{
            isVisible: true,
            position: { latitude: centerLat, longitude: centerLng },
          }}
        >
          {isMapReady && validSpots.map((s) => (
            <NaverMapMarkerOverlay
              key={String(s.id)}
              latitude={s.latitude}
              longitude={s.longitude}
              width={MAP_MINI_PIN_SIZE}
              height={MAP_MINI_PIN_SIZE}
              anchor={{ x: 0.5, y: 0.5 }}
              image={PIN_SPOT_IMAGE}
            />
          ))}
        </NaverMapView>
      </View>

      {/* 2. 우하단 주변 스팟 개수 배지 */}
      <View
        style={{
          position: 'absolute',
          bottom: normalize(10),
          right: normalize(10),
          backgroundColor: 'rgba(255,255,255,0.88)',
          borderRadius: normalize(8),
          paddingHorizontal: normalize(10),
          paddingVertical: normalize(6),
          flexDirection: 'row',
          alignItems: 'center',
          gap: normalize(3),
          zIndex: 3,
        }}
        pointerEvents="none"
      >
        <IconMapPin size={normalize(12)} color={BRAND} fill={BRAND} />
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: TEXT_SUB, letterSpacing: -0.1 }}
        >
          {isLoading ? '주변 스팟 탐색 중...' : `주변 스팟 ${spotCount}개`}
        </Text>
      </View>

      {/* 3. 배너 전체 터치 오버레이 (탭 시 전체 지도로 이동) */}
      {/* style은 반드시 일반 객체로 준다. Pressable의 함수형 style(({pressed}) => ...)은
          NativeWind v4가 통째로 버려서, 오버레이가 absolute·전체 크기를 잃고 0으로 접힌다
          — 그래서 배너를 탭해도 지도로 넘어가지 않았다.
          (같은 함정: mypage/components/BookmarkedSpotRow.tsx, spot/TimePickerSheet.tsx) */}
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
        }}
      />
    </View>
  );
}
