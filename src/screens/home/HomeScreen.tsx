
import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, Image, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/stacks/HomeStack';
import type { RootStackParamList } from '@/navigation';
import { CONTENT_PADDING, FONT_SM, FONT_XS, FONT_XL, SPACING_LG, CARD_RADIUS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import HeroSection from '@/components/home/HeroSection';
import SearchBar from '@/components/home/SearchBar';
import CategoryFilter from '@/components/home/CategoryFilter';
import MapBanner from '@/components/home/MapBanner';
import PopularSpotsSection from '@/components/home/PopularSpotsSection';
import CalendarSection from '@/components/home/CalendarSection';
import SpotAlertBanner from '@/components/home/SpotAlertBanner';
import FilterBottomSheet from '@/components/home/FilterBottomSheet';
import { useNotification } from '@/hooks/useNotification';
import { useNearbySpots } from '@/hooks/useSpot';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

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

  const [userAddress, setUserAddress] = useState<string>('서울시');

  useEffect(() => {
    const initUserLocation = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
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
        console.warn('[HomeScreen] initUserLocation error:', err);
      }
    };
    void initUserLocation();
  }, []);

  // 사용자 주소 역지오코딩 (예: '서울 종로구', '부산 수영구')
  useEffect(() => {
    const fetchAddress = async () => {
      try {
        if (userLocation.isReal && userLocation.lat && userLocation.lng) {
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          });
          if (geo) {
            const region = (geo.region || geo.city || '')
              .replace('서울특별시', '서울')
              .replace('부산광역시', '부산')
              .replace('대구광역시', '대구')
              .replace('인천광역시', '인천')
              .replace('광주광역시', '광주')
              .replace('대전광역시', '대전')
              .replace('울산광역시', '울산')
              .replace('세종특별자치시', '세종')
              .replace('경기도', '경기')
              .replace('강원특별자치도', '강원')
              .replace('충청북도', '충북')
              .replace('충청남도', '충남')
              .replace('전라북도', '전북')
              .replace('전라남도', '전남')
              .replace('경상북도', '경북')
              .replace('경상남도', '경남')
              .replace('제주특별자치도', '제주');
            const district = geo.district || geo.city || geo.subregion || '';
            const fullAddr = `${region} ${district}`.trim();
            if (fullAddr) {
              setUserAddress(fullAddr);
            }
          }
        }
      } catch (err) {
        console.warn('[HomeScreen] reverseGeocodeAsync error:', err);
      }
    };
    void fetchAddress();
  }, [userLocation.isReal, userLocation.lat, userLocation.lng]);

  const { data: nearbySpots = [], isLoading: isNearbyLoading } = useNearbySpots({
    lat: userLocation.lat,
    lng: userLocation.lng,
    radiusKm: 5.0,
    limit: 20,
  });

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
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', marginTop: normalize(4), marginBottom: normalize(14) }}
          >
            {userAddress} 기준 · 반경 5km · 탭하면 전체 지도로 이동
          </Text>
          <MapBanner
            onPress={() => navigation.getParent()?.navigate('MapTab' as never)}
            spotCount={nearbySpots.length}
            isLoading={isNearbyLoading}
            userLocation={{ lat: userLocation.lat, lng: userLocation.lng }}
            spots={nearbySpots}
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
        <SpotAlertBanner onPress={() => (navigation as any).navigate('Wishlist')} />

      </ScrollView>

      <FilterBottomSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApply={(count) => setActiveFilterCount(count)}
      />

    </View>
  );
}
