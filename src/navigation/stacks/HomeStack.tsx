import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/screens/home/HomeScreen';
import SearchResultScreen from '@/screens/search/SearchResultScreen';
import NotificationScreen from '@/screens/home/NotificationScreen';
import FestivalListScreen from '@/screens/festival/FestivalListScreen';

export type HomeStackParamList = {
  Home: undefined;
  // sort: 'popular'이면 키워드 없이 인기순 스팟 전체 목록으로 진입한다 (홈 "모두 보기").
  SearchResult: { query?: string; sort?: 'popular' };
  Notification: undefined;
  FestivalList?: { status?: 'ONGOING' | 'UPCOMING' | 'ALL' };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SearchResult" component={SearchResultScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="FestivalList" component={FestivalListScreen} />
    </Stack.Navigator>
  );
}
