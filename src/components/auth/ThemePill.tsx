import React from 'react';
import { Pressable, Text } from 'react-native';
import { FONT_SM } from '@/constants/layout';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function ThemePill({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: selected ? 'rgba(227,27,89,0.08)' : '#F5F5F7',
        borderWidth: 1,
        borderColor: selected ? '#E31B59' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: FONT_SM,
          fontFamily: selected ? 'Pretendard-Medium' : 'Pretendard-Regular',
          color: selected ? '#E31B59' : 'rgba(0,0,0,0.5)',
          letterSpacing: -0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
