import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityFeedScreen from '@/screens/community/CommunityFeedScreen';
import CommunityWriteScreen from '@/screens/community/CommunityWriteScreen';
import ContestScreen from '@/screens/community/ContestScreen';

export type CommunityStackParamList = {
  CommunityFeed: undefined;
  CommunityWrite: undefined;
  Contest: undefined;
};

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export default function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityFeed" component={CommunityFeedScreen} />
      <Stack.Screen name="CommunityWrite" component={CommunityWriteScreen} />
      <Stack.Screen name="Contest" component={ContestScreen} />
    </Stack.Navigator>
  );
}
