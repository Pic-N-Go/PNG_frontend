
import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, AppState } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/stacks/HomeStack';
import type { RootStackParamList } from '@/navigation';
import { CONTENT_PADDING, FONT_SM, FONT_XL, SPACING_LG } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import HeroSection from '@/components/home/HeroSection';
import SearchBar from '@/components/home/SearchBar';
import CategoryFilter from '@/components/home/CategoryFilter';
import MapBanner from '@/components/home/MapBanner';
import PopularSpotsSection from '@/components/home/PopularSpotsSection';
import CalendarSection from '@/components/home/CalendarSection';
import { IconBell } from '@tabler/icons-react-native';
import LinkBanner from '@/components/common/LinkBanner';
import FilterBottomSheet from '@/components/home/FilterBottomSheet';
import { useNotification } from '@/hooks/useNotification';
import { useNearbySpots } from '@/hooks/useSpot';
import { TEXT_SUB } from '@/constants/colors';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);

  // 현재 사용자 GPS 위치 관리 (기본값: 서울시청)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; isReal: boolean }>({
    lat: 37.5665,
    lng: 126.9780,
    isReal: false,
  });

  const [userAddress, setUserAddress] = useState<string>('내 위치');

  const syncUserCoords = useCallback(async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status === Location.PermissionStatus.UNDETERMINED) {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status === Location.PermissionStatus.GRANTED) {
        const lastKnown = await Location.getLastKnownPositionAsync();
        if (lastKnown) {
          setUserLocation({
            lat: lastKnown.coords.latitude,
            lng: lastKnown.coords.longitude,
            isReal: true,
          });
        }
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (current) {
          setUserLocation({
            lat: current.coords.latitude,
            lng: current.coords.longitude,
            isReal: true,
          });
        }
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
  }, [userLocation.isReal, userLocation.lat, userLocation.lng]);

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

  const { useNotificationsQuery } = useNotification();
  const { data: notifications = [] } = useNotificationsQuery();
  const hasUnread = notifications.some((item) => !item.isRead);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        // TAB_BAR_HEIGHT·insets.bottom을 더하지 않는다 — MainTab이 기본(non-absolute) 하단 탭
        // 내비게이터라 화면 영역이 이미 탭바 높이를 뺀 크기로 잡히고, 시스템 내비바는 탭바 자신의
        // paddingBottom(TabBar.tsx)이 덮는다. 필요한 건 마지막 콘텐츠와 탭바 사이의 최소 여백뿐이다.
        contentContainerStyle={{ paddingBottom: SPACING_LG }}
      >
        <HeroSection onNotificationPress={() => navigation.navigate('Notification')} hasUnread={hasUnread} />

        {/* 히어로 → 흰 배경 페이드 */}
        <LinearGradient
          colors={['#f0c89a', '#ffffff']}
          style={{ height: normalize(40), marginTop: -1 }}
        />

        <SearchBar
          onPress={() => navigation.navigate('SearchResult', { query: '' })}
          onFilterPress={() => setFilterVisible(true)}
          activeFilterCount={activeFilterCount}
        />

        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* 주변 스팟 섹션 */}
        <View style={{ paddingHorizontal: CONTENT_PADDING, marginTop: normalize(28) }}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, color: '#000', letterSpacing: -0.4 }}
          >
            내 주변 포토스팟
          </Text>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: TEXT_SUB, marginTop: normalize(4), marginBottom: normalize(14) }}
          >
            {userLocation.isReal ? `${userAddress} 기준 · 반경 5km · 탭하면 전체 지도로 이동` : '위치 탐색 중 · 반경 5km · 탭하면 전체 지도로 이동'}
          </Text>
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
        </View>

        <PopularSpotsSection
          onSpotPress={(id) => {
            // SpotStack은 HomeStack의 조상 네비게이터(RootStack)에 등록돼 있음 —
            // React Navigation이 자동으로 상위로 액션을 전파(bubbling)하므로 getParent() 체이닝 불필요
            const rootNavigation = navigation as unknown as NativeStackNavigationProp<RootStackParamList>;
            rootNavigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: id } });
          }}
        />

        <CalendarSection />
        <LinkBanner
          icon={IconBell}
          title="출사 알림 조건 설정"
          subtitle="원하는 날씨가 되면 알려드려요"
          marginTop={normalize(28)}
          onPress={() => (navigation as any).navigate('Wishlist')}
        />

      </ScrollView>

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={(count) => setActiveFilterCount(count)}
      />

    </View>
  );
}
