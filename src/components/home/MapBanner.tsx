import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { IconMapPin } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_XS } from '@/constants/layout';

const PINS = [
  { left: '30%', top: '42%', large: true },
  { left: '62%', top: '32%', large: false },
  { left: '80%', top: '65%', large: false },
  { left: '46%', top: '74%', large: false },
] as const;

interface Props {
  onPress: () => void;
}

export default function MapBanner({ onPress }: Props) {
  return (
    <View style={{ height: normalize(160), borderRadius: CARD_RADIUS, overflow: 'hidden' }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flex: 1,
          opacity: pressed ? 0.97 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        })}
      >
        {/* 지도 배경 */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#e8e8ed' }} />

        {/* 격자선 + 도로선 */}
        <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%" viewBox="0 0 334 160" preserveAspectRatio="none">
          <Line x1="0" y1="53" x2="100%" y2="53" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
          <Line x1="0" y1="106" x2="100%" y2="106" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
          <Line x1="33%" y1="0" x2="33%" y2="100%" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
          <Line x1="66%" y1="0" x2="66%" y2="100%" stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
          <Path d="M0 90Q80 70 150 82Q230 95 310 65" stroke="rgba(0,0,0,0.06)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d="M150 0Q138 60 150 82Q162 104 140 160" stroke="rgba(0,0,0,0.06)" strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>

        {/* 핀들 */}
        {PINS.map((pin, i) => {
          const w = normalize(pin.large ? 22 : 18);
          const h = normalize(pin.large ? 27 : 22);
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: pin.left,
                top: pin.top,
                transform: [{ translateX: -w / 2 }, { translateY: -h }],
              }}
            >
              <Svg width={w} height={h} viewBox="0 0 28 34">
                <Path
                  d="M14 0C6.3 0 0 6.3 0 14C0 23 14 34 14 34S28 23 28 14C28 6.3 21.7 0 14 0Z"
                  fill="#E31B59"
                />
                <Circle cx="14" cy="12" r={pin.large ? 5 : 4} fill="#fff" />
              </Svg>
            </View>
          );
        })}

        {/* 현위치 */}
        <View
          style={{
            position: 'absolute',
            left: '50%',
            top: '52%',
            transform: [{ translateX: -normalize(10) }, { translateY: -normalize(10) }],
          }}
        >
          <View
            style={{
              width: normalize(20),
              height: normalize(20),
              borderRadius: normalize(10),
              backgroundColor: 'rgba(227,27,89,0.12)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: normalize(9),
                height: normalize(9),
                borderRadius: normalize(4.5),
                backgroundColor: '#E31B59',
                borderWidth: 2,
                borderColor: '#fff',
              }}
            />
          </View>
        </View>

        {/* 하단 오버레이 */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.18)']}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: normalize(80) }}
        />

        {/* 배지 */}
        <View
          style={{
            position: 'absolute',
            top: normalize(12),
            left: normalize(12),
            height: normalize(24),
            paddingHorizontal: normalize(10),
            borderRadius: normalize(12),
            backgroundColor: 'rgba(0,0,0,0.35)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: normalize(4),
          }}
        >
          <IconMapPin size={normalizeFontSize(10)} color="#fff" strokeWidth={1.5} />
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_XS, color: '#fff' }}
          >
            주변 스팟 4개
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
