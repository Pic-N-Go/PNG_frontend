import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, BackHandler, Image, Animated, PanResponder, Easing, ScrollView, useWindowDimensions } from 'react-native';
import { NaverMapView, NaverMapMarkerOverlay, type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import * as Location from 'expo-location';
import { IconChevronLeft, IconMapPin, IconFocus2, IconChevronRight, IconMapPinFilled } from '@tabler/icons-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomSheet from '@/components/common/BottomSheet';
import { StatusBar } from 'expo-status-bar';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, HAIRLINE_WIDTH } from '@/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND, HAIRLINE } from '@/constants/colors';
import { useBookmarkedSpots, useReviewedSpots } from '@/hooks/useSpot';
import { useMapCluster } from '@/hooks/useMapCluster';
import { mergeMapSpots } from '@/utils/spotMappers';
import type { MapSpot } from '@/types/spot';
import SaveToPlanSheet from '@/components/spot/SaveToPlanSheet';
import Toast from '@/components/common/Toast';
import Skeleton from '@/components/common/Skeleton';
import { sanitizeKoreaLocation } from '@/utils/location';

type FilterType = 'all' | 'review' | 'fav';

// 지도 영역의 위 경계. 헤더 = 내비 행 + 필터 행(위아래 패딩 10 + 칩 높이 30).
const NAV_ROW_HEIGHT = normalize(54);
const HEADER_HEIGHT = NAV_ROW_HEIGHT + normalize(10) * 2 + normalize(30);

export default function PhotoMapScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const naverMapRef = useRef<NaverMapViewRef>(null);
  // 지도 생성 전에 오버레이를 붙이면 native overlays 리스트와 RN이 어긋나 인덱싱에서 죽는다
  // (`Index n out of bounds for length 0`). 초기화 후에만 자식을 렌더한다.
  const [isMapReady, setMapReady] = useState(false);
  const currentCameraRef = useRef({ latitude: 36.5, longitude: 127.5, zoom: 6 });
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeSpot, setActiveSpot] = useState<MapSpot | null>(null);

  // 코스 저장 시트.
  const [courseTarget, setCourseTarget] = useState<MapSpot | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 리뷰 핀과 즐겨찾기 핀은 서버가 따로 준다. 같은 스팟이면 mergeMapSpots가 핀 하나로 합친다.
  const reviewed = useReviewedSpots();
  const bookmarked = useBookmarkedSpots();
  const spots = useMemo(
    () => mergeMapSpots(reviewed.data, bookmarked.data),
    [reviewed.data, bookmarked.data],
  );
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

  // 리뷰도 쓰고 즐겨찾기도 한 스팟은 두 필터에 모두 나온다
  const filteredSpots = useMemo(() => {
    if (filter === 'review') return spots.filter((sp) => sp.reviewed);
    if (filter === 'fav') return spots.filter((sp) => sp.bookmarked);
    return spots;
  }, [filter, spots]);

  const handleSpotPress = useCallback((spot: MapSpot) => {
    setActiveSpot(spot);
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
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setToast('위치 권한이 필요해요');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const sanitized = sanitizeKoreaLocation(loc.coords.latitude, loc.coords.longitude);
      currentCameraRef.current = { latitude: sanitized.lat, longitude: sanitized.lng, zoom: 14 };
      naverMapRef.current?.animateCameraTo({
        latitude: sanitized.lat,
        longitude: sanitized.lng,
        zoom: 14,
      });
    } catch {
      setToast('현재 위치를 가져올 수 없어요');
    }
  }, []);

  useEffect(() => {
    if (filteredSpots.length > 0 && naverMapRef.current) {
      if (filteredSpots.length === 1) {
        naverMapRef.current.animateCameraTo({
          latitude: filteredSpots[0].lat,
          longitude: filteredSpots[0].lng,
          zoom: 14,
        });
      } else {
        const lats = filteredSpots.map((s) => s.lat).filter(Boolean);
        const lngs = filteredSpots.map((s) => s.lng).filter(Boolean);
        if (lats.length > 0) {
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          const latDelta = Math.max(0.005, maxLat - minLat);
          const lngDelta = Math.max(0.005, maxLng - minLng);
          const padLat = latDelta * 0.3;
          const padLng = lngDelta * 0.3;

          naverMapRef.current.animateCameraWithTwoCoords({
            coord1: { latitude: minLat - padLat, longitude: minLng - padLng },
            coord2: { latitude: maxLat + padLat, longitude: maxLng + padLng },
          });
        }
      }
    }
  }, [filteredSpots]);

  const [mapZoom, setMapZoom] = useState(6);
  const [mapBounds, setMapBounds] = useState<any>(null);

  // 서로 다른 색의 핀끼리 섞이지 않도록 리뷰(핑크 #e31b59)와 즐겨찾기(검정 #1c1c1e)를 분리하여 클러스터링
  const reviewSpots = useMemo(() => {
    if (filter === 'fav') return [];
    return filteredSpots.filter((sp) => sp.reviewed);
  }, [filter, filteredSpots]);

  const bookmarkSpots = useMemo(() => {
    if (filter === 'review') return [];
    if (filter === 'fav') return filteredSpots;
    return filteredSpots.filter((sp) => !sp.reviewed && sp.bookmarked);
  }, [filter, filteredSpots]);

  const { clusterElements: reviewClusters } = useMapCluster<any>(
    reviewSpots,
    mapZoom,
    mapBounds,
    { radius: 45, maxZoom: 15 }
  );

  const { clusterElements: bookmarkClusters } = useMapCluster<any>(
    bookmarkSpots,
    mapZoom,
    mapBounds,
    { radius: 45, maxZoom: 15 }
  );

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

      <NaverMapView
        ref={naverMapRef}
        style={{ flex: 1 }}
        initialCamera={{
          latitude: filteredSpots[0]?.lat || 36.5,
          longitude: filteredSpots[0]?.lng || 127.5,
          zoom: filteredSpots.length > 0 ? 10 : 6,
        }}
        onCameraIdle={(e) => {
          setMapZoom(e.zoom ?? 10);
          currentCameraRef.current = {
            latitude: e.latitude,
            longitude: e.longitude,
            zoom: e.zoom ?? 10,
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
        onInitialized={() => setMapReady(true)}
        onTapMap={() => setActiveSpot(null)}
        isShowCompass={false}
        isShowScaleBar={false}
        isShowZoomControls={false}
        isShowLocationButton={false}
        logoMargin={{ bottom: mapAreaBottomOf(insets.bottom) + 8, left: 14 }}
      >
        {/* 리뷰 클러스터 및 핀 (핑크 #e31b59) */}
        {isMapReady && reviewClusters.map((element) => {
          if (element.isCluster) {
            return (
              <NaverMapMarkerOverlay
                key={`cluster_review_${element.id}`}
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
                  key={`cluster_review_view_${element.id}_${element.count}`}
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
              key={`review_${spot.id}`}
              latitude={spot.lat}
              longitude={spot.lng}
              width={normalize(24)}
              height={normalize(24)}
              anchor={{ x: 0.5, y: 0.5 }}
              caption={{
                text: spot.name,
                textSize: FONT_XS,
                color: '#1c1c1e',
                haloColor: '#FFFFFF',
                offset: normalize(4),
              }}
              onTap={() => handleSpotPress(spot)}
            >
              <View
                key={`photo_spot_pin_${spot.id}`}
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

        {/* 즐겨찾기 클러스터 및 핀 (검정 #1c1c1e) */}
        {isMapReady && bookmarkClusters.map((element) => {
          if (element.isCluster) {
            return (
              <NaverMapMarkerOverlay
                key={`cluster_fav_${element.id}`}
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
                  key={`cluster_fav_view_${element.id}_${element.count}`}
                  collapsable={false}
                  style={{
                    width: normalize(36),
                    height: normalize(36),
                    borderRadius: normalize(18),
                    backgroundColor: '#1c1c1e',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000000',
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
              key={`fav_${spot.id}`}
              latitude={spot.lat}
              longitude={spot.lng}
              width={normalize(24)}
              height={normalize(24)}
              anchor={{ x: 0.5, y: 0.5 }}
              caption={{
                text: spot.name,
                textSize: FONT_XS,
                color: '#1c1c1e',
                haloColor: '#FFFFFF',
                offset: normalize(4),
              }}
              onTap={() => handleSpotPress(spot)}
            >
              <View
                key={`fav_spot_pin_${spot.id}`}
                collapsable={false}
                style={{
                  width: normalize(24),
                  height: normalize(24),
                  borderRadius: normalize(12),
                  backgroundColor: '#1c1c1e',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000000',
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

      <View className="absolute z-30 bg-[rgba(255,255,255,0.88)]" style={{ left: normalize(14), top: insets.top + HEADER_HEIGHT + normalize(16), borderRadius: normalize(10), paddingHorizontal: normalize(12), paddingVertical: normalize(8), gap: normalize(6) }}>
        <View className="flex-row items-center" style={{ gap: normalize(4) }}>
          <IconMapPin size={normalize(13)} color={BRAND} fill={BRAND} />
          <Text className="text-[rgba(0,0,0,0.55)] font-normal" style={{ fontSize: FONT_XS }}>리뷰</Text>
        </View>
        <View className="flex-row items-center" style={{ gap: normalize(4) }}>
          <IconMapPin size={normalize(13)} color="#1c1c1e" fill="#1c1c1e" />
          <Text className="text-[rgba(0,0,0,0.55)] font-normal" style={{ fontSize: FONT_XS }}>즐겨찾기</Text>
        </View>
      </View>

      {isError && spots.length === 0 ? (
        <MapNotice
          text="핀을 불러오지 못했어요"
          onRetry={() => {
            reviewed.refetch();
            bookmarked.refetch();
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
