import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconBell, IconChevronRight } from '@tabler/icons-react-native';
import { GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';

interface Props {
  onPress: () => void;
}

export default function SpotAlertBanner({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center bg-[#FEEFF4] border border-[#E31B59]/[0.12]"
      style={{
        marginHorizontal: GRID_PADDING,
        gap: normalize(11),
        borderRadius: normalize(14),
        paddingVertical: normalize(12),
        paddingHorizontal: normalize(14),
      }}
    >
      <View
        className="items-center justify-center bg-[#E31B59]/[0.08]"
        style={{
          width: normalize(36),
          height: normalize(36),
          borderRadius: normalize(10),
        }}
      >
        <IconBell size={normalize(18)} color={ACCENT} strokeWidth={2} />
      </View>
      <View className="flex-1">
        <Text allowFontScaling={false} className="font-semibold text-[#1F1E1D] tracking-tight" style={{ fontSize: normalizeFontSize(14), marginBottom: normalize(1) }}>
          출사 알림 조건 설정
        </Text>
        <Text allowFontScaling={false} className="font-normal text-[#A15E72]" style={{ fontSize: normalizeFontSize(12) }}>
          원하는 날씨가 되면 알려드려요
        </Text>
      </View>
      <IconChevronRight size={normalize(18)} color={ACCENT} strokeWidth={2} />
    </Pressable>
  );
}
