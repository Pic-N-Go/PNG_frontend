import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityFeedScreen from '@/screens/community/CommunityFeedScreen';

export type CommunityStackParamList = {
  CommunityFeed: undefined;
};

const Stack = createNativeStackNavigator<CommunityStackParamList>();

export default function CommunityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityFeed" component={CommunityFeedScreen} />
    </Stack.Navigator>
  );
}
