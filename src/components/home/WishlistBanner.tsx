import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconBell, IconChevronRight } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, GRID_PADDING } from '@/constants/layout';

interface Props {
  // TODO: 위시리스트 화면 경로 확정 후 onPress 연결
  onPress?: () => void;
}

export default function WishlistBanner({ onPress }: Props) {
  return (
    <View
      style={{
        marginHorizontal: GRID_PADDING,
        marginTop: normalize(28),
        borderRadius: CARD_RADIUS,
        backgroundColor: '#F5F5F7',
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: onPress && pressed ? 'rgba(227,27,89,0.04)' : 'transparent',
        })}
      >
        <View
          style={{
            paddingVertical: normalize(14),
            paddingHorizontal: normalize(16),
            flexDirection: 'row',
            alignItems: 'center',
            gap: normalize(12),
          }}
        >
          {/* 아이콘 */}
          <View
            style={{
              width: normalize(36),
              height: normalize(36),
              borderRadius: normalize(10),
              backgroundColor: 'rgba(227,27,89,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconBell size={normalize(18)} color="#E31B59" strokeWidth={1.5} />
          </View>

          {/* 텍스트 */}
          <View style={{ flex: 1 }}>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Medium',
                fontSize: normalizeFontSize(14),
                color: '#000',
                letterSpacing: -0.15,
              }}
            >
              촬영 조건 위시리스트
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: normalizeFontSize(12),
                color: 'rgba(0,0,0,0.4)',
                marginTop: normalize(1),
              }}
            >
              원하는 날씨가 되면 알려드려요
            </Text>
          </View>

          {/* 화살표 */}
          <View style={{ flexShrink: 0 }}>
            <IconChevronRight size={normalize(16)} color="rgba(0,0,0,0.2)" strokeWidth={1.5} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}
