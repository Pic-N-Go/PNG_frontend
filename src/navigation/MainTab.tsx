import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStack from './stacks/HomeStack';
import TravelStack from './stacks/TravelStack';
import CommunityStack from './stacks/CommunityStack';
import MyPageStack from './stacks/MyPageStack';

export type MainTabParamList = {
  HomeTab: undefined;
  TravelTab: undefined;
  CommunityTab: undefined;
  MyPageTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTab() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="TravelTab" component={TravelStack} />
      <Tab.Screen name="CommunityTab" component={CommunityStack} />
      <Tab.Screen name="MyPageTab" component={MyPageStack} />
    </Tab.Navigator>
  );
}
