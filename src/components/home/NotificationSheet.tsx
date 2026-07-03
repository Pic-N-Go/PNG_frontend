import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconBell,
  IconCloudDown,
  IconHeart,
  IconMessage,
  IconSun,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import {
  FONT_MD,
  FONT_SM,
  FONT_XL,
  FONT_XS,
  GRID_PADDING,
} from '@/constants/layout';

type TabKey = 'all' | 'wishlist' | 'weather' | 'community';
type IconColor = 'pink' | 'green' | 'orange' | 'red' | 'gray';

interface NotifItem {
  id: string;
  type: Exclude<TabKey, 'all'>;
  isUnread: boolean;
  iconColor: IconColor;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  time: string;
  title: string;
  desc: string;
  photoScore?: number;
  cta?: string;
}

interface NotifGroup {
  label: string;
  items: NotifItem[];
}

const ICON_COLORS: Record<IconColor, { bg: string; stroke: string }> = {
  pink:   { bg: 'rgba(227,27,89,0.08)',  stroke: '#E31B59' },
  green:  { bg: 'rgba(52,199,89,0.1)',   stroke: '#34c759' },
  orange: { bg: 'rgba(255,159,10,0.1)',  stroke: '#ff9f0a' },
  red:    { bg: 'rgba(255,69,58,0.08)',  stroke: '#ff453a' },
  gray:   { bg: '#F5F5F7',               stroke: 'rgba(0,0,0,0.4)' },
};

const LABEL_COLORS: Record<IconColor, string> = {
  pink:   '#E31B59',
  green:  '#34c759',
  orange: '#ff9f0a',
  red:    '#ff453a',
  gray:   'rgba(0,0,0,0.4)',
};

const MOCK_GROUPS: NotifGroup[] = [
  {
    label: '오늘',
    items: [
      {
        id: '1', type: 'wishlist', isUnread: true,
        iconColor: 'pink', Icon: IconBell,
        label: '위시리스트 달성', time: '방금',
        title: '광안리 해수욕장 — 조건 충족!',
        desc: '미세먼지 좋음 · 골든아워 오전 6:32 · 맑음',
        photoScore: 87, cta: '바로 출발',
      },
      {
        id: '2', type: 'weather', isUnread: true,
        iconColor: 'orange', Icon: IconSun,
        label: '날씨 예보', time: '1시간 전',
        title: '경복궁 — 내일 오전 촬영 최적',
        desc: '맑음 · 미세먼지 좋음 · 골든아워 5:58 예상',
      },
      {
        id: '3', type: 'community', isUnread: false,
        iconColor: 'red', Icon: IconHeart,
        label: '좋아요', time: '3시간 전',
        title: '김준혁 외 12명이 좋아해요',
        desc: '광안리 일출 사진 · 오늘 오전 게시',
      },
      {
        id: '4', type: 'community', isUnread: false,
        iconColor: 'gray', Icon: IconMessage,
        label: '댓글', time: '4시간 전',
        title: '이수연 · "삼각대 어떤 거 쓰셨어요?"',
        desc: '광안리 일출 사진에 댓글',
      },
    ],
  },
  {
    label: '어제',
    items: [
      {
        id: '5', type: 'wishlist', isUnread: false,
        iconColor: 'pink', Icon: IconBell,
        label: '위시리스트 예보', time: '어제 18:20',
        title: '제주 사려니숲길 — 내일 안개 예상',
        desc: '오전 7~9시 안개 예보 · 촬영 최적 조건',
        photoScore: 78,
      },
      {
        id: '6', type: 'weather', isUnread: false,
        iconColor: 'green', Icon: IconCloudDown,
        label: '날씨 개선', time: '어제 09:04',
        title: '영월 별마로천문대 — 구름 해소',
        desc: '오늘 밤 구름 없음 · 은하수 촬영 가능',
      },
      {
        id: '7', type: 'community', isUnread: false,
        iconColor: 'gray', Icon: IconUserPlus,
        label: '새 팔로워', time: '어제 07:30',
        title: '박민준이 팔로우했어요',
        desc: '팔로워 38명',
      },
    ],
  },
  {
    label: '이전',
    items: [
      {
        id: '8', type: 'wishlist', isUnread: false,
        iconColor: 'pink', Icon: IconBell,
        label: '위시리스트 달성', time: '5월 10일',
        title: '에버랜드 장미원 — 만개 조건 충족',
        desc: '개화율 94% · 맑음 · 미세먼지 좋음',
        photoScore: 92,
      },
    ],
  },
];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: '전체' },
  { key: 'wishlist',  label: '위시리스트' },
  { key: 'weather',   label: '날씨' },
  { key: 'community', label: '커뮤니티' },
];

const PANEL_MAX_HEIGHT = Dimensions.get('window').height * 0.88;

interface Props {
  visible: boolean;
  onClose: () => void;
  onUnreadChange?: (hasUnread: boolean) => void;
}

export default function NotificationSheet({ visible, onClose, onUnreadChange }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-PANEL_MAX_HEIGHT)).current;
  const [show, setShow] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [groups, setGroups] = useState(MOCK_GROUPS);

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else if (show) {
      Animated.timing(slideAnim, {
        toValue: -PANEL_MAX_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setShow(false);
        setActiveTab('all');
      });
    }
  }, [visible, show, slideAnim]);

  useEffect(() => {
    const hasUnread = groups.some((g) => g.items.some((i) => i.isUnread));
    onUnreadChange?.(hasUnread);
  }, [groups, onUnreadChange]);

  function markAllRead() {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        items: g.items.map((item) => ({ ...item, isUnread: false })),
      }))
    );
  }

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      items: activeTab === 'all' ? g.items : g.items.filter((i) => i.type === activeTab),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Modal visible={show} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      {/* 딤 오버레이 */}
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={onClose} />

      {/* 패널 */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          maxHeight: PANEL_MAX_HEIGHT,
          backgroundColor: '#fff',
          borderBottomLeftRadius: normalize(28),
          borderBottomRightRadius: normalize(28),
          overflow: 'hidden',
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={{ height: insets.top }} />

        {/* 핸들 */}
        <View style={{ alignItems: 'center', paddingTop: normalize(10), paddingBottom: normalize(2) }}>
          <View style={{ width: normalize(36), height: normalize(4), borderRadius: normalize(2), backgroundColor: 'rgba(0,0,0,0.12)' }} />
        </View>

        {/* 헤더 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GRID_PADDING, paddingTop: normalize(14) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, color: '#000', letterSpacing: -0.4 }}>
            알림
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(14) }}>
            <Pressable onPress={markAllRead} hitSlop={8}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: '#E31B59', letterSpacing: -0.1 }}>
                모두 읽음
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={{ width: normalize(28), height: normalize(28), borderRadius: normalize(14), backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconX size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>

        {/* 탭 필터 */}
        <View style={{ flexDirection: 'row', gap: normalize(6), paddingHorizontal: GRID_PADDING, paddingTop: normalize(14), paddingBottom: normalize(2) }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{ height: normalize(30), paddingHorizontal: normalize(14), borderRadius: normalize(15), backgroundColor: isActive ? '#000' : '#F5F5F7', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: isActive ? '#fff' : 'rgba(0,0,0,0.5)' }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 알림 목록 */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: normalize(10), paddingBottom: normalize(28) }}>
          {filteredGroups.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: normalize(48), paddingHorizontal: GRID_PADDING, gap: normalize(10) }}>
              <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(16), backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center', marginBottom: normalize(6) }}>
                <IconBell size={normalize(24)} color="rgba(0,0,0,0.25)" strokeWidth={1.5} />
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(16), color: '#000', letterSpacing: -0.2 }}>알림이 없어요</Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1 }}>위시리스트 조건이 충족되면 알려드려요</Text>
            </View>
          ) : (
            filteredGroups.map((group) => (
              <View key={group.label}>
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.3)', letterSpacing: 0.2, paddingHorizontal: GRID_PADDING, paddingTop: normalize(14), paddingBottom: normalize(6) }}
                >
                  {group.label}
                </Text>

                {group.items.map((item, idx) => {
                  const ic = ICON_COLORS[item.iconColor];
                  return (
                    <View key={item.id}>
                      {/* outer: 미읽음 배경 */}
                      <View style={{ backgroundColor: item.isUnread ? 'rgba(227,27,89,0.03)' : 'transparent', position: 'relative' }}>
                        {item.isUnread && (
                          <View style={{ position: 'absolute', left: normalize(10), top: normalize(18), width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: '#E31B59', zIndex: 1 }} />
                        )}
                        <Pressable style={({ pressed }) => ({ backgroundColor: pressed ? 'rgba(0,0,0,0.02)' : 'transparent' })}>
                          {/* inner: 패딩 + 레이아웃 */}
                          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: normalize(12), paddingHorizontal: GRID_PADDING, paddingVertical: normalize(12) }}>
                            {/* 아이콘 */}
                            <View style={{ width: normalize(44), height: normalize(44), borderRadius: normalize(13), backgroundColor: ic.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <item.Icon size={normalize(22)} color={ic.stroke} strokeWidth={1.5} />
                            </View>

                            {/* 본문 */}
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: normalize(8), marginBottom: normalize(2) }}>
                                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(12), color: LABEL_COLORS[item.iconColor], letterSpacing: 0.2 }}>
                                  {item.label}
                                </Text>
                                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.28)', letterSpacing: -0.1, flexShrink: 0 }}>
                                  {item.time}
                                </Text>
                              </View>
                              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2, lineHeight: FONT_MD * 1.35, marginBottom: normalize(3) }} numberOfLines={2}>
                                {item.title}
                              </Text>
                              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1, lineHeight: FONT_SM * 1.4 }} numberOfLines={2}>
                                {item.desc}
                              </Text>

                              {item.photoScore !== undefined && (
                                <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: normalize(4), height: normalize(22), paddingHorizontal: normalize(10), borderRadius: normalize(11), backgroundColor: 'rgba(227,27,89,0.08)', marginTop: normalize(6) }}>
                                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#E31B59' }}>{item.photoScore}</Text>
                                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}>포토제닉 지수</Text>
                                </View>
                              )}

                              {item.cta && (
                                <View style={{ flexDirection: 'row', gap: normalize(8), marginTop: normalize(10) }}>
                                  <Pressable style={({ pressed }) => ({ height: normalize(32), paddingHorizontal: normalize(14), borderRadius: normalize(16), backgroundColor: pressed ? '#c91550' : '#E31B59', alignItems: 'center', justifyContent: 'center' })}>
                                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: '#fff' }}>{item.cta}</Text>
                                  </Pressable>
                                  <Pressable style={{ height: normalize(32), paddingHorizontal: normalize(14), borderRadius: normalize(16), backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' }}>
                                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)' }}>나중에</Text>
                                  </Pressable>
                                </View>
                              )}
                            </View>
                          </View>
                        </Pressable>
                      </View>

                      {idx < group.items.length - 1 && (
                        <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: GRID_PADDING }} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}
