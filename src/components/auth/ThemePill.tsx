import React from 'react';
import { Pressable, Text } from 'react-native';
import { BORDER_CONTROL, FONT_SM } from '@/constants/layout';
import { BRAND, BRAND_TINT_ACTIVE, CARD } from '@/constants/colors';

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
        backgroundColor: selected ? BRAND_TINT_ACTIVE : CARD,
        borderWidth: BORDER_CONTROL,
        borderColor: selected ? BRAND : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: FONT_SM,
          fontFamily: selected ? 'Pretendard-Medium' : 'Pretendard-Regular',
          color: selected ? BRAND : 'rgba(0,0,0,0.5)',
          letterSpacing: -0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
