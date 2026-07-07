import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// TODO: 지도 API 확정 후 MapScreen 실제 구현 필요 (현재 placeholder)
import MapScreen from '@/screens/home/MapScreen';

export type MapStackParamList = {
  Map: undefined;
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Map" component={MapScreen} />
    </Stack.Navigator>
  );
}
