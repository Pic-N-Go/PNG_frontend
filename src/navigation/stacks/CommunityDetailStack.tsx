import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostDetailScreen from '@/screens/community/PostDetailScreen';
import CommunityWriteScreen from '@/screens/community/CommunityWriteScreen';
import ContestResultScreen from '@/screens/community/ContestResultScreen';
import UserProfileScreen from '@/screens/community/UserProfileScreen';

export type CommunityDetailStackParamList = {
  PostDetail: { isMyPost?: boolean } | undefined;
  CommunityWrite: undefined;
  ContestResult: undefined;
  UserProfile: undefined;
};

const Stack = createNativeStackNavigator<CommunityDetailStackParamList>();

/**
 * 커뮤니티의 push 화면 4개(게시글 상세/글쓰기/콘테스트 결과/프로필)는 탭바가 없어야 하므로
 * `CommunityStack`(탭 안쪽) 대신 `SpotStack`과 동일하게 RootStack의 형제 스크린으로 둔다.
 * `CommunityFeedScreen`에서는 `navigation.navigate('CommunityDetailStack', { screen: ... })`로 진입한다.
 */
export default function CommunityDetailStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CommunityWrite" component={CommunityWriteScreen} />
      <Stack.Screen name="ContestResult" component={ContestResultScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}
