import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconBell, IconChevronRight } from '@tabler/icons-react-native';
import { GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';

interface Props {
  onPress: () => void;
}

export default function SpotWishlistBanner({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: GRID_PADDING,
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(11),
        backgroundColor: '#FEEFF4',
        borderWidth: 1,
        borderColor: 'rgba(227,27,89,0.12)',
        borderRadius: normalize(14),
        paddingVertical: normalize(12),
        paddingHorizontal: normalize(14),
      }}
    >
      <View
        style={{
          width: normalize(36),
          height: normalize(36),
          borderRadius: normalize(10),
          backgroundColor: 'rgba(227,27,89,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconBell size={normalize(18)} color={ACCENT} strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#1F1E1D', letterSpacing: -0.2, marginBottom: normalize(1) }}>
          촬영 조건 위시리스트
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: '#A15E72' }}>
          원하는 날씨가 되면 알려드려요
        </Text>
      </View>
      <IconChevronRight size={normalize(18)} color={ACCENT} strokeWidth={2} />
    </Pressable>
  );
}
