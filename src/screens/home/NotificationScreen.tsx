import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconBell,
  IconChevronLeft,
  IconCloudDown,
  IconHeart,
  IconMessage,
  IconSun,
  IconUserPlus,
} from '@tabler/icons-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/stacks/HomeStack';
import { useNotificationStore, NotifType, NotifIconKey } from '@/store/useNotificationStore';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import {
  FONT_MD,
  FONT_SM,
  FONT_XL,
  FONT_XS,
  GRID_PADDING,
  TAB_BAR_HEIGHT,
} from '@/constants/layout';

type TabKey = 'all' | NotifType;

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'wishlist', label: '위시리스트' },
  { key: 'weather', label: '날씨' },
  { key: 'community', label: '커뮤니티' },
];

const ICONS: Record<NotifIconKey, React.ComponentType<{ size: number; color: string; strokeWidth: number }>> = {
  bell: IconBell,
  sun: IconSun,
  cloudDown: IconCloudDown,
  heart: IconHeart,
  message: IconMessage,
  userPlus: IconUserPlus,
};

type Props = NativeStackScreenProps<HomeStackParamList, 'Notification'>;

export default function NotificationScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const groups = useNotificationStore((s) => s.groups);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      items: activeTab === 'all' ? g.items : g.items.filter((i) => i.type === activeTab),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      {/* 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GRID_PADDING, paddingTop: normalize(14) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <IconChevronLeft size={normalize(20)} color="rgba(0,0,0,0.6)" strokeWidth={1.5} />
          </Pressable>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, color: '#000', letterSpacing: -0.4 }}>
            알림
          </Text>
        </View>
        <Pressable onPress={markAllRead} hitSlop={8}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: '#E31B59', letterSpacing: -0.1 }}>
            모두 읽음
          </Text>
        </Pressable>
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
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: normalize(10), paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}>
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
                const ItemIcon = ICONS[item.icon];
                return (
                <View key={item.id}>
                  {/* outer: 미읽음 배경 */}
                  <View style={{ backgroundColor: item.isUnread ? 'rgba(227,27,89,0.03)' : 'transparent', position: 'relative' }}>
                    {item.isUnread && (
                      <View style={{ position: 'absolute', left: normalize(10), top: normalize(18), width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: '#E31B59', zIndex: 1 }} />
                    )}
                    <Pressable
                      onPress={() => item.isUnread && markRead(item.id)}
                      style={({ pressed }) => ({ backgroundColor: pressed ? 'rgba(0,0,0,0.02)' : 'transparent' })}
                    >
                      {/* inner: 패딩 + 레이아웃 */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: normalize(12), paddingHorizontal: GRID_PADDING, paddingVertical: normalize(12) }}>
                        {/* 아이콘 — 카테고리 구분은 탭 필터가 담당하므로 중립 톤 하나로 통일 */}
                        <View style={{ width: normalize(44), height: normalize(44), borderRadius: normalize(13), backgroundColor: 'rgba(227,27,89,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ItemIcon size={normalize(22)} color="#E31B59" strokeWidth={1.5} />
                        </View>

                        {/* 본문 */}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: normalize(8), marginBottom: normalize(2) }}>
                            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.45)', letterSpacing: 0.2 }}>
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

                          {item.cta && (
                            <Pressable style={({ pressed }) => ({ alignSelf: 'flex-start', height: normalize(32), paddingHorizontal: normalize(14), borderRadius: normalize(16), backgroundColor: pressed ? '#c91550' : '#E31B59', alignItems: 'center', justifyContent: 'center', marginTop: normalize(10) })}>
                              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: '#fff' }}>{item.cta}</Text>
                            </Pressable>
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
    </View>
  );
}
