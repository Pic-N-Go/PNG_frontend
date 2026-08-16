import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, Image } from 'react-native';
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
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  const centerLat = userLocation?.lat ?? 37.5665;
  const centerLng = userLocation?.lng ?? 126.9780;

  const mapHtml = useMemo(() => {
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
      background: #E31B59; border: 2.5px solid #ffffff;
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
      overlay.addEventListener('click', function () {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BANNER_TAP' }));
        }
      });
    })();
  </script>
  <script>
    function initMap() {
      var container = document.getElementById('map');
      if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
        setTimeout(initMap, 50);
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
          var pinSvg = '<div class="spot-pin"><svg width="22" height="27" viewBox="0 0 28 34"><path d="M14 0C6.3 0 0 6.3 0 14C0 23 14 34 14 34S28 23 28 14C28 6.3 21.7 0 14 0Z" fill="#E31B59"/><circle cx="14" cy="12" r="5" fill="#fff"/></svg></div>';
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
        } else {
          setTimeout(initMap, 200);
        }
      };
    }
  </script>
</body>
</html>
`;
  }, [centerLat, centerLng, spots]);

  // 웹뷰 로딩 전에도 즉시 뭔가 보이도록 카카오 스태틱 맵을 배경으로 먼저 깐다.
  const staticMapUrl = `https://dapi.kakao.com/v2/maps/staticmap?appkey=${KAKAO_KEY}&center=${centerLat},${centerLng}&level=6&w=640&h=320`;

  return (
    <View style={{ width: '100%', height: normalize(160), borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: '#e8e8ed', position: 'relative' }}>
      {/* 1. 카카오 스태틱 맵 백그라운드 (웹뷰 초기 로딩 전 정적 지도 즉시 표기) */}
      {!webViewLoaded && (
        <Image
          source={{ uri: staticMapUrl }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
      )}

      {/* 2. 실제 카카오 지도 미니 웹뷰 */}
      {/* 탭 처리 주의: 안드로이드 네이티브 WebView는 자기 영역의 터치를 안드로이드 뷰 계층에서
          직접 받아버려, 위에 겹쳐 둔 RN Pressable이 터치를 전혀 받지 못한다(uiautomator로
          보면 이 영역의 클릭 가능 노드가 WebView 하나뿐). RN의 pointerEvents="none"은 RN
          터치 시스템에만 적용돼 여기서는 효과가 없다. 그래서 웹뷰 안 #tap-overlay가 탭을
          받아 postMessage로 알려주면 여기서 onPress로 이어준다. */}
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

      {/* 5. 배너 전체 터치 오버레이 (탭 시 전체 지도로 이동) — WebView 위에서도 터치가 먹도록 맨 위(zIndex 최상단)에 둔다. */}
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
