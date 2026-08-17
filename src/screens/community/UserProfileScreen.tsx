import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import ProfilePostsTab from '@/components/community/ProfilePostsTab';
import ProfileContestsTab from '@/components/community/ProfileContestsTab';
import ProfileSpotsTab from '@/components/community/ProfileSpotsTab';
import { useFollowCounts, useMyFollowing, useToggleFollow, useUserProfile } from '@/hooks/useCommunity';
import { initialsOf } from '@/utils/communityMappers';
import type { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { ProfileContestItem, ProfilePostItem, ProfileSpotItem, ProfileTabKey } from '@/types/community';
import { FONT_XL, HEADER_HEIGHT, CONTENT_PADDING, FONT_2XS, FONT_LG, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

// ponytail: 아래 세 목록과 우승 횟수·자기소개는 서버에 API가 없다.
// `/users/{id}/profile`이 주는 건 닉네임·프로필사진·관심 카테고리뿐이고,
// 특정 유저의 게시글/콘테스트/방문 스팟을 조회하는 엔드포인트가 아직 없다.
// 목데이터를 지우면 탭이 통째로 빈 화면이 되므로, 서버가 생길 때까지 그대로 둔다.
const CONTEST_COUNT = 18;
const SPOT_COUNT = 36;

const MOCK_POSTS: ProfilePostItem[] = [
  { id: 'p1', photoGradient: ['#0f2027', '#203a43', '#4a7c8a'], likeCount: 248 },
  { id: 'p2', photoGradient: ['#1a1530', '#b44a3a', '#f0c89a'], likeCount: 312, contestRank: 1 },
  { id: 'p3', photoGradient: ['#232526', '#8e7b5a', '#8e7b5a'], likeCount: 96 },
  { id: 'p4', photoGradient: ['#1a1510', '#a08060', '#a08060'], likeCount: 142 },
  { id: 'p5', photoGradient: ['#0a1a0f', '#4a8060', '#4a8060'], likeCount: 58 },
  { id: 'p6', photoGradient: ['#020010', '#1a1545', '#1a1545'], likeCount: 203 },
  { id: 'p7', photoGradient: ['#1a0f1e', '#c080a0', '#c080a0'], likeCount: 77 },
  { id: 'p8', photoGradient: ['#2a2e35', '#6a7580', '#6a7580'], likeCount: 164 },
  { id: 'p9', photoGradient: ['#0f1a2a', '#2a5a8a', '#2a5a8a'], likeCount: 45 },
  { id: 'p10', photoGradient: ['#1a0a0a', '#8a3030', '#8a3030'], likeCount: 88 },
  { id: 'p11', photoGradient: ['#0a2020', '#40a090', '#40a090'], likeCount: 121 },
  { id: 'p12', photoGradient: ['#0f2027', '#e8a87c', '#e8a87c'], likeCount: 167 },
];

const MOCK_CONTESTS: ProfileContestItem[] = [
  { id: 'c1', theme: '골든아워', rank: 1, voteCount: 67, gradient: ['#1a1530', '#b44a3a', '#f0c89a'], status: 'active' },
  { id: 'c2', theme: '숲 산책', rank: 1, voteCount: 89, gradient: ['#0a1a0f', '#4a8060', '#a8c090'], status: 'won' },
  { id: 'c3', theme: '골목의 낮', rank: 3, voteCount: 41, gradient: ['#1a1510', '#a08060', '#a08060'], status: 'ended' },
  { id: 'c4', theme: '밤하늘', rank: 1, voteCount: 124, gradient: ['#020010', '#1a1545', '#4a4080'], status: 'won' },
];

const MOCK_SPOTS: ProfileSpotItem[] = [
  { id: 's1', name: '광안리 해수욕장', address: '부산 수영구 광안해변로 219', lastVisitLabel: '어제 방문', visitCount: 8, photoCount: 42, gradient: ['#0f2027', '#203a43', '#4a7c8a'] },
  { id: 's2', name: '경복궁 야간개장', address: '서울 종로구 사직로 161', lastVisitLabel: '3주 전 방문', visitCount: 5, photoCount: 26, gradient: ['#1a1530', '#4a1942', '#e8855a'] },
  { id: 's3', name: '세운상가', address: '서울 종로구 청계천로 159', lastVisitLabel: '2일 전 방문', visitCount: 4, photoCount: 18, gradient: ['#232526', '#8e7b5a', '#8e7b5a'] },
  { id: 's4', name: '해운대 달맞이길', address: '부산 해운대구 달맞이길', lastVisitLabel: '1개월 전 방문', visitCount: 3, photoCount: 12, gradient: ['#0a1a0f', '#4a8060', '#4a8060'] },
];

const SUBTABS: { key: ProfileTabKey; label: string; count: number }[] = [
  { key: 'posts', label: '게시글', count: MOCK_POSTS.length },
  { key: 'contests', label: '콘테스트', count: CONTEST_COUNT },
  { key: 'spots', label: '방문한 스팟', count: SPOT_COUNT },
];

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'UserProfile'>>();
  const userId = route.params?.userId;
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('posts');

  const { data: profile, isLoading, isError } = useUserProfile(userId);
  const { data: counts } = useFollowCounts(userId);
  const { data: followingIds } = useMyFollowing();
  const toggleFollow = useToggleFollow();

  const isFollowing = userId ? followingIds?.has(userId) ?? false : false;
  const nickname = profile?.nickname ?? '';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <View
        className="flex-row items-center"
        style={{ height: HEADER_HEIGHT, paddingHorizontal: normalize(20), gap: normalize(8), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          className="items-center justify-center"
          style={{ width: normalize(32), height: normalize(32) }}
        >
          <ChevronLeft size={normalize(24)} color="#000" strokeWidth={1.8} />
        </Pressable>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4 }}>
          {nickname ? `@${nickname}` : '프로필'}
        </Text>
      </View>

      {isLoading || isError || !profile ? (
        <View className="items-center justify-center" style={{ flex: 1 }}>
          {isLoading ? (
            <ActivityIndicator color={ACCENT} />
          ) : (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
              프로필을 불러오지 못했어요
            </Text>
          )}
        </View>
      ) : (
      <ScrollView contentContainerStyle={{ paddingBottom: normalize(24) }}>
        <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(24), paddingBottom: normalize(16) }}>
          <View className="flex-row items-center" style={{ gap: normalize(16), marginBottom: normalize(16) }}>
            <View
              className="items-center justify-center overflow-hidden"
              style={{ width: normalize(80), height: normalize(80), borderRadius: normalize(40), backgroundColor: SURFACE }}
            >
              {profile.profileImageUrl ? (
                <Image source={{ uri: profile.profileImageUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, color: 'rgba(0,0,0,0.3)', letterSpacing: -0.5 }}>
                  {initialsOf(nickname)}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.3 }}>
                {nickname}
              </Text>
              {/* 자기소개·콘테스트 우승 횟수는 프로필 API에 없어 표시하지 않는다 */}
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.15, marginTop: normalize(2) }}>
                @{nickname}
              </Text>
              {profile.spotCategories?.length > 0 && (
                <View className="flex-row flex-wrap" style={{ gap: normalize(4), marginTop: normalize(8) }}>
                  {profile.spotCategories.map((category) => (
                    <View
                      key={category}
                      className="items-center justify-center"
                      style={{ height: normalize(22), paddingHorizontal: normalize(9), borderRadius: normalize(11), backgroundColor: 'rgba(227,27,89,0.08)' }}
                    >
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: ACCENT, letterSpacing: -0.1 }}>
                        {category}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* 게시글 수 카운트는 유저별 게시글 API가 없어 뺐다 — 팔로워·팔로잉만 서버 값이다 */}
          <View className="flex-row" style={{ paddingVertical: normalize(14), paddingHorizontal: normalize(4), backgroundColor: SURFACE, borderRadius: normalize(14), marginBottom: normalize(16) }}>
            <View className="flex-1 items-center">
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.3 }}>
                {(counts?.followerCount ?? 0).toLocaleString()}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1, marginTop: normalize(1) }}>
                팔로워
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <View className="flex-1 items-center">
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.3 }}>
                {(counts?.followingCount ?? 0).toLocaleString()}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1, marginTop: normalize(1) }}>
                팔로잉
              </Text>
            </View>
          </View>

          <View className="flex-row" style={{ gap: normalize(8) }}>
            <Pressable
              onPress={() => userId && toggleFollow.mutate({ userId, next: !isFollowing })}
              disabled={!userId || toggleFollow.isPending}
              className="flex-1 items-center justify-center"
              style={{ height: normalize(44), borderRadius: normalize(22), backgroundColor: isFollowing ? SURFACE : ACCENT }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: isFollowing ? 'rgba(0,0,0,0.55)' : '#fff', letterSpacing: -0.2 }}>
                {isFollowing ? '팔로잉' : '팔로우'}
              </Text>
            </Pressable>
            <Pressable
              disabled
              className="flex-1 items-center justify-center"
              style={{ height: normalize(44), borderRadius: normalize(22), backgroundColor: SURFACE, position: 'relative' }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.35)', letterSpacing: -0.2 }}>
                메시지
              </Text>
              <View
                className="absolute items-center justify-center"
                style={{ top: normalize(-6), right: normalize(6), height: normalize(16), paddingHorizontal: normalize(6), borderRadius: normalize(8), backgroundColor: ACCENT }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff', letterSpacing: 0.5 }}>
                  BETA
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        <View className="flex-row" style={{ paddingHorizontal: CONTENT_PADDING, gap: normalize(20), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' }}>
          {SUBTABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{ paddingTop: normalize(16), paddingBottom: normalize(10), borderBottomWidth: isActive ? 2 : 0, borderBottomColor: ACCENT, marginBottom: -1 }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: isActive ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, color: isActive ? '#000' : 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                  {tab.label} <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', color: isActive ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)' }}>{tab.count}</Text>
                </Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'posts' && <ProfilePostsTab items={MOCK_POSTS} />}
        {activeTab === 'contests' && <ProfileContestsTab items={MOCK_CONTESTS} />}
        {activeTab === 'spots' && <ProfileSpotsTab items={MOCK_SPOTS} totalCount={SPOT_COUNT} onSelectSpot={() => {}} />}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
