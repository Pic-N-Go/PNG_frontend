import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_XS, FONT_LG } from '@/constants/layout';
import Toast from '@/components/common/Toast';
import { useUserFollowers, useUserFollowing } from '@/hooks/useUser';
import { useAuthStore } from '@/store/useAuthStore';
import type { FollowUserResponse } from '@/types/user';

type FollowTab = 'followers' | 'following';

const AVATAR_COLORS = [
  '#2c5364',
  '#4a3060',
  '#6b3a2a',
  '#1a4a3a',
  '#2a2a5a',
  '#1a3a5a',
  '#3a4a2a',
];

export default function FollowScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);

  const targetUserId = route.params?.userId || authUser?.id;

  const [activeTab, setActiveTab] = useState<FollowTab>(route.params?.initialTab || 'followers');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { data: followers = [], isLoading: isFollowersLoading } =
    useUserFollowers(targetUserId);
  const { data: following = [], isLoading: isFollowingLoading } =
    useUserFollowing(targetUserId);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleRemoveFollower = (_userId: number) => {
    showToast('팔로워를 삭제했어요');
  };

  const handleToggleFollowing = (user: FollowUserResponse) => {
    showToast(`${user.nickname} 팔로우를 취소했어요`);
  };

  const renderItem = (user: FollowUserResponse) => {
    const initial = user.nickname?.charAt(0) || 'U';
    const bgColor = AVATAR_COLORS[Math.abs(user.id) % AVATAR_COLORS.length];

    return (
      <View
        key={user.id}
        className="flex-row items-center"
        style={{
          paddingVertical: normalize(12),
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0,0,0,0.04)',
        }}
      >
        <View
          style={{
            width: normalize(44),
            height: normalize(44),
            borderRadius: normalize(22),
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {user.profileImageUrl ? (
            <Image
              source={{ uri: user.profileImageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: normalizeFontSize(15), fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
              {initial}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, marginLeft: normalize(12), marginRight: normalize(12) }}>
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: 'Pretendard-SemiBold',
              color: '#000',
              letterSpacing: -0.2,
              marginBottom: normalize(2),
            }}
          >
            {user.nickname}
          </Text>
          <Text
            style={{
              fontSize: FONT_XS,
              fontFamily: 'Pretendard-Regular',
              color: 'rgba(0,0,0,0.35)',
              letterSpacing: -0.1,
            }}
          >
            @{user.nickname}
          </Text>
        </View>

        {activeTab === 'followers' ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleRemoveFollower(user.id)}
            style={{
              height: normalize(30),
              paddingHorizontal: normalize(14),
              borderRadius: normalize(15),
              backgroundColor: '#f8f8f9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: FONT_XS,
                fontFamily: 'Pretendard-Medium',
                color: 'rgba(0,0,0,0.45)',
              }}
            >
              삭제
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleToggleFollowing(user)}
            style={{
              height: normalize(30),
              paddingHorizontal: normalize(14),
              borderRadius: normalize(15),
              backgroundColor: '#f8f8f9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: FONT_XS,
                fontFamily: 'Pretendard-Medium',
                color: 'rgba(0,0,0,0.45)',
              }}
            >
              팔로잉
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0,0,0,0.06)',
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
          borderBottomWidth: 0.5,
          borderBottomColor: 'rgba(0,0,0,0.07)',
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
                <ActivityIndicator size="small" color="#E31B59" />
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
                <ActivityIndicator size="small" color="#E31B59" />
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
