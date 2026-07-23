import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconBell,
  IconChevronLeft,
  IconSun,
  IconMessage,
  IconAlertCircle,
} from '@tabler/icons-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/stacks/HomeStack';
import { useNotification } from '@/hooks/useNotification';
import { NotificationItem } from '@/api/notification';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import {
  FONT_MD,
  FONT_SM,
  FONT_XL,
  FONT_XS,
  GRID_PADDING,
  TAB_BAR_HEIGHT,
} from '@/constants/layout';

type TabKey = 'all' | 'wishlist' | 'weather' | 'community';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'wishlist', label: '위시리스트' },
  { key: 'weather', label: '날씨' },
  { key: 'community', label: '커뮤니티' },
];

function getCategoryInfo(type: string) {
  const upper = (type || '').toUpperCase();
  if (upper.includes('WISHLIST')) {
    return { label: '위시리스트 달성', icon: IconBell, key: 'wishlist' };
  }
  if (upper.includes('WEATHER') || upper.includes('GOLDEN')) {
    return { label: '날씨 예보', icon: IconSun, key: 'weather' };
  }
  if (upper.includes('COMMUNITY')) {
    return { label: '커뮤니티 알림', icon: IconMessage, key: 'community' };
  }
  return { label: '알림', icon: IconAlertCircle, key: 'system' };
}

function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return '방금';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}

function groupNotificationsByDate(items: NotificationItem[]) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const groups: { label: string; items: NotificationItem[] }[] = [
    { label: '오늘', items: [] },
    { label: '어제', items: [] },
    { label: '이전', items: [] },
  ];

  items.forEach((item) => {
    const itemDateStr = item.createdAt ? item.createdAt.split('T')[0] : todayStr;
    if (itemDateStr === todayStr) {
      groups[0].items.push(item);
    } else if (itemDateStr === yesterdayStr) {
      groups[1].items.push(item);
    } else {
      groups[2].items.push(item);
    }
  });

  return groups.filter((g) => g.items.length > 0);
}

type Props = NativeStackScreenProps<HomeStackParamList, 'Notification'>;

export default function NotificationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { useNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } = useNotification();

  const { data: rawNotifications = [], isLoading, isError } = useNotificationsQuery();
  const { mutate: markRead } = useMarkReadMutation();
  const { mutate: markAllRead } = useMarkAllReadMutation();

  const [activeTab, setActiveTab] = useState<TabKey>('all');

  // 탭 필터링
  const filteredNotifications = rawNotifications.filter((item) => {
    if (activeTab === 'all') return true;
    const cat = getCategoryInfo(item.type).key;
    return cat === activeTab;
  });

  // 날짜 그룹핑
  const groups = groupNotificationsByDate(filteredNotifications);

  const handleItemPress = (item: NotificationItem) => {
    // 1. 단건 읽음 처리
    if (!item.isRead) {
      markRead(item.id);
    }

    // 2. 딥링크 이동 처리
    if (item.deepLink) {
      const link = item.deepLink;
      if (link.includes('wishlist')) {
        navigation.navigate('Wishlist' as any);
      } else if (link.includes('map')) {
        (navigation as any).navigate('Map', {});
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      {/* 헤더 */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: GRID_PADDING,
          paddingTop: normalize(14),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <IconChevronLeft size={normalize(20)} color="rgba(0,0,0,0.6)" strokeWidth={1.5} />
          </Pressable>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: FONT_XL,
              color: '#000',
              letterSpacing: -0.4,
            }}
          >
            알림
          </Text>
        </View>
        <Pressable onPress={() => markAllRead()} hitSlop={8}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: normalizeFontSize(14),
              color: '#E31B59',
              letterSpacing: -0.1,
            }}
          >
            모두 읽음
          </Text>
        </Pressable>
      </View>

      {/* 탭 필터 */}
      <View
        style={{
          flexDirection: 'row',
          gap: normalize(6),
          paddingHorizontal: GRID_PADDING,
          paddingTop: normalize(14),
          paddingBottom: normalize(2),
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                height: normalize(30),
                paddingHorizontal: normalize(14),
                borderRadius: normalize(15),
                backgroundColor: isActive ? '#000' : '#F5F5F7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Medium',
                  fontSize: FONT_SM,
                  color: isActive ? '#fff' : 'rgba(0,0,0,0.5)',
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 알림 목록 영역 */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: normalize(10),
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom,
        }}
      >
        {isLoading ? (
          <View style={{ paddingVertical: normalize(48), alignItems: 'center' }}>
            <ActivityIndicator color="#E31B59" size="small" />
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: FONT_SM,
                color: 'rgba(0,0,0,0.4)',
                marginTop: normalize(10),
              }}
            >
              알림을 불러오는 중...
            </Text>
          </View>
        ) : isError ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: normalize(48),
              paddingHorizontal: GRID_PADDING,
              gap: normalize(10),
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Medium',
                fontSize: normalizeFontSize(16),
                color: '#000',
              }}
            >
              알림을 불러오지 못했습니다
            </Text>
          </View>
        ) : groups.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: normalize(48),
              paddingHorizontal: GRID_PADDING,
              gap: normalize(10),
            }}
          >
            <View
              style={{
                width: normalize(56),
                height: normalize(56),
                borderRadius: normalize(16),
                backgroundColor: '#F5F5F7',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: normalize(6),
              }}
            >
              <IconBell size={normalize(24)} color="rgba(0,0,0,0.25)" strokeWidth={1.5} />
            </View>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Medium',
                fontSize: normalizeFontSize(16),
                color: '#000',
                letterSpacing: -0.2,
              }}
            >
              알림이 없어요
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: FONT_SM,
                color: 'rgba(0,0,0,0.4)',
                letterSpacing: -0.1,
              }}
            >
              위시리스트 조건이 충족되면 알려드려요
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.label}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: normalizeFontSize(12),
                  color: 'rgba(0,0,0,0.3)',
                  letterSpacing: -0.2,
                  paddingHorizontal: GRID_PADDING,
                  paddingTop: normalize(14),
                  paddingBottom: normalize(6),
                }}
              >
                {group.label}
              </Text>

              {group.items.map((item, idx) => {
                const info = getCategoryInfo(item.type);
                const ItemIcon = info.icon;
                const isUnread = !item.isRead;

                return (
                  <View key={item.id}>
                    {/* outer: 미읽음 배경 */}
                    <View
                      style={{
                        backgroundColor: isUnread ? 'rgba(227,27,89,0.03)' : 'transparent',
                        position: 'relative',
                      }}
                    >
                      {isUnread && (
                        <View
                          style={{
                            position: 'absolute',
                            left: normalize(10),
                            top: normalize(18),
                            width: normalize(6),
                            height: normalize(6),
                            borderRadius: normalize(3),
                            backgroundColor: '#E31B59',
                            zIndex: 1,
                          }}
                        />
                      )}
                      <Pressable
                        onPress={() => handleItemPress(item)}
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? 'rgba(0,0,0,0.02)' : 'transparent',
                        })}
                      >
                        {/* inner: 패딩 + 레이아웃 */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: normalize(12),
                            paddingHorizontal: GRID_PADDING,
                            paddingVertical: normalize(12),
                          }}
                        >
                          <View
                            style={{
                              width: normalize(44),
                              height: normalize(44),
                              borderRadius: normalize(13),
                              backgroundColor: 'rgba(227,27,89,0.08)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <ItemIcon size={normalize(22)} color="#E31B59" strokeWidth={1.5} />
                          </View>

                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'baseline',
                                justifyContent: 'space-between',
                                gap: normalize(8),
                                marginBottom: normalize(2),
                              }}
                            >
                              <Text
                                allowFontScaling={false}
                                style={{
                                  fontFamily: 'Pretendard-SemiBold',
                                  fontSize: normalizeFontSize(12),
                                  color: 'rgba(0,0,0,0.45)',
                                  letterSpacing: -0.2,
                                }}
                              >
                                {info.label}
                              </Text>
                              <Text
                                allowFontScaling={false}
                                style={{
                                  fontFamily: 'Pretendard-Regular',
                                  fontSize: FONT_XS,
                                  color: 'rgba(0,0,0,0.28)',
                                  letterSpacing: -0.1,
                                  flexShrink: 0,
                                }}
                              >
                                {formatRelativeTime(item.createdAt)}
                              </Text>
                            </View>
                            <Text
                              allowFontScaling={false}
                              style={{
                                fontFamily: 'Pretendard-Medium',
                                fontSize: FONT_MD,
                                color: '#000',
                                letterSpacing: -0.2,
                                lineHeight: FONT_MD * 1.35,
                                marginBottom: normalize(3),
                              }}
                              numberOfLines={2}
                            >
                              {item.title}
                            </Text>
                            <Text
                              allowFontScaling={false}
                              style={{
                                fontFamily: 'Pretendard-Regular',
                                fontSize: FONT_SM,
                                color: 'rgba(0,0,0,0.45)',
                                letterSpacing: -0.1,
                                lineHeight: FONT_SM * 1.4,
                              }}
                              numberOfLines={2}
                            >
                              {item.content}
                            </Text>
                          </View>
                        </View>
                      </Pressable>
                    </View>

                    {idx < group.items.length - 1 && (
                      <View
                        style={{
                          height: 0.5,
                          backgroundColor: 'rgba(0,0,0,0.06)',
                          marginHorizontal: GRID_PADDING,
                        }}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
