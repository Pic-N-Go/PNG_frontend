import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TravelListScreen from '@/screens/travel/TravelListScreen';
import TravelPlanScreen from '@/screens/travel/TravelPlanScreen';
import TravelNewScreen from '@/screens/travel/TravelNewScreen';

import MapScreen from '@/screens/home/MapScreen';
import SearchResultScreen from '@/screens/search/SearchResultScreen';

export type CourseStackParamList = {
  CourseList: undefined;
  CoursePlan: { planId: string };
  CourseNew: undefined;

  // 호환용 에일리어스
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

const Stack = createNativeStackNavigator<CourseStackParamList>();

export default function CourseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CourseList" component={TravelListScreen} />
      <Stack.Screen name="CoursePlan" component={TravelPlanScreen} />
      <Stack.Screen name="CourseNew" component={TravelNewScreen} />

      <Stack.Screen name="TravelList" component={TravelListScreen} />
      <Stack.Screen name="TravelPlan" component={TravelPlanScreen} />
      <Stack.Screen name="TravelNew" component={TravelNewScreen} />

      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="SearchResult" component={SearchResultScreen} />
    </Stack.Navigator>
  );
}
