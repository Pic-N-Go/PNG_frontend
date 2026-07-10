import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/screens/home/HomeScreen';
import SearchResultScreen from '@/screens/search/SearchResultScreen';
import NotificationScreen from '@/screens/home/NotificationScreen';

export type HomeStackParamList = {
  Home: undefined;
  SearchResult: { query: string };
  Notification: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="SearchResult" component={SearchResultScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
    </Stack.Navigator>
  );
}
