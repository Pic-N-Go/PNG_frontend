import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconChevronRight } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, GRID_PADDING, FONT_XS } from '@/constants/layout';
import { BRAND, BRAND_TINT } from '@/constants/colors';

interface Props {
  /** 좌측 타일 아이콘 (tabler) */
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  onPress?: () => void;
  marginTop?: number;
}

/**
 * [아이콘 타일 · 제목/부제 · 셰브론] 형태의 다른 화면 이동 배너.
 * 홈 / 스팟 상세 / 1:1 문의 작성에서 공용으로 사용.
 * 카드 규칙(보더·그림자 없음, 배경 #f5f5f7)을 따르고 핑크는 아이콘 타일에만 쓴다.
 */
export default function LinkBanner({ icon: Icon, title, subtitle, onPress, marginTop = 0 }: Props) {
  return (
    <View
      className="bg-card overflow-hidden"
      style={{ marginHorizontal: GRID_PADDING, marginTop, borderRadius: CARD_RADIUS }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: onPress && pressed ? BRAND_TINT : 'transparent',
        })}
      >
        <View
          className="flex-row items-center"
          style={{ paddingVertical: normalize(14), paddingHorizontal: normalize(16), gap: normalize(12) }}
        >
          <View
            className="items-center justify-center shrink-0 bg-brand/5"
            style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10) }}
          >
            <Icon size={normalize(18)} color={BRAND} strokeWidth={1.5} />
          </View>

          <View className="flex-1">
            <Text
              allowFontScaling={false}
              className="text-black font-medium tracking-tight"
              style={{ fontSize: normalizeFontSize(14) }}
            >
              {title}
            </Text>
            <Text allowFontScaling={false} className="text-sub" style={{ fontSize: FONT_XS, marginTop: normalize(1) }}>
              {subtitle}
            </Text>
          </View>

          <View className="shrink-0">
            <IconChevronRight size={normalize(16)} color="rgba(0,0,0,0.2)" strokeWidth={1.5} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}
