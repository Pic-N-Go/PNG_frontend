import React from 'react';
import { Text, View } from 'react-native';
import { IconCar } from '@tabler/icons-react-native';
import Skeleton from '@/components/common/Skeleton';
import { FONT_SM, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { ConvenienceInfo } from '@/types/spot';

const CELL_COLOR: Record<ConvenienceInfo['cells'][number]['variant'], string> = {
  green: '#34C759',
  orange: '#FF9F0A',
  default: '#000',
};

interface Props {
  info: ConvenienceInfo;
  loading?: boolean;
}

export default function ConvenienceInfoSection({ info, loading = false }: Props) {
  return (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(20), color: '#000', letterSpacing: -0.3, marginBottom: normalize(14) }}>
        편의 정보
      </Text>

      <View style={{ borderRadius: normalize(14), backgroundColor: '#F5F5F7', overflow: 'hidden', marginBottom: normalize(12) }}>
        {info.transport.map((item, idx) => (
          <View
            key={item.main}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: normalize(12),
              paddingHorizontal: normalize(16),
              paddingVertical: normalize(14),
              borderTopWidth: idx > 0 ? 0.5 : 0,
              borderTopColor: 'rgba(0,0,0,0.04)',
            }}
          >
            {item.icon === 'parking' ? (
              <View style={{ width: normalize(28), height: normalize(28), borderRadius: normalize(8), backgroundColor: 'rgba(52,199,89,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(11), color: '#34c759' }}>P</Text>
              </View>
            ) : (
              <View style={{ width: normalize(28), height: normalize(28), borderRadius: normalize(8), backgroundColor: '#E8F3FF', alignItems: 'center', justifyContent: 'center' }}>
                <IconCar size={normalize(16)} color="#007aff" strokeWidth={2} />
              </View>
            )}
            <View style={{ flex: 1, gap: normalize(4) }}>
              {loading ? (
                <>
                  <Skeleton width="80%" height={normalize(13)} borderRadius={normalize(4)} />
                  <Skeleton width="60%" height={normalize(11)} borderRadius={normalize(4)} />
                </>
              ) : (
                <>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: '#000', letterSpacing: -0.15 }}>
                    {item.main}
                  </Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)' }}>
                    {item.sub}
                  </Text>
                </>
              )}
            </View>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(8) }}>
        {info.cells.map((cell) => (
          <View key={cell.label} style={{ flexBasis: '31%', flexGrow: 1, padding: normalize(14), borderRadius: normalize(12), backgroundColor: '#F5F5F7' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.35)', marginBottom: normalize(4) }}>
              {cell.label}
            </Text>
            {loading ? (
              <Skeleton width="70%" height={normalize(15)} borderRadius={normalize(4)} />
            ) : (
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(13), color: CELL_COLOR[cell.variant] }}>
                {cell.value}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
