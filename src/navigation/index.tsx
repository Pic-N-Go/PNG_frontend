import React from 'react';
import { NavigationContainer, type NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthStack from './AuthStack';
import MainTab from './MainTab';
import SpotStack, { type SpotStackParamList } from './stacks/SpotStack';
import WishlistScreen from '@/screens/wishlist/WishlistScreen';
import WishlistSettingScreen from '@/screens/wishlist/WishlistSettingScreen';
import MapScreen from '@/screens/home/MapScreen';
import { useAuthStore } from '@/store/useAuthStore';

export type RootStackParamList = {
  Main: undefined;
  SpotStack: NavigatorScreenParams<SpotStackParamList>;
  Wishlist: undefined;
  WishlistSetting: { id?: number; wishlist?: any; spotId?: string; newSpot?: any; newWishlist?: any };
  Map: { source?: string; newSpot?: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated) return null;

  return (
    <NavigationContainer>
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
