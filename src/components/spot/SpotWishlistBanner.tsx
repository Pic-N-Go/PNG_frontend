import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconBell, IconChevronRight } from '@tabler/icons-react-native';
import { FONT_SM, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

interface Props {
  onPress: () => void;
}

export default function SpotWishlistBanner({ onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginHorizontal: GRID_PADDING,
        paddingHorizontal: normalize(16),
        paddingVertical: normalize(14),
        borderRadius: normalize(14),
        backgroundColor: '#F5F5F7',
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(12),
      }}
    >
      <View style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(10), backgroundColor: 'rgba(227,27,89,0.08)', alignItems: 'center', justifyContent: 'center' }}>
        <IconBell size={normalize(18)} color="#e31b59" strokeWidth={2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: '#000', letterSpacing: -0.15 }}>
          촬영 조건 위시리스트
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginTop: normalize(1) }}>
          원하는 날씨가 되면 알려드려요
        </Text>
      </View>
      <IconChevronRight size={normalize(18)} color="rgba(0,0,0,0.18)" strokeWidth={2} />
    </Pressable>
  );
}
