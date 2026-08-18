import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';
import ProfilePostsTab from '@/components/community/ProfilePostsTab';
import { useMyFollowing, useToggleFollow, useUserPosts, useUserProfile } from '@/hooks/useCommunity';
import { useAuthStore } from '@/store/useAuthStore';
import { initialsOf } from '@/utils/communityMappers';
import type { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { ProfilePostItem, ProfileTabKey } from '@/types/community';
import { FONT_XL, HEADER_HEIGHT, CONTENT_PADDING, FONT_2XS, FONT_LG, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

// ponytail: 콘테스트·방문 스팟은 아직 서버에 조회 API가 없어 목데이터를 남겨둔다.
// 게시글 탭만 GET /posts?authorId={id}로 실 데이터를 쓴다.
// 방문 스팟은 /users/me/stats가 개수(visitedSpotCount)만 주고 목록 API가 없으며, 그나마 본인 것뿐이다.
// 콘테스트·방문 스팟은 조회 API가 없다. 개수를 지어내면 BETA 뱃지를 붙여도 거짓 정보라
// count를 비우고(undefined) 준비 중 안내만 띄운다.
const subTabs = (postCount: number): { key: ProfileTabKey; label: string; count?: number; beta?: boolean }[] => [
  { key: 'posts', label: '게시글', count: postCount },
  { key: 'contests', label: '콘테스트', beta: true },
  { key: 'spots', label: '방문한 스팟', beta: true },
];

export default function UserProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList>>();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'UserProfile'>>();
  const userId = route.params?.userId;
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('posts');

  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const { data: profile, isLoading, isError } = useUserProfile(userId);
  const {
    data: userPosts,
    isLoading: postsLoading,
    isError: postsFailed,
    hasNextPage: hasMorePosts,
    fetchNextPage: fetchMorePosts,
    isFetchingNextPage: fetchingMorePosts,
  } = useUserPosts(userId);
  const { data: followingIds } = useMyFollowing();
  const toggleFollow = useToggleFollow();

  const isFollowing = userId ? followingIds?.has(userId) ?? false : false;
  const nickname = profile?.nickname ?? '';

  // 콘테스트 순위는 서버에 없어 넣지 않는다 — 넣으면 트로피 뱃지가 거짓값이 된다.
  const postItems: ProfilePostItem[] = (userPosts?.posts ?? []).map((post) => ({
    id: post.id,
    imageUrl: post.imageUrls[0],
    photoGradient: post.photoGradient,
    likeCount: post.likeCount,
  }));

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
          사용자 프로필
        </Text>
      </View>

      {isLoading || isError || !profile ? (
        <View className="items-center justify-center" style={{ flex: 1 }}>
          {isLoading ? (
            <ActivityIndicator color={ACCENT} />
          ) : (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
              {/* 프로필 조회에도 인증이 필요해, 비로그인은 실패가 아니라 로그인 안내를 띄운다 */}
              {!isLoggedIn ? '로그인이 필요해요' : '프로필을 불러오지 못했어요'}
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
              {/* 자기소개(상태 메시지)·콘테스트 우승 횟수는 프로필 API에 없어 표시하지 않는다.
                  닉네임 아래 핸들 줄도 뺐다 — 서버에 핸들 개념이 없어 닉네임을 한 번 더 쓰는 것뿐이었다. */}
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
                {(profile?.followerCount ?? 0).toLocaleString()}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1, marginTop: normalize(1) }}>
                팔로워
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />
            <View className="flex-1 items-center">
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.3 }}>
                {(profile?.followingCount ?? 0).toLocaleString()}
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
          {subTabs(userPosts?.totalElements ?? 0).map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{ paddingTop: normalize(16), paddingBottom: normalize(10), borderBottomWidth: isActive ? 2 : 0, borderBottomColor: ACCENT, marginBottom: -1 }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: isActive ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, color: isActive ? '#000' : 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                  {tab.label}
                  {tab.count != null && (
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', color: isActive ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)' }}> {tab.count}</Text>
                  )}
                </Text>
                {/* 아직 실 데이터가 아닌 탭임을 알린다 — 메시지 버튼과 같은 뱃지를 쓴다 */}
                {tab.beta && (
                  <View
                    className="absolute items-center justify-center"
                    style={{ top: normalize(6), right: normalize(-14), height: normalize(14), paddingHorizontal: normalize(5), borderRadius: normalize(7), backgroundColor: ACCENT }}
                  >
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff', letterSpacing: 0.4 }}>
                      BETA
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {activeTab === 'posts' && (
          postsLoading ? (
            <View style={{ paddingVertical: normalize(40) }}>
              <ActivityIndicator color={ACCENT} />
            </View>
          ) : postsFailed ? (
            <Text
              allowFontScaling={false}
              className="text-center"
              style={{ paddingVertical: normalize(40), fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.2 }}
            >
              게시글을 불러오지 못했어요
            </Text>
          ) : postItems.length === 0 ? (
            <Text
              allowFontScaling={false}
              className="text-center"
              style={{ paddingVertical: normalize(40), fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.2 }}
            >
              아직 작성한 게시글이 없어요
            </Text>
          ) : (
            <>
              <ProfilePostsTab
                items={postItems}
                // push가 아니면 스택에 이미 있는 PostDetail을 재사용해 이 프로필 화면이 사라진다.
                onSelectPost={(id) => navigation.push('PostDetail', { postId: id })}
              />
              {/* 화면이 단일 ScrollView라 무한스크롤 대신 명시적 더보기를 둔다(댓글과 같은 방식) */}
              {hasMorePosts && (
                <Pressable
                  onPress={() => fetchMorePosts()}
                  disabled={fetchingMorePosts}
                  style={{ paddingVertical: normalize(16) }}
                >
                  <Text
                    allowFontScaling={false}
                    className="text-center"
                    style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.15 }}
                  >
                    {fetchingMorePosts ? '불러오는 중...' : '게시글 더보기'}
                  </Text>
                </Pressable>
              )}
            </>
          )
        )}
        {(activeTab === 'contests' || activeTab === 'spots') && (
          <Text
            allowFontScaling={false}
            className="text-center"
            style={{ paddingVertical: normalize(40), fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.2 }}
          >
            준비 중이에요
          </Text>
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
