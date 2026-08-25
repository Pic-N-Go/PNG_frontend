import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FONT_SM, HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD } from '@/constants/colors';
import { SHADOW_CONTROL } from '@/constants/shadow';

export type ChipVariant = 'brand' | 'outline' | 'dark';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  variant?: ChipVariant;
  icon?: React.ReactNode;
  shadow?: boolean;
  showDot?: boolean;
  /** 점 색 고정 — 컬렉션 색처럼 선택 여부와 무관한 색이 있을 때 쓴다. */
  dotColor?: string;
  height?: number;
  fontSize?: number;
  paddingHorizontal?: number;
}

export default function Chip({
  label,
  selected,
  onPress,
  variant = 'dark',
  icon,
  shadow = false,
  showDot = false,
  dotColor,
  height,
  fontSize = FONT_SM,
  paddingHorizontal = normalize(14),
}: Props) {
  const isBrand = variant === 'brand';
  const isOutline = variant === 'outline';

  let backgroundColor = CARD;
  let textColor = 'rgba(0,0,0,0.5)';
  let borderColor = 'transparent';
  let borderWidth = 0;

  if (isBrand) {
    backgroundColor = selected ? BRAND : '#ffffff';
    textColor = selected ? '#ffffff' : '#374151';
    borderColor = selected ? BRAND : 'rgba(0,0,0,0.08)';
    borderWidth = HAIRLINE_WIDTH;
  } else if (isOutline) {
    backgroundColor = selected ? BRAND_TINT : '#ffffff';
    textColor = selected ? BRAND : '#000000';
    borderColor = selected ? BRAND : 'rgba(0,0,0,0.1)';
    borderWidth = 1.2;
  } else {
    // dark (legacy default)
    backgroundColor = selected ? '#000000' : CARD;
    textColor = selected ? '#ffffff' : 'rgba(0,0,0,0.5)';
    borderColor = 'transparent';
    borderWidth = 0;
  }

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: normalize(6),
          height,
          paddingVertical: height ? undefined : normalize(7),
          paddingHorizontal,
          borderRadius: normalize(50),
          backgroundColor,
          borderWidth,
          borderColor,
        },
        shadow && SHADOW_CONTROL,
      ]}
    >
      {icon && <View style={{ alignItems: 'center', justifyContent: 'center' }}>{icon}</View>}
      {showDot && (
        <View
          style={{
            width: normalize(6),
            height: normalize(6),
            borderRadius: normalize(3),
            backgroundColor: dotColor ?? (selected ? BRAND : 'rgba(0,0,0,0.15)'),
          }}
        />
      )}
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: selected ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
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

