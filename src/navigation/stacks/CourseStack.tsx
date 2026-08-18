import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TravelListScreen from '@/screens/travel/TravelListScreen';
import TravelPlanScreen from '@/screens/travel/TravelPlanScreen';
import TravelNewScreen from '@/screens/travel/TravelNewScreen';

import MapScreen from '@/screens/home/MapScreen';
import MapSearchScreen from '@/screens/search/MapSearchScreen';
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
    // MapSearch가 돌려주는 값 (MapStack의 Map과 동일 규약)
    searchSelectedSpot?: any;
    searchKeyword?: string;
    searchNonce?: number;
  };
  // MapScreen이 이 스택에도 등록돼 있어(코스 만들기 → 스팟 추가) 검색 화면도 함께 둬야 한다.
  // 여기 없으면 코스 흐름에서 검색창을 눌렀을 때 NAVIGATE가 처리되지 않고 에러가 난다.
  MapSearch: undefined;
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
      <Stack.Screen name="MapSearch" component={MapSearchScreen} />
      <Stack.Screen name="SearchResult" component={SearchResultScreen} />
    </Stack.Navigator>
  );
}
