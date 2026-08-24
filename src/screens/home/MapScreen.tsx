import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler, Image, Alert, Linking } from 'react-native';
import { NaverMapView, NaverMapMarkerOverlay, NaverMapPathOverlay, type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import * as Location from 'expo-location';
import { IconChevronLeft, IconSearch, IconAdjustmentsHorizontal, IconFocus2, IconX, IconChevronDown, IconChevronUp, IconRoute, IconMapPinFilled } from '@tabler/icons-react-native';
import { useNavigation, useRoute, useFocusEffect, CommonActions } from '@react-navigation/native';
import { useCourseStore, Spot } from '@/store/useCourseStore';
import { useSpots, useMapSpots, useSearchSpots } from '@/hooks/useSpot';
import { useDebounce } from '@/hooks/useDebounce';
import { useMapCluster } from '@/hooks/useMapCluster';
import SpotPopup from '@/components/travel/SpotPopup';
import BottomSheet from '@/components/common/BottomSheet';
import FilterBottomSheet, { FilterState, EMPTY_FILTER } from '@/components/home/FilterBottomSheet';
import SaveToPlanSheet from '@/components/spot/SaveToPlanSheet';
import Toast from '@/components/common/Toast';
import { StatusBar } from 'expo-status-bar';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { getCourseStats } from '@/utils/distance';
import { parseValidCoordinate } from '@/utils/geo';
import { getDayColor, DAY_COLOR_PALETTE } from '@/constants/dayColors';
import { CATEGORY_LABELS, CODE_BY_LABEL } from '@/constants/spotCategories';
import { BUTTON_HEIGHT, BUTTON_RADIUS, CONTROL_SIZE, FONT_MD, FONT_SM, FONT_TITLE, FONT_XL, FONT_XS, HEADER_HEIGHT, ICON_SM } from '@/constants/layout';
import Chip from '@/components/common/Chip';
import { BRAND, TEXT_SUB } from '@/constants/colors';
import { SHADOW_CONTROL, SHADOW_OVERLAY } from '@/constants/shadow';
import { sanitizeKoreaLocation } from '@/utils/location';

// 칩 id·라벨·enum 매핑 모두 @/constants/spotCategories 단일 출처를 따른다.
const CATEGORY_MAP: Record<string, string> = CODE_BY_LABEL;

// Day 드롭다운의 "전체" 항목. 실제 Day 키("1", "2"…)와 겹치지 않는 값이면 된다.
const ALL_DAYS = 'all';

// 지도에 넘길 스팟에 Day 색과 Day별 순번을 실어준다.
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

// id는 한글 라벨 그대로 쓴다(CATEGORY_MAP이 라벨로 enum을 찾는다). '기타'는 필터 대상이 아니라 제외.
const CATEGORIES = [
  { id: 'all', label: '전체' },
  ...CATEGORY_LABELS.map((label) => ({ id: label, label })),
];

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const mode = route.params?.source === 'plan' ? 'plan' 
             : route.params?.source === 'plan-view' ? 'plan-view'
             : route.params?.source === 'wishlist-change' ? 'wishlist-change'
             : 'view';
  const isCourseView = mode === 'plan-view' || !!route.params?.spots;

  const naverMapRef = useRef<NaverMapViewRef>(null);
  const currentCameraRef = useRef({ latitude: 37.5665, longitude: 126.9780, zoom: 14 });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { selectedSpots, addSpot, removeSpot } = useCourseStore();
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);
  const [isCourseModalOpen, setCourseModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. 앱 최초 구동 (지도 화면 마운트) 시 위치 권한 자동 요청
  useEffect(() => {
    const requestLocationPermissionOnStart = async () => {
      try {
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        if (existingStatus === Location.PermissionStatus.UNDETERMINED) {
          await Location.requestForegroundPermissionsAsync();
        }
      } catch (err) {
        console.warn('[MapScreen] requestLocationPermissionOnStart error:', err);
      }
    };
    void requestLocationPermissionOnStart();
  }, []);

  // 2. 위치 실시간 추적 및 반영
  useEffect(() => {
    let isDisposed = false;
    let subscription: any = null;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (isDisposed) return;

        if (status === Location.PermissionStatus.GRANTED) {
          const lastKnown = await Location.getLastKnownPositionAsync();
          if (isDisposed) return;

          if (lastKnown) {
            const sanitized = sanitizeKoreaLocation(lastKnown.coords.latitude, lastKnown.coords.longitude);
            setUserLocation({ latitude: sanitized.lat, longitude: sanitized.lng });
            if (!isCourseView) {
              naverMapRef.current?.animateCameraTo({
                latitude: sanitized.lat,
                longitude: sanitized.lng,
                zoom: 14,
              });
            }
          }

          const sub = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 2000,
              distanceInterval: 3,
            },
            (location) => {
              if (isDisposed) return;
              const sanitized = sanitizeKoreaLocation(location.coords.latitude, location.coords.longitude);
              setUserLocation({ latitude: sanitized.lat, longitude: sanitized.lng });
            }
          );

          if (isDisposed) {
            sub.remove();
          } else {
            subscription = sub;
          }
        }
      } catch (error) {
        if (!isDisposed) {
          console.error('[MapScreen] startLocationTracking error:', error);
        }
      }
    };

    void startLocationTracking();

    return () => {
      isDisposed = true;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isCourseView]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const [detailFilter, setDetailFilter] = useState<FilterState>(EMPTY_FILTER);
  const [currentPlanDay, setCurrentPlanDay] = useState<string>(route.params?.initialDay || '1');
  const [dayMenuOpen, setDayMenuOpen] = useState(false);
  const planDays = useMemo(() => Object.keys(route.params?.planData || {}), [route.params?.planData]);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [mapZoom, setMapZoom] = useState(14);
  const debouncedKeyword = useDebounce(searchQuery, 300);
  const debouncedMapBounds = useDebounce(mapBounds, 200);

  // 이전에 받아온 스팟들을 누적 보존하여 줌 인/아웃 시 마커가 사라지거나 깜빡이지 않게 함
  const spotPoolRef = useRef<Map<string, any>>(new Map());

  const apiCategory = CATEGORY_MAP[selectedCategory] || (selectedCategory !== 'all' ? selectedCategory : undefined);
  const hasKeyword = debouncedKeyword.trim().length > 0;
  const usesRouteSpots = mode === 'plan-view' || Array.isArray(route.params?.spots);

  // 카테고리 변경 시 스팟 풀 초기화
  useEffect(() => {
    spotPoolRef.current.clear();
  }, [selectedCategory]);

  // 1. 지도 영역 핀 목록 (GET /spots/map)
  const { data: mapSpotsData, error: mapError } = useMapSpots(
    { ...(debouncedMapBounds ?? DEFAULT_BOUNDS), category: apiCategory, size: 200 },
    { enabled: !usesRouteSpots && !hasKeyword },
  );

  // 2. 키워드 검색 목록 (GET /spots/search)
  const { data: searchSpotsData, error: searchError } = useSearchSpots(
    { keyword: debouncedKeyword, category: apiCategory, size: 50 },
    { enabled: !usesRouteSpots },
  );

  // 3. 백업 스팟 목록 (GET /spots)
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
      rawList = spotsPageData.content;
    }

    const list = rawList.map((spot: any) => {
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

    // 검색 중이 아닐 때는 수신된 스팟들을 누적 풀에 추가
    if (!hasKeyword && list.length > 0) {
      list.forEach((s: any) => {
        if (s.id && s.lat && s.lng) {
          spotPoolRef.current.set(String(s.id), s);
        }
      });
    }

    return list;
  }, [hasKeyword, needsFallback, mapSpotsData, searchSpotsData, spotsPageData]);

  const isSpotSaved = useCallback(
    (spotId: string) => selectedSpots.some((s) => String(s.id) === String(spotId)),
    [selectedSpots]
  );

  useEffect(() => {
    if (route.params?.initialDay) {
      setCurrentPlanDay(route.params.initialDay);
    }
  }, [route.params?.initialDay]);

  useEffect(() => {
    const nonce = route.params?.searchNonce;
    if (!nonce) return;

    const { searchSelectedSpot, searchKeyword } = route.params;

    if (searchSelectedSpot) {
      setSearchQuery(searchSelectedSpot.name);
      setActiveSpot(searchSelectedSpot);
      const lat = Number(searchSelectedSpot.lat);
      const lng = Number(searchSelectedSpot.lng);
      const isValidCoord =
        Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
      if (isValidCoord) {
        naverMapRef.current?.animateCameraTo({
          latitude: lat,
          longitude: lng,
          zoom: 15,
        });
      }
    } else if (searchKeyword) {
      setSearchQuery(searchKeyword);
    }

    navigation.setParams({ searchSelectedSpot: undefined, searchKeyword: undefined, searchNonce: undefined });
  }, [route.params, navigation]);

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
    return true;
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

  const handleZoomIn = useCallback(() => {
    if (naverMapRef.current) {
      naverMapRef.current.animateCameraTo({
        latitude: currentCameraRef.current.latitude,
        longitude: currentCameraRef.current.longitude,
        zoom: currentCameraRef.current.zoom + 1,
      });
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (naverMapRef.current) {
      naverMapRef.current.animateCameraTo({
        latitude: currentCameraRef.current.latitude,
        longitude: currentCameraRef.current.longitude,
        zoom: currentCameraRef.current.zoom - 1,
      });
    }
  }, []);

  const handleMyLocation = useCallback(async () => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== Location.PermissionStatus.GRANTED) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          '위치 권한 필요',
          '내 위치 주변으로 지도를 이동하려면 기기 설정에서 위치 권한을 허용해 주세요.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '설정으로 이동',
              onPress: () => {
                void Linking.openSettings();
              },
            },
          ]
        );
        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        const sanitized = sanitizeKoreaLocation(lastKnown.coords.latitude, lastKnown.coords.longitude);
        setUserLocation({ latitude: sanitized.lat, longitude: sanitized.lng });
        naverMapRef.current?.animateCameraTo({
          latitude: sanitized.lat,
          longitude: sanitized.lng,
          zoom: 15,
        });
      }

      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((location) => {
          const sanitized = sanitizeKoreaLocation(location.coords.latitude, location.coords.longitude);
          setUserLocation({ latitude: sanitized.lat, longitude: sanitized.lng });
          naverMapRef.current?.animateCameraTo({
            latitude: sanitized.lat,
            longitude: sanitized.lng,
            zoom: 15,
          });
        })
        .catch((err) => console.warn('[MapScreen] Background getCurrentPosition error:', err));

    } catch (err) {
      console.warn('[MapScreen] handleMyLocation error:', err);
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
    if (route.params?.spots) {
      return route.params.spots;
    }
    if (hasKeyword) {
      return apiSpots;
    }
    const pool = Array.from(spotPoolRef.current.values());
    return pool.length > 0 ? pool : apiSpots;
  }, [mode, route.params?.spots, route.params?.planData, currentPlanDay, planDays, apiSpots, hasKeyword]);

  const planSummary = useMemo(() => {
    const isAll = currentPlanDay === ALL_DAYS;
    const title = isAll ? '전체 경로' : `DAY ${currentPlanDay} 경로`;
    if (baseSpots.length === 0) return { isEmpty: true, title, meta: '등록된 스팟이 없어요' };

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
    if (mode === 'plan-view') return baseSpots;
    return baseSpots.filter((spot: any) => {
      if (selectedCategory !== 'all' && selectedCategory !== '전체') {
        const targetEnum = CATEGORY_MAP[selectedCategory] || selectedCategory;
        const matchesCategory = spot.tags?.some(
          (t: string) => t === targetEnum || t === selectedCategory || (typeof t === 'string' && t.includes(selectedCategory))
        );
        if (!matchesCategory) return false;
      }

      if (detailFilter.time.length > 0) {
        const matchesTime = spot.tags?.some((t: string) => detailFilter.time.includes(t));
        if (!matchesTime) return false;
      }
      if (detailFilter.weather.length > 0) {
        const matchesWeather = spot.tags?.some((t: string) => detailFilter.weather.includes(t));
        if (!matchesWeather) return false;
      }
      if (detailFilter.score) {
        const minScore = parseInt(detailFilter.score.replace(/[^0-9]/g, ''), 10);
        if (spot.score < minScore) return false;
      }

      return true;
    });
  }, [baseSpots, selectedCategory, detailFilter, mode]);

  // 코스 보기 모드에서 Day 전환 시 카메라 Bounds 맞춤
  useEffect(() => {
    if (isCourseView && filteredSpots.length > 0 && naverMapRef.current) {
      if (filteredSpots.length === 1) {
        naverMapRef.current.animateCameraTo({
          latitude: filteredSpots[0].lat,
          longitude: filteredSpots[0].lng,
          zoom: 14,
        });
      } else {
        const lats = filteredSpots.map((s: any) => s.lat).filter(Boolean);
        const lngs = filteredSpots.map((s: any) => s.lng).filter(Boolean);
        if (lats.length > 0) {
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          naverMapRef.current.animateRegionTo({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
            longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
          });
        }
      }
    }
  }, [currentPlanDay, isCourseView, filteredSpots]);

  // 코스 경로 라인 그룹화
  const dayPathGroups = useMemo(() => {
    if (!isCourseView || filteredSpots.length < 2) return [];
    const groups: Record<string, { spots: any[]; color: string }> = {};
    filteredSpots.forEach((s: any) => {
      const dayKey = s.__day || '1';
      if (!groups[dayKey]) {
        groups[dayKey] = {
          spots: [],
          color: s.__dayColor || getDayColor(dayKey).text,
        };
      }
      groups[dayKey].spots.push(s);
    });

    return Object.values(groups).filter((g) => g.spots.length >= 2);
  }, [isCourseView, filteredSpots]);

  // 클러스터링 계산 (일반 탐색 모드에서 동작)
  const { clusterElements } = useMapCluster<any>(
    isCourseView ? [] : filteredSpots,
    mapZoom,
    mapBounds,
    { radius: 45, maxZoom: 15 }
  );

  const isAllDays = currentPlanDay === ALL_DAYS;
  const activeDayColor = isAllDays ? DAY_COLOR_PALETTE[0] : getDayColor(currentPlanDay);

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

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* 네이티브 네이버 지도 */}
      <NaverMapView
        ref={naverMapRef}
        style={{ flex: 1 }}
        initialCamera={{
          latitude: filteredSpots[0]?.lat || 37.5665,
          longitude: filteredSpots[0]?.lng || 126.9780,
          zoom: isCourseView ? 12 : 14,
        }}
        onCameraIdle={(e) => {
          setMapZoom(e.zoom ?? 14);
          currentCameraRef.current = {
            latitude: e.latitude,
            longitude: e.longitude,
            zoom: e.zoom ?? 14,
          };
          if (e.region) {
            const swLat = e.region.latitude - e.region.latitudeDelta / 2;
            const neLat = e.region.latitude + e.region.latitudeDelta / 2;
            const swLng = e.region.longitude - e.region.longitudeDelta / 2;
            const neLng = e.region.longitude + e.region.longitudeDelta / 2;
            setMapBounds({
              southWestLat: swLat,
              southWestLng: swLng,
              northEastLat: neLat,
              northEastLng: neLng,
            });
          }
        }}
        onTapMap={() => setActiveSpot(null)}
        isShowCompass={false}
        isShowScaleBar={false}
        isShowZoomControls={false}
        isShowLocationButton={false}
        logoMargin={{ bottom: normalize(mode === 'plan-view' ? 120 : 36), left: 16 }}
        locationOverlay={
          userLocation
            ? {
                isVisible: true,
                position: userLocation,
              }
            : undefined
        }
      >
        {/* 코스 경로선 */}
        {dayPathGroups.map((group, idx) => (
          <NaverMapPathOverlay
            key={`path_${idx}`}
            coords={group.spots.map((s: any) => ({ latitude: s.lat, longitude: s.lng }))}
            width={4}
            color={group.color}
            outlineWidth={0}
          />
        ))}

        {/* 스팟 마커 및 클러스터 마커 */}
        {isCourseView
          ? filteredSpots.map((spot: any, index: number) => {
              if (!spot.lat || !spot.lng) return null;
              return (
                <NaverMapMarkerOverlay
                  key={`${spot.__day || '1'}_${spot.id}_${index}`}
                  latitude={spot.lat}
                  longitude={spot.lng}
                  width={normalize(28)}
                  height={normalize(28)}
                  anchor={{ x: 0.5, y: 0.5 }}
                  onTap={() => setActiveSpot(spot)}
                >
                  <View
                    key={`course_pin_${spot.__day}_${spot.id}_${index}`}
                    collapsable={false}
                    style={{
                      width: normalize(28),
                      height: normalize(28),
                      borderRadius: normalize(14),
                      backgroundColor: spot.__dayColor || '#e31b59',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.25,
                      shadowRadius: 2,
                      elevation: 3,
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        color: '#FFFFFF',
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: FONT_XS,
                      }}
                    >
                      {spot.__label || index + 1}
                    </Text>
                  </View>
                </NaverMapMarkerOverlay>
              );
            })
          : clusterElements.map((element) => {
              if (element.isCluster) {
                return (
                  <NaverMapMarkerOverlay
                    key={`cluster_${element.id}`}
                    latitude={element.latitude}
                    longitude={element.longitude}
                    width={normalize(36)}
                    height={normalize(36)}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onTap={() => {
                      naverMapRef.current?.animateCameraTo({
                        latitude: element.latitude,
                        longitude: element.longitude,
                        zoom: element.expansionZoom,
                      });
                    }}
                  >
                    <View
                      key={`cluster_view_${element.id}_${element.count}`}
                      collapsable={false}
                      style={{
                        width: normalize(36),
                        height: normalize(36),
                        borderRadius: normalize(18),
                        backgroundColor: '#e31b59',
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#e31b59',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.4,
                        shadowRadius: 4,
                        elevation: 4,
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          color: '#FFFFFF',
                          fontFamily: 'Pretendard-SemiBold',
                          fontSize: FONT_SM,
                        }}
                      >
                        {element.count}
                      </Text>
                    </View>
                  </NaverMapMarkerOverlay>
                );
              }

              const spot = element.spot;
              if (!spot.lat || !spot.lng) return null;
              return (
                <NaverMapMarkerOverlay
                  key={String(spot.id)}
                  latitude={spot.lat}
                  longitude={spot.lng}
                  width={normalize(24)}
                  height={normalize(24)}
                  anchor={{ x: 0.5, y: 0.5 }}
                  caption={{
                    text: spot.name,
                    textSize: FONT_XS,
                    color: '#111111',
                    haloColor: '#FFFFFF',
                    offset: normalize(4),
                  }}
                  onTap={() => setActiveSpot(spot)}
                >
                  <View
                    key={`spot_pin_${spot.id}`}
                    collapsable={false}
                    style={{
                      width: normalize(24),
                      height: normalize(24),
                      borderRadius: normalize(12),
                      backgroundColor: '#e31b59',
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#e31b59',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.35,
                      shadowRadius: 3,
                      elevation: 3,
                    }}
                  >
                    <IconMapPinFilled size={normalize(12)} color="#FFFFFF" />
                  </View>
                </NaverMapMarkerOverlay>
              );
            })}
      </NaverMapView>

      {/* 상단 오버레이 (검색창 + 뒤로가기) */}
      {mode === 'wishlist-change' ? (
        <View className="bg-brand pt-14 pb-4 px-5 z-20 absolute top-0 left-0 right-0 w-full pointer-events-auto shadow-md">
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
            <TouchableOpacity
              onPress={() => navigation.navigate('MapSearch')}
              className="flex-1 flex-row items-center"
              style={{ height: '100%' }}
              activeOpacity={0.8}
            >
              <IconSearch size={normalize(18)} color="rgba(0,0,0,0.3)" />
              <Text
                numberOfLines={1}
                className="flex-1 ml-2 font-medium"
                style={{
                  fontFamily: 'Pretendard-Medium',
                  fontSize: normalizeFontSize(14),
                  color: searchQuery ? '#111111' : 'rgba(0,0,0,0.3)',
                }}
              >
                {searchQuery || '스팟 이름으로 검색'}
              </Text>
            </TouchableOpacity>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setActiveSpot(null);
                }}
                hitSlop={8}
              >
                <IconX size={normalize(16)} color={TEXT_SUB} />
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
                ...SHADOW_CONTROL,
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
                  ...SHADOW_CONTROL,
                }}
              >
                <TouchableOpacity
                  onPress={() => navigation.navigate('MapSearch')}
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
                      <IconX size={normalize(16)} color={TEXT_SUB} strokeWidth={1.5} />
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
                          backgroundColor: BRAND,
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
              /* 코스 보기 — Day 드롭다운 */
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
                    ? <IconChevronUp size={normalize(16)} color={TEXT_SUB} strokeWidth={2} />
                    : <IconChevronDown size={normalize(16)} color={TEXT_SUB} strokeWidth={2} />}
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
                {CATEGORIES.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.label}
                    selected={selectedCategory === cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    height={normalize(32)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {/* Day 드롭다운 스크림 */}
      {dayMenuOpen && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setDayMenuOpen(false)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15, backgroundColor: 'rgba(0,0,0,0.12)' }}
        />
      )}

      {/* Day 드롭다운 목록 */}
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
            ...SHADOW_OVERLAY,
          }}
        >
          <ScrollView style={{ maxHeight: normalize(220) }} showsVerticalScrollIndicator={false}>
            {[ALL_DAYS, ...planDays].map((dayStr) => {
              const isActive = dayStr === currentPlanDay;
              const isAllRow = dayStr === ALL_DAYS;
              const rowColor = isAllRow ? DAY_COLOR_PALETTE[0] : getDayColor(dayStr);
              return (
                <View key={dayStr}>
                  <TouchableOpacity
                    onPress={() => {
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

      {/* 우측 하단 지도 편의 컨트롤 (내 위치 이동 + 줌 컨트롤) */}
      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          right: 16,
          bottom: normalize(mode === 'plan-view' ? 120 : 36),
          zIndex: 10,
          gap: 8,
        }}
      >
        {/* 내 위치 이동 버튼 */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            overflow: 'hidden',
            ...SHADOW_CONTROL,
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
            <IconFocus2 size={18} color="rgba(0,0,0,0.55)" />
          </TouchableOpacity>
        </View>

        {/* 줌 컨트롤 그룹 */}
        <View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            overflow: 'hidden',
            ...SHADOW_CONTROL,
          }}
        >
          <TouchableOpacity
            onPress={handleZoomIn}
            activeOpacity={0.7}
            style={{
              width: CONTROL_SIZE,
              height: CONTROL_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: FONT_XL, color: 'rgba(0,0,0,0.55)', fontFamily: 'Pretendard-Regular' }}>+</Text>
          </TouchableOpacity>
          
          <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)' }} />

          <TouchableOpacity
            onPress={handleZoomOut}
            activeOpacity={0.7}
            style={{
              width: CONTROL_SIZE,
              height: CONTROL_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: FONT_XL, color: 'rgba(0,0,0,0.55)', fontFamily: 'Pretendard-Regular' }}>−</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 코스 보기 하단 요약 카드 */}
      {mode === 'plan-view' && !activeSpot && (
        <View
          style={{
            position: 'absolute',
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
            ...SHADOW_CONTROL,
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
              size={ICON_SM}
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
                  <Text className="font-semibold text-black mb-1" style={{ fontSize: FONT_TITLE }}>{activeSpot.name}</Text>
                  <Text className="text-sub mb-2.5 font-normal" style={{ fontSize: normalizeFontSize(14) }}>{activeSpot.loc}</Text>
                  <View className="flex-row items-center gap-2 flex-wrap">
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
                className="bg-brand items-center justify-center" 
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
                    const alreadySaved = useCourseStore
                      .getState()
                      .selectedSpots.some((s) => String(s.id) === String(popupSpot.id));
                    if (alreadySaved) {
                      removeSpot(popupSpot.id);
                    } else {
                      addSpot(popupSpot);
                    }
                  }}
                  className={`flex-1 items-center justify-center ${saved ? 'bg-brand' : 'bg-card'}`}
                  style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
                >
                  <Text className={`font-semibold ${saved ? 'text-white' : 'text-black/60'}`} style={{ fontSize: FONT_MD }}>
                    {mode === 'plan' ? (saved ? '현재 코스에 저장됨' : '현재 코스에 저장') : '코스에 저장'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: popupSpot.id } })}
                className="flex-1 bg-brand items-center justify-center"
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
