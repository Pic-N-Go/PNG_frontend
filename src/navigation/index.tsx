import React from 'react';
import { NavigationContainer, createNavigationContainerRef, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTab from './MainTab';
import SpotStack, { type SpotStackParamList } from './stacks/SpotStack';
import WishlistScreen from '@/screens/wishlist/WishlistScreen';
import WishlistSettingScreen from '@/screens/wishlist/WishlistSettingScreen';
import MapScreen from '@/screens/home/MapScreen';
import { useAuthStore } from '@/store/useAuthStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export type RootStackParamList = {
  Main: undefined;
  SpotStack: NavigatorScreenParams<SpotStackParamList>;
  Wishlist: undefined;
  WishlistSetting: { id?: number; wishlist?: any; spotId?: string; newSpot?: any; newWishlist?: any };
  Map: { source?: string; newSpot?: any };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let pendingSpotId: string | null = null;

function navigateToSpotDetail(spotId: string) {
  (navigationRef as any).navigate('SpotStack', {
    screen: 'SpotDetail',
    params: { id: spotId, spotId },
  });
}

function handleDeepLinkNav(deepLink: string) {
  const spotIdMatch = deepLink.match(/(?:spotId=|\/spot\/|^)(\d+)/);
  if (!spotIdMatch || !spotIdMatch[1]) return;

  const spotId = spotIdMatch[1];
  if (navigationRef.isReady()) {
    navigateToSpotDetail(spotId);
  } else {
    pendingSpotId = spotId;
  }
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const [hydrated, setHydrated] = React.useState(false);
  const [isNavReady, setIsNavReady] = React.useState(false);

  // 푸시 알림 초기화 및 토큰 갱신 훅 호출 (딥링크 이동 콜백 연결)
  usePushNotifications(handleDeepLinkNav);

  React.useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // 인증 완료 및 네비게이션 준비 시 대기 중인 pendingSpotId가 있으면 딥링크 네비게이션 재실행
  React.useEffect(() => {
    if (isLoggedIn && isNavReady && pendingSpotId) {
      const targetSpotId = pendingSpotId;
      pendingSpotId = null;
      navigateToSpotDetail(targetSpotId);
    }
  }, [isLoggedIn, isNavReady]);

  const handleContainerReady = React.useCallback(() => {
    setIsNavReady(true);
    if (isLoggedIn && pendingSpotId) {
      const targetSpotId = pendingSpotId;
      pendingSpotId = null;
      navigateToSpotDetail(targetSpotId);
    }
  }, [isLoggedIn]);

  if (!hydrated) return null;

  return (
    <NavigationContainer ref={navigationRef} onReady={handleContainerReady}>
      {isLoggedIn ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainTab} />
          <Stack.Screen name="SpotStack" component={SpotStack} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} />
          <Stack.Screen name="WishlistSetting" component={WishlistSettingScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
        </Stack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
