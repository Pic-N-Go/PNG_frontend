import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { IconMapPin } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_XS } from '@/constants/layout';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

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
  const mapHtml = useMemo(() => {
    const centerLat = userLocation?.lat ?? 37.5665;
    const centerLng = userLocation?.lng ?? 126.9780;
    const spotItems = (spots || []).map((s) => ({
      lat: s.latitude,
      lng: s.longitude,
    }));

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <meta name="referrer" content="no-referrer">
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8e8ed; }
    #map { width: 100%; height: 100%; }
    .me-dot {
      width: 18px; height: 18px; border-radius: 50%;
      background: rgba(227, 27, 89, 0.2);
      display: flex; align-items: center; justify-content: center;
    }
    .me-dot-inner {
      width: 9px; height: 9px; border-radius: 50%;
      background: #E31B59; border: 2px solid #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    kakao.maps.load(function() {
      var mapContainer = document.getElementById('map');
      var mapOption = {
        center: new kakao.maps.LatLng(${centerLat}, ${centerLng}),
        level: 6,
        draggable: false,
        zoomable: false
      };
      var map = new kakao.maps.Map(mapContainer, mapOption);

      // 내 위치 중앙 오버레이
      var meContent = '<div class="me-dot"><div class="me-dot-inner"></div></div>';
      new kakao.maps.CustomOverlay({
        map: map,
        position: new kakao.maps.LatLng(${centerLat}, ${centerLng}),
        content: meContent,
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 10
      });

      // 주변 스팟 핀
      var spots = ${JSON.stringify(spotItems)};
      spots.forEach(function(s) {
        if (s.lat && s.lng) {
          new kakao.maps.Marker({
            map: map,
            position: new kakao.maps.LatLng(s.lat, s.lng)
          });
        }
      });
    });
  </script>
</body>
</html>
`;
  }, [userLocation?.lat, userLocation?.lng, spots]);

  return (
    <View style={{ height: normalize(160), borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: '#e8e8ed' }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          opacity: pressed ? 0.97 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        {/* 실제 카카오 지도 미니 웹뷰 */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml, baseUrl: 'https://localhost' }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* 하단 페이드 오버레이 */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.25)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: normalize(80) }}
        />

        {/* 좌상단 배지 */}
        <View
          style={{
            position: 'absolute',
            top: normalize(12),
            left: normalize(12),
            height: normalize(24),
            paddingHorizontal: normalize(10),
            borderRadius: normalize(12),
            backgroundColor: 'rgba(0,0,0,0.45)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: normalize(4),
          }}
        >
          <IconMapPin size={normalizeFontSize(10)} color="#fff" strokeWidth={1.5} />
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_XS, color: '#fff' }}
          >
            {isLoading ? '주변 스팟 탐색 중...' : `주변 스팟 ${spotCount}개`}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
