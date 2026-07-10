import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SpotDetailScreen from '@/screens/spot/SpotDetailScreen';
import ReviewWriteScreen from '@/screens/spot/ReviewWriteScreen';
import PhotoDetailScreen from '@/screens/spot/PhotoDetailScreen';

export type SpotStackParamList = {
  SpotDetail: { spotId: string };
  ReviewWrite: { spotId: string };
  PhotoDetail: { photoId: string; spotId: string };
};

const Stack = createNativeStackNavigator<SpotStackParamList>();

export default function SpotStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpotDetail" component={SpotDetailScreen} />
      <Stack.Screen name="ReviewWrite" component={ReviewWriteScreen} />
      <Stack.Screen name="PhotoDetail" component={PhotoDetailScreen} />
    </Stack.Navigator>
  );
}
