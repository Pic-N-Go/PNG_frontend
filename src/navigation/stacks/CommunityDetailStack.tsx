import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostDetailScreen from '@/screens/community/PostDetailScreen';
import CommunityWriteScreen from '@/screens/community/CommunityWriteScreen';
import ContestResultScreen from '@/screens/community/ContestResultScreen';
import UserProfileScreen from '@/screens/community/UserProfileScreen';
import ContestAllEntriesScreen from '@/screens/community/ContestAllEntriesScreen';
import ContestSubmitScreen from '@/screens/community/ContestSubmitScreen';
import ContestEntryDetailScreen from '@/screens/community/ContestEntryDetailScreen';
import type { ContestSubmitTarget } from '@/types/community';

export type CommunityDetailStackParamList = {
  PostDetail: { postId: string; isMyPost?: boolean };
  /** postId가 있으면 그 글의 수정 모드로 연다. 없으면 새 글 작성. */
  CommunityWrite: { postId?: string } | undefined;
  /** submitTarget: 빈 상태 CTA가 출품 화면으로 넘길 값. 없으면 출품 경로를 막는다(남은 자리를 모르므로) */
  ContestAllEntries: { mode?: 'voting' | 'past'; submitTarget?: ContestSubmitTarget } | undefined;
  ContestResult: { monthLabel?: string; myRank?: number | null; myVotes?: number; participantCount?: number; totalVotes?: number } | undefined;
  /** userId 없이 열면 서버에서 받아올 대상이 없어 빈 프로필이 뜬다 — 진입점에서 반드시 넘긴다 */
  UserProfile: { userId?: string } | undefined;
  ContestSubmit: { theme?: string; monthLabel?: string; remainingSlots?: number } | undefined;
  ContestEntryDetail: { entryId?: string; isMine?: boolean; isEnded?: boolean; rank?: number; totalCount?: number; voteCount?: number } | undefined;
};

const Stack = createNativeStackNavigator<CommunityDetailStackParamList>();

/**
 * 커뮤니티의 push 화면 7개(게시글 상세/글쓰기/전체 출품작/콘테스트 결과/프로필/출품 작성/출품작 상세)는
 * 탭바가 없어야 하므로 `CommunityStack`(탭 안쪽) 대신 `SpotStack`과 동일하게 RootStack의 형제 스크린으로 둔다.
 * `CommunityFeedScreen`에서는 `navigation.navigate('CommunityDetailStack', { screen: ... })`로 진입한다.
 */
export default function CommunityDetailStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="CommunityWrite" component={CommunityWriteScreen} />
      <Stack.Screen name="ContestAllEntries" component={ContestAllEntriesScreen} />
      <Stack.Screen name="ContestResult" component={ContestResultScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="ContestSubmit" component={ContestSubmitScreen} />
      <Stack.Screen name="ContestEntryDetail" component={ContestEntryDetailScreen} />
    </Stack.Navigator>
  );
}
