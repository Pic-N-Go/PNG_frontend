import React from 'react';
import { Text, View } from 'react-native';
import { IconMapPin } from '@tabler/icons-react-native';
import StarRating from '@/components/common/StarRating';
import { FONT_2XL, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { SpotDetailInfo } from '@/types/spot';

interface Props {
  spot: SpotDetailInfo;
}

export default function SpotInfoHeader({ spot }: Props) {
  return (
    <View style={{ paddingHorizontal: GRID_PADDING, paddingVertical: normalize(20) }}>
      {spot.badge && (
        <View
          style={{
            alignSelf: 'flex-start',
            height: normalize(24),
            paddingHorizontal: normalize(10),
            borderRadius: normalize(6),
            backgroundColor: 'rgba(227,27,89,0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: normalize(12),
          }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#E31B59', letterSpacing: 0.3 }}>
            {spot.badge}
          </Text>
        </View>
      )}

      <Text
        allowFontScaling={false}
        style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XL, color: '#000', letterSpacing: -0.6, lineHeight: FONT_2XL * 1.2, marginBottom: normalize(8) }}
      >
        {spot.name}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), marginBottom: normalize(12) }}>
        <IconMapPin size={normalize(14)} color="rgba(0,0,0,0.35)" strokeWidth={2} />
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.45)', letterSpacing: -0.15 }}>
          {spot.address}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: normalize(14) }}>
        <StarRating rating={spot.rating} size={normalizeFontSize(14)} />
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#000', marginLeft: normalize(4) }}>
          {spot.rating.toFixed(1)}
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.35)', marginLeft: normalize(2) }}>
          {` · 리뷰 ${spot.reviewCount}건 · 사진 ${spot.photoCount.toLocaleString()}장`}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(6) }}>
        {spot.tags.map((tag) => (
          <View
            key={tag}
            style={{
              height: normalize(30),
              paddingHorizontal: normalize(14),
              borderRadius: normalize(17),
              backgroundColor: '#F5F5F7',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.45)' }}>
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
