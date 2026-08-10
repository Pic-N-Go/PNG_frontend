import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconBell, IconChevronRight } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, GRID_PADDING } from '@/constants/layout';

interface Props {
  onPress?: () => void;
}

export default function SpotAlertBanner({ onPress }: Props) {
  return (
    <View
      className="bg-[#F5F5F7] overflow-hidden"
      style={{
        marginHorizontal: GRID_PADDING,
        marginTop: normalize(28),
        borderRadius: CARD_RADIUS,
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: onPress && pressed ? 'rgba(227,27,89,0.04)' : 'transparent',
        })}
      >
        <View
          className="flex-row items-center"
          style={{
            paddingVertical: normalize(14),
            paddingHorizontal: normalize(16),
            gap: normalize(12),
          }}
        >
          {/* 아이콘 */}
          <View
            className="items-center justify-center shrink-0 bg-[#E31B59]/[0.08]"
            style={{
              width: normalize(36),
              height: normalize(36),
              borderRadius: normalize(10),
            }}
          >
            <IconBell size={normalize(18)} color="#E31B59" strokeWidth={1.5} />
          </View>

          {/* 텍스트 */}
          <View className="flex-1">
            <Text
              allowFontScaling={false}
              className="text-black font-medium tracking-tight"
              style={{
                fontSize: normalizeFontSize(14),
              }}
            >
              출사 알림 조건 설정
            </Text>
            <Text
              allowFontScaling={false}
              className="text-black/40"
              style={{
                fontSize: normalizeFontSize(12),
                marginTop: normalize(1),
              }}
            >
              원하는 날씨가 되면 알려드려요
            </Text>
          </View>

          {/* 화살표 */}
          <View className="shrink-0">
            <IconChevronRight size={normalize(16)} color="rgba(0,0,0,0.2)" strokeWidth={1.5} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}
