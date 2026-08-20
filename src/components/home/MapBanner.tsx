import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { IconMapPin } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_XS } from '@/constants/layout';
import { BRAND } from '@/constants/colors';

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
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  const centerLat = userLocation?.lat ?? 37.5665;
  const centerLng = userLocation?.lng ?? 126.9780;

  // 좌표 및 스팟 ID 기반의 안정적인 spotsKey 생성 (배열 참조 변경으로 인한 불필요한 웹뷰 재로드 방지)
  const spotsKey = useMemo(() => {
    if (!spots || spots.length === 0) return '';
    return spots.map((s) => `${s.id}_${s.latitude}_${s.longitude}`).join('|');
  }, [spots]);

  const mapHtml = useMemo(() => {
    if (!KAKAO_KEY) return '';

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
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(227, 27, 89, 0.5); }
      70% { box-shadow: 0 0 0 10px rgba(227, 27, 89, 0); }
      100% { box-shadow: 0 0 0 0 rgba(227, 27, 89, 0); }
    }
    .user-dot {
      width: 14px; height: 14px; border-radius: 50%;
      background: ${BRAND}; border: 2.5px solid #ffffff;
      box-shadow: 0 0 6px rgba(227,27,89,0.8);
      animation: pulse 2s infinite;
    }
    .spot-pin {
      width: 22px; height: 27px;
      display: flex; align-items: center; justify-content: center;
    }
    /* 배너 전체를 덮는 투명 탭 레이어. 안드로이드 네이티브 WebView가 자기 영역의 터치를
       RN보다 먼저 가로채기 때문에, RN 쪽 Pressable 오버레이로는 탭을 받을 수 없다.
       그래서 웹뷰 안에서 직접 탭을 받아 postMessage로 RN에 알린다. */
    #tap-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      z-index: 9999; background: transparent;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="tap-overlay"></div>
  <script>
    (function () {
      var overlay = document.getElementById('tap-overlay');
      if (overlay) {
        overlay.addEventListener('click', function () {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BANNER_TAP' }));
          }
        });
      }
    })();
  </script>
  <script>
    var retryCount = 0;
    var maxRetries = 10;

    function initMap() {
      if (!window.kakao || !window.kakao.maps) {
        return;
      }
      var container = document.getElementById('map');
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(initMap, 50);
        }
        return;
      }
      var mapOption = {
        center: new kakao.maps.LatLng(${centerLat}, ${centerLng}),
        level: 6,
        draggable: false,
        zoomable: false,
        disableDoubleClickZoom: true
      };
      var map = new kakao.maps.Map(container, mapOption);

      setTimeout(function() {
        map.relayout();
        map.setCenter(new kakao.maps.LatLng(${centerLat}, ${centerLng}));
      }, 100);

      // 내 위치 중앙 마커
      new kakao.maps.CustomOverlay({
        map: map,
        position: new kakao.maps.LatLng(${centerLat}, ${centerLng}),
        content: '<div class="user-dot"></div>',
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 10
      });

      // 주변 스팟 핀들
      var spots = ${JSON.stringify(spotItems)};
      spots.forEach(function(s) {
        if (s.lat && s.lng) {
          var pinSvg = '<div class="spot-pin"><svg width="22" height="27" viewBox="0 0 28 34"><path d="M14 0C6.3 0 0 6.3 0 14C0 23 14 34 14 34S28 23 28 14C28 6.3 21.7 0 14 0Z" fill="${BRAND}"/><circle cx="14" cy="12" r="5" fill="#fff"/></svg></div>';
          new kakao.maps.CustomOverlay({
            map: map,
            position: new kakao.maps.LatLng(s.lat, s.lng),
            content: pinSvg,
            xAnchor: 0.5,
            yAnchor: 1.0,
            zIndex: 5
          });
        }
      });
    }

    if (window.kakao && window.kakao.maps) {
      kakao.maps.load(initMap);
    } else {
      window.onload = function() {
        if (window.kakao && window.kakao.maps) {
          kakao.maps.load(initMap);
        }
      };
    }
  </script>
</body>
</html>
`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerLat, centerLng, spotsKey]);

  // KAKAO_KEY가 존재할 때만 정적 스태틱 맵 이미지 URL 생성
  const staticMapUrl = KAKAO_KEY
    ? `https://dapi.kakao.com/v2/maps/staticmap?appkey=${KAKAO_KEY}&center=${centerLat},${centerLng}&level=6&w=640&h=320`
    : null;

  return (
    <View style={{ width: '100%', height: normalize(160), borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: '#e8e8ed', position: 'relative' }}>
      {/* 1. 카카오 스태틱 맵 백그라운드 (유효한 키가 있고 웹뷰 초기 로딩 전일 때 표기) */}
      {staticMapUrl && !webViewLoaded && (
        <Image
          source={{ uri: staticMapUrl }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
      )}

      {/* 2. 실제 카카오 지도 미니 웹뷰 (KAKAO_KEY가 유효할 때만 로드) */}
      {Boolean(KAKAO_KEY) && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml, baseUrl: 'https://localhost' }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            onLoadEnd={() => setWebViewLoaded(true)}
            onMessage={(event) => {
              try {
                if (JSON.parse(event.nativeEvent.data)?.type === 'BANNER_TAP') onPress();
              } catch {
                // 배너가 보내는 메시지는 BANNER_TAP 하나뿐이라 파싱 실패는 무시한다.
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      )}

      {/* 3. 하단 페이드 오버레이 */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: normalize(80), zIndex: 2 }}
        pointerEvents="none"
      />

      {/* 4. 좌상단 주변 스팟 개수 배지 */}
      <View
        style={{
          position: 'absolute',
          top: normalize(12),
          left: normalize(12),
          height: normalize(24),
          paddingHorizontal: normalize(10),
          borderRadius: normalize(12),
          backgroundColor: 'rgba(0,0,0,0.5)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: normalize(4),
          zIndex: 3,
        }}
        pointerEvents="none"
      >
        <IconMapPin size={normalizeFontSize(10)} color="#fff" strokeWidth={1.5} />
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_XS, color: '#fff' }}
        >
          {isLoading ? '주변 스팟 탐색 중...' : `주변 스팟 ${spotCount}개`}
        </Text>
      </View>

      {/* 5. 배너 전체 터치 오버레이 (탭 시 전체 지도로 이동) */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          backgroundColor: pressed ? 'rgba(0,0,0,0.05)' : 'transparent',
        })}
      />
    </View>
  );
}
