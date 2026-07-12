import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_BASE } from '@/constants/layout';
import Toast from '@/components/auth/Toast';

type FollowTab = 'followers' | 'following';

interface UserItem {
  id: number;
  name: string;
  handle: string;
  color: string;
  initial: string;
  isMutual?: boolean;
  isFollowing?: boolean;
}

const INITIAL_FOLLOWERS: UserItem[] = [
  { id: 1, name: '한강뷰어', handle: '@hangang_view', color: '#2c5364', initial: '한', isMutual: true },
  { id: 2, name: '봄날의사진', handle: '@spring_shot', color: '#4a3060', initial: '봄', isMutual: false },
  { id: 3, name: '골든아워헌터', handle: '@golden_h', color: '#6b3a2a', initial: '골', isMutual: true },
  { id: 4, name: '제주스냅', handle: '@jeju_snap', color: '#1a4a3a', initial: '제', isMutual: false },
  { id: 5, name: '야경마스터', handle: '@night_master', color: '#2a2a5a', initial: '야', isMutual: true },
];

const INITIAL_FOLLOWING: UserItem[] = [
  { id: 1, name: '한강뷰어', handle: '@hangang_view', color: '#2c5364', initial: '한', isFollowing: true },
  { id: 2, name: '골든아워헌터', handle: '@golden_h', color: '#6b3a2a', initial: '골', isFollowing: true },
  { id: 3, name: '야경마스터', handle: '@night_master', color: '#2a2a5a', initial: '야', isFollowing: true },
  { id: 4, name: '부산사진관', handle: '@busan_photo', color: '#1a3a5a', initial: '부', isFollowing: true },
  { id: 5, name: '새벽빛', handle: '@dawn_light', color: '#3a4a2a', initial: '새', isFollowing: false },
];

export default function FollowScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<FollowTab>(route.params?.initialTab || 'followers');
  const [followers, setFollowers] = useState<UserItem[]>(INITIAL_FOLLOWERS);
  const [following, setFollowing] = useState<UserItem[]>(INITIAL_FOLLOWING);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleRemoveFollower = (id: number) => {
    setFollowers(prev => prev.filter(user => user.id !== id));
    showToast('팔로워를 삭제했어요');
  };

  const handleToggleFollowing = (id: number) => {
    setFollowing(prev => prev.map(user => {
      if (user.id === id) {
        const nextFollowing = !user.isFollowing;
        if (!nextFollowing) {
          showToast(`${user.name} 팔로우를 취소했어요`);
        }
        return { ...user, isFollowing: nextFollowing };
      }
      return user;
    }));
  };

  const renderItem = (user: UserItem) => {
    return (
      <View key={user.id} style={styles.itemContainer}>
        <View style={[styles.avatar, { backgroundColor: user.color }]}>
          <Text style={styles.avatarText}>{user.initial}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{user.name}</Text>
          <Text style={styles.handleText}>{user.handle}</Text>
        </View>
        {activeTab === 'followers' ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleRemoveFollower(user.id)}
            style={styles.actionButtonLight}
          >
            <Text style={styles.actionButtonTextLight}>삭제</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleToggleFollowing(user.id)}
            style={user.isFollowing ? styles.actionButtonLight : styles.actionButtonDark}
          >
            <Text style={user.isFollowing ? styles.actionButtonTextLight : styles.actionButtonTextDark}>
              {user.isFollowing ? '팔로잉' : '팔로우'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };


  const scrollViewRef = React.useRef<ScrollView>(null);
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

  // Sync scroll position if initialTab is 'following' on mount
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
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>팔로우</Text>
        <View style={{ width: normalize(36) }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'followers' && styles.activeTab]} 
          onPress={() => handleTabPress('followers')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
            팔로워
          </Text>
          {activeTab === 'followers' && <View style={styles.indicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'following' && styles.activeTab]} 
          onPress={() => handleTabPress('following')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
            팔로잉
          </Text>
          {activeTab === 'following' && <View style={styles.indicator} />}
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
            contentContainerStyle={styles.listContent} 
            showsVerticalScrollIndicator={false}
          >
            {followers.length > 0 ? (
              followers.map(renderItem)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>팔로워가 없어요</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Following Page */}
        <View style={{ width: screenWidth }}>
          <ScrollView 
            contentContainerStyle={styles.listContent} 
            showsVerticalScrollIndicator={false}
          >
            {following.length > 0 ? (
              following.map(renderItem)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>팔로잉한 사람이 없어요</Text>
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

const styles = StyleSheet.create({
  navBar: {
    height: normalize(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)'
  },
  backButton: {
    width: normalize(36),
    height: normalize(36),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -normalize(8)
  },
  navTitle: {
    fontSize: normalizeFontSize(18),
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.3
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: normalize(20),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.07)',
  },
  tab: {
    flex: 1,
    height: normalize(44),
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    //
  },
  tabText: {
    fontSize: FONT_BASE,
    fontFamily: 'Pretendard-Medium',
    color: 'rgba(0,0,0,0.35)',
    letterSpacing: -0.15,
  },
  activeTabText: {
    color: '#000',
    fontFamily: 'Pretendard-SemiBold',
  },
  indicator: {
    position: 'absolute',
    bottom: -0.5,
    width: '60%',
    height: 2,
    backgroundColor: '#000',
    borderRadius: 1,
  },
  listContent: {
    paddingHorizontal: normalize(20),
    paddingTop: normalize(4),
    paddingBottom: normalize(40),
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(12),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  avatar: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: normalizeFontSize(16),
    fontWeight: '600',
    color: '#fff',
  },
  infoContainer: {
    flex: 1,
    marginLeft: normalize(12),
    marginRight: normalize(12),
  },
  nameText: {
    fontSize: FONT_BASE,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.2,
    marginBottom: normalize(2),
  },
  handleText: {
    fontSize: normalizeFontSize(12),
    color: 'rgba(0,0,0,0.35)',
    letterSpacing: -0.1,
  },
  actionButtonLight: {
    height: normalize(30),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(15),
    backgroundColor: '#f8f8f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTextLight: {
    fontSize: normalizeFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: 'rgba(0,0,0,0.45)',
  },
  actionButtonDark: {
    height: normalize(30),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(15),
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonTextDark: {
    fontSize: normalizeFontSize(12),
    fontFamily: 'Pretendard-Medium',
    color: '#fff',
  },
  emptyContainer: {
    paddingVertical: normalize(40),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONT_BASE,
    color: 'rgba(0,0,0,0.3)',
  }
});
