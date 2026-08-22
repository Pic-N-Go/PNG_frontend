import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, PermissionsAndroid, BackHandler, Image, Animated, PanResponder, Easing, ScrollView, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { IconChevronLeft, IconMapPin, IconFocus2, IconChevronRight } from '@tabler/icons-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomSheet from '@/components/common/BottomSheet';
import { StatusBar } from 'expo-status-bar';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, HAIRLINE_WIDTH } from '@/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, HAIRLINE } from '@/constants/colors';
import { useBookmarkedSpots, useReviewedSpots } from '@/hooks/useSpot';
import { mergeMapSpots } from '@/utils/spotMappers';
import type { MapSpot } from '@/types/spot';
import SaveToPlanSheet from '@/components/spot/SaveToPlanSheet';
import Toast from '@/components/common/Toast';
import Skeleton from '@/components/common/Skeleton';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

type FilterType = 'all' | 'review' | 'fav';

// 지도 영역의 위 경계. 헤더 = 내비 행 + 필터 행(위아래 패딩 10 + 칩 높이 30).
// MapNotice·지도 컨트롤·범례가 모두 이 값을 기준으로 놓여야 헤더를 고칠 때 같이 따라온다.
const NAV_ROW_HEIGHT = normalize(54);
const HEADER_HEIGHT = NAV_ROW_HEIGHT + normalize(10) * 2 + normalize(30);

export default function PhotoMapScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const webViewRef = useRef<any>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeSpot, setActiveSpot] = useState<MapSpot | null>(null);
  const ignoreMapClickRef = useRef(false);
  // 지도 준비 전에 주입하면 window.updateMarkers가 아직 없어 핀이 조용히 사라진다.
  // initMap이 컨테이너 크기를 기다리며 재시도하므로 onLoadEnd로도 이르다 — 페이지가 직접 알려준다.
  const mapReadyRef = useRef(false);
  const spotsRef = useRef<MapSpot[]>([]);
  // 오버레이 렌더용. ref는 주입 타이밍 판단에만 쓰고 리렌더를 유발하지 않는다.
  const [mapReady, setMapReady] = useState(false);
  // 페이지 안 타임아웃으로는 부족하다 — 카카오 SDK 스크립트가 실패하면 kakao.maps.load가 없어
  // 인라인 스크립트가 즉시 throw하고, 그 안에 등록하려던 setTimeout이 아예 걸리지 않는다.
  // 그러면 오버레이가 영구히 남는다. 포기 시점은 RN이 쥔다.
  const [mapGaveUp, setMapGaveUp] = useState(false);
  // html source로 띄운 WebView는 reload()가 HTML을 다시 렌더하지 않고 baseUrl(https://localhost)을
  // 네트워크로 가져오려 해서 복구가 안 된다. key를 올려 강제 리마운트하는 것만 확실하다.
  const [webViewKey, setWebViewKey] = useState(0);
  const showMapLoading = !mapReady && !mapGaveUp;
  const mapAreaBottom = mapAreaBottomOf(insets.bottom);

  const remountMap = useCallback(() => {
    mapReadyRef.current = false;
    setMapReady(false);
    setMapGaveUp(false);
    setWebViewKey((k) => k + 1);
  }, []);

  // 리마운트할 때마다 포기 타이머를 다시 건다. 한 번 포기하면 되돌아오지 않는 구조였다.
  useEffect(() => {
    if (mapReady) return;
    const timer = setTimeout(() => setMapGaveUp(true), 6000);
    return () => clearTimeout(timer);
  }, [webViewKey, mapReady]);

  // 코스 저장 시트. BottomSheet가 RN Modal이라 스팟 시트 위에 겹쳐 띄우면 iOS에서 불안정하다 —
  // 스팟 시트를 닫고 코스 시트를 연다. 저장할 스팟은 시트가 닫힌 뒤에도 필요해 따로 들고 있는다.
  const [courseTarget, setCourseTarget] = useState<MapSpot | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 리뷰 핀과 즐겨찾기 핀은 서버가 따로 준다. 같은 스팟이면 mergeMapSpots가 핀 하나로 합친다.
  const reviewed = useReviewedSpots();
  const bookmarked = useBookmarkedSpots();
  const spots = useMemo(
    () => mergeMapSpots(reviewed.data, bookmarked.data),
    [reviewed.data, bookmarked.data],
  );
  // 한쪽만 도착한 상태로 핀을 그리면 색이 뒤늦게 바뀐다(리뷰만 먼저 오면 검정 → 핑크). 둘 다 기다린다.
  const isLoading = reviewed.isLoading || bookmarked.isLoading;
  const isError = reviewed.isError || bookmarked.isError;
  const counts = useMemo(
    () => ({
      all: spots.length,
      review: spots.filter((sp) => sp.reviewed).length,
      fav: spots.filter((sp) => sp.bookmarked).length,
    }),
    [spots],
  );

  const handleBackNavigation = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MyPageStack', { screen: 'MyPage' });
    }
    return true;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackNavigation);
      return () => subscription.remove();
    }, [handleBackNavigation])
  );

  // 리뷰도 쓰고 즐겨찾기도 한 스팟은 두 필터에 모두 나온다 — 배타 분류가 아니다.
  const filteredSpots = useMemo(() => {
    if (filter === 'review') return spots.filter((sp) => sp.reviewed);
    if (filter === 'fav') return spots.filter((sp) => sp.bookmarked);
    return spots;
  }, [filter, spots]);

  const pushMarkers = useCallback((list: MapSpot[]) => {
    webViewRef.current?.injectJavaScript(`
      if (window.updateMarkers) {
        window.updateMarkers(${JSON.stringify(JSON.stringify(list))});
      }
      true;
    `);
  }, []);

  const handleMessage = useCallback((event: any) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed.type === 'MAP_READY') {
        mapReadyRef.current = true;
        setMapReady(true);
        pushMarkers(spotsRef.current);
      } else if (parsed.type === 'SPOT_CLICK') {
        setActiveSpot(parsed.data);
      } else if (parsed.type === 'MAP_CLICK') {
        if (!ignoreMapClickRef.current) {
          setActiveSpot(null);
        }
      }
    } catch (e) {
      console.log('WebView Message Parse Error:', e);
    }
  }, [pushMarkers]);

  const handleSpotPress = useCallback((spot: MapSpot) => {
    setActiveSpot(spot);
    ignoreMapClickRef.current = true;
    setTimeout(() => {
      ignoreMapClickRef.current = false;
    }, 500);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.kakaoMap) {
          window.kakaoMap.setLevel(window.kakaoMap.getLevel() - 1);
        }
      `);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.kakaoMap) {
          window.kakaoMap.setLevel(window.kakaoMap.getLevel() + 1);
        }
      `);
    }
  }, []);

  const handleMyLocation = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      } catch {
        return;
      }
    }
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.kakaoMap && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function(position) {
              window.kakaoMap.setCenter(new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude));
            },
            function(error) {
              console.error("Geolocation error:", error);
            }
          );
        }
      `);
    }
  }, []);

  useEffect(() => {
    spotsRef.current = filteredSpots;
    if (mapReadyRef.current) pushMarkers(filteredSpots);
  }, [filteredSpots, pushMarkers]);

  // HTML은 한 번만 만든다. filteredSpots를 여기에 끼우면 핀이 바뀔 때마다 source가 달라져
  // WebView가 통째로 리로드되고, 지도 중심·줌이 초기화된다. 핀 갱신은 injectJavaScript로만 한다.
  const HTML = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <!-- baseUrl을 https로 주면 카카오 SDK가 내부 라이브러리를 https로 받는다(iOS ATS 통과).
       baseUrl 없이 html만 넘기면 origin이 about:blank가 되어 지도가 흰 화면으로 남는다. -->
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #ffffff; }
    #map { width: 100%; height: 100%; }
    .map-pin {
      position: absolute;
      transform: translate(-50%, -100%);
      line-height: 0;
      cursor: pointer;
      z-index: 5;
    }
    .map-pin--review svg path { fill: ${BRAND}; }
    .map-pin--fav svg path { fill: #1c1c1e; }
    .map-pin--review { filter: drop-shadow(0 2px 6px rgba(227,27,89,0.45)); }
    .map-pin--fav { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    kakao.maps.load(function() {
      function initMap() {
        var mapContainer = document.getElementById('map');
        if (mapContainer.clientHeight === 0 || mapContainer.clientWidth === 0) {
          setTimeout(initMap, 50);
          return;
        }

        var map = new kakao.maps.Map(mapContainer, {
            center: new kakao.maps.LatLng(36.5, 127.5),
            level: 13
        });
        window.kakaoMap = map;

        var markers = [];

        // 리뷰도 쓰고 즐겨찾기도 한 스팟은 핀이 하나뿐이다. 색은 리뷰(핑크)를 우선한다 —
        // 리뷰를 쓴 곳은 대개 즐겨찾기도 해두므로, 즐겨찾기를 우선하면 핀이 전부 한 색이 된다.
        function createPinHtml(isReviewed) {
          var cls = isReviewed ? 'map-pin map-pin--review' : 'map-pin map-pin--fav';
          var svgColor = isReviewed ? '${BRAND}' : '#1c1c1e';
          var size = isReviewed ? 26 : 24;
          var viewBoxHeight = isReviewed ? 33 : 30;
          return \`
            <div class="\${cls}">
              <svg width="\${size}" height="\${viewBoxHeight}" viewBox="0 0 24 30" fill="none">
                <path d="M12 0C5.4 0 0 5.4 0 12C0 20 12 30 12 30S24 20 24 12C24 5.4 18.6 0 12 0Z" fill="\${svgColor}"/>
                <circle cx="12" cy="10.5" r="4.5" fill="#fff"/>
              </svg>
            </div>
          \`;
        }

        window.updateMarkers = function(spotsJson) {
          var spots = JSON.parse(spotsJson);
          
          markers.forEach(function(m) { m.setMap(null); });
          markers = [];

          var bounds = new kakao.maps.LatLngBounds();

          spots.forEach(function(spot) {
            var position = new kakao.maps.LatLng(spot.lat, spot.lng);
            bounds.extend(position);

            var content = document.createElement('div');
            content.innerHTML = createPinHtml(spot.reviewed);
            
            content.onclick = function(e) {
              e.stopPropagation();
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPOT_CLICK', data: spot }));
            };

            var customOverlay = new kakao.maps.CustomOverlay({
              position: position,
              content: content,
              clickable: true,
              yAnchor: 1,
              zIndex: spot.reviewed ? 2 : 1
            });
            
            customOverlay.setMap(map);
            markers.push(customOverlay);
          });

          if (spots.length > 0) {
            map.setBounds(bounds);
          }
        };

        kakao.maps.event.addListener(map, 'click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
        });

        // 지도 객체 생성 직후는 아직 타일이 회색이다. 실제로 그려진 뒤 알려야 오버레이를
        // 걷는 시점이 맞는다. tilesloaded가 오지 않는 환경도 있어 타임아웃으로 보정한다.
        var told = false;
        function tellReady() {
          if (told) return;
          told = true;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
        }
        kakao.maps.event.addListener(map, 'tilesloaded', tellReady);
        setTimeout(tellReady, 2000);
      }
      initMap();
    });
  </script>
</body>
</html>
    `;
  }, []);

  // HTML과 마찬가지로 source 객체도 고정한다 — 매 렌더 새 객체를 주면 WebView가 재로딩된다.
  const mapSource = useMemo(() => ({ html: HTML, baseUrl: 'https://localhost' }), [HTML]);

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View 
        className="absolute top-0 left-0 right-0 z-50 bg-[rgba(255,255,255,0.92)] border-b-[0.5px] border-hairline"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between" style={{ height: NAV_ROW_HEIGHT, paddingHorizontal: normalize(20) }}>
          <TouchableOpacity onPress={handleBackNavigation} className="items-center justify-center" style={{ width: normalize(36), height: normalize(36), marginLeft: -normalize(8) }}>
            <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.65)" />
          </TouchableOpacity>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_LG, letterSpacing: -0.3 }}>
            PIC MAP
          </Text>
          <View style={{ width: normalize(36) }} />
        </View>

        <View className="flex-row" style={{ paddingHorizontal: normalize(16), paddingVertical: normalize(10), gap: normalize(7) }}>
          {(['all', 'review', 'fav'] as FilterType[]).map((f) => {
            const isActive = filter === f;
            // 로딩 중에는 개수를 붙이지 않는다 — "전체 0"은 핀이 없다는 뜻으로 읽힌다.
            const labels = isLoading
              ? { all: '전체', review: '리뷰', fav: '즐겨찾기' }
              : { all: `전체 ${counts.all}`, review: `리뷰 ${counts.review}`, fav: `즐겨찾기 ${counts.fav}` };
            
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                className={`justify-center ${isActive ? 'bg-[#1c1c1e]' : 'bg-[rgba(0,0,0,0.04)]'}`}
                style={{
                  height: normalize(30),
                  paddingHorizontal: normalize(14),
                  borderRadius: normalize(15),
                }}
              >
                <Text className={`font-medium ${isActive ? 'text-white' : 'text-[rgba(0,0,0,0.5)]'}`} style={{ fontSize: FONT_SM }}>
                  {labels[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <WebView
        key={webViewKey}
        ref={webViewRef}
        source={mapSource}
        geolocationEnabled={true}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onError={(e: any) => {
          console.error('[PIC MAP WebView Error]', e.nativeEvent);
          setMapGaveUp(true);
        }}
        onHttpError={(e: any) => console.error('[PIC MAP WebView HTTP]', e.nativeEvent)}
        // iOS 콘텐츠 프로세스가 죽으면 에러 없이 흰 화면만 남는다. 알아서 되살린다.
        onContentProcessDidTerminate={() => {
          console.warn('[PIC MAP] WebView 콘텐츠 프로세스 종료 — 재로딩');
          remountMap();
        }}
        // NativeWind는 WebView에 className을 적용하지 못한다(cssInterop 대상이 아니다).
        // className="flex-1"을 주면 조용히 무시돼 높이가 0이 되고, 지도가 흰 화면으로 남는다.
        style={{ flex: 1 }}
      />

      {!showMapLoading && (
      <View className="absolute z-30" style={{ right: normalize(14), top: insets.top + HEADER_HEIGHT + normalize(16), gap: normalize(8) }}>
        <View className="bg-white overflow-hidden" style={{ borderRadius: normalize(12) }}>
          <TouchableOpacity onPress={handleZoomIn} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
            <Text className="text-[rgba(0,0,0,0.55)] font-normal" style={{ fontSize: normalizeFontSize(20) }}>+</Text>
          </TouchableOpacity>
          <View className="bg-[rgba(0,0,0,0.07)]" style={{ height: 0.5 }} />
          <TouchableOpacity onPress={handleZoomOut} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
            <Text className="text-[rgba(0,0,0,0.55)] font-normal" style={{ fontSize: normalizeFontSize(20) }}>−</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleMyLocation} className="bg-white items-center justify-center" style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(12) }}>
          <IconFocus2 size={normalize(20)} color="rgba(0,0,0,0.45)" />
        </TouchableOpacity>
      </View>
      )}

      {!showMapLoading && (
      <View className="absolute z-30 bg-[rgba(255,255,255,0.88)]" style={{ left: normalize(14), top: insets.top + HEADER_HEIGHT + normalize(16), borderRadius: normalize(10), paddingHorizontal: normalize(12), paddingVertical: normalize(8), gap: normalize(6) }}>
        {/* 범례 표식은 지도 핀·리스트와 같은 모양이어야 한다 — 동그라미면 무엇을 가리키는지 한 번 더 번역해야 한다 */}
        <View className="flex-row items-center" style={{ gap: normalize(4) }}>
          <IconMapPin size={normalize(13)} color={BRAND} fill={BRAND} />
          <Text className="text-[rgba(0,0,0,0.55)] font-normal" style={{ fontSize: FONT_XS }}>리뷰</Text>
        </View>
        <View className="flex-row items-center" style={{ gap: normalize(4) }}>
          <IconMapPin size={normalize(13)} color="#1c1c1e" fill="#1c1c1e" />
          <Text className="text-[rgba(0,0,0,0.55)] font-normal" style={{ fontSize: FONT_XS }}>즐겨찾기</Text>
        </View>
      </View>
      )}

      {/* 지도는 데이터가 0이어도 전국 지도만 덩그러니 뜬다 — 왜 비었는지는 말로 알려줘야 한다.
          리스트 시트(z-40)와 겹치지 않게 지도 상단 영역에 둔다. */}
      {/* 카카오 SDK·타일을 받는 동안은 지도가 실제로 비어 있다. 그 구간만 덮는다 —
          핀 데이터 로딩과 다르다(그건 하단 스켈레톤이 말한다). */}
      {showMapLoading && (
        <View
          pointerEvents="none"
          className="absolute left-0 right-0 items-center justify-center bg-[rgba(255,255,255,0.9)]"
          style={{ top: insets.top + HEADER_HEIGHT, bottom: mapAreaBottom, zIndex: 25 }}
        >
          <Text className="text-sub font-normal" style={{ fontSize: FONT_SM }}>지도 불러오는 중...</Text>
        </View>
      )}

      {showMapLoading ? null : isError && spots.length === 0 ? (
        // 캐시가 남아 있으면(백그라운드 refetch 실패) 있던 핀을 뺏지 않는다 — SpotCarouselSection과 같은 규칙.
        <MapNotice
          text="핀을 불러오지 못했어요"
          onRetry={() => {
            reviewed.refetch();
            bookmarked.refetch();
            // 오프라인에서 들어왔으면 지도도 같이 죽어 있다. 데이터만 되살리면 흰 지도가 남는다.
            if (!mapReady) remountMap();
          }}
        />
      ) : !isLoading && spots.length === 0 ? (
        <MapNotice text={'리뷰를 쓰거나 스팟을 즐겨찾기하면\n여기에 핀이 표시돼요'} />
      ) : null}

      <SpotListSheet spots={filteredSpots} isLoading={isLoading} activeSpot={activeSpot} onSpotPress={handleSpotPress} filterName={filter === 'all' ? '전체 스팟' : filter === 'review' ? '리뷰한 스팟' : '즐겨찾기 스팟'} />

      <BottomSheet visible={!!activeSpot} onClose={() => setActiveSpot(null)}>
        {activeSpot && (
          <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(20) }}>
            {/* 서버가 스팟 이미지를 안 주는 경우가 있다(TourAPI 원본 누락). 배경 대비만으로 자리를 지킨다. */}
            <View className="w-full overflow-hidden bg-card" style={{ height: normalize(150), borderRadius: normalize(14), marginBottom: normalize(14) }}>
              {activeSpot.photo && (
                <Image source={{ uri: activeSpot.photo }} className="w-full h-full" resizeMode="cover" />
              )}
            </View>

            <Text className="font-semibold text-black" style={{ fontSize: FONT_LG, letterSpacing: -0.3, marginBottom: normalize(3) }}>
              {activeSpot.name}
            </Text>
            <Text className="text-sub font-normal" style={{ fontSize: FONT_SM, marginBottom: normalize(10), letterSpacing: -0.1 }}>
              {activeSpot.loc}
            </Text>

            {/* 스팟 카테고리. "코스에 저장"을 누를지 정할 때 이름·주소보다 이게 판단 재료가 된다.
                지도 탭 스팟 팝업과 같은 칩 스타일. 사진 위에 얹지 않는다 — 이미지가 없는 스팟에선
                흰 칩이 밝은 배경에 묻힌다. ETC만 달린 스팟은 매퍼가 걸러 배열이 비고, 줄 자체가 사라진다. */}
            {activeSpot.categories.length > 0 && (
              <View className="flex-row" style={{ gap: normalize(5), marginBottom: normalize(14) }}>
                {activeSpot.categories.map((label) => (
                  <View
                    key={label}
                    className="bg-[rgba(0,0,0,0.06)] justify-center"
                    style={{ height: normalize(22), paddingHorizontal: normalize(9), borderRadius: normalize(11) }}
                  >
                    <Text className="font-medium text-sub" style={{ fontSize: normalizeFontSize(11) }}>{label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* 즐겨찾기만 한 스팟은 리뷰가 없어 작성일·별점이 존재하지 않는다. 카드를 비워 두지 않고 아예 걷는다. */}
            {activeSpot.reviewed && (
              <View className="flex-row" style={{ gap: normalize(8), marginBottom: normalize(16) }}>
                <View className="flex-1 bg-card" style={{ borderRadius: normalize(10), padding: normalize(10) }}>
                  <Text className="text-[rgba(0,0,0,0.35)] font-normal" style={{ fontSize: normalizeFontSize(10), marginBottom: normalize(3) }}>리뷰 작성일</Text>
                  <Text className="font-semibold text-black" style={{ fontSize: FONT_MD }}>{activeSpot.date}</Text>
                </View>
                <View className="flex-1 bg-card" style={{ borderRadius: normalize(10), padding: normalize(10) }}>
                  <Text className="text-[rgba(0,0,0,0.35)] font-normal" style={{ fontSize: normalizeFontSize(10), marginBottom: normalize(3) }}>리뷰 점수</Text>
                  <Text className="font-semibold text-brand" style={{ fontSize: FONT_MD }}>{activeSpot.rating}점</Text>
                </View>
              </View>
            )}

            {/* 지도 탭의 스팟 팝업과 같은 배치 — 보조(코스 저장) + 주(상세 보기). CTA는 핑크가 규칙이다. */}
            <View className="flex-row" style={{ gap: normalize(8) }}>
              <TouchableOpacity
                className="flex-1 bg-card items-center justify-center"
                style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
                onPress={() => {
                  setCourseTarget(activeSpot);
                  setActiveSpot(null);
                }}
              >
                <Text className="font-semibold text-black/60" style={{ fontSize: FONT_MD }}>코스에 저장</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-brand items-center justify-center"
                style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
                onPress={() => navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: activeSpot.id } })}
              >
                <Text className="font-semibold text-white" style={{ fontSize: FONT_MD }}>상세 보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </BottomSheet>

      <SaveToPlanSheet
        visible={!!courseTarget}
        onClose={() => setCourseTarget(null)}
        spot={
          courseTarget
            ? {
                id: courseTarget.id,
                name: courseTarget.name,
                loc: courseTarget.loc,
                lat: courseTarget.lat,
                lng: courseTarget.lng,
                imageUrl: courseTarget.photo,
              }
            : null
        }
        onSaved={(message) => {
          setCourseTarget(null);
          setToast(message);
        }}
      />

      <Toast message={toast ?? ''} visible={!!toast} onHide={() => setToast(null)} />
    </View>
  );}

// 지도 영역(헤더 아래 ~ 리스트 시트 위) 전체를 차지하고 그 안에서 중앙 정렬한다.
// 고정 top 오프셋으로 두면 기기 높이에 따라 위쪽에 치우친다.
function MapNotice({ text, onRetry }: { text: string; onRetry?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    // box-none: 이 뷰가 지도 영역 전체를 덮으므로 auto면 배경이 투명해도 지도 드래그·줌·내 위치
    // 버튼이 전부 죽는다(RN은 투명 뷰도 히트테스트 대상이다). 자식(재시도 버튼)은 계속 눌린다.
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 items-center justify-center"
      style={{ top: insets.top + HEADER_HEIGHT, bottom: mapAreaBottomOf(insets.bottom), zIndex: 30 }}
    >
      <View
        className="bg-[rgba(255,255,255,0.92)] items-center"
        style={{ borderRadius: normalize(14), paddingHorizontal: normalize(20), paddingVertical: normalize(14), maxWidth: '80%' }}
      >
        <Text className="text-sub font-normal text-center" style={{ fontSize: FONT_SM, lineHeight: normalize(20) }}>
          {text}
        </Text>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} hitSlop={8} style={{ marginTop: normalize(8) }}>
            <Text className="font-semibold text-brand" style={{ fontSize: FONT_SM }}>다시 시도</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// 실제 행과 같은 골격(52px 썸네일 + 2줄)이라야 데이터가 도착할 때 높이가 튀지 않는다.
function SkeletonRow({ last }: { last: boolean }) {
  return (
    <View
      className="flex-row items-center"
      style={{ paddingVertical: normalize(12), borderBottomWidth: last ? 0 : HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}
    >
      <Skeleton width={normalize(52)} height={normalize(52)} borderRadius={normalize(10)} style={{ marginRight: normalize(12) }} />
      <View className="flex-1" style={{ gap: normalize(6) }}>
        <Skeleton width="55%" height={normalize(14)} borderRadius={normalize(7)} />
        <Skeleton width="35%" height={normalize(11)} borderRadius={normalize(6)} />
      </View>
    </View>
  );
}

const LIST_PEEK_HEIGHT = normalize(160);

// 지도 영역의 아래 경계 = 리스트 시트가 peek으로 걸쳐 있는 높이. SpotListSheet의 peekY와 같은 식이다.
function mapAreaBottomOf(insetBottom: number) {
  return LIST_PEEK_HEIGHT + Math.max(insetBottom, normalize(10));
}

function SpotListSheet({ spots, isLoading, activeSpot, onSpotPress, filterName }: { spots: MapSpot[], isLoading: boolean, activeSpot: MapSpot | null, onSpotPress: (s: MapSpot) => void, filterName: string }) {
  const insets = useSafeAreaInsets();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  const LIST_EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.7;
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(isExpanded);
  
  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const peekYRef = useRef(SCREEN_HEIGHT - LIST_PEEK_HEIGHT - Math.max(insets.bottom, normalize(10)));
  const expandedYRef = useRef(SCREEN_HEIGHT - LIST_EXPANDED_HEIGHT);

  useEffect(() => {
    peekYRef.current = SCREEN_HEIGHT - LIST_PEEK_HEIGHT - Math.max(insets.bottom, normalize(10));
    expandedYRef.current = SCREEN_HEIGHT - LIST_EXPANDED_HEIGHT;
  }, [SCREEN_HEIGHT, insets.bottom, LIST_EXPANDED_HEIGHT]);

  useEffect(() => {
    if (activeSpot) {
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.spring(translateY, {
        toValue: isExpanded ? expandedYRef.current : peekYRef.current,
        stiffness: 250, damping: 25, mass: 1,
        restSpeedThreshold: 100, restDisplacementThreshold: 40,
        useNativeDriver: true
      }).start();
    }
  }, [activeSpot, isExpanded, translateY, SCREEN_HEIGHT]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, state) => Math.abs(state.dy) > 5,
      onPanResponderMove: (_, state) => {
        const startY = isExpandedRef.current ? expandedYRef.current : peekYRef.current;
        let newY = startY + state.dy;
        if (newY < expandedYRef.current) newY = expandedYRef.current + (newY - expandedYRef.current) * 0.3;
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, state) => {
        if (Math.abs(state.dy) < 20) {
          Animated.spring(translateY, { toValue: isExpandedRef.current ? expandedYRef.current : peekYRef.current, useNativeDriver: true }).start();
        } else {
          const nextExpanded = state.dy < 0;
          setIsExpanded(nextExpanded);
          Animated.spring(translateY, {
            toValue: nextExpanded ? expandedYRef.current : peekYRef.current,
            velocity: state.vy,
            stiffness: 250, damping: 25, mass: 1,
            restSpeedThreshold: 100, restDisplacementThreshold: 40,
            useNativeDriver: true
          }).start();
        }
      }
    })
  ).current;

  return (
    <Animated.View
      className="absolute top-0 left-0 right-0 z-40 bg-white"
      style={{
        height: LIST_EXPANDED_HEIGHT,
        transform: [{ translateY }],
        borderTopLeftRadius: normalize(24), borderTopRightRadius: normalize(24)
      }}
    >
      <View {...panResponder.panHandlers} className="bg-transparent">
        <View className="items-center" style={{ paddingTop: normalize(12), paddingBottom: normalize(8) }}>
          <View className="bg-[rgba(0,0,0,0.1)]" style={{ width: normalize(36), height: normalize(5), borderRadius: normalize(2.5) }} />
        </View>
        <View className="flex-row items-baseline border-b-[0.5px] border-hairline" style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(12) }}>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_LG, letterSpacing: -0.3, marginRight: normalize(8) }}>
            {filterName}
          </Text>
          {isLoading ? (
            <Skeleton width={normalize(30)} height={normalize(12)} borderRadius={normalize(6)} />
          ) : (
            <Text className="text-[rgba(0,0,0,0.35)] font-normal" style={{ fontSize: FONT_SM }}>{spots.length}곳</Text>
          )}
        </View>
      </View>

      <ScrollView keyboardShouldPersistTaps="always" className="flex-1" style={{ paddingHorizontal: normalize(20) }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, normalize(20)) + normalize(20) }}>
        {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={`sk-${i}`} last={i === 2} />)}
        {!isLoading && spots.map((spot, idx) => (
          <TouchableOpacity
            key={spot.id}
            onPress={() => onSpotPress(spot)}
            className="flex-row items-center"
            style={{ paddingVertical: normalize(12), borderBottomWidth: idx < spots.length - 1 ? HAIRLINE_WIDTH : 0, borderBottomColor: HAIRLINE }}
          >
            <View className="bg-card overflow-hidden" style={{ width: normalize(52), height: normalize(52), borderRadius: normalize(10), marginRight: normalize(12) }}>
              {spot.photo && <Image source={{ uri: spot.photo }} className="w-full h-full" />}
            </View>
            <View className="flex-1" style={{ marginRight: normalize(8) }}>
              {/* 지도 핀과 같은 규칙 — 리뷰가 있으면 핑크 우선 */}
              <View className="flex-row items-center" style={{ gap: normalize(4), marginBottom: normalize(2) }}>
                <IconMapPin
                  size={normalize(14)}
                  color={spot.reviewed ? BRAND : '#1c1c1e'}
                  fill={spot.reviewed ? BRAND : '#1c1c1e'}
                />
                <Text className="font-semibold text-black flex-1" style={{ fontSize: FONT_MD, letterSpacing: -0.2 }} numberOfLines={1}>{spot.name}</Text>
              </View>
              <Text className="text-[rgba(0,0,0,0.38)] font-normal" style={{ fontSize: FONT_XS, letterSpacing: -0.1, marginBottom: normalize(4) }} numberOfLines={1}>{spot.loc}</Text>
              {/* 즐겨찾기만 한 스팟은 리뷰 작성일이 없다 — 칩 줄을 비워 두지 않고 행을 2줄로 둔다. */}
              {spot.date && (
                <View className="flex-row" style={{ gap: normalize(5) }}>
                  <View className="bg-[rgba(0,0,0,0.06)] justify-center" style={{ height: normalize(18), paddingHorizontal: normalize(7), borderRadius: normalize(9) }}>
                    <Text className="font-medium text-sub" style={{ fontSize: normalizeFontSize(10) }}>{spot.date}</Text>
                  </View>
                </View>
              )}
            </View>
            <IconChevronRight size={normalize(18)} color="rgba(0,0,0,0.18)" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
