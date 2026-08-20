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
  SPACING_LG,
} from '@/constants/layout';
import { BRAND, BRAND_TINT, CARD, TEXT_SUB } from '@/constants/colors';

type TabKey = 'all' | 'wishlist' | 'weather' | 'community';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'wishlist', label: '출사 알림' },
  { key: 'weather', label: '날씨' },
  { key: 'community', label: '커뮤니티' },
];

function getCategoryInfo(type: string) {
  const upper = (type || '').toUpperCase();
  if (upper.includes('INQUIRY')) {
    return { label: '1:1 문의 답변', icon: IconMessage, key: 'system' };
  }
  if (upper.includes('WISHLIST') || upper.includes('SPOT_ALERT')) {
    return { label: '출사 조건 달성', icon: IconBell, key: 'wishlist' };
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

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function groupNotificationsByDate(items: NotificationItem[]) {
  const now = new Date();
  const todayStr = toLocalDateKey(now);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateKey(yesterday);

  const groups: { label: string; items: NotificationItem[] }[] = [
    { label: '오늘', items: [] },
    { label: '어제', items: [] },
    { label: '이전', items: [] },
  ];

  items.forEach((item) => {
    let itemDateStr = todayStr;
    if (item.createdAt) {
      const parsed = new Date(item.createdAt);
      itemDateStr = isNaN(parsed.getTime()) ? item.createdAt.split('T')[0] : toLocalDateKey(parsed);
    }
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

    // 2. 1:1 문의 답변 알림인 경우 InquiryDetail 또는 InquiryList 로 이동
    const upperType = (item.type || '').toUpperCase();
    if (upperType.includes('INQUIRY') || (item.deepLink && item.deepLink.includes('inquiry'))) {
      const inquiryMatch = (item.deepLink || '').match(/(?:inquiryId=|\/mypage\/inquiry\/|\/inquiry\/)(\d+)/);
      const inquiryId = inquiryMatch ? inquiryMatch[1] : undefined;

      (navigation as any).navigate('Main', {
        screen: 'MyPageTab',
        params: {
          screen: inquiryId ? 'InquiryDetail' : 'Inquiry',
          params: inquiryId ? { id: inquiryId } : undefined,
        },
      });
      return;
    }

    // 3. spotId가 포함되어 수신된 알림의 경우 해당 스팟 상세 페이지로 이동
    if (item.spotId !== undefined && item.spotId !== null) {
      (navigation as any).navigate('SpotStack', {
        screen: 'SpotDetail',
        params: { spotId: String(item.spotId) },
      });
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
              color: BRAND,
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
                backgroundColor: isActive ? '#000' : CARD,
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
          // 빈 상태를 남은 영역 가운데에 두려면 콘텐츠가 짧아도 높이를 채워야 한다
          flexGrow: 1,
          paddingTop: normalize(10),
          // 탭바 높이·인셋을 더하지 않는다 — 화면 영역에서 이미 빠져 있다(HomeScreen 주석 참고).
          paddingBottom: SPACING_LG,
        }}
      >
        {isLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={BRAND} size="small" />
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: FONT_SM,
                color: TEXT_SUB,
                marginTop: normalize(10),
              }}
            >
              알림을 불러오는 중...
            </Text>
          </View>
        ) : isError ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: GRID_PADDING,
              gap: normalize(10),
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Medium',
                fontSize: FONT_MD,
                color: '#000',
              }}
            >
              알림을 불러오지 못했습니다
            </Text>
          </View>
        ) : groups.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: GRID_PADDING,
              gap: normalize(10),
            }}
          >
            <View
              style={{
                width: normalize(56),
                height: normalize(56),
                borderRadius: normalize(16),
                backgroundColor: CARD,
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
                fontSize: FONT_MD,
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
                color: TEXT_SUB,
                letterSpacing: -0.1,
              }}
            >
              출사 조건이 충족되면 알려드려요
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
                        backgroundColor: isUnread ? BRAND_TINT : 'transparent',
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
                            backgroundColor: BRAND,
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
                              backgroundColor: BRAND_TINT,
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <ItemIcon size={normalize(22)} color={BRAND} strokeWidth={1.5} />
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

        {/* 하단 안내 멘트 */}
        {groups.length > 0 && (
          <View style={{ marginTop: normalize(16) }}>
            <View
              style={{
                height: 0.5,
                backgroundColor: 'rgba(0,0,0,0.06)',
                marginHorizontal: GRID_PADDING,
              }}
            />
            <View style={{ alignItems: 'center', paddingVertical: normalize(20) }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Regular',
                  fontSize: FONT_XS,
                  color: 'rgba(0,0,0,0.3)',
                  letterSpacing: -0.1,
                }}
              >
                7일 전 알림까지 확인할 수 있어요
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
