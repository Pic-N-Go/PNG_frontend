import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@/screens/home/HomeScreen';
import MapScreen from '@/screens/home/MapScreen';
import SpotStack from './SpotStack';

export type HomeStackParamList = {
  Home: undefined;
  Map: undefined;
  SpotStack: { spotId: string };
  SearchResult: { query: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
    </Stack.Navigator>
  );
}
