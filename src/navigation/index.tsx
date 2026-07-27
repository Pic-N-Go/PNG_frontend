import React from 'react';
import { 
  NavigationContainer, 
  createNavigationContainerRef,
  type NavigatorScreenParams 
} from '@react-navigation/native';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const [hydrated, setHydrated] = React.useState(false);
  const [isNavReady, setIsNavReady] = React.useState(false);
  const pendingSpotIdRef = React.useRef<string | null>(null);

  const handleDeepLinkNav = React.useCallback((deepLink: string) => {
    let spotId = deepLink;
    const match = deepLink.match(/spot\/(\d+)/) || deepLink.match(/spotId=(\d+)/);
    if (match) {
      spotId = match[1];
    }

    if (navigationRef.isReady() && isLoggedIn) {
      (navigationRef as any).navigate('SpotStack', {
        screen: 'SpotDetail',
        params: { id: spotId },
      });
    } else {
      pendingSpotIdRef.current = spotId;
    }
  }, [isLoggedIn]);

  // 푸시 알림 딥링크 핸들러 주입
  usePushNotifications(handleDeepLinkNav);

  React.useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  React.useEffect(() => {
    if (isNavReady && isLoggedIn && pendingSpotIdRef.current) {
      const spotId = pendingSpotIdRef.current;
      pendingSpotIdRef.current = null;
      (navigationRef as any).navigate('SpotStack', {
        screen: 'SpotDetail',
        params: { id: spotId },
      });
    }
  }, [isNavReady, isLoggedIn]);

  if (!hydrated) return null;

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setIsNavReady(true)}
    >
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
