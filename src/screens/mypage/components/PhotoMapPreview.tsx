import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Line, Circle, Path } from 'react-native-svg';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM } from '@/constants/layout';

export default function PhotoMapPreview() {
  return (
    <View className="mb-7 px-5">
      <View className="flex-row justify-between items-baseline mb-3">
        <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
          PIC MAP
        </Text>
        <TouchableOpacity onPress={() => console.log('전체보기: photo-map')}>
          <Text className="tracking-tight" style={{ fontSize: FONT_SM, color: '#e31b59' }}>
            전체보기
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={{
          height: normalize(200),
          borderRadius: normalize(16),
          backgroundColor: '#fff',
          position: 'relative',
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 5,
          elevation: 2,
        }}
      >
        <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
          {/* 가로선 */}
          <Line x1="0" y1="33%" x2="100%" y2="33%" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" />
          <Line x1="0" y1="66%" x2="100%" y2="66%" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" />
          {/* 세로선 */}
          <Line x1="33%" y1="0" x2="33%" y2="100%" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" />
          <Line x1="66%" y1="0" x2="66%" y2="100%" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" />
        </Svg>

        {/* 핀 렌더링 (모의 위치) */}
        {renderPin('23%', '34%', 'visit')}
        {renderPin('57%', '46%', 'visit')}
        {renderPin('40%', '66%', 'visit')}
        {renderPin('80%', '29%', 'featured')}
        {renderPin('29%', '83%', 'featured')}

        {/* 범례 */}
        <View
          style={{
            position: 'absolute',
            bottom: normalize(10),
            left: normalize(12),
            flexDirection: 'row',
            gap: normalize(14),
            alignItems: 'center',
          }}
        >
          <View className="flex-row items-center" style={{ gap: normalize(4) }}>
            <View style={{ width: normalize(8), height: normalize(8), borderRadius: normalize(4), backgroundColor: '#1c1c1e' }} />
            <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(10), color: 'rgba(0, 0, 0, 0.4)' }}>
              방문
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: normalize(4) }}>
            <View style={{ width: normalize(8), height: normalize(8), borderRadius: normalize(4), backgroundColor: '#E31B59' }} />
            <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(10), color: 'rgba(0, 0, 0, 0.4)' }}>
              즐겨찾기
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function renderPin(left: string, top: string, type: 'visit' | 'featured') {
  const isVisit = type === 'visit';
  const color = isVisit ? '#1c1c1e' : '#E31B59';
  const shadowColor = isVisit ? 'rgba(0,0,0,0.22)' : 'rgba(227,27,89,0.4)';
  const size = isVisit ? normalize(16) : normalize(20);
  const viewBoxHeight = isVisit ? 20 : 25;

  return (
    <View
      style={{
        position: 'absolute',
        left: left as any,
        top: top as any,
        transform: [{ translateX: -size / 2 }, { translateY: -viewBoxHeight }],
        shadowColor,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 3,
      }}
    >
      <Svg width={size} height={viewBoxHeight} viewBox="0 0 24 30" fill="none">
        <Path d="M12 0C5.4 0 0 5.4 0 12C0 20 12 30 12 30S24 20 24 12C24 5.4 18.6 0 12 0Z" fill={color} />
        <Circle cx="12" cy="10.5" r="4.5" fill="#fff" />
      </Svg>
    </View>
  );
}
