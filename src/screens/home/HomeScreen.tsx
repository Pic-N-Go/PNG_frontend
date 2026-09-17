
import React, { useState, useEffect, useCallback } from 'react';
import { RefreshControl, ScrollView, Text, View, AppState, Linking, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/stacks/HomeStack';
import type { RootStackParamList } from '@/navigation';
import { BUTTON_RADIUS, CARD_RADIUS, CONTENT_PADDING, FONT_SM, FONT_TITLE, FONT_XS, SPACING_LG } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import HeroSection from '@/components/home/HeroSection';
import SearchBar from '@/components/common/SearchBar';
import MapBanner from '@/components/home/MapBanner';
import PopularSpotsSection from '@/components/home/PopularSpotsSection';
import RecommendedSpotsSection from '@/components/home/RecommendedSpotsSection';
import FestivalSection from '@/components/home/FestivalSection';
import SeasonalSpotSection from '@/components/home/SeasonalSpotSection';
import { IconBell, IconMapPin } from '@tabler/icons-react-native';
import LinkBanner from '@/components/common/LinkBanner';
import { useNotification } from '@/hooks/useNotification';
import { queryClient } from '@/store/queryClient';
import { useNearbySpots } from '@/hooks/useSpot';
import { BRAND, BRAND_TINT, CARD, TEXT_SUB } from '@/constants/colors';
import { isLocationInKorea, sanitizeKoreaLocation } from '@/utils/location';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

// 한국 행정구역 주소에서 '동/읍/면' 우선 추출 (차선: '구', 삼선: '시/군')
function extractDongOrDistrict(geo: Location.LocationGeocodedAddress): string {
  const fields = [geo.subregion, geo.name, geo.district, geo.street, geo.city].filter(Boolean) as string[];

  // 1. '동', '읍', '면', '리' 탐색 (예: 불당동, 두정동, 신부동, 역삼동)
  const dongRegex = /([가-힣0-9]+(?:동|읍|면|리))\b/;
  for (const field of fields) {
    const match = field.match(dongRegex);
    if (match && match[1]) {
      const name = match[1];
      if (!['동구', '남구', '서구', '북구', '중구'].includes(name)) {
        return name;
      }
    }
  }

  // 2. '구' 탐색 (예: 서북구, 동남구, 강남구)
  for (const field of fields) {
    const match = field.match(/([가-힣]+구)\b/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // 3. '시' / '군' 탐색 (예: 천안시, 가평군)
  for (const field of fields) {
    const match = field.match(/([가-힣]+(?:시|군))\b/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return '내 위치';
}

export default function HomeScreen({ navigation }: Props) {
  const [isPermissionDenied, setIsPermissionDenied] = useState(false);

  // 현재 사용자 GPS 위치 관리 (기본값: 서울시청)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; isReal: boolean; isFallback?: boolean }>({
    lat: 37.5665,
    lng: 126.9780,
    isReal: false,
    isFallback: true,
  });

  const [userAddress, setUserAddress] = useState<string>('내 위치');

  // SpotStack은 HomeStack의 조상 네비게이터(RootStack)에 등록돼 있음 —
  // React Navigation이 자동으로 상위로 액션을 전파(bubbling)하므로 getParent() 체이닝 불필요
  const goToSpotDetail = useCallback(
    (spotId: string) => {
      const rootNavigation = navigation as unknown as NativeStackNavigationProp<RootStackParamList>;
      rootNavigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId } });
    },
    [navigation],
  );

  const syncUserCoords = useCallback(async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.UNDETERMINED) {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status === Location.PermissionStatus.GRANTED) {
        setIsPermissionDenied(false);
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          const sanitized = sanitizeKoreaLocation(lastKnown.coords.latitude, lastKnown.coords.longitude);
          setUserLocation({
            lat: sanitized.lat,
            lng: sanitized.lng,
            isReal: true,
            isFallback: sanitized.isFallback,
          });
        }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (current) {
          const sanitized = sanitizeKoreaLocation(current.coords.latitude, current.coords.longitude);
          setUserLocation({
            lat: sanitized.lat,
            lng: sanitized.lng,
            isReal: true,
            isFallback: sanitized.isFallback,
          });
        }
      } else {
        setIsPermissionDenied(true);
      }
    } catch (err) {
      console.warn('[HomeScreen] syncUserCoords error:', err);
    }
  }, []);

  useEffect(() => {
    void syncUserCoords();

    // 알림/위치 권한 팝업이 닫히거나 앱이 포그라운드로 복귀할 때 실시간 좌표 동기화
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        void syncUserCoords();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [syncUserCoords]);

  // 사용자 주소 역지오코딩 (동/읍/면 단위 추출)
  useEffect(() => {
    let ignore = false;

    const fetchAddress = async () => {
      try {
        if (userLocation.isReal && userLocation.lat && userLocation.lng) {
          if (userLocation.isFallback || !isLocationInKorea(userLocation.lat, userLocation.lng)) {
            if (!ignore) setUserAddress('서울시청');
            return;
          }
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          });
          if (!ignore && geo) {
            const dongOrDistrict = extractDongOrDistrict(geo);
            if (!ignore && dongOrDistrict) {
              setUserAddress(dongOrDistrict);
            }
          }
        }
      } catch (err) {
        if (!ignore) {
          console.warn('[HomeScreen] reverseGeocodeAsync error:', err);
        }
      }
    };
    void fetchAddress();

    return () => {
      ignore = true;
    };
  }, [userLocation.isReal, userLocation.lat, userLocation.lng, userLocation.isFallback]);

  const { data: nearbySpots = [], isLoading: isNearbyLoading } = useNearbySpots(
    {
      lat: userLocation.lat,
      lng: userLocation.lng,
      radiusKm: 5.0,
      limit: 20,
    },
    {
      enabled: userLocation.isReal,
    }
  );

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 좌표가 바뀌었으면 주변 스팟 쿼리 키가 따라 바뀐다 — 리페치보다 먼저 맞춰야 한 번에 끝난다.
      await syncUserCoords();
      // ponytail: 마운트된 쿼리를 전부 훑는다. 홈 데이터가 섹션 컴포넌트마다 흩어져 있어
      // 화면에서 refetch를 하나로 묶을 수 없다. 다른 탭 목록까지 같이 갱신되지만 사용자가
      // 명시적으로 당겼을 때 한 번뿐이라 감수한다 — 비용이 보이면 키 접두사로 좁힐 것.
      await queryClient.refetchQueries({ type: 'active' });
    } finally {
      setRefreshing(false);
    }
  }, [syncUserCoords]);

  const { useNotificationsQuery } = useNotification();
  const { data: notifications = [] } = useNotificationsQuery();
  const hasUnread = notifications.some((item) => !item.isRead);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={BRAND} colors={[BRAND]} />
        }
        // TAB_BAR_HEIGHT·insets.bottom을 더하지 않는다 — MainTab이 기본(non-absolute) 하단 탭
        // 내비게이터라 화면 영역이 이미 탭바 높이를 뺀 크기로 잡히고, 시스템 내비바는 탭바 자신의
        // paddingBottom(TabBar.tsx)이 덮는다. 필요한 건 마지막 콘텐츠와 탭바 사이의 최소 여백뿐이다.
        contentContainerStyle={{ paddingBottom: SPACING_LG }}
      >
        <HeroSection
          onNotificationPress={() => navigation.navigate('Notification')}
          hasUnread={hasUnread}
          lat={userLocation.isReal ? userLocation.lat : undefined}
          lng={userLocation.isReal ? userLocation.lng : undefined}
        />

        {/* 히어로 → 흰 배경 페이드 */}
        <LinearGradient
          colors={['#f0c89a', '#ffffff']}
          style={{ height: normalize(40), marginTop: -1 }}
        />

        <SearchBar
          onPress={() => navigation.navigate('SearchResult', { query: '' })}
        />

        {/* 주변 스팟 섹션 */}
        <View style={{ paddingHorizontal: CONTENT_PADDING, marginTop: normalize(28) }}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, color: '#000', letterSpacing: -0.4 }}
          >
            내 주변 포토스팟
          </Text>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: TEXT_SUB, marginTop: normalize(4), marginBottom: normalize(14) }}
          >
            {isPermissionDenied
              ? '위치 권한이 꺼져 있어요'
              : userLocation.isReal
              ? `${userAddress} 기준 · 반경 5km · 탭하면 전체 지도로 이동`
              : '위치 탐색 중 · 반경 5km · 탭하면 전체 지도로 이동'}
          </Text>
          {isPermissionDenied ? (
            <View
              style={{
                width: '100%',
                height: normalize(160),
                borderRadius: CARD_RADIUS,
                backgroundColor: CARD,
                paddingHorizontal: normalize(20),
                alignItems: 'center',
                justifyContent: 'center',
                gap: normalize(10),
              }}
            >
              <View style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(20), backgroundColor: BRAND_TINT, alignItems: 'center', justifyContent: 'center' }}>
                <IconMapPin size={normalize(20)} color={BRAND} />
              </View>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: '#000', textAlign: 'center', letterSpacing: -0.2 }}
              >
                위치 권한을 허용하면 내 주변 포토스팟을 볼 수 있어요
              </Text>
              <Pressable
                onPress={() => Linking.openSettings()}
                hitSlop={8}
                style={{
                  backgroundColor: BRAND,
                  paddingHorizontal: normalize(16),
                  paddingVertical: normalize(8),
                  borderRadius: BUTTON_RADIUS,
                }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff' }}>
                  설정에서 권한 켜기
                </Text>
              </Pressable>
            </View>
          ) : (
            <MapBanner
              onPress={() => {
                const parent = navigation.getParent();
                if (parent) {
                  parent.navigate('MapTab' as never);
                } else {
                  (navigation as any).navigate('MapTab');
                }
              }}
              spotCount={userLocation.isReal ? nearbySpots.length : 0}
              isLoading={!userLocation.isReal || isNearbyLoading}
              userLocation={userLocation.isReal ? { lat: userLocation.lat, lng: userLocation.lng } : undefined}
              spots={userLocation.isReal ? nearbySpots : []}
            />
          )}
        </View>

        <PopularSpotsSection
          onSpotPress={goToSpotDetail}
          onViewAll={() => navigation.navigate('SearchResult', { sort: 'popular' })}
        />

        <RecommendedSpotsSection
          onSpotPress={goToSpotDetail}
          onSetThemes={() =>
            (navigation as any).navigate('Main', {
              screen: 'MyPageTab',
              // initial: false — 없으면 MY 탭 스택이 [Setting] 하나로 시작해
              // 뒤로가기가 홈으로 튀고, MY 탭을 다시 눌러도 설정 화면이 남는다.
              params: { screen: 'Setting', params: { openThemeSheet: true }, initial: false },
            })
          }
        />

        <FestivalSection
          onEventPress={goToSpotDetail}
          onViewAll={() => navigation.navigate('FestivalList')}
        />

        <SeasonalSpotSection
          onSpotPress={goToSpotDetail}
          onViewAll={(query) => navigation.navigate('SearchResult', { query })}
        />
        <LinkBanner
          icon={IconBell}
          title="출사 알림 조건 설정"
          subtitle="원하는 날씨가 되면 알려드려요"
          marginTop={normalize(28)}
          onPress={() => (navigation as any).navigate('Wishlist')}
        />

      </ScrollView>
    </View>
  );
}
