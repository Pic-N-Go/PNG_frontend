import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { FONT_LG, FONT_SM, FONT_XS, HAIRLINE_WIDTH } from '@/constants/layout';
import UserRow from '@/components/common/UserRow';
import Toast from '@/components/common/Toast';
import { useUserFollowers, useUserFollowing } from '@/hooks/useUser';
import { useToggleFollow } from '@/hooks/useCommunity';
import { toErrorMessage } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import type { FollowUserResponse } from '@/types/user';
import { BRAND, CARD, HAIRLINE } from '@/constants/colors';

type FollowTab = 'followers' | 'following';

export default function FollowScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);

  const targetUserId = route.params?.userId || authUser?.id;
  // 남의 프로필에서도 열리는 화면이라, 삭제·팔로우 취소는 본인 목록에서만 노출한다.
  // 남의 팔로워를 내가 지우는 버튼이 보이면 안 된다.
  const isMe = !!authUser?.id && Number(targetUserId) === authUser.id;

  const [activeTab, setActiveTab] = useState<FollowTab>(route.params?.initialTab || 'followers');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { data: followers = [], isLoading: isFollowersLoading } =
    useUserFollowers(targetUserId);
  const { data: following = [], isLoading: isFollowingLoading } =
    useUserFollowing(targetUserId);
  const toggleFollow = useToggleFollow();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleUnfollow = (user: FollowUserResponse) => {
    toggleFollow.mutate(
      { userId: String(user.id), next: false },
      {
        onSuccess: () => showToast(`${user.nickname} 팔로우를 취소했어요`),
        onError: (err) => showToast(toErrorMessage(err, '팔로우를 취소하지 못했어요')),
      },
    );
  };

  /**
   * 팔로잉 탭에만 버튼을 둔다.
   *
   * 팔로워 탭에는 '삭제' 버튼이 있었지만 서버에 팔로워를 제거하는 엔드포인트가 없다
   * (`/users/{id}/follow`는 내가 남을 언팔로우하는 것뿐이다). 호출 없이 토스트만 띄우면
   * 일어나지 않은 일을 했다고 말하는 셈이라 버튼째로 없앴다.
   *
   * 남의 목록에서는 action을 넘기지 않아 버튼이 아예 렌더되지 않는다.
   */
  const actionFor = (user: FollowUserResponse) => {
    if (!isMe || activeTab !== 'following') return undefined;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleUnfollow(user)}
        disabled={toggleFollow.isPending}
        style={{
          height: normalize(30),
          paddingHorizontal: normalize(14),
          borderRadius: normalize(15),
          backgroundColor: CARD,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: toggleFollow.isPending ? 0.5 : 1,
        }}
      >
        <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Medium', color: 'rgba(0,0,0,0.45)' }}>
          팔로잉
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = (user: FollowUserResponse) => (
    <UserRow
      key={user.id}
      user={user}
      // FollowScreen은 MyPageStack·CommunityDetailStack 양쪽에 등록돼 있고 둘 다 UserProfile을 가진다.
      onPress={() => navigation.navigate('UserProfile', { userId: String(user.id) })}
      action={actionFor(user)}
    />
  );

  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;

  const handleTabPress = (tab: FollowTab) => {
    setActiveTab(tab);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: tab === 'followers' ? 0 : screenWidth,
        animated: true,
      });
    }
  };

  const handleMomentumScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / screenWidth);
    setActiveTab(page === 0 ? 'followers' : 'following');
  };

  useEffect(() => {
    if (route.params?.initialTab === 'following' && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: screenWidth, animated: false });
      }, 0);
    }
  }, [route.params?.initialTab, screenWidth]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      {/* Navigation Bar */}
      <View
        className="flex-row items-center justify-between"
        style={{
          height: normalize(54),
          paddingHorizontal: normalize(20),
          borderBottomWidth: HAIRLINE_WIDTH,
          borderBottomColor: HAIRLINE,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: normalize(36),
            height: normalize(36),
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: -normalize(8),
          }}
        >
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: FONT_LG,
            fontFamily: 'Pretendard-SemiBold',
            color: '#000',
            letterSpacing: -0.3,
          }}
        >
          팔로우
        </Text>
        <View style={{ width: normalize(36) }} />
      </View>

      {/* Tabs */}
      <View
        className="flex-row"
        style={{
          marginHorizontal: normalize(20),
          borderBottomWidth: HAIRLINE_WIDTH,
          borderBottomColor: HAIRLINE,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            height: normalize(44),
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => handleTabPress('followers')}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: activeTab === 'followers' ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
              color: activeTab === 'followers' ? '#000' : 'rgba(0,0,0,0.35)',
              letterSpacing: -0.15,
            }}
          >
            팔로워 {followers.length > 0 ? `(${followers.length})` : ''}
          </Text>
          {activeTab === 'followers' && (
            <View
              style={{
                position: 'absolute',
                bottom: -0.5,
                width: '60%',
                height: 2,
                backgroundColor: '#000',
                borderRadius: 1,
              }}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            height: normalize(44),
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => handleTabPress('following')}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: activeTab === 'following' ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
              color: activeTab === 'following' ? '#000' : 'rgba(0,0,0,0.35)',
              letterSpacing: -0.15,
            }}
          >
            팔로잉 {following.length > 0 ? `(${following.length})` : ''}
          </Text>
          {activeTab === 'following' && (
            <View
              style={{
                position: 'absolute',
                bottom: -0.5,
                width: '60%',
                height: 2,
                backgroundColor: '#000',
                borderRadius: 1,
              }}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Swipeable List Area */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        bounces={false}
      >
        {/* Followers Page */}
        <View style={{ width: screenWidth }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: normalize(20),
              paddingTop: normalize(4),
              paddingBottom: normalize(40),
            }}
            showsVerticalScrollIndicator={false}
          >
            {isFollowersLoading ? (
              <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
                <ActivityIndicator size="small" color={BRAND} />
              </View>
            ) : followers.length > 0 ? (
              followers.map(renderItem)
            ) : (
              <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.3)' }}>
                  팔로워가 없어요
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Following Page */}
        <View style={{ width: screenWidth }}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: normalize(20),
              paddingTop: normalize(4),
              paddingBottom: normalize(40),
            }}
            showsVerticalScrollIndicator={false}
          >
            {isFollowingLoading ? (
              <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
                <ActivityIndicator size="small" color={BRAND} />
              </View>
            ) : following.length > 0 ? (
              following.map(renderItem)
            ) : (
              <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.3)' }}>
                  팔로잉한 사람이 없어요
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Toast */}
      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </View>
  );
}
