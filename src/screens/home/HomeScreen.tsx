
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
        // paddingBottom(TabBar.tsx)이 덮는다. 여기서 또 더하면 그만큼 죽은 공백이 두 배로 생긴다.
        // 필요한 건 마지막 콘텐츠와 탭바 사이의 최소 여백뿐이다.
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
            {userLocation.isReal ? '내 위치 기준' : '서울시 기준'} · 반경 5km · 탭하면 전체 지도로 이동
          </Text>
          <MapBanner
            onPress={() => navigation.getParent()?.navigate('MapTab' as never)}
            spotCount={nearbySpots.length}
            isLoading={isNearbyLoading}
          />

          {/* 주변 스팟 실시간 카드 스크롤 목록 */}
          {nearbySpots.length > 0 && (
            <View style={{ marginTop: normalize(14) }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: normalize(10) }}
              >
                {nearbySpots.map((spot) => (
                  <Pressable
                    key={spot.id}
                    onPress={() => {
                      const rootNavigation = navigation as unknown as NativeStackNavigationProp<RootStackParamList>;
                      rootNavigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: String(spot.id) } });
                    }}
                    style={({ pressed }) => ({
                      width: normalize(140),
                      borderRadius: CARD_RADIUS,
                      backgroundColor: '#F5F5F7',
                      overflow: 'hidden',
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    })}
                  >
                    <View style={{ height: normalize(100), backgroundColor: '#e0e0e0', position: 'relative' }}>
                      {spot.thumbnailUrl ? (
                        <Image source={{ uri: spot.thumbnailUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={['#2c5364', '#203a43', '#0f2027']} style={{ width: '100%', height: '100%' }} />
                      )}
                      <View
                        style={{
                          position: 'absolute',
                          bottom: normalize(6),
                          left: normalize(6),
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          paddingHorizontal: normalize(6),
                          paddingVertical: normalize(2),
                          borderRadius: normalize(8),
                        }}
                      >
                        <Text allowFontScaling={false} style={{ fontSize: FONT_XS, color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                          {spot.distanceKm < 1 ? `${Math.round(spot.distanceKm * 1000)}m` : `${spot.distanceKm.toFixed(1)}km`}
                        </Text>
                      </View>
                    </View>
                    <View style={{ padding: normalize(8) }}>
                      <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000' }}>
                        {spot.name}
                      </Text>
                      <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', marginTop: normalize(2) }}>
                        {spot.categories?.join(', ') || spot.address}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
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
