import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FONT_SM, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

export type SpotTabKey = 'info' | 'photo' | 'review' | 'chat';

const TABS: { key: SpotTabKey; label: string }[] = [
  { key: 'info', label: '정보' },
  { key: 'photo', label: '사진' },
  { key: 'review', label: '리뷰' },
  { key: 'chat', label: '채팅' },
];

interface Props {
  activeTab: SpotTabKey;
  onChange: (tab: SpotTabKey) => void;
}

export default function SpotTabBar({ activeTab, onChange }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        paddingHorizontal: GRID_PADDING,
        backgroundColor: '#fff',
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{ flex: 1, height: normalize(44), alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: isActive ? 'Pretendard-Medium' : 'Pretendard-Regular',
                fontSize: FONT_SM,
                color: isActive ? '#E31B59' : 'rgba(0,0,0,0.4)',
                letterSpacing: -0.15,
              }}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: '#E31B59',
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
