import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconSparkles, IconArrowRight } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, CONTENT_PADDING, FONT_MD, FONT_XS } from '@/constants/layout';
import { BRAND } from '@/constants/colors';

interface Props {
  onPress: () => void;
  marginTop?: number;
}

export default function AiPlannerBanner({ onPress, marginTop = normalize(16) }: Props) {
  return (
    <View
      className="bg-[#18181B] overflow-hidden"
      style={{
        marginHorizontal: CONTENT_PADDING,
        marginTop,
        borderRadius: CARD_RADIUS,
        padding: normalize(18),
      }}
    >
      <View className="flex-row items-center mb-1.5">
        <View
          className="items-center justify-center rounded-lg mr-2"
          style={{
            width: normalize(26),
            height: normalize(26),
            backgroundColor: 'rgba(227, 27, 89, 0.2)',
          }}
        >
          <IconSparkles size={normalize(14)} color={BRAND} strokeWidth={2} />
        </View>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: FONT_MD,
            color: '#FFFFFF',
            letterSpacing: -0.3,
          }}
        >
          AI 맞춤 출사 플래너
        </Text>
      </View>

      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'Pretendard-Regular',
          fontSize: FONT_XS,
          color: 'rgba(255,255,255,0.65)',
          lineHeight: normalize(18),
          letterSpacing: -0.2,
          marginBottom: normalize(14),
        }}
      >
        원하는 테마와 일정을 입력하면 나만의 출사 코스를 기획해 드립니다.
      </Text>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className="flex-row items-center justify-center self-start bg-brand rounded-full"
        style={{
          height: normalize(34),
          paddingHorizontal: normalize(14),
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: FONT_XS,
            color: '#FFFFFF',
            letterSpacing: -0.1,
            marginRight: normalize(4),
          }}
        >
          코스 기획하기
        </Text>
        <IconArrowRight size={normalize(13)} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}
