import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, PermissionsAndroid, BackHandler, Image, Animated, PanResponder, Dimensions, ScrollView, Easing } from 'react-native';
import { WebView } from 'react-native-webview';
import { IconChevronLeft, IconMapPin, IconStarFilled, IconBookmark, IconFocus2, IconChevronRight } from '@tabler/icons-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomSheet from '@/components/common/BottomSheet';
import { StatusBar } from 'expo-status-bar';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD } from '@/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

type FilterType = 'all' | 'visit' | 'fav';

interface MapSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  loc: string;
  date: string;
  score: number;
  isFav: boolean;
  photo: string;
  tags: string[];
}

const PHOTO_SPOTS: MapSpot[] = [
  { id: 'gwanganri', name: '광안리 해수욕장', lat: 35.1532, lng: 129.1186, loc: '부산 · 수영구', date: '2026.03.28', score: 91, isFav: true, tags: ['야경', '바다'], photo: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8dd?q=80&w=400&auto=format&fit=crop' },
  { id: 'gyeongbokgung', name: '경복궁', lat: 37.5796, lng: 126.9770, loc: '서울 · 종로구', date: '2026.03.08', score: 85, isFav: false, tags: ['고궁', '역사'], photo: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=400&auto=format&fit=crop' },
  { id: 'jeju', name: '사려니숲길', lat: 33.4000, lng: 126.6000, loc: '제주 · 조천읍', date: '2026.04.15', score: 79, isFav: false, tags: ['숲', '안개'], photo: 'https://images.unsplash.com/photo-1600758208050-a35f99478f68?q=80&w=400&auto=format&fit=crop' },
  { id: 'jinhe', name: '진해 경화역', lat: 35.1522, lng: 128.6655, loc: '경남 · 창원시', date: '2026.04.02', score: 88, isFav: true, tags: ['벚꽃', '봄'], photo: 'https://images.unsplash.com/photo-1610311756586-81e8eb9f3152?q=80&w=400&auto=format&fit=crop' },
  { id: 'gamcheon', name: '감천문화마을', lat: 35.0975, lng: 129.0106, loc: '부산 · 사하구', date: '2026.02.14', score: 82, isFav: false, tags: ['마을', '컬러풀'], photo: 'https://images.unsplash.com/photo-1582236968962-d2f1f58b9cf6?q=80&w=400&auto=format&fit=crop' },
];

export default function PhotoMapScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const webViewRef = useRef<any>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeSpot, setActiveSpot] = useState<MapSpot | null>(null);

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

  const filteredSpots = useMemo(() => {
    if (filter === 'visit') return PHOTO_SPOTS.filter(s => !s.isFav);
    if (filter === 'fav') return PHOTO_SPOTS.filter(s => s.isFav);
    return PHOTO_SPOTS;
  }, [filter]);

  const handleMessage = useCallback((event: any) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed.type === 'SPOT_CLICK') {
        setActiveSpot(parsed.data);
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
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      } catch (err) {
        return;
      }
    }
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.kakaoMap && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            window.kakaoMap.setCenter(new kakao.maps.LatLng(position.coords.latitude, position.coords.longitude));
          });
        }
      `);
    }
  }, []);

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
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8e8ed; }
    #map { width: 100%; height: 100%; }
    .map-pin {
      position: absolute;
      transform: translate(-50%, -100%);
      line-height: 0;
      cursor: pointer;
      z-index: 5;
    }
    .map-pin--visit svg path { fill: #1c1c1e; }
    .map-pin--fav svg path { fill: #E31B59; }
    .map-pin--visit { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); }
    .map-pin--fav { filter: drop-shadow(0 2px 6px rgba(227,27,89,0.45)); }
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

        function createPinHtml(isFav) {
          var cls = isFav ? 'map-pin map-pin--fav' : 'map-pin map-pin--visit';
          var svgColor = isFav ? '#E31B59' : '#1c1c1e';
          var size = isFav ? 26 : 24;
          var viewBoxHeight = isFav ? 33 : 30;
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
            content.innerHTML = createPinHtml(spot.isFav);
            
            content.onclick = function(e) {
              e.stopPropagation();
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPOT_CLICK', data: spot }));
            };

            var customOverlay = new kakao.maps.CustomOverlay({
              position: position,
              content: content,
              clickable: true,
              yAnchor: 1,
              zIndex: spot.isFav ? 2 : 1
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

        // 초기 마커 렌더링
        window.updateMarkers(${JSON.stringify(JSON.stringify(filteredSpots))});
      }
      initMap();
    });
  </script>
</body>
</html>
    `;
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#e8e8ed' }}>
      <StatusBar style="dark" />

      {/* 플로팅 네비 바 */}
      <View 
        style={{ 
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
          paddingTop: insets.top,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)'
        }}
      >
        <View style={{ height: normalize(54), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: normalize(20) }}>
          <TouchableOpacity onPress={handleBackNavigation} style={{ width: normalize(36), height: normalize(36), alignItems: 'center', justifyContent: 'center', marginLeft: -normalize(8) }}>
            <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.65)" />
          </TouchableOpacity>
          <Text style={{ fontSize: normalizeFontSize(18), fontWeight: '600', color: '#000', letterSpacing: -0.3 }}>
            PIC MAP
          </Text>
          <View style={{ width: normalize(36) }} />
        </View>

        {/* 필터 칩 */}
        <View style={{ flexDirection: 'row', paddingHorizontal: normalize(16), paddingVertical: normalize(10), gap: normalize(7) }}>
          {(['all', 'visit', 'fav'] as FilterType[]).map((f) => {
            const isActive = filter === f;
            const labels = { all: `전체 ${PHOTO_SPOTS.length}`, visit: `방문 ${PHOTO_SPOTS.filter(s => !s.isFav).length}`, fav: `즐겨찾기 ${PHOTO_SPOTS.filter(s => s.isFav).length}` };
            
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={{
                  height: normalize(30),
                  paddingHorizontal: normalize(14),
                  borderRadius: normalize(15),
                  backgroundColor: isActive ? (f === 'fav' ? '#E31B59' : '#1c1c1e') : 'rgba(0,0,0,0.04)',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: FONT_SM, fontWeight: '500', color: isActive ? '#fff' : 'rgba(0,0,0,0.5)' }}>
                  {labels[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: HTML }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        bounces={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      />

      {/* 지도 컨트롤 */}
      <View style={{ position: 'absolute', right: normalize(14), top: normalize(120), zIndex: 30, gap: normalize(8) }}>
        <View style={{ backgroundColor: '#fff', borderRadius: normalize(12), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3, overflow: 'hidden' }}>
          <TouchableOpacity onPress={handleZoomIn} style={{ width: normalize(40), height: normalize(40), alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: normalizeFontSize(20), color: 'rgba(0,0,0,0.55)' }}>+</Text>
          </TouchableOpacity>
          <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.07)' }} />
          <TouchableOpacity onPress={handleZoomOut} style={{ width: normalize(40), height: normalize(40), alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: normalizeFontSize(20), color: 'rgba(0,0,0,0.55)' }}>−</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleMyLocation} style={{ width: normalize(40), height: normalize(40), backgroundColor: '#fff', borderRadius: normalize(12), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3, alignItems: 'center', justifyContent: 'center' }}>
          <IconFocus2 size={normalize(20)} color="rgba(0,0,0,0.45)" />
        </TouchableOpacity>
      </View>

      {/* 레전드 (범례) */}
      <View style={{ position: 'absolute', left: normalize(14), top: normalize(120), zIndex: 30, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: normalize(10), paddingHorizontal: normalize(12), paddingVertical: normalize(8), gap: normalize(6), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
          <View style={{ width: normalize(10), height: normalize(10), borderRadius: normalize(5), backgroundColor: '#1c1c1e' }} />
          <Text style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.55)' }}>방문</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
          <View style={{ width: normalize(10), height: normalize(10), borderRadius: normalize(5), backgroundColor: '#E31B59' }} />
          <Text style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.55)' }}>즐겨찾기</Text>
        </View>
      </View>

      {/* 스팟 리스트 바텀 시트 */}
      <SpotListSheet spots={filteredSpots} activeSpot={activeSpot} onSpotPress={(spot) => setActiveSpot(spot)} filterName={filter === 'all' ? '전체 스팟' : filter === 'visit' ? '방문한 스팟' : '즐겨찾기 스팟'} />

      {/* 스팟 상세 바텀 시트 */}
      <BottomSheet visible={!!activeSpot} onClose={() => setActiveSpot(null)}>
        {activeSpot && (
          <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(20) }}>
            <View style={{ width: '100%', height: normalize(150), borderRadius: normalize(14), overflow: 'hidden', marginBottom: normalize(14), position: 'relative' }}>
              <Image source={{ uri: activeSpot.photo }} style={{ width: '100%', height: '100%', backgroundColor: '#eee' }} resizeMode="cover" />
              <View style={{ position: 'absolute', bottom: normalize(10), left: normalize(12), flexDirection: 'row', gap: normalize(5) }}>
                {activeSpot.tags.map(tag => (
                  <View key={tag} style={{ height: normalize(20), paddingHorizontal: normalize(8), borderRadius: normalize(10), backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center' }}>
                    <Text style={{ fontSize: normalizeFontSize(10), fontWeight: '500', color: 'rgba(255,255,255,0.9)' }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={{ fontSize: normalizeFontSize(18), fontWeight: '600', color: '#000', letterSpacing: -0.3, marginBottom: normalize(3) }}>
              {activeSpot.name}
            </Text>
            <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', marginBottom: normalize(14), letterSpacing: -0.1 }}>
              {activeSpot.loc}
            </Text>

            <View style={{ flexDirection: 'row', gap: normalize(8), marginBottom: normalize(16) }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: normalize(10), padding: normalize(10) }}>
                <Text style={{ fontSize: normalizeFontSize(10), color: 'rgba(0,0,0,0.35)', marginBottom: normalize(3) }}>최근 방문일</Text>
                <Text style={{ fontSize: FONT_MD, fontWeight: '600', color: '#000' }}>{activeSpot.date}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: normalize(10), padding: normalize(10) }}>
                <Text style={{ fontSize: normalizeFontSize(10), color: 'rgba(0,0,0,0.35)', marginBottom: normalize(3) }}>사진 점수</Text>
                <Text style={{ fontSize: FONT_MD, fontWeight: '600', color: '#E31B59' }}>{activeSpot.score}점</Text>
              </View>
            </View>

            <TouchableOpacity
              style={{
                width: '100%', height: normalize(48), borderRadius: normalize(24), backgroundColor: '#000', alignItems: 'center', justifyContent: 'center'
              }}
              onPress={() => console.log('스팟 상세보기')}
            >
              <Text style={{ fontSize: FONT_MD, fontWeight: '500', color: '#fff' }}>스팟 상세 보기</Text>
            </TouchableOpacity>
          </View>
        )}
      </BottomSheet>
    </View>
  );}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const LIST_PEEK_HEIGHT = normalize(160);
const LIST_EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.7;

function SpotListSheet({ spots, activeSpot, onSpotPress, filterName }: { spots: MapSpot[], activeSpot: MapSpot | null, onSpotPress: (s: MapSpot) => void, filterName: string }) {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandedRef = useRef(isExpanded);
  
  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const peekY = SCREEN_HEIGHT - LIST_PEEK_HEIGHT - Math.max(insets.bottom, normalize(10));
  const expandedY = SCREEN_HEIGHT - LIST_EXPANDED_HEIGHT;

  useEffect(() => {
    if (activeSpot) {
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start();
    } else {
      Animated.spring(translateY, {
        toValue: isExpanded ? expandedY : peekY,
        stiffness: 250, damping: 25, mass: 1, useNativeDriver: true
      }).start();
    }
  }, [activeSpot]); // Removed isExpanded to handle animation in PanResponderRelease directly

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, state) => Math.abs(state.dy) > 5,
      onPanResponderMove: (_, state) => {
        const startY = isExpandedRef.current ? expandedY : peekY;
        let newY = startY + state.dy;
        if (newY < expandedY) newY = expandedY + (newY - expandedY) * 0.3; // rubber band
        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, state) => {
        let nextExpanded = isExpandedRef.current;
        if (state.vy < -0.5 || state.dy < -50) nextExpanded = true;
        else if (state.vy > 0.5 || state.dy > 50) nextExpanded = false;
        
        setIsExpanded(nextExpanded);
        
        Animated.spring(translateY, {
          toValue: nextExpanded ? expandedY : peekY,
          stiffness: 250, damping: 25, mass: 1, useNativeDriver: true
        }).start();
      }
    })
  ).current;

  return (
    <Animated.View
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: LIST_EXPANDED_HEIGHT,
        transform: [{ translateY }], zIndex: 40,
        backgroundColor: '#fff',
        borderTopLeftRadius: normalize(24), borderTopRightRadius: normalize(24),
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10
      }}
    >
      <View {...panResponder.panHandlers} style={{ backgroundColor: 'transparent' }}>
        <View style={{ alignItems: 'center', paddingTop: normalize(12), paddingBottom: normalize(8) }}>
          <View style={{ width: normalize(36), height: normalize(5), borderRadius: normalize(2.5), backgroundColor: 'rgba(0,0,0,0.1)' }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: normalize(20), paddingBottom: normalize(12), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
          <Text style={{ fontSize: normalizeFontSize(18), fontWeight: '600', color: '#000', letterSpacing: -0.3, marginRight: normalize(8) }}>
            {filterName}
          </Text>
          <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)' }}>{spots.length}곳</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: normalize(20) }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, normalize(20)) + normalize(20) }}>
        {spots.map((spot, idx) => (
          <TouchableOpacity
            key={spot.id}
            onPress={() => onSpotPress(spot)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(12), borderBottomWidth: idx < spots.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(0,0,0,0.05)' }}
          >
            <View style={{ width: normalize(52), height: normalize(52), borderRadius: normalize(10), backgroundColor: '#eee', overflow: 'hidden', marginRight: normalize(12) }}>
              <Image source={{ uri: spot.photo }} style={{ width: '100%', height: '100%' }} />
              <View style={{ position: 'absolute', bottom: normalize(4), left: normalize(4) }}>
                {spot.isFav ? (
                  <View style={{ shadowColor: '#E31B59', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 2, elevation: 2 }}>
                    <IconMapPin size={normalize(14)} color="#E31B59" fill="#E31B59" />
                  </View>
                ) : (
                  <View style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 }}>
                    <IconMapPin size={normalize(14)} color="#1c1c1e" fill="#1c1c1e" />
                  </View>
                )}
              </View>
            </View>
            <View style={{ flex: 1, marginRight: normalize(8) }}>
              <Text style={{ fontSize: FONT_MD, fontWeight: '600', color: '#000', letterSpacing: -0.2, marginBottom: normalize(2) }} numberOfLines={1}>{spot.name}</Text>
              <Text style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.38)', letterSpacing: -0.1, marginBottom: normalize(4) }} numberOfLines={1}>{spot.loc}</Text>
              <View style={{ flexDirection: 'row', gap: normalize(5) }}>
                <View style={{ height: normalize(18), paddingHorizontal: normalize(7), borderRadius: normalize(9), backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center' }}>
                  <Text style={{ fontSize: normalizeFontSize(10), fontWeight: '500', color: 'rgba(0,0,0,0.4)' }}>{spot.date}</Text>
                </View>
                <View style={{ height: normalize(18), paddingHorizontal: normalize(7), borderRadius: normalize(9), backgroundColor: 'rgba(227,27,89,0.08)', justifyContent: 'center' }}>
                  <Text style={{ fontSize: normalizeFontSize(10), fontWeight: '600', color: '#E31B59' }}>{spot.score}점</Text>
                </View>
                {spot.isFav && (
                  <View style={{ height: normalize(18), paddingHorizontal: normalize(7), borderRadius: normalize(9), backgroundColor: 'rgba(227,27,89,0.08)', justifyContent: 'center' }}>
                    <Text style={{ fontSize: normalizeFontSize(10), fontWeight: '500', color: '#E31B59' }}>즐겨찾기</Text>
                  </View>
                )}
              </View>
            </View>
            <IconChevronRight size={normalize(18)} color="rgba(0,0,0,0.18)" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
