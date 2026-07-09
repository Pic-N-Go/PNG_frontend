import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import HomeStack from './stacks/HomeStack';
import MapStack from './stacks/MapStack';
import TravelStack from './stacks/TravelStack';
import CommunityStack from './stacks/CommunityStack';
import MyPageStack from './stacks/MyPageStack';
import TabBar from '@/components/common/TabBar';

export type MainTabParamList = {
  HomeTab: undefined;
  MapTab: undefined;
  TravelTab: undefined;
  CommunityTab: undefined;
  MyPageTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} />
      <Tab.Screen name="MapTab" component={MapStack} />
      <Tab.Screen name="TravelTab" component={TravelStack} />
      <Tab.Screen name="CommunityTab" component={CommunityStack} />
      <Tab.Screen name="MyPageTab" component={MyPageStack} />
    </Tab.Navigator>
  );
}
