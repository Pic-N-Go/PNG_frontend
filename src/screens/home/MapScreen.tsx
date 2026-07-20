import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, PermissionsAndroid, BackHandler, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { IconChevronLeft, IconSearch, IconAdjustmentsHorizontal, IconFocus2, IconX } from '@tabler/icons-react-native';
import { useNavigation, useRoute, useFocusEffect, CommonActions } from '@react-navigation/native';
import { useTravelStore, Spot } from '@/store/useTravelStore';
import { useSpots } from '@/hooks/useSpot';
import SpotPopup from '@/components/travel/SpotPopup';
import BottomSheet from '@/components/common/BottomSheet';
import FilterBottomSheet, { FilterState, EMPTY_FILTER } from '@/components/home/FilterBottomSheet';
import { StatusBar } from 'expo-status-bar';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_MD, BUTTON_HEIGHT, BUTTON_RADIUS, HEADER_HEIGHT } from '@/constants/layout';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;



const DEFAULT_SPOTS: any[] = []; // Not used anymore, fetching from API

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: '야경', label: '야경' },
  { id: '바다', label: '바다' },
  { id: '한옥', label: '한옥' },
  { id: '꽃', label: '꽃' },
  { id: '카페', label: '카페' },
  { id: '숲', label: '숲' },
  { id: '축제', label: '축제' },
];

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode = route.params?.source === 'plan' ? 'plan' 
             : route.params?.source === 'plan-view' ? 'plan-view'
             : route.params?.source === 'wishlist-change' ? 'wishlist-change'
             : 'view';

  const webViewRef = useRef<any>(null);
  const { selectedSpots, addSpot, removeSpot } = useTravelStore();
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [isCourseModalOpen, setCourseModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [detailFilter, setDetailFilter] = useState<FilterState>(EMPTY_FILTER);
  const [currentPlanDay, setCurrentPlanDay] = useState<string>(route.params?.initialDay || '1');

  const { data: spotsPage } = useSpots();

  const apiSpots = useMemo(() => {
    console.log('[DEBUG] spotsPage from API:', spotsPage);
    if (!spotsPage?.content) return [];
    const mapped = spotsPage.content.map(spot => ({
      id: String(spot.id),
      name: spot.name,
      lat: spot.latitude,
      lng: spot.longitude,
      tags: [spot.category],
      score: spot.photogenicScore,
      loc: spot.address,
      photo: spot.thumbnailUrl || spot.imageUrl || ''
    }));
    console.log('[DEBUG] mapped apiSpots:', mapped);
    return mapped;
  }, [spotsPage]);

  const isSelected = activeSpot ? selectedSpots.some(s => s.id === activeSpot.id) : false;

  useEffect(() => {
    if (route.params?.initialDay) {
      setCurrentPlanDay(route.params.initialDay);
    }
  }, [route.params?.initialDay]);

  const handleBackNavigation = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('HomeTab');
    }
    return true; // prevent default behavior
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return handleBackNavigation();
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [handleBackNavigation])
  );

  const closeSheet = useCallback(() => {
    setActiveSpot(null);
  }, []);

  const handleMessage = useCallback((event: any) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed.type === 'SPOT_CLICK') {
        // 같은 스팟을 다시 탭하면 참조를 유지해 불필요한 재-진입 애니메이션을 막는다.
        setActiveSpot(prev => (prev?.id === parsed.data.id ? prev : parsed.data));
      } else if (parsed.type === 'MAP_CLICK') {
        setActiveSpot(null);
      }
    } catch (e) {
      console.log('WebView Message Parse Error:', e);
    }
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
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Location permission denied');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.kakaoMap) {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
              var lat = position.coords.latitude;
              var lng = position.coords.longitude;
              window.kakaoMap.setCenter(new kakao.maps.LatLng(lat, lng));
            }, function(error) {
              window.kakaoMap.setCenter(new kakao.maps.LatLng(35.1532, 129.1186));
            });
          } else {
            window.kakaoMap.setCenter(new kakao.maps.LatLng(35.1532, 129.1186));
          }
        }
      `);
    }
  }, []);

  const baseSpots = useMemo(() => {
    if (mode === 'plan-view' && route.params?.planData) {
      return route.params.planData[currentPlanDay]?.spots || [];
    }
    return route.params?.spots || apiSpots;
  }, [mode, route.params?.spots, route.params?.planData, currentPlanDay, apiSpots]);

  const filteredSpots = useMemo(() => {
    return baseSpots.filter((spot: any) => {
      // 1. 카테고리 필터링
      if (selectedCategory !== 'all' && selectedCategory !== '전체') {
        const matchesCategory = spot.tags.some((t: string) => t.includes(selectedCategory));
        if (!matchesCategory) return false;
      }

      // 2. 상세 필터링 (FilterBottomSheet)
      // 시간대 필터
      if (detailFilter.time.length > 0) {
        const matchesTime = spot.tags.some((t: string) => detailFilter.time.includes(t));
        if (!matchesTime) return false;
      }
      // 날씨 필터
      if (detailFilter.weather.length > 0) {
        const matchesWeather = spot.tags.some((t: string) => detailFilter.weather.includes(t));
        if (!matchesWeather) return false;
      }
      // 스코어 필터 (예: '80점 이상')
      if (detailFilter.score) {
        const minScore = parseInt(detailFilter.score.replace(/[^0-9]/g, ''), 10);
        if (spot.score < minScore) return false;
      }

      return true;
    });
  }, [baseSpots, selectedCategory, detailFilter]);

  // filteredSpots가 변경될 때마다 WebView에 메시지를 보내 마커 갱신
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.updateMarkers) {
          window.updateMarkers(${JSON.stringify(JSON.stringify(filteredSpots))});
        }
      `);
    }
  }, [filteredSpots]);
  const HTML = useMemo(() => {
    const initialSpots = (mode === 'plan-view' && route.params?.planData)
      ? (route.params.planData[route.params.initialDay || '1']?.spots || [])
      : (route.params?.spots || apiSpots);
    const isCourseView = mode === 'plan-view' || !!route.params?.spots;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8e8ed; }
    #map { width: 100%; height: 100%; }
    .custom-marker {
      width: 32px; height: 32px; border-radius: 50%; background: #E31B59;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2.5px solid white;
    }
    .custom-marker svg { width: 16px; height: 16px; fill: white; }
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

        var mapOption = {
            center: new kakao.maps.LatLng(36.5, 127.5),
            level: 13
        };
        var map = new kakao.maps.Map(mapContainer, mapOption);
        window.kakaoMap = map;

      // 마커(오버레이) 탭 시 kakao가 지도 'click'도 함께 발생시켜 '열자마자 닫힘' 깜빡임이 생긴다.
      // 지도 클릭에 의한 닫기(MAP_CLICK)를 살짝 지연시키고, 그 사이 마커 탭이 오면 취소한다(순서 무관).
      var pendingMapClose = null;
      function scheduleMapClose() {
        if (pendingMapClose) clearTimeout(pendingMapClose);
        pendingMapClose = setTimeout(function () {
          pendingMapClose = null;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
        }, 80);
      }
      function cancelMapClose() {
        if (pendingMapClose) { clearTimeout(pendingMapClose); pendingMapClose = null; }
      }

      var spots = ${JSON.stringify(initialSpots).replace(/</g, '\\u003c')};
      var isCourseView = ${isCourseView};

      var bounds = new kakao.maps.LatLngBounds();
      var activeOverlays = [];
      var activePolyline = null;

      function drawPolyline(targetSpots) {
        if (activePolyline) {
          activePolyline.setMap(null);
          activePolyline = null;
        }
        if (isCourseView && targetSpots && targetSpots.length > 0) {
          var linePath = targetSpots.map(function(s) { return new kakao.maps.LatLng(s.lat, s.lng); });
          activePolyline = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 3,
            strokeColor: '#e31b59',
            strokeOpacity: 0.8,
            strokeStyle: 'solid'
          });
          activePolyline.setMap(map);
        }
      }

      function drawMarkers(targetSpots) {
        // 기존 오버레이 모두 제거
        activeOverlays.forEach(function(o) { o.setMap(null); });
        activeOverlays = [];

        var markerBounds = new kakao.maps.LatLngBounds();

        targetSpots.forEach(function(spot, index) {
          var markerPosition = new kakao.maps.LatLng(spot.lat, spot.lng);

          var content = document.createElement('div');
          content.className = 'custom-marker';
          // isCourseView일 때는 숫자, 아닐 때는 하트 아이콘
          if (isCourseView) {
            content.innerHTML = '<span style="color:white; font-size:14px; font-weight:bold;">' + (index + 1) + '</span>';
          } else {
            content.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
          }

          content.onclick = function(e) {
              e.stopPropagation();
              cancelMapClose();
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPOT_CLICK', data: spot }));
          };
          // 터치 환경에서 지도 click이 마커 onclick보다 먼저 예약되는 경우까지 대비
          content.addEventListener('touchstart', function(e) { e.stopPropagation(); cancelMapClose(); }, { passive: true });

          var customOverlay = new kakao.maps.CustomOverlay({
              position: markerPosition,
              content: content,
              yAnchor: 1
          });
          customOverlay.setMap(map);
          activeOverlays.push(customOverlay);
          markerBounds.extend(markerPosition);
        });

        if (targetSpots.length > 0) {
          map.setBounds(markerBounds);
        }
        
        drawPolyline(targetSpots);
      }

      // 초기 마커 정렬 및 그리기
      drawMarkers(spots);

      // 외부(React Native)에서 호출 가능한 마커 갱신 함수 노출
      window.updateMarkers = function(spotsJson) {
        try {
          var parsed = JSON.parse(spotsJson);
          drawMarkers(parsed);
        } catch (e) {
          console.error("updateMarkers Error: ", e);
        }
      };

      kakao.maps.event.addListener(map, 'click', function() {
          scheduleMapClose();
      });
      }
      initMap();
    });
  </script>
</body>
</html>
  `;
  }, [route.params?.spots, route.params?.planData, route.params?.initialDay, mode]);

  // source 객체도 HTML 문자열이 바뀔 때만 새로 만들어 WebView가 재로딩되지 않게 한다.
  const mapSource = useMemo(() => ({ html: HTML }), [HTML]);

  if (!KAKAO_KEY) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-black/50" style={{ fontSize: normalizeFontSize(16) }}>카카오 맵 API 키가 설정되지 않았습니다.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        {/* 상단 오버레이 (검색창 + 뒤로가기) */}
        {mode === 'wishlist-change' ? (
          <View className="bg-[#E31B59] pt-14 pb-4 px-5 z-20 absolute top-0 left-0 right-0 w-full pointer-events-auto shadow-md">
            <View className="flex-row items-center justify-between mb-5">
              <TouchableOpacity onPress={handleBackNavigation} className="bg-white/20 items-center justify-center rounded-full" style={{ width: normalize(32), height: normalize(32) }}>
                <IconChevronLeft size={normalize(20)} color="#fff" />
              </TouchableOpacity>
              <Text className="font-semibold text-white" style={{ fontSize: normalizeFontSize(18) }}>변경할 스팟을 선택하세요</Text>
              <TouchableOpacity onPress={handleBackNavigation} className="bg-white/20 items-center justify-center rounded-full" style={{ width: normalize(32), height: normalize(32) }}>
                <IconX size={normalize(16)} color="#fff" />
              </TouchableOpacity>
            </View>
            <View className="bg-[#f5f5f7] rounded-xl flex-row items-center px-4" style={{ height: normalize(44) }}>
              <IconSearch size={normalize(18)} color="rgba(0,0,0,0.3)" />
              <Text className="ml-2 text-black/30" style={{ fontSize: normalizeFontSize(14) }}>스팟 이름으로 검색</Text>
            </View>
          </View>
        ) : (
          <View className="absolute top-0 left-0 right-0 z-20 pointer-events-box-none" style={{ paddingTop: HEADER_HEIGHT }}>
          <View className="flex-row items-center px-4 gap-2 pointer-events-auto">
            {/* 뒤로가기 버튼 */}
            <TouchableOpacity
              onPress={handleBackNavigation}
              activeOpacity={0.7}
              style={{
                width: normalize(48),
                height: normalize(48),
                borderRadius: normalize(24),
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderWidth: 0.5,
                borderColor: 'rgba(255,255,255,0.6)',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <IconChevronLeft size={normalize(24)} color="#000" strokeWidth={1.5} />
            </TouchableOpacity>

            {/* 검색바 또는 모드별 헤더 */}
            {mode !== 'plan-view' ? (
              <View
                style={{
                  flex: 1,
                  height: normalize(48),
                  borderRadius: normalize(24),
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  borderWidth: 0.5,
                  borderColor: 'rgba(255,255,255,0.6)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: normalize(16),
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('SearchResult', { query: '' })}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: '100%', paddingRight: normalize(32) }}
                >
                  <IconSearch size={normalize(18)} color="rgba(0,0,0,0.3)" strokeWidth={1.5} />
                  <Text
                    allowFontScaling={false}
                    style={{
                      marginLeft: normalize(8),
                      fontSize: FONT_MD,
                      color: 'rgba(0,0,0,0.3)',
                      fontFamily: 'Pretendard-Regular',
                      letterSpacing: -0.2,
                    }}
                  >
                    장소, 테마, 키워드 검색
                  </Text>
                </TouchableOpacity>

                {/* 필터 조절 아이콘 */}
                <TouchableOpacity
                  onPress={() => setFilterVisible(true)}
                  hitSlop={8}
                  style={{ position: 'absolute', right: normalize(16), top: 0, bottom: 0, justifyContent: 'center' }}
                >
                  <View style={{ position: 'relative' }}>
                    <IconAdjustmentsHorizontal size={normalize(18)} color="rgba(0,0,0,0.45)" strokeWidth={1.5} />
                    {activeFilterCount > 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -normalize(4),
                          right: -normalize(4),
                          width: normalize(14),
                          height: normalize(14),
                          borderRadius: normalize(7),
                          backgroundColor: '#E31B59',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: normalizeFontSize(8), color: '#fff', fontFamily: 'Pretendard-Medium', letterSpacing: -0.2 }}>
                          {activeFilterCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
          
          <View className="mt-2 pointer-events-auto">
            {mode === 'plan-view' ? (
              <View className="flex-row items-center justify-between px-4 mt-2">
                <Text className="font-semibold tracking-tight" style={{ color: '#E31B59', fontSize: normalizeFontSize(16) }}>
                  DAY {currentPlanDay} 경로
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1 ml-4" contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', gap: 8 }}>
                  {Object.keys(route.params?.planData || {}).map((dayStr) => {
                    const isActive = dayStr === currentPlanDay;
                    const bg = isActive ? '#E31B59' : '#f5f5f7';
                    const textColor = isActive ? 'text-white' : 'text-black/50';
                    return (
                      <TouchableOpacity
                        key={dayStr}
                        onPress={() => setCurrentPlanDay(dayStr)}
                        style={{
                          paddingHorizontal: isActive ? 28 : 16,
                          paddingVertical: 6,
                          borderRadius: 20,
                          backgroundColor: bg,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: isActive ? 0.2 : 0,
                          shadowRadius: 2,
                          elevation: isActive ? 2 : 0,
                        }}
                      >
                        <Text className={`${textColor} font-semibold tracking-tight`} style={{ fontSize: normalizeFontSize(12), letterSpacing: -0.2 }}>
                          DAY {dayStr}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, gap: 6 }}
              >
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={{
                        height: normalize(32),
                        paddingHorizontal: normalize(14),
                        borderRadius: normalize(16),
                        backgroundColor: isActive ? '#E31B59' : '#F5F5F7',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: isActive ? 'Pretendard-Medium' : 'Pretendard-Regular',
                          fontSize: normalizeFontSize(12),
                          color: isActive ? '#ffffff' : 'rgba(0,0,0,0.55)',
                          letterSpacing: -0.2,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
        )}

        <WebView
          ref={webViewRef}
          source={mapSource}
          onMessage={handleMessage}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          originWhitelist={['*']}
        />

        {/* 우측 지도 편의 컨트롤 */}
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            right: 16,
            top: 160,
            zIndex: 10,
            gap: 8,
          }}
        >
          {/* 줌 컨트롤 그룹 */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <TouchableOpacity
              onPress={handleZoomIn}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20, color: 'rgba(0,0,0,0.45)', fontFamily: 'Pretendard-Regular' }}>+</Text>
            </TouchableOpacity>
            
            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)' }} />

            <TouchableOpacity
              onPress={handleZoomOut}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 20, color: 'rgba(0,0,0,0.45)', fontFamily: 'Pretendard-Regular' }}>−</Text>
            </TouchableOpacity>
          </View>

          {/* 내 위치 이동 버튼 */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <TouchableOpacity
              onPress={handleMyLocation}
              activeOpacity={0.7}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconFocus2 size={18} color="rgba(0,0,0,0.45)" />
            </TouchableOpacity>
          </View>
        </View>

        {mode === 'wishlist-change' ? (
          <BottomSheet visible={!!activeSpot} onClose={closeSheet}>
            {activeSpot && (
              <View className="px-5 pb-5 pt-2">
                <View className="flex-row items-center mb-6">
                  <Image source={{ uri: activeSpot.photo }} className="rounded-xl mr-3" style={{ width: normalize(64), height: normalize(64) }} />
                  <View className="flex-1 justify-center">
                    <Text className="font-semibold text-black mb-1" style={{ fontSize: normalizeFontSize(20) }}>{activeSpot.name}</Text>
                    <Text className="text-black/40 mb-2.5" style={{ fontSize: normalizeFontSize(14) }}>{activeSpot.loc}</Text>
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <View className="bg-[#E31B59]/10 items-center justify-center rounded-full px-2.5 py-1">
                        <Text className="text-[#E31B59] font-semibold" style={{ fontSize: normalizeFontSize(10) }}>포토제닉 {activeSpot.score}</Text>
                      </View>
                      {(activeSpot.tags || []).map((t: string) => (
                        <View key={t} className="bg-black/5 items-center justify-center rounded-full px-2.5 py-1">
                          <Text className="text-black/50 font-medium" style={{ fontSize: normalizeFontSize(10) }}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    closeSheet();
                    const state = navigation.getState();
                    if (state && state.routes.length > 1) {
                      const prevRoute = state.routes[state.routes.length - 2];
                      if (prevRoute.name === 'WishlistSetting') {
                        navigation.dispatch({
                          ...CommonActions.setParams({ newSpot: activeSpot }),
                          source: prevRoute.key,
                        });
                        navigation.goBack();
                        return;
                      }
                    }
                    navigation.navigate('WishlistSetting', { newSpot: activeSpot }, { merge: true });
                  }} 
                  className="bg-[#E31B59] items-center justify-center" 
                  style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
                  <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(16) }}>이 스팟으로 변경</Text>
                </TouchableOpacity>
              </View>
            )}
          </BottomSheet>
        ) : (
          <SpotPopup
            activeSpot={activeSpot}
            onClose={closeSheet}
            renderButtons={() => (
              <View className="flex-row gap-2 mt-4">
                {mode !== 'plan-view' && (
                  <TouchableOpacity
                    onPress={() => {
                      if (mode === 'plan') {
                        if (isSelected) {
                          removeSpot(activeSpot!.id);
                        } else {
                          addSpot(activeSpot!);
                        }
                      } else {
                        setCourseModalOpen(true);
                      }
                    }}
                    className={`flex-1 items-center justify-center ${isSelected && mode === 'plan' ? 'bg-[#E31B59]' : 'bg-[#f5f5f7]'}`}
                    style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
                  >
                    <Text className={`font-semibold ${isSelected && mode === 'plan' ? 'text-white' : 'text-black/60'}`} style={{ fontSize: FONT_MD }}>
                      {mode === 'plan' ? (isSelected ? '현재 코스에 저장됨' : '현재 코스에 저장') : '코스에 저장'}
                    </Text>
                  </TouchableOpacity>
                )}

              <TouchableOpacity
                onPress={() => navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: activeSpot!.id } })}
                className="flex-1 bg-[#E31B59] items-center justify-center"
                style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
              >
                <Text className="font-semibold text-white" style={{ fontSize: FONT_MD }}>상세 보기</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        )}

        {/* Course Select Modal (Dummy) */}
        {isCourseModalOpen && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center z-50">
            <View className="bg-white rounded-2xl w-[80%] p-5 items-center">
              <Text className="font-semibold text-black mb-4" style={{ fontSize: normalizeFontSize(18) }}>어떤 코스에 저장할까요?</Text>

              <TouchableOpacity
                onPress={() => {
                  setCourseModalOpen(false);
                  navigation.navigate('TravelTab', { screen: 'TravelNew' });
                }}
                className="w-full bg-[#f5f5f7] rounded-xl items-center justify-center mb-2"
                style={{ height: BUTTON_HEIGHT }}
              >
                <Text className="text-black font-medium" style={{ fontSize: FONT_MD }}>+ 새 코스 만들기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCourseModalOpen(false);
                  addSpot(activeSpot!);
                  navigation.navigate('TravelTab', { screen: 'TravelNew' });
                }}
                className="w-full bg-[#E31B59] rounded-xl items-center justify-center"
                style={{ height: BUTTON_HEIGHT }}
              >
                <Text className="text-white font-medium" style={{ fontSize: FONT_MD }}>현재 진행중인 코스</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCourseModalOpen(false)}
                className="mt-4 p-2"
              >
                <Text className="text-black/50" style={{ fontSize: normalizeFontSize(14) }}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FilterBottomSheet
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          onApply={(count, filterState) => {
            setActiveFilterCount(count);
            setDetailFilter(filterState);
          }}
        />
      </View>
    );
}
