import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// TODO: 지도 API 확정 후 MapScreen 실제 구현 필요 (현재 placeholder)
import MapScreen from '@/screens/home/MapScreen';
import MapSearchScreen from '@/screens/search/MapSearchScreen';
import SearchResultScreen from '@/screens/search/SearchResultScreen';
import type { Spot } from '@/store/useCourseStore';

export type MapStackParamList = {
  // Map은 여러 진입점(출사 코스 만들기/보기, 위시리스트 변경)에서 각기 다른 파라미터를 들고
  // 들어오고 MapScreen이 useRoute<any>로 느슨하게 읽는다. 검색이 돌려주는 값만 명시하고
  // 나머지는 인덱스 시그니처로 열어 둔다.
  Map:
    | {
        /** MapSearch에서 고른 스팟 — 지도를 이 좌표로 이동시킨다. */
        searchSelectedSpot?: Spot;
        /** MapSearch에서 제출한 키워드 */
        searchKeyword?: string;
        /** 같은 값을 다시 골라도 지도 쪽 effect가 다시 돌게 하는 값 */
        searchNonce?: number;
        [key: string]: unknown;
      }
    | undefined;
  MapSearch: undefined;
  SearchResult: { query: string };
};

const Stack = createNativeStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="MapSearch" component={MapSearchScreen} />
      <Stack.Screen name="SearchResult" component={SearchResultScreen} />
    </Stack.Navigator>
  );
}
