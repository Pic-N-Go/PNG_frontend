import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, PermissionsAndroid, BackHandler, Image, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { IconChevronLeft, IconSearch, IconAdjustmentsHorizontal, IconFocus2, IconX, IconChevronDown, IconChevronUp, IconRoute } from '@tabler/icons-react-native';
import { useNavigation, useRoute, useFocusEffect, CommonActions } from '@react-navigation/native';
import { useCourseStore, Spot } from '@/store/useCourseStore';
import { useSpots, useMapSpots, useSearchSpots } from '@/hooks/useSpot';
import { useDebounce } from '@/hooks/useDebounce';
import SpotPopup from '@/components/travel/SpotPopup';
import BottomSheet from '@/components/common/BottomSheet';
import FilterBottomSheet, { FilterState, EMPTY_FILTER } from '@/components/home/FilterBottomSheet';
import SearchModal from '@/components/common/SearchModal';
import SaveToPlanSheet from '@/components/spot/SaveToPlanSheet';
import Toast from '@/components/common/Toast';
import { StatusBar } from 'expo-status-bar';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { getCourseStats } from '@/utils/distance';
import { parseValidCoordinate } from '@/utils/geo';
import { getDayColor, DAY_COLOR_PALETTE } from '@/constants/dayColors';
import { FONT_SM, FONT_MD, BUTTON_HEIGHT, BUTTON_RADIUS, HEADER_HEIGHT } from '@/constants/layout';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

const CATEGORY_MAP: Record<string, string> = {
  '야경': 'NIGHT_VIEW',
  '바다': 'BEACH',
  '한옥': 'HANOK',
  '꽃': 'FLOWER',
  '카페': 'CAFE',
  '숲': 'FOREST',
  '축제': 'FESTIVAL',
  '공원': 'PARK',
  '산': 'MOUNTAIN',
  '유적지': 'HERITAGE',
  '도시': 'CITY',
  '일출일몰': 'SUNRISE_SUNSET',
  '은하수': 'MILKY_WAY',
  '기타': 'ETC',
};

// Day 드롭다운의 "전체" 항목. 실제 Day 키("1", "2"…)와 겹치지 않는 값이면 된다.
const ALL_DAYS = 'all';

// 지도에 넘길 스팟에 Day 색과 Day별 순번을 실어준다.
// 번호는 Day별로 1부터 다시 매긴다 — 전체 보기에서 같은 번호가 여러 개 보이지만 색으로 구분된다.
// 좌표가 깨진 스팟은 여기서 걸러낸다. 하나만 섞여도 bounds가 오염돼 전체 보기의 카메라가
// 엉뚱한 곳으로 날아가고 폴리라인도 끊긴다. (번호는 걸러낸 뒤 매겨 1,2,3이 이어지게 둔다)
const withDayMeta = (spots: any[], day: string) =>
  spots
    .filter((s) => parseValidCoordinate(s.lat, s.lng) !== null)
    .map((s, i) => ({ ...s, __day: day, __dayColor: getDayColor(day).text, __label: i + 1 }));

type MapBounds = {
  southWestLat: number;
  southWestLng: number;
  northEastLat: number;
  northEastLng: number;
};

// 지도가 첫 bounds를 알려주기 전까지 쓰는 기본값 (대한민국 전체 영역)
const DEFAULT_BOUNDS: MapBounds = {
  southWestLat: 33.0,
  southWestLng: 124.0,
  northEastLat: 38.8,
  northEastLng: 132.0,
};

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: '야경', label: '야경' },
  { id: '바다', label: '바다' },
  { id: '한옥', label: '한옥' },
  { id: '꽃', label: '꽃' },
  { id: '카페', label: '카페' },
  { id: '숲', label: '숲' },
  { id: '축제', label: '축제' },
  { id: '공원', label: '공원' },
  { id: '산', label: '산' },
  { id: '유적지', label: '유적지' },
  { id: '도시', label: '도시' },
  { id: '일출일몰', label: '일출/일몰' },
  { id: '은하수', label: '은하수' },
];

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode = route.params?.source === 'plan' ? 'plan' 
             : route.params?.source === 'plan-view' ? 'plan-view'
             : route.params?.source === 'wishlist-change' ? 'wishlist-change'
             : 'view';

  const webViewRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const { selectedSpots, addSpot, removeSpot } = useCourseStore();
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [isCourseModalOpen, setCourseModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const [detailFilter, setDetailFilter] = useState<FilterState>(EMPTY_FILTER);
  const [currentPlanDay, setCurrentPlanDay] = useState<string>(route.params?.initialDay || '1');
  const [dayMenuOpen, setDayMenuOpen] = useState(false);
  const planDays = useMemo(() => Object.keys(route.params?.planData || {}), [route.params?.planData]);
  // 지도가 idle될 때마다 WebView가 알려주는 현재 화면 영역
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const debouncedKeyword = useDebounce(searchQuery, 500);
  const debouncedMapBounds = useDebounce(mapBounds, 500);

  const apiCategory = CATEGORY_MAP[selectedCategory] || (selectedCategory !== 'all' ? selectedCategory : undefined);
  const hasKeyword = debouncedKeyword.trim().length > 0;
  // 코스 보기/스팟 목록을 파라미터로 받은 경우엔 API 조회가 필요 없다.
  const usesRouteSpots = mode === 'plan-view' || Array.isArray(route.params?.spots);

  // 1. 지도 영역 핀 목록 (GET /spots/map) — 지도 드래그/확대 축소가 멈춘 뒤 500ms 후에 API 호출
  const { data: mapSpotsData, error: mapError } = useMapSpots(
    { ...(debouncedMapBounds ?? DEFAULT_BOUNDS), category: apiCategory, size: 200 },
    { enabled: !usesRouteSpots && !hasKeyword },
  );

  // 2. 키워드 검색 목록 (GET /spots/search) — 키워드가 있을 때만 실행된다.
  const { data: searchSpotsData, error: searchError } = useSearchSpots(
    { keyword: debouncedKeyword, category: apiCategory, size: 50 },
    { enabled: !usesRouteSpots },
  );

  // 3. 백업 스팟 목록 (GET /spots) — 지도 조회가 실패했을 때만 받아온다.
  // 결과가 비어있는 건 "그 영역에 스팟이 없다"는 정상 응답이므로 전국 목록으로 대체하지 않는다.
  const needsFallback = !usesRouteSpots && !hasKeyword && !!mapError;
  const { data: spotsPageData, error: spotsError } = useSpots(
    { category: apiCategory, size: 50 },
    { enabled: needsFallback },
  );

  useEffect(() => {
    if (mapError) console.error('[MapScreen] mapSpots API error:', mapError);
    if (searchError) console.error('[MapScreen] searchSpots API error:', searchError);
    if (spotsError) console.error('[MapScreen] spotsPage API error:', spotsError);
  }, [mapError, searchError, spotsError]);

  const apiSpots = useMemo(() => {
    let rawList: any[] = [];
    if (hasKeyword) {
      rawList = searchSpotsData?.content || [];
    } else if (mapSpotsData && Array.isArray(mapSpotsData) && mapSpotsData.length > 0) {
      rawList = mapSpotsData;
    } else if (needsFallback && spotsPageData?.content && Array.isArray(spotsPageData.content)) {
      // 비활성 쿼리도 캐시가 남아 있으면 data를 돌려주므로, 폴백 조건일 때만 사용한다.
      // (그렇지 않으면 "이 영역에 스팟 없음"인 정상 응답을 이전 전국 목록이 덮어쓴다)
      rawList = spotsPageData.content;
    }

    return rawList.map((spot: any) => {
      const tags = Array.isArray(spot.categories) && spot.categories.length > 0
        ? spot.categories
        : (spot.category ? [spot.category] : []);

      return {
        id: String(spot.id),
        name: spot.name,
        lat: spot.latitude,
        lng: spot.longitude,
        tags,
        score: spot.photogenicScore ?? 0,
        loc: spot.address ?? '',
        photo: spot.thumbnailUrl || spot.imageUrl || '',
        badge: spot.badge ?? false,
      };
    });
  }, [hasKeyword, needsFallback, mapSpotsData, searchSpotsData, spotsPageData]);

  // 현재 코스(선택 목록)에 담긴 스팟인지 판단 — id 타입 불일치(number/string) 방지
  const isSpotSaved = useCallback(
    (spotId: string) => selectedSpots.some((s) => String(s.id) === String(spotId)),
    [selectedSpots]
  );




  useEffect(() => {
    if (route.params?.initialDay) {
      setCurrentPlanDay(route.params.initialDay);
    }
  }, [route.params?.initialDay]);

  const handleBackNavigation = useCallback(() => {
    if (searchQuery || activeSpot) {
      setSearchQuery('');
      setActiveSpot(null);
      return true;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('HomeTab');
    }
    return true; // prevent default behavior
  }, [searchQuery, activeSpot, navigation]);

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
      } else if (parsed.type === 'MAP_READY') {
        setMapReady(true);
      } else if (parsed.type === 'BOUNDS_CHANGED') {
        const next = parsed.data as MapBounds;
        // 같은 영역이면 쿼리 키가 흔들리지 않도록 갱신을 건너뛴다.
        setMapBounds((prev) =>
          prev &&
          prev.southWestLat === next.southWestLat &&
          prev.southWestLng === next.southWestLng &&
          prev.northEastLat === next.northEastLat &&
          prev.northEastLng === next.northEastLng
            ? prev
            : next,
        );
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
      const planData = route.params.planData;
      if (currentPlanDay === ALL_DAYS) {
        return planDays.flatMap((day) => withDayMeta(planData[day]?.spots || [], day));
      }
      return withDayMeta(planData[currentPlanDay]?.spots || [], currentPlanDay);
    }
    return route.params?.spots || apiSpots;
  }, [mode, route.params?.spots, route.params?.planData, currentPlanDay, planDays, apiSpots]);

  // 하단 요약 카드 값 — 계획 화면 통계와 같은 계산(getCourseStats)을 재사용한다.
  // 값이 없는 항목은 " · " 구분자까지 같이 뺀다.
  const planSummary = useMemo(() => {
    const isAll = currentPlanDay === ALL_DAYS;
    const title = isAll ? '전체 경로' : `DAY ${currentPlanDay} 경로`;
    if (baseSpots.length === 0) return { isEmpty: true, title, meta: '등록된 스팟이 없어요' };

    // 전체는 Day를 이어붙이지 않고 Day별 거리·시간을 각각 더한다(마지막 스팟 → 다음 날 첫 스팟은 이동이 아니다).
    // 지도에 그리는 것과 같은 집합(withDayMeta로 좌표 검증을 통과한 스팟)으로 계산해야
    // 같은 Day를 전체에서 볼 때와 따로 볼 때 거리가 달라지지 않는다.
    const perDay = isAll
      ? planDays.map((day) => getCourseStats(withDayMeta(route.params?.planData?.[day]?.spots || [], day)))
      : [getCourseStats(baseSpots)];
    const distanceKm = Math.round(perDay.reduce((sum, s) => sum + s.distanceKm, 0));

    const parts = [`스팟 ${baseSpots.length}곳`];
    if (distanceKm > 0) parts.push(`${distanceKm}km`);
    if (isAll) {
      parts.push(`${planDays.length}일`);
    } else if (perDay[0].durationText !== '0분') {
      parts.push(perDay[0].durationText);
    }
    return { isEmpty: false, title, meta: parts.join(' · ') };
  }, [baseSpots, currentPlanDay, planDays, route.params?.planData]);

  const filteredSpots = useMemo(() => {
    // 코스 보기에는 필터 UI 자체가 없다. 게다가 코스 스팟에는 tags 필드가 없어서
    // 필터가 조금이라도 걸리면 spot.tags.some에서 터진다.
    if (mode === 'plan-view') return baseSpots;
    return baseSpots.filter((spot: any) => {
      // 1. 카테고리 필터링
      if (selectedCategory !== 'all' && selectedCategory !== '전체') {
        const targetEnum = CATEGORY_MAP[selectedCategory] || selectedCategory;
        const matchesCategory = spot.tags.some(
          (t: string) => t === targetEnum || t === selectedCategory || (typeof t === 'string' && t.includes(selectedCategory))
        );
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
  }, [baseSpots, selectedCategory, detailFilter, mode]);

  // filteredSpots가 변경될 때마다 WebView에 메시지를 보내 마커 갱신
  // 단, 팝업이 열린 상태(activeSpot !== null)에서는 마커 재그리기 생략
  // → 마커 재그리기 시 발생하는 map click 이벤트가 팝업을 닫는 부작용 방지
  // 코스 보기에서 Day를 바꾸면 그 Day 경로가 화면에 들어와야 한다.
  // drawMarkers는 fitBounds가 true일 때만 카메라를 옮기므로, Day 전환 직후 한 번만 켠다.
  const fitOnNextUpdateRef = useRef(false);
  useEffect(() => {
    if (mode === 'plan-view') fitOnNextUpdateRef.current = true;
  }, [currentPlanDay, mode]);

  useEffect(() => {
    // 이 갱신을 건너뛰더라도 플래그는 소비한다. 남겨두면 나중의 무관한 마커 갱신이 카메라를 옮긴다.
    const shouldFit = hasKeyword || fitOnNextUpdateRef.current;
    fitOnNextUpdateRef.current = false;
    if (webViewRef.current && mapReady && !activeSpot) {
      // 검색 결과이거나 Day를 전환한 직후에만 카메라를 옮긴다.
      // (지도 이동으로 받아온 핀까지 따라가면 사용자가 보던 영역이 계속 튄다)
      webViewRef.current.injectJavaScript(`
        if (window.updateMarkers) {
          window.updateMarkers(${JSON.stringify(filteredSpots)}, ${shouldFit});
        }
        true;
      `);
    }
  }, [filteredSpots, mapReady, activeSpot, hasKeyword]);

  const HTML = useMemo(() => {
    // 첫 페인트도 Day 색으로 그리게 초기 스팟에도 메타를 실어둔다(이후는 updateMarkers가 담당).
    const initialDay = route.params?.initialDay || '1';
    const initialSpots = (mode === 'plan-view' && route.params?.planData)
      ? withDayMeta(route.params.planData[initialDay]?.spots || [], initialDay)
      : (route.params?.spots || []);
    const isCourseView = mode === 'plan-view' || !!route.params?.spots;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <!-- baseUrl을 https로 주면 카카오 SDK가 내부 라이브러리를 https로 받는다(iOS ATS 통과).
       단 Referer가 붙으면 미등록 도메인이라 401이 되므로 no-referrer로 억제한다. -->
  <meta name="referrer" content="no-referrer">
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=clusterer&autoload=false"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8e8ed; }
    #map { width: 100%; height: 100%; -webkit-transform: translateZ(0); transform: translateZ(0); will-change: transform; }
    .marker-touch-wrap {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transform: translateZ(0);
    }
    .custom-marker {
      width: 24px; height: 24px; border-radius: 50%; background: #E31B59;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 6px rgba(227, 27, 89, 0.35); border: 2px solid white;
    }
    .custom-marker svg { width: 12px; height: 12px; fill: white; pointer-events: none; }
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
            center: new kakao.maps.LatLng(33.4996, 126.5312),
            level: 10
        };
        var map = new kakao.maps.Map(mapContainer, mapOption);
        window.kakaoMap = map;

        var clusterer = new kakao.maps.MarkerClusterer({
            map: map,
            averageCenter: true,
            minLevel: 5,
            gridSize: 50,
            styles: [{
                width: '34px', height: '34px',
                background: '#E31B59',
                borderRadius: '17px',
                color: '#FFFFFF',
                textAlign: 'center',
                lineHeight: '34px',
                fontWeight: '700',
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(227, 27, 89, 0.4)',
                border: '2px solid #FFFFFF'
            }]
        });

      // 마커(오버레이) 탭 시 kakao가 지도 'click'도 함께 발생시켜 '열자마자 닫힘'이 생긴다.
      // 이전에는 MAP_CLICK을 80ms 지연시키고 마커 탭이 오면 취소했는데, 지도 click이 마커 click
      // '뒤에' 오면 취소 후 다시 예약되어 팝업이 닫혔다. 취소가 아니라 '억제'로 바꿔 순서에 무관하게 만든다.
      // (touchstart는 항상 click보다 먼저 오므로 마커 탭 시각을 기록해두면 판별이 가능하다)
      var MARKER_TAP_GUARD_MS = 400;
      var lastMarkerTapAt = 0;
      function markMarkerTapped() {
        lastMarkerTapAt = Date.now();
      }
      function closePopupFromMapClick() {
        if (Date.now() - lastMarkerTapAt < MARKER_TAP_GUARD_MS) return; // 마커 탭에 딸려온 지도 클릭
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
      }

      var spots = ${JSON.stringify(initialSpots).replace(/</g, '\\u003c')};
      var isCourseView = ${isCourseView};

      var activeOverlays = [];
      var activePolylines = [];
      var initialBoundsSet = false;  // 최초 1회만 bounds 맞춤, 이후 updateMarkers 호출 시 지도 이동 방지

      // Day별로 나눠 각자의 색으로 그린다. 단일 Day를 보고 있으면 그룹이 하나뿐이라 결과가 같다.
      function drawPolyline(targetSpots) {
        activePolylines.forEach(function(p) { p.setMap(null); });
        activePolylines = [];
        if (!isCourseView || !targetSpots || targetSpots.length === 0) return;

        var groups = {};
        var order = [];
        targetSpots.forEach(function(s) {
          var key = s.__day || 'single';
          if (!groups[key]) { groups[key] = []; order.push(key); }
          groups[key].push(s);
        });

        order.forEach(function(key) {
          var group = groups[key];
          if (group.length < 2) return;
          var line = new kakao.maps.Polyline({
            path: group.map(function(s) { return new kakao.maps.LatLng(s.lat, s.lng); }),
            strokeWeight: 3,
            strokeColor: group[0].__dayColor || '#e31b59',
            strokeOpacity: 0.8,
            strokeStyle: 'solid'
          });
          line.setMap(map);
          activePolylines.push(line);
        });
      }

      function drawMarkers(targetSpots, fitBounds) {
        // 기존 오버레이 및 클러스터 제거
        activeOverlays.forEach(function(o) { o.setMap(null); });
        activeOverlays = [];
        if (clusterer) {
          clusterer.clear();
        }

        var markerBounds = new kakao.maps.LatLngBounds();
        var clusterMarkers = [];

        targetSpots.forEach(function(spot, index) {
          var markerPosition = new kakao.maps.LatLng(spot.lat, spot.lng);

          var wrap = document.createElement('div');
          wrap.className = 'marker-touch-wrap';

          var content = document.createElement('div');
          content.className = 'custom-marker';
          // isCourseView일 때는 숫자, 아닐 때는 하트 아이콘
          if (isCourseView) {
            // 전체 보기에서는 Day마다 색이 다르고 번호는 Day별로 1부터 다시 매겨진다.
            if (spot.__dayColor) {
              content.style.background = spot.__dayColor;
              content.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
            }
            content.innerHTML = '<span style="color:white; font-size:12px; font-weight:bold;">' + (spot.__label || (index + 1)) + '</span>';
          } else {
            content.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
          }
          wrap.appendChild(content);

          wrap.onclick = function(e) {
              e.stopPropagation();
              markMarkerTapped();
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPOT_CLICK', data: spot }));
          };
          wrap.addEventListener('touchstart', function(e) { e.stopPropagation(); markMarkerTapped(); }, { passive: true });

          var customOverlay = new kakao.maps.CustomOverlay({
              position: markerPosition,
              content: wrap,
              xAnchor: 0.5,
              yAnchor: 0.5
          });

          // 코스 보기는 핀이 많아야 열 몇 개인데, 묶이면 이 화면의 핵심인 번호와 Day 색이
          // 클러스터 배지(단색) 뒤로 사라진다. 여러 Day가 한 클러스터에 들어가면 색을 정할 수도 없다.
          if (isCourseView) {
            customOverlay.setMap(map);
          } else {
            clusterMarkers.push(customOverlay);
          }
          activeOverlays.push(customOverlay);
          markerBounds.extend(markerPosition);
        });

        if (clusterer && clusterMarkers.length > 0) {
          clusterer.addMarkers(clusterMarkers);
        }

        // 최초 1회, 그리고 검색 결과를 그릴 때만 지도 범위를 맞춘다.
        // (그 외에는 setBounds를 생략해야 사용자가 보던 영역이 유지된다)
        if ((fitBounds || !initialBoundsSet) && targetSpots.length > 0) {
          if (isCourseView) {
            // 코스 보기에만 적용한다. 일반 지도/키워드 검색까지 걸면 스팟 한 곳을 검색해도
            // 축척 500m로 튕겨나가 기존 동작이 깨진다.
            // 지도 위 오버레이(상단 헤더·Day 드롭다운, 하단 요약 카드)는 RN 뷰라 지도가 존재를 모른다.
            // 패딩이 없으면 가장자리 핀이 그 뒤로 들어간다.
            map.setBounds(markerBounds, 140, 40, 160, 40);
            // 스팟끼리 가까우면 setBounds가 골목 단위까지 확대해버린다(스팟 2곳 3km짜리 Day 등).
            // 레벨은 작을수록 확대 — 6(축척 500m)보다 더 파고들지 않게 자른다.
            if (map.getLevel() < 6) map.setLevel(6);
          } else {
            map.setBounds(markerBounds);
          }
          initialBoundsSet = true;
        }

        drawPolyline(targetSpots);
      }

      // 초기 마커 정렬 및 그리기
      drawMarkers(spots);

      // 외부(React Native)에서 호출 가능한 마커 갱신 함수 노출
      window.updateMarkers = function(spotsJson, fitBounds) {
        try {
          var parsed = typeof spotsJson === 'string' ? JSON.parse(spotsJson) : spotsJson;
          drawMarkers(parsed, fitBounds);
        } catch (e) {
          console.error("updateMarkers Error: ", e);
        }
      };

      // 현재 화면 영역을 React Native에 전달 → /spots/map 재조회 트리거
      function postBounds() {
        var b = map.getBounds();
        var sw = b.getSouthWest();
        var ne = b.getNorthEast();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'BOUNDS_CHANGED',
          data: {
            southWestLat: sw.getLat(),
            southWestLng: sw.getLng(),
            northEastLat: ne.getLat(),
            northEastLng: ne.getLng()
          }
        }));
      }

      // 카카오맵 + updateMarkers 준비 완료 → React Native에 알림
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      postBounds();

      // 이동/확대가 멈춘 시점에만 발생하므로 별도 디바운스 없이 그대로 사용
      kakao.maps.event.addListener(map, 'idle', postBounds);

      kakao.maps.event.addListener(map, 'click', function() {
          closePopupFromMapClick();
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
  const mapSource = useMemo(() => ({ html: HTML, baseUrl: 'https://localhost' }), [HTML]);

  const isAllDays = currentPlanDay === ALL_DAYS;
  // "전체"는 대표 색이 없어 카드 아이콘만 1일차 색을 빌려 쓴다(점은 아래 DayDot이 겹쳐 표시).
  const activeDayColor = isAllDays ? DAY_COLOR_PALETTE[0] : getDayColor(currentPlanDay);

  // 드롭다운 각 행의 점. 전체는 Day 색을 최대 3개까지 겹쳐 보여준다.
  // 비선택 행도 점은 원래 Day 색 그대로 둔다 — 이 점이 지도 경로 색의 범례라서
  // 회색으로 죽이면 어느 Day가 무슨 색인지 알 수 없어진다(선택 표시는 배경·굵기로 충분).
  // 슬롯 폭을 고정해야 "전체" 행과 Day 행의 라벨 시작 위치가 어긋나지 않는다.
  const renderDayDot = (day: string) => {
    const dot = (color: string, i: number) => (
      <View
        key={i}
        style={{
          width: normalize(8),
          height: normalize(8),
          borderRadius: normalize(4),
          backgroundColor: color,
          marginLeft: i === 0 ? 0 : -normalize(4),
          borderWidth: i === 0 ? 0 : 1,
          borderColor: '#fff',
        }}
      />
    );
    return (
      <View style={{ width: normalize(16), flexDirection: 'row', alignItems: 'center' }}>
        {day === ALL_DAYS
          ? planDays.slice(0, 3).map((d, i) => dot(getDayColor(d).text, i))
          : dot(getDayColor(day).text, 0)}
      </View>
    );
  };

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
            <View className="flex-row items-center justify-between mb-3">
              <TouchableOpacity onPress={handleBackNavigation} className="bg-white/20 items-center justify-center rounded-full" style={{ width: normalize(32), height: normalize(32) }}>
                <IconChevronLeft size={normalize(20)} color="#fff" />
              </TouchableOpacity>
              <Text className="font-semibold text-white" style={{ fontSize: normalizeFontSize(18) }}>변경할 스팟을 선택하세요</Text>
              <TouchableOpacity onPress={handleBackNavigation} className="bg-white/20 items-center justify-center rounded-full" style={{ width: normalize(32), height: normalize(32) }}>
                <IconX size={normalize(16)} color="#fff" />
              </TouchableOpacity>
            </View>
            <View className="bg-white rounded-xl flex-row items-center px-4" style={{ height: normalize(44) }}>
              <IconSearch size={normalize(18)} color="rgba(0,0,0,0.3)" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="스팟 이름으로 검색"
                placeholderTextColor="rgba(0,0,0,0.3)"
                className="flex-1 ml-2 text-black font-medium p-0"
                style={{ fontSize: normalizeFontSize(14) }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
                  <IconX size={normalize(16)} color="rgba(0,0,0,0.4)" />
                </TouchableOpacity>
              )}
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
                  onPress={() => setSearchModalVisible(true)}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: '100%', paddingRight: normalize(32) }}
                  activeOpacity={0.8}
                >
                  <IconSearch size={normalize(18)} color="rgba(0,0,0,0.3)" strokeWidth={1.5} />
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      marginLeft: normalize(8),
                      fontSize: FONT_MD,
                      color: searchQuery ? '#111' : 'rgba(0,0,0,0.3)',
                      fontFamily: 'Pretendard-Regular',
                      letterSpacing: -0.2,
                    }}
                  >
                    {searchQuery || '장소, 테마, 키워드 검색'}
                  </Text>
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8} style={{ padding: 4 }}>
                      <IconX size={normalize(16)} color="rgba(0,0,0,0.4)" strokeWidth={1.5} />
                    </TouchableOpacity>
                  )}
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
              /* 코스 보기 — Day 드롭다운.
                 가로 세그먼트는 Day가 늘어날수록 화면 밖으로 밀려나서 드롭다운으로 바꿨다.
                 닫힌 폭이 고정이라 2일이든 10일이든 헤더 모양이 같다. */
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => setDayMenuOpen((v) => !v)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 4, bottom: 4 }}
                  style={{
                    width: normalize(132),
                    height: normalize(42),
                    borderRadius: normalize(14),
                    backgroundColor: '#fff',
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: normalize(14),
                    gap: normalize(8),
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                >
                  {renderDayDot(currentPlanDay)}
                  <Text
                    allowFontScaling={false}
                    style={{ flex: 1, fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold', color: '#000', letterSpacing: -0.2 }}
                  >
                    {isAllDays ? '전체' : `DAY ${currentPlanDay}`}
                  </Text>
                  {dayMenuOpen
                    ? <IconChevronUp size={normalize(16)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
                    : <IconChevronDown size={normalize(16)} color="rgba(0,0,0,0.4)" strokeWidth={2} />}
                </TouchableOpacity>

              </View>
            )}
          </View>

          {mode !== 'plan-view' && (
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
            </View>
          )}
        </View>
        )}

        <WebView
          ref={webViewRef}
          source={mapSource}
          onMessage={handleMessage}
          onError={(syntheticEvent: any) => console.error('[WebView Error]', syntheticEvent.nativeEvent)}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          originWhitelist={['*']}
          androidLayerType="hardware"
          androidHardwareAccelerationDisabled={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />

        {/* Day 드롭다운 스크림 — 헤더(z-20)보다 아래, 지도 컨트롤(z-10)보다 위 */}
        {dayMenuOpen && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setDayMenuOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15, backgroundColor: 'rgba(0,0,0,0.12)' }}
          />
        )}

        {/* Day 드롭다운 목록 — 트리거(헤더) 안에 두면 부모 높이를 넘어가서 안드로이드가
            영역 밖 자식에게 터치를 전달하지 않는다. 루트 형제로 빼고 좌표로 트리거 아래에 붙인다.
            top = 헤더 + 트리거 세로 중앙정렬 여백(3) + 트리거 높이(42) + 간격(6) */}
        {dayMenuOpen && (
          <View
            style={{
              position: 'absolute',
              top: HEADER_HEIGHT + normalize(51),
              right: 16,
              zIndex: 16,
              width: normalize(132),
              borderRadius: normalize(14),
              backgroundColor: '#fff',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.16,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            {/* 5행까지 노출하고 그 이상은 목록만 스크롤 */}
            <ScrollView style={{ maxHeight: normalize(220) }} showsVerticalScrollIndicator={false}>
              {/* "전체"는 목록 최상단 고정. 구분선은 전체 ↔ Day 경계에만 둔다 */}
              {[ALL_DAYS, ...planDays].map((dayStr) => {
                const isActive = dayStr === currentPlanDay;
                const isAllRow = dayStr === ALL_DAYS;
                const rowColor = isAllRow ? DAY_COLOR_PALETTE[0] : getDayColor(dayStr);
                return (
                  <View key={dayStr}>
                    <TouchableOpacity
                      onPress={() => {
                        // 팝업이 열린 채로 Day를 바꾸면 마커 갱신 effect가 !activeSpot에서 막혀
                        // 이전 Day 경로가 그대로 남는다. Day를 바꾸는 순간 팝업은 무효하니 닫는다.
                        setActiveSpot(null);
                        setCurrentPlanDay(dayStr);
                        setDayMenuOpen(false);
                      }}
                      activeOpacity={0.7}
                      style={{
                        height: normalize(44),
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: normalize(14),
                        gap: normalize(8),
                        backgroundColor: isActive ? rowColor.bg : 'transparent',
                      }}
                    >
                      {renderDayDot(dayStr)}
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: FONT_MD,
                          fontFamily: isActive ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                          color: isActive ? rowColor.text : 'rgba(0,0,0,0.6)',
                          letterSpacing: -0.2,
                        }}
                      >
                        {isAllRow ? '전체' : `DAY ${dayStr}`}
                      </Text>
                    </TouchableOpacity>
                    {isAllRow && (
                      <View style={{ height: 1, marginHorizontal: normalize(14), backgroundColor: 'rgba(0,0,0,0.07)' }} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* 우측 지도 편의 컨트롤 — 드롭다운이 열리면 목록과 겹쳐서 숨긴다 */}
        {!dayMenuOpen && (
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
        )}

        {/* 코스 보기 하단 요약 카드 — 지도 위에 얹혀 안 읽히던 "DAY N 경로" 텍스트를 대체한다.
            스팟 팝업이 뜨면 겹치므로 숨긴다. bottom 값은 카카오 로고/축척을 가리지 않는 높이. */}
        {mode === 'plan-view' && !activeSpot && (
          <View
            style={{
              position: 'absolute',
              // 드롭다운 목록(right:16)과 줌 컨트롤(right:16)이 raw 16이다. 헤더 행이 Tailwind
              // px-4(= raw 16)를 쓰기 때문인데, 여기만 normalize하면 430dp에서 2px 어긋난다.
              left: 16,
              right: 16,
              bottom: normalize(40),
              zIndex: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: normalize(12),
              paddingVertical: normalize(14),
              paddingHorizontal: normalize(16),
              borderRadius: normalize(16),
              backgroundColor: '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: normalize(36),
                height: normalize(36),
                borderRadius: normalize(10),
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: planSummary.isEmpty ? 'rgba(0,0,0,0.05)' : activeDayColor.bg,
              }}
            >
              <IconRoute
                size={normalize(18)}
                color={planSummary.isEmpty ? 'rgba(0,0,0,0.3)' : activeDayColor.text}
                strokeWidth={1.8}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                allowFontScaling={false}
                style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold', color: '#000', letterSpacing: -0.2 }}
              >
                {planSummary.title}
              </Text>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                style={{ marginTop: normalize(2), fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.5)', letterSpacing: -0.2 }}
              >
                {planSummary.meta}
              </Text>
            </View>
          </View>
        )}

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
            renderButtons={(popupSpot) => {
              const saved = mode === 'plan' && isSpotSaved(popupSpot.id);
              return (
              <View className="flex-row gap-2 mt-4">
                {mode !== 'plan-view' && (
                  <TouchableOpacity
                    onPress={() => {
                      if (mode !== 'plan') {
                        setCourseModalOpen(true);
                        return;
                      }
                      // 렌더 시점 파생값(saved) 대신 스토어 최신 상태를 직접 읽어 판단한다.
                      // 렌더가 한 박자 늦으면 첫 탭이 removeSpot(목록에 없어 no-op)으로 새어
                      // "두 번 눌러야 저장되는" 현상이 생기기 때문.
                      const alreadySaved = useCourseStore
                        .getState()
                        .selectedSpots.some((s) => String(s.id) === String(popupSpot.id));
                      if (alreadySaved) {
                        removeSpot(popupSpot.id);
                      } else {
                        addSpot(popupSpot);
                      }
                    }}
                    className={`flex-1 items-center justify-center ${saved ? 'bg-[#E31B59]' : 'bg-[#f5f5f7]'}`}
                    style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
                  >
                    <Text className={`font-semibold ${saved ? 'text-white' : 'text-black/60'}`} style={{ fontSize: FONT_MD }}>
                      {mode === 'plan' ? (saved ? '현재 코스에 저장됨' : '현재 코스에 저장') : '코스에 저장'}
                    </Text>
                  </TouchableOpacity>
                )}

              <TouchableOpacity
                onPress={() => navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: popupSpot.id } })}
                className="flex-1 bg-[#E31B59] items-center justify-center"
                style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
              >
                <Text className="font-semibold text-white" style={{ fontSize: FONT_MD }}>상세 보기</Text>
              </TouchableOpacity>
            </View>
            );
          }}
        />
        )}

        <SaveToPlanSheet
          visible={isCourseModalOpen}
          onClose={() => setCourseModalOpen(false)}
          spot={activeSpot}
          onSaved={(message) => {
            setCourseModalOpen(false);
            showToast(message);
          }}
        />

        <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

        <SearchModal
          visible={isSearchModalVisible}
          onClose={() => setSearchModalVisible(false)}
          defaultCategory="spot"
          onSelectSpot={(spot) => {
            setSearchQuery(spot.name);
            setActiveSpot(spot);
            const lat = Number(spot.lat);
            const lng = Number(spot.lng);
            const isValidCoord =
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              lat >= -90 &&
              lat <= 90 &&
              lng >= -180 &&
              lng <= 180;
            if (webViewRef.current && isValidCoord) {
              webViewRef.current.injectJavaScript(`
                if (window.kakaoMap) {
                  window.kakaoMap.setCenter(new kakao.maps.LatLng(${JSON.stringify(lat)}, ${JSON.stringify(lng)}));
                  window.kakaoMap.setLevel(3);
                }
              `);
            }
          }}
          onSelectKeyword={(keyword) => {
            setSearchQuery(keyword);
          }}
        />

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
