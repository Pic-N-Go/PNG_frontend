import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD } from '@/constants/colors';

export type ChipVariant = 'outline' | 'dark';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: ChipVariant;
  showDot?: boolean;
  height?: number;
  fontSize?: number;
  paddingHorizontal?: number;
}

export default function Chip({
  label,
  selected,
  onPress,
  variant = 'dark',
  showDot = false,
  height,
  fontSize = FONT_SM,
  paddingHorizontal = normalize(14),
}: Props) {
  const isOutline = variant === 'outline';

  const backgroundColor = isOutline
    ? selected
      ? BRAND_TINT
      : '#fff'
    : selected
      ? '#000'
      : CARD;

  const textColor = isOutline
    ? selected
      ? BRAND
      : '#000'
    : selected
      ? '#fff'
      : 'rgba(0,0,0,0.5)';

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(6),
        height,
        paddingVertical: height ? undefined : normalize(7),
        paddingHorizontal,
        borderRadius: normalize(50),
        backgroundColor,
        borderWidth: isOutline ? 1.2 : 0,
        borderColor: isOutline ? (selected ? BRAND : 'rgba(0,0,0,0.1)') : 'transparent',
      }}
    >
      {showDot && (
        <View
          style={{
            width: normalize(6),
            height: normalize(6),
            borderRadius: normalize(3),
            backgroundColor: selected ? BRAND : 'rgba(0,0,0,0.15)',
          }}
        />
      )}
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: selected && !isOutline ? 'Pretendard-Medium' : 'Pretendard-Regular',
          fontSize,
          color: textColor,
          letterSpacing: -0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
