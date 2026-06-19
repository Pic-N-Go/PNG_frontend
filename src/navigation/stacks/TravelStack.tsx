import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TravelListScreen from '@/screens/travel/TravelListScreen';
import TravelPlanScreen from '@/screens/travel/TravelPlanScreen';
import TravelNewScreen from '@/screens/travel/TravelNewScreen';
import WishlistScreen from '@/screens/wishlist/WishlistScreen';
import WishlistSettingScreen from '@/screens/wishlist/WishlistSettingScreen';

export type TravelStackParamList = {
  TravelList: undefined;
  TravelPlan: { planId: string };
  TravelNew: undefined;
  Wishlist: undefined;
  WishlistSetting: { spotId: string };
};

const Stack = createNativeStackNavigator<TravelStackParamList>();

export default function TravelStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TravelList" component={TravelListScreen} />
      <Stack.Screen name="TravelPlan" component={TravelPlanScreen} />
      <Stack.Screen name="TravelNew" component={TravelNewScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="WishlistSetting" component={WishlistSettingScreen} />
    </Stack.Navigator>
  );
}
