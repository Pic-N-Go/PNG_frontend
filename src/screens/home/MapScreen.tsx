import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { IconChevronLeft, IconSearch, IconAdjustmentsHorizontal, IconFocus2 } from '@tabler/icons-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTravelStore, Spot } from '@/store/useTravelStore';
import SpotPopup from '@/components/travel/SpotPopup';
import FilterBottomSheet, { FilterState, EMPTY_FILTER } from '@/components/home/FilterBottomSheet';
import { StatusBar } from 'expo-status-bar';
import { normalize } from '@/utils/normalize';
import { FONT_MD } from '@/constants/layout';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

const DEFAULT_SPOTS = [
  { id: '1', name: '광안리 해수욕장', lat: 35.1532, lng: 129.1186, tags: ['바다', '야경'], score: 87, loc: '부산 수영구', photo: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8dd?q=80&w=400&auto=format&fit=crop' },
  { id: '2', name: '경복궁', lat: 37.5796, lng: 126.9770, tags: ['역사', '고궁', '한옥'], score: 91, loc: '서울 종로구', photo: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=400&auto=format&fit=crop' },
  { id: '3', name: '제주 사려니숲길', lat: 33.4000, lng: 126.6000, tags: ['숲', '안개'], score: 78, loc: '제주 제주시', photo: 'https://images.unsplash.com/photo-1600758208050-a35f99478f68?q=80&w=400&auto=format&fit=crop' },
  { id: '4', name: '남산 서울타워', lat: 37.5512, lng: 126.9882, tags: ['야경', '랜드마크'], score: 86, loc: '서울 용산구', photo: 'https://images.unsplash.com/photo-1610311756586-81e8eb9f3152?q=80&w=400&auto=format&fit=crop' },
  { id: '5', name: '전주 한옥마을', lat: 35.8147, lng: 127.1526, tags: ['한옥', '먹거리'], score: 85, loc: '전북 전주시', photo: 'https://images.unsplash.com/photo-1582236968962-d2f1f58b9cf6?q=80&w=400&auto=format&fit=crop' },
];

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
  const mode = route.params?.source === 'plan' ? 'plan' : 'view';

  const webViewRef = useRef<any>(null);
  const { selectedSpots, addSpot, removeSpot } = useTravelStore();
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [isCourseModalOpen, setCourseModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [detailFilter, setDetailFilter] = useState<FilterState>(EMPTY_FILTER);

  const isSelected = activeSpot ? selectedSpots.some(s => s.id === activeSpot.id) : false;

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

  const handleMyLocation = useCallback(() => {
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

  const baseSpots = useMemo(() => route.params?.spots || DEFAULT_SPOTS, [route.params?.spots]);

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
          window.updateMarkers('${JSON.stringify(filteredSpots)}');
        }
      `);
    }
  }, [filteredSpots]);

  // 마커 탭(setActiveSpot)마다 HTML 문자열이 새로 만들어지면 WebView가 통째로 리로드된다.
  // Fabric(New Arch) 환경에서 WebView 리마운트가 SpotPopup(reanimated) 마운트와 겹치면
  // 네이티브 뷰 트리가 붕괴되며 'Couldn't find a navigation context' 크래시가 난다
  // (TravelPlanScreen 상단 주석의 트리 붕괴 케이스와 동일). route로 주입된 spots가
  // 바뀔 때만 HTML을 재생성해 WebView 리로드를 막는다.
  const HTML = useMemo(() => `
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

      var defaultSpots = [
        { id: '1', name: '광안리 해수욕장', lat: 35.1532, lng: 129.1186, tags: ['바다', '야경'], score: '4.8', loc: '부산 수영구', photo: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8dd?q=80&w=400&auto=format&fit=crop' },
        { id: '2', name: '경복궁', lat: 37.5796, lng: 126.9770, tags: ['역사', '고궁'], score: '4.9', loc: '서울 종로구', photo: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=400&auto=format&fit=crop' },
        { id: '3', name: '제주 사려니숲길', lat: 33.4000, lng: 126.6000, tags: ['숲', '안개'], score: '4.7', loc: '제주 제주시', photo: 'https://images.unsplash.com/photo-1600758208050-a35f99478f68?q=80&w=400&auto=format&fit=crop' },
        { id: '4', name: '남산 서울타워', lat: 37.5512, lng: 126.9882, tags: ['야경', '랜드마크'], score: '4.7', loc: '서울 용산구', photo: 'https://images.unsplash.com/photo-1610311756586-81e8eb9f3152?q=80&w=400&auto=format&fit=crop' },
        { id: '5', name: '전주 한옥마을', lat: 35.8147, lng: 127.1526, tags: ['한옥', '먹거리'], score: '4.6', loc: '전북 전주시', photo: 'https://images.unsplash.com/photo-1582236968962-d2f1f58b9cf6?q=80&w=400&auto=format&fit=crop' },
      ];
      
      var injectedSpots = ${JSON.stringify(route.params?.spots || null).replace(/</g, '\\u003c')};
      var spots = injectedSpots || defaultSpots;

      var bounds = new kakao.maps.LatLngBounds();
      var activeOverlays = [];

      // 경로선 그리기 (route에서 넘어온 spots가 있을 경우에만 선으로 이음)
      if (injectedSpots && spots.length > 0) {
        var linePath = spots.map(function(s) { return new kakao.maps.LatLng(s.lat, s.lng); });
        var polyline = new kakao.maps.Polyline({
          path: linePath,
          strokeWeight: 3,
          strokeColor: '#e31b59',
          strokeOpacity: 0.8,
          strokeStyle: 'solid'
        });
        polyline.setMap(map);
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
          // injectedSpots일 때는 숫자, 아닐 때는 하트 아이콘
          if (injectedSpots) {
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
      }

      // 초기 마커 그리기
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
  `, [route.params?.spots]);

  // source 객체도 HTML 문자열이 바뀔 때만 새로 만들어 WebView가 재로딩되지 않게 한다.
  const mapSource = useMemo(() => ({ html: HTML }), [HTML]);

  if (!KAKAO_KEY) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-[16px] text-black/50">카카오 맵 API 키가 설정되지 않았습니다.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        {/* 상단 오버레이 (검색창 + 뒤로가기) */}
        <View className="absolute top-0 left-0 right-0 z-20 pt-[54px] pointer-events-box-none">
          <View className="flex-row items-center px-4 gap-2 pointer-events-auto">
            {/* 뒤로가기 버튼 */}
            <TouchableOpacity
              onPress={() => {
                const fromTravelPlan = route.params?.from === 'TravelPlan';
                const planId = route.params?.planId;

                if (route.params?.spots || route.params?.from) {
                  navigation.setParams({ spots: undefined, from: undefined, planId: undefined });
                }

                if (fromTravelPlan) {
                  navigation.navigate('TravelTab', {
                    screen: 'TravelPlan',
                    ...(planId ? { params: { planId } } : {}),
                  });
                } else if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('HomeTab');
                }
              }}
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

            {/* 검색바 */}
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
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: '#E31B59',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 8, color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                        {activeFilterCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          <View className="mt-2 pointer-events-auto">
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
                      height: 32,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      backgroundColor: isActive ? '#000000' : '#F5F5F7',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: isActive ? 'Pretendard-Medium' : 'Pretendard-Regular',
                        fontSize: 12,
                        color: isActive ? '#ffffff' : 'rgba(0,0,0,0.55)',
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <WebView
          ref={webViewRef}
          source={mapSource}
          onMessage={handleMessage}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
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

        <SpotPopup
          activeSpot={activeSpot}
          onClose={closeSheet}
          renderButtons={() => (
            <View className="flex-row gap-2 mt-4">
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
                className={`flex-1 h-11 rounded-full items-center justify-center ${isSelected && mode === 'plan' ? 'bg-[#e31b59]' : 'bg-[#f5f5f7]'}`}
              >
                <Text className={`text-[15px] font-medium ${isSelected && mode === 'plan' ? 'text-white' : 'text-black/60'}`}>
                  {mode === 'plan' ? (isSelected ? '현재 코스에 저장됨' : '현재 코스에 저장') : '코스에 저장'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: activeSpot!.id } })}
                className="flex-1 h-11 rounded-full bg-[#E31B59] items-center justify-center"
              >
                <Text className="text-[15px] font-medium text-white">상세 보기 {'>'}</Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Course Select Modal (Dummy) */}
        {isCourseModalOpen && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center z-50">
            <View className="bg-white rounded-2xl w-[80%] p-5 items-center">
              <Text className="text-[18px] font-semibold text-black mb-4">어떤 코스에 저장할까요?</Text>

              <TouchableOpacity
                onPress={() => {
                  setCourseModalOpen(false);
                  navigation.navigate('TravelTab', { screen: 'TravelNew' });
                }}
                className="w-full h-12 bg-[#f5f5f7] rounded-xl items-center justify-center mb-2"
              >
                <Text className="text-[15px] text-black font-medium">+ 새 코스 만들기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCourseModalOpen(false);
                  addSpot(activeSpot!);
                  navigation.navigate('TravelTab', { screen: 'TravelNew' });
                }}
                className="w-full h-12 bg-[#E31B59] rounded-xl items-center justify-center"
              >
                <Text className="text-[15px] text-white font-medium">현재 진행중인 코스</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setCourseModalOpen(false)}
                className="mt-4 p-2"
              >
                <Text className="text-[14px] text-black/50">취소</Text>
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
