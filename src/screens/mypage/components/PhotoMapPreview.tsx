import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { IconMapPin } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_2XS, FONT_SM, FONT_TITLE, GRID_PADDING } from '@/constants/layout';

import { useIsFocused, useNavigation } from '@react-navigation/native';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';
import { useBookmarkedSpots, useReviewedSpots } from '@/hooks/useSpot';
import { mergeMapSpots } from '@/utils/spotMappers';
import Skeleton from '@/components/common/Skeleton';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

// 전체보기(PhotoMapScreen)와 같은 카카오맵을 쓴다. 목업은 추상 격자였지만(mypage.html:1011)
// 실데이터 핀만 얹으면 배경 없는 흰 카드에 점만 뜬 꼴이 되어 미완성으로 읽힌다.
// 조작은 막고(드래그·줌 없음, pointerEvents none) 카드 전체를 전체보기 진입으로 쓴다.
export default function PhotoMapPreview() {
  const navigation = useNavigation();
  // PIC MAP 전체 화면으로 들어가면 카카오맵 WebView가 두 개 동시에 살아 있게 된다.
  // iOS 콘텐츠 프로세스가 그 부담으로 죽으면 두 지도가 다 흰 화면이 된다 — 안 보일 때는 내린다.
  const isFocused = useIsFocused();

  const reviewed = useReviewedSpots();
  const bookmarked = useBookmarkedSpots();
  const spots = useMemo(
    () => mergeMapSpots(reviewed.data, bookmarked.data),
    [reviewed.data, bookmarked.data],
  );
  const isLoading = reviewed.isLoading || bookmarked.isLoading;
  const isError = reviewed.isError || bookmarked.isError;

  // 카카오 SDK 내려받기 + 타일 요청은 클라이언트에서 줄일 방법이 없다(스태틱 맵은 REST 키가 필요해 불가).
  // 대신 준비되기 전까지 스켈레톤을 덮고, 지도가 실제로 그려진 뒤 페이드로 바꿔 끊김을 안 보이게 한다.
  // onLoadEnd는 문서 로드 시점이라 아직 회색 판이다 — 페이지가 핀까지 그린 뒤 READY를 보낸다.
  const [ready, setReady] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  const showMap = Boolean(KAKAO_KEY) && spots.length > 0 && isFocused;
  // 로딩 구간을 실제로 덮는다. spots가 도착한 뒤부터 세면 "빈 카드 → 스켈레톤 → 지도" 순서가 되어
  // 스켈레톤이 로딩이 끝난 뒤에 나타난다.
  const showSkeleton = isLoading || (showMap && !ready && !gaveUp);

  // READY만 기다리면 영구 스켈레톤이 된다. 카카오 SDK 스크립트가 실패하면 페이지의 인라인
  // 스크립트가 kakao 미정의로 즉시 throw해서 그 안의 백스톱 타임아웃조차 등록되지 않는다.
  // KAKAO_KEY가 비어 WebView 자체가 안 뜨는 경우도 같다. 포기 시점은 RN이 쥔다.
  useEffect(() => {
    if (!showMap || ready) return;
    const timer = setTimeout(() => setGaveUp(true), 6000);
    return () => clearTimeout(timer);
  }, [showMap, ready]);

  // 포커스를 잃으면 WebView가 사라지므로 다음 진입 때 다시 로딩된다. 상태도 같이 되돌린다.
  useEffect(() => {
    if (!isFocused) {
      setReady(false);
      setGaveUp(false);
      fade.setValue(0);
    }
  }, [isFocused, fade]);
  const handleReady = useCallback(() => {
    setReady(true);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [fade]);

  // 핀 목록이 실제로 바뀔 때만 HTML을 새로 만든다 — 매 렌더 새 문자열이면 WebView가 계속 리로드된다.
  const spotsKey = spots.map((s) => `${s.id}:${s.reviewed ? 1 : 0}`).join(',');
  const html = useMemo(() => buildPreviewHtml(spots), [spotsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // baseUrl을 https로 주면 카카오 SDK가 내부 라이브러리를 https로 받는다(iOS ATS 통과).
  const mapSource = useMemo(() => ({ html, baseUrl: 'https://localhost' }), [html]);

  return (
    <View className="mb-10" style={{ paddingHorizontal: GRID_PADDING }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-semibold tracking-tight text-black" style={{ fontSize: FONT_TITLE }}>
          PIC MAP
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('PhotoMap' as never)}>
          <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: BRAND }}>
            전체보기
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('PhotoMap' as never)}
        style={{
          height: normalize(200),
          borderRadius: CARD_RADIUS,
          backgroundColor: CARD,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* pointerEvents none — 지도가 탭을 먹으면 카드를 눌러도 전체보기로 못 간다 */}
        {showMap && (
          <Animated.View
            pointerEvents="none"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: fade }}
          >
            <WebView
              source={mapSource}
              originWhitelist={['*']}
              javaScriptEnabled
              // SDK·타일을 HTTP 캐시에 남겨 두 번째 진입부터 즉시 뜨게 한다.
              cacheEnabled
              androidLayerType="hardware"
              onMessage={handleReady}
              scrollEnabled={false}
              bounces={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              // NativeWind는 WebView에 className을 적용하지 못한다 — style로 줘야 높이가 잡힌다.
              style={{ flex: 1, backgroundColor: 'transparent' }}
            />
          </Animated.View>
        )}

        {/* 지도가 그려질 때까지 카드 자리를 지킨다 — 회색 판이 드러나는 순간이 "느리다"로 읽힌다. */}
        {showSkeleton && (
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Skeleton width="100%" height={normalize(200)} borderRadius={CARD_RADIUS} />
          </View>
        )}

        {/* 조회 실패를 빈 상태로 표시하면 "당신은 핀이 없다"는 거짓말이 된다. 재시도 버튼은 두지 않는다 —
            카드 전체가 전체보기 진입이고, 그쪽에 재시도가 있다. */}
        {!isLoading && spots.length === 0 && (
          <View
            pointerEvents="none"
            className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center"
            style={{ paddingHorizontal: normalize(24) }}
          >
            <Text
              className="font-normal text-center"
              style={{ fontSize: FONT_SM, color: TEXT_SUB, lineHeight: normalize(20) }}
            >
              {isError
                ? '핀을 불러오지 못했어요'
                : '리뷰를 쓰거나 스팟을 즐겨찾기하면\n여기에 핀이 표시돼요'}
            </Text>
          </View>
        )}

        {/* 범례 — 지도 위에 얹히므로 흰 배경을 깔아 가독성을 지킨다.
            좌하단은 카카오 축척 바·로고 자리라 오른쪽에 둔다(가리면 안 되는 표기다). */}
        <View
          style={{
            position: 'absolute',
            bottom: normalize(10),
            right: normalize(10),
            flexDirection: 'row',
            gap: normalize(12),
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.88)',
            borderRadius: normalize(8),
            paddingHorizontal: normalize(10),
            paddingVertical: normalize(6),
          }}
        >
          <View className="flex-row items-center" style={{ gap: normalize(3) }}>
            <IconMapPin size={normalize(12)} color={BRAND} fill={BRAND} />
            <Text className="tracking-tight font-normal" style={{ fontSize: FONT_2XS, color: TEXT_SUB }}>
              리뷰
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: normalize(3) }}>
            <IconMapPin size={normalize(12)} color="#1c1c1e" fill="#1c1c1e" />
            <Text className="tracking-tight font-normal" style={{ fontSize: FONT_2XS, color: TEXT_SUB }}>
              즐겨찾기
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// 프리뷰는 조작·클릭이 없어 전체보기 화면의 HTML보다 훨씬 작다 —
// updateMarkers·MAP_READY·이벤트 핸들러 없이 로드 시 한 번 그리고 끝낸다.
function buildPreviewHtml(spots: { lat: number; lng: number; reviewed: boolean }[]) {
  // r = 리뷰 있음. 겸용 스팟은 리뷰(핑크)를 우선한다 — 지도 화면과 같은 규칙.
  const pins = JSON.stringify(spots.map((s) => ({ lat: s.lat, lng: s.lng, r: s.reviewed })));
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <!-- Referer를 보내면 카카오가 baseUrl(https://localhost)을 등록되지 않은 도메인으로 보고
       sdk.js에 401 AccessDeniedError를 준다. 스크립트 자리에 JSON이 오므로 kakao가 미정의가 되고
       아래 인라인 스크립트가 즉시 throw해 지도가 통째로 안 그려진다(회색 카드만 남는다). -->
  <meta name="referrer" content="no-referrer">
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: ${CARD}; }
    #map { width: 100%; height: 100%; }
    .pin { position: absolute; transform: translate(-50%, -100%); line-height: 0; }
    .pin--review { filter: drop-shadow(0 1px 3px rgba(227,27,89,0.45)); }
    .pin--fav { filter: drop-shadow(0 1px 3px rgba(0,0,0,0.25)); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var PINS = ${pins};
    kakao.maps.load(function () {
      function initMap() {
        var el = document.getElementById('map');
        // 카드가 레이아웃되기 전에는 크기가 0이라 지도가 회색으로 남는다. 크기가 잡힐 때까지 기다린다.
        if (el.clientHeight === 0 || el.clientWidth === 0) { setTimeout(initMap, 50); return; }

        var map = new kakao.maps.Map(el, {
          center: new kakao.maps.LatLng(36.5, 127.5),
          level: 13,
          draggable: false,
          zoomable: false,
          disableDoubleClickZoom: true
        });

        var bounds = new kakao.maps.LatLngBounds();
        PINS.forEach(function (p) {
          var pos = new kakao.maps.LatLng(p.lat, p.lng);
          bounds.extend(pos);
          var size = p.r ? 20 : 17;
          var h = p.r ? 25 : 21;
          var color = p.r ? '${BRAND}' : '#1c1c1e';
          var el2 = document.createElement('div');
          el2.className = p.r ? 'pin pin--review' : 'pin pin--fav';
          el2.innerHTML =
            '<svg width="' + size + '" height="' + h + '" viewBox="0 0 24 30" fill="none">' +
            '<path d="M12 0C5.4 0 0 5.4 0 12C0 20 12 30 12 30S24 20 24 12C24 5.4 18.6 0 12 0Z" fill="' + color + '"/>' +
            '<circle cx="12" cy="10.5" r="4.5" fill="#fff"/></svg>';
          new kakao.maps.CustomOverlay({
            position: pos, content: el2, yAnchor: 1, zIndex: p.r ? 2 : 1
          }).setMap(map);
        });

        // 핀이 1개면 setBounds가 최대 줌까지 당겨 거리 단위로 보인다. 그때는 레벨을 고정한다.
        if (PINS.length > 1) {
          map.setBounds(bounds, 24, 24, 24, 24);
        } else if (PINS.length === 1) {
          map.setCenter(new kakao.maps.LatLng(PINS[0].lat, PINS[0].lng));
          map.setLevel(7);
        }

        // 타일이 한 번 그려진 뒤 알린다. tilesloaded가 안 오는 환경도 있어 타임아웃으로 보정한다.
        var told = false;
        function tellReady() {
          if (told) return;
          told = true;
          window.ReactNativeWebView.postMessage('READY');
        }
        kakao.maps.event.addListener(map, 'tilesloaded', tellReady);
        setTimeout(tellReady, 1500);
      }
      initMap();
    });
  </script>
</body>
</html>
`;
}
