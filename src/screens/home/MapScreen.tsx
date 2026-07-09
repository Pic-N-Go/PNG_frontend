import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTravelStore, Spot } from '@/store/useTravelStore';
import SpotPopup from '@/components/travel/SpotPopup';
import { StatusBar } from 'expo-status-bar';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode = route.params?.source === 'plan' ? 'plan' : 'view';

  const { selectedSpots, addSpot, removeSpot } = useTravelStore();
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [isCourseModalOpen, setCourseModalOpen] = useState(false);

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
        { id: '3', name: '제주 애월 해안도로', lat: 33.4632, lng: 126.3195, tags: ['드라이브', '바다'], score: '4.7', loc: '제주 제주시', photo: 'https://images.unsplash.com/photo-1600758208050-a35f99478f68?q=80&w=400&auto=format&fit=crop' },
        { id: '4', name: '남산 서울타워', lat: 37.5512, lng: 126.9882, tags: ['야경', '랜드마크'], score: '4.7', loc: '서울 용산구', photo: 'https://images.unsplash.com/photo-1610311756586-81e8eb9f3152?q=80&w=400&auto=format&fit=crop' },
        { id: '5', name: '전주 한옥마을', lat: 35.8147, lng: 127.1526, tags: ['한옥', '먹거리'], score: '4.6', loc: '전북 전주시', photo: 'https://images.unsplash.com/photo-1582236968962-d2f1f58b9cf6?q=80&w=400&auto=format&fit=crop' },
      ];
      
      var injectedSpots = ${JSON.stringify(route.params?.spots || null).replace(/</g, '\\u003c')};
      var spots = injectedSpots || defaultSpots;

      var bounds = new kakao.maps.LatLngBounds();

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

      spots.forEach(function(spot, index) {
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
        bounds.extend(markerPosition);
      });

      map.setBounds(bounds);

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
        {/* 투명 헤더 */}
        <View className="absolute top-0 left-0 right-0 z-20 pt-[54px] px-4 pointer-events-box-none">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => {
                // 파라미터를 지우기 전에 분기 판단에 필요한 값을 먼저 캡처한다.
                const fromTravelPlan = route.params?.from === 'TravelPlan';
                const planId = route.params?.planId;

                // 지도에 주입된 코스 마커/출처 정보를 초기화해, 다음에 지도 탭을 다시
                // 열었을 때 이전 코스가 남아있지 않도록 한다.
                if (route.params?.spots || route.params?.from) {
                  navigation.setParams({ spots: undefined, from: undefined, planId: undefined });
                }

                if (fromTravelPlan) {
                  // 코스 상세보기에서 넘어온 경우: 지도 탭은 단일 스크린 스택이라
                  // goBack()이 탭 네비게이터로 버블링돼 홈으로 가버린다.
                  // 명시적으로 출사 탭의 코스 상세보기로 복귀한다.
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
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <IconChevronLeft size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <WebView
          source={mapSource}
          onMessage={handleMessage}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

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
      </View>
    );
}
