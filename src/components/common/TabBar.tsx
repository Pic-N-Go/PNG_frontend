import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconHome,
  IconMap,
  IconRoute,
  IconMessageCircle,
  IconUser,
} from '@tabler/icons-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

type TabIcon = typeof IconHome;

const TABS: { route: string; label: string; Icon: TabIcon }[] = [
  { route: 'HomeTab',      label: '홈',      Icon: IconHome },
  { route: 'MapTab',       label: '지도',    Icon: IconMap },
  { route: 'TravelTab',    label: '출사',    Icon: IconRoute },
  { route: 'CommunityTab', label: '커뮤니티', Icon: IconMessageCircle },
  { route: 'MyPageTab',    label: 'MY',      Icon: IconUser },
];

const ACTIVE_COLOR = '#E31B59';
const INACTIVE_COLOR = 'rgba(0,0,0,0.35)';

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        height: TAB_BAR_HEIGHT + insets.bottom,
        backgroundColor: '#fff',
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(0,0,0,0.08)',
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingTop: normalize(8),
        paddingBottom: insets.bottom,
      }}
    >
      {TABS.map((tab) => {
        const index = state.routes.findIndex((r) => r.name === tab.route);
        if (index === -1) return null;
        const isFocused = state.index === index;
        const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <Pressable
            key={tab.route}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: tab.route,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.route);
              }
            }}
            style={{ flex: 1, alignItems: 'center', gap: 4 }}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
          >
            <tab.Icon size={22} color={color} strokeWidth={1.5} />
            <Text
              allowFontScaling={false}
              style={{
                fontSize: normalizeFontSize(10),
                color,
                fontFamily: isFocused ? 'Pretendard-Medium' : 'Pretendard-Regular',
                letterSpacing: -0.1,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
