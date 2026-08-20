import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Map, Route, MessageCircle, User } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HAIRLINE_WIDTH, TAB_BAR_HEIGHT } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BRAND, HAIRLINE } from '@/constants/colors';

type TabIcon = typeof Home;

const TABS: { route: string; label: string; Icon: TabIcon }[] = [
  { route: 'HomeTab',      label: '홈',      Icon: Home },
  { route: 'MapTab',       label: '지도',    Icon: Map },
  { route: 'TravelTab',    label: '출사',    Icon: Route },
  { route: 'CommunityTab', label: '커뮤니티', Icon: MessageCircle },
  { route: 'MyPageTab',    label: 'MY',      Icon: User },
];

const ACTIVE_COLOR = BRAND;
const INACTIVE_COLOR = 'rgba(0,0,0,0.35)';

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedOptions = descriptors[state.routes[state.index].key].options;

  if (focusedOptions?.tabBarStyle && (focusedOptions.tabBarStyle as any).display === 'none') {
    return null;
  }

  return (
    <View
      style={{
        height: TAB_BAR_HEIGHT + insets.bottom,
        backgroundColor: '#fff',
        borderTopWidth: HAIRLINE_WIDTH,
        borderTopColor: HAIRLINE,
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
