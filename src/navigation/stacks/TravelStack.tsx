import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TravelListScreen from '@/screens/travel/TravelListScreen';
import TravelPlanScreen from '@/screens/travel/TravelPlanScreen';
import TravelNewScreen from '@/screens/travel/TravelNewScreen';

import MapScreen from '@/screens/home/MapScreen';
import SearchResultScreen from '@/screens/search/SearchResultScreen';

export type TravelStackParamList = {
  TravelList: undefined;
  TravelPlan: { planId: string };
  TravelNew: undefined;

  Map: { 
    source?: 'plan' | string;
    spots?: any[];
    from?: string;
    planId?: string;
  };
  SearchResult: { query: string };
};

const Stack = createNativeStackNavigator<TravelStackParamList>();

export default function TravelStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TravelList" component={TravelListScreen} />
      <Stack.Screen name="TravelPlan" component={TravelPlanScreen} />
      <Stack.Screen name="TravelNew" component={TravelNewScreen} />

      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="SearchResult" component={SearchResultScreen} />
    </Stack.Navigator>
  );
}
