import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { IconChevronLeft, IconMapPin, IconX, IconStarFilled, IconBookmark } from '@tabler/icons-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTravelStore, Spot } from '@/store/useTravelStore';
import { StatusBar } from 'expo-status-bar';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

// 시트 애니메이션 기준값
const PHOTO_H = 190;      // 사진 영역 높이 (h-[190px])
const TAGS_H = 40;        // 태그 줄 높이
const CLOSE_OUT = 520;    // 시트를 화면 아래로 완전히 밀어내는 translateY
// "쫀득한" 스프링 — 살짝 오버슈트되며 안착
const SPRING = { damping: 18, stiffness: 200, mass: 0.85 };

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode = route.params?.source === 'plan' ? 'plan' : 'view';

  const { selectedSpots, addSpot, removeSpot } = useTravelStore();
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [isCourseModalOpen, setCourseModalOpen] = useState(false);

  const isSelected = activeSpot ? selectedSpots.some(s => s.id === activeSpot.id) : false;

  // expand: 1 = 사진 펼침(확장 상태), 0 = 사진 접힘(요약 상태)
  // closeY: 시트 전체 세로 오프셋 (진입 슬라이드 · 닫기 · 드래그 피드백)
  const expand = useSharedValue(1);
  const closeY = useSharedValue(CLOSE_OUT);
  const startExpand = useSharedValue(1); // 제스처 시작 시점의 expand 스냅샷

  const handleClose = () => setActiveSpot(null);

  // 스팟이 새로 열릴 때: 확장 상태로 초기화하고 아래에서 위로 슬라이드-인
  useEffect(() => {
    if (activeSpot) {
      expand.value = withSpring(1, { damping: 22, stiffness: 240 });
      if (closeY.value > 100) {
        closeY.value = CLOSE_OUT;
      }
      closeY.value = withSpring(0, { damping: 22, stiffness: 240, mass: 0.9 });
    }
  }, [activeSpot]);

  // 아래로 밀어낸 뒤 언마운트 (X 버튼 · 지도 빈 곳 탭 공용)
  const closeSheet = () => {
    closeY.value = withTiming(CLOSE_OUT, { duration: 240, easing: Easing.in(Easing.cubic) }, (finished) => {
      'worklet';
      if (finished) runOnJS(handleClose)();
    });
  };

  // ── 제스처: 세로 드래그로 사진 접기/펼치기, 요약 상태에서 아래로 끌면 닫힘 ──
  // activeOffsetY 로 12px 이상 세로 이동에만 반응 → 내부 버튼 탭은 그대로 살아난다.
  const pan = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .failOffsetX([-24, 24])
    .onStart(() => {
      startExpand.value = expand.value;
    })
    .onUpdate((e) => {
      const dy = e.translationY;
      if (startExpand.value > 0.5) {
        // 확장 상태에서 시작
        if (dy > 0) {
          // 아래로 드래그 → 사진이 손끝을 따라 접힌다
          expand.value = Math.min(1, Math.max(0, 1 - dy / PHOTO_H));
          closeY.value = 0;
        } else {
          // 이미 최대 확장 → 위로는 이동 막음
          closeY.value = 0;
        }
      } else {
        // 요약 상태에서 시작
        if (dy < 0) {
          // 위로 드래그 → 사진이 다시 펼쳐진다
          expand.value = Math.min(1, Math.max(0, -dy / PHOTO_H));
          closeY.value = 0;
        } else {
          // 아래로 드래그 → 시트를 끌어내려 닫기 준비
          closeY.value = dy;
        }
      }
    })
    .onEnd((e) => {
      const dy = e.translationY;
      const vy = e.velocityY;
      if (startExpand.value > 0.5) {
        if (dy > 20 || vy > 200) {
          // 살짝만 내려도 요약 상태로 확정
          expand.value = withSpring(0, SPRING);
        } else {
          // 원래대로
          expand.value = withSpring(1, SPRING);
        }
        closeY.value = withSpring(0, SPRING);
      } else {
        if (dy < -20 || vy < -200) {
          // 살짝만 올려도 확장 상태로 확정
          expand.value = withSpring(1, SPRING);
          closeY.value = withSpring(0, SPRING);
        } else if (dy > 0) {
          // 요약 상태에서 아래로 → 임계 넘으면 닫기, 아니면 되돌림
          if (closeY.value > 50 || vy > 500) {
            closeY.value = withTiming(CLOSE_OUT, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
              if (finished) runOnJS(handleClose)();
            });
          } else {
            closeY.value = withSpring(0, SPRING);
          }
        } else {
          closeY.value = withSpring(0, SPRING);
        }
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: closeY.value }],
  }));
  const photoStyle = useAnimatedStyle(() => {
    const e = Math.min(1, Math.max(0, expand.value));
    return { height: e * PHOTO_H, opacity: e };
  });
  const tagsStyle = useAnimatedStyle(() => {
    const e = Math.min(1, Math.max(0, expand.value));
    return { height: e * TAGS_H, opacity: e };
  });

  const handleMessage = (event: any) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed.type === 'SPOT_CLICK') {
        // 같은 스팟을 다시 탭하면 참조를 유지해 불필요한 재-진입 애니메이션을 막는다.
        setActiveSpot(prev => (prev?.id === parsed.data.id ? prev : parsed.data));
      } else if (parsed.type === 'MAP_CLICK') {
        closeSheet();
      }
    } catch (e) {
      console.log('WebView Message Parse Error:', e);
    }
  };

  const HTML = `
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
      
      var injectedSpots = ${JSON.stringify(route.params?.spots || null)};
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
  `;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="flex-1 bg-white">
        <StatusBar style="dark" />
        {/* 투명 헤더 */}
        <View className="absolute top-0 left-0 right-0 z-20 pt-[54px] px-4 pointer-events-box-none">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => {
                if (route.params?.spots) {
                  navigation.setParams({ spots: undefined, from: undefined });
                }
                if (route.params?.from === 'TravelPlan') {
                  navigation.navigate('TravelTab', { screen: 'TravelPlan' });
                } else {
                  navigation.goBack();
                }
              }}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <IconChevronLeft size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <WebView
          source={{ html: HTML }}
          onMessage={handleMessage}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />

        {/* Spot Popup */}
        {activeSpot && (
          <Animated.View
            style={sheetStyle}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-lg z-30"
          >
            <GestureDetector gesture={pan}>
              <View className="w-full relative rounded-t-[24px] overflow-hidden bg-white">
                {/* Handle Bar floating over the image */}
                <View
                  className="absolute top-2.5 left-1/2 -ml-[20px] w-10 h-1.5 bg-white/95 rounded-full z-40"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 3 }}
                />

                <Animated.View style={[{ overflow: 'hidden' }, photoStyle]}>
                  <View className="h-[190px] w-full relative bg-gray-200">
                    {activeSpot.photo ? (
                      <View className="flex-row w-full h-full gap-[2px] bg-white">
                        <Image source={{ uri: activeSpot.photo }} className="flex-1 h-full bg-gray-200" resizeMode="cover" />
                        <Image source={{ uri: activeSpot.photo }} className="flex-1 h-full bg-gray-200" resizeMode="cover" />
                        <Image source={{ uri: activeSpot.photo }} className="flex-1 h-full bg-gray-200" resizeMode="cover" />
                      </View>
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <IconHeart size={40} color="#ccc" />
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={closeSheet}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 items-center justify-center z-10"
                    >
                      <IconX size={18} color="#fff" />
                    </TouchableOpacity>

                    <View className="absolute top-3 left-3 h-7 px-3 rounded-full bg-[#E31B59] items-center justify-center z-10 shadow-sm shadow-[#E31B59]/30">
                      <Text className="text-[13px] font-bold text-white">92점</Text>
                    </View>
                  </View>
                </Animated.View>

                <View className="px-4 pt-5 pb-6">
                  {/* TOP SECTION: Always visible */}
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-[20px] font-bold text-black">{activeSpot.name}</Text>

                      <View className="flex-row items-center mt-1.5">
                        <View className="flex-row mr-1.5">
                          <IconStarFilled size={14} color="#FBBF24" />
                          <IconStarFilled size={14} color="#FBBF24" />
                          <IconStarFilled size={14} color="#FBBF24" />
                          <IconStarFilled size={14} color="#FBBF24" />
                          <IconStarFilled size={14} color="#FBBF24" />
                        </View>
                        <Text className="text-[13px] text-black/40">{activeSpot.score} · 리뷰 324건</Text>
                      </View>

                      <View className="flex-row items-center mt-2.5 mb-1">
                        <IconMapPin size={14} color="rgba(0,0,0,0.4)" />
                        <Text className="text-[13px] text-black/50 ml-1">{activeSpot.loc}</Text>
                      </View>
                    </View>

                        <TouchableOpacity className="p-1">
                          <IconBookmark size={26} color="#ccc" />
                        </TouchableOpacity>
                  </View>

                  <Animated.View style={[{ overflow: 'hidden' }, tagsStyle]}>
                    <View className="flex-row flex-wrap gap-1.5 mt-3 mb-1">
                      {(activeSpot.tags || []).map(tag => (
                        <View key={tag} className="px-2.5 py-1 bg-[#f5f5f7] rounded-full">
                          <Text className="text-[12px] text-black/50">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>

                  {/* BOTTOM SECTION: Buttons */}
                  <View className="flex-row gap-2 mt-4">
                    <TouchableOpacity
                      onPress={() => {
                        if (mode === 'plan') {
                          isSelected ? removeSpot(activeSpot.id) : addSpot(activeSpot);
                        } else {
                          setCourseModalOpen(true);
                        }
                      }}
                      className={`flex-1 h-11 rounded-full items-center justify-center ${isSelected && mode === 'plan' ? 'bg-black' : 'bg-[#f5f5f7]'}`}
                    >
                      <Text className={`text-[15px] font-medium ${isSelected && mode === 'plan' ? 'text-white' : 'text-black/60'}`}>
                        {mode === 'plan' ? (isSelected ? '현재 코스에 저장됨' : '현재 코스에 저장') : '코스에 저장'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: activeSpot.id } })}
                      className="flex-1 h-11 rounded-full bg-[#E31B59] items-center justify-center"
                    >
                      <Text className="text-[15px] font-medium text-white">상세 보기 {'>'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </GestureDetector>
          </Animated.View>
        )}

        {/* Course Select Modal (Dummy) */}
        {isCourseModalOpen && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center z-50">
            <View className="bg-white rounded-2xl w-[80%] p-5 items-center">
              <Text className="text-[18px] font-bold text-black mb-4">어떤 코스에 저장할까요?</Text>

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
    </GestureHandlerRootView>
  );
}
