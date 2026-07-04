import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon } from 'react-native-svg';
import { IconBell } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_LG, FONT_MD, GRID_PADDING, ICON_MD } from '@/constants/layout';

const HERO_COLORS = ['#1a1530', '#2d1b4e', '#8b4a6b', '#d4856a', '#e8a87c', '#f0c89a'] as const;
const HERO_LOCS = [0, 0.2, 0.45, 0.65, 0.82, 1.0] as const;
const HERO_HEIGHT = normalize(340);

const STARS: { top: number; left: number; opacity: number }[] = [
  { top: 55, left: 70, opacity: 0.4 },
  { top: 38, left: 140, opacity: 0.3 },
  { top: 65, left: 220, opacity: 0.25 },
  { top: 48, left: 340, opacity: 0.3 },
];

interface Props {
  onNotificationPress?: () => void;
  hasUnread?: boolean;
}

export default function HeroSection({ onNotificationPress, hasUnread }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ height: HERO_HEIGHT }}>
      <LinearGradient
        colors={HERO_COLORS}
        locations={HERO_LOCS}
        style={{ position: 'absolute', inset: 0 }}
      />

      {/* 별 */}
      {STARS.map((s, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: normalize(s.top),
            left: normalize(s.left),
            width: normalize(2),
            height: normalize(2),
            borderRadius: normalize(1),
            backgroundColor: `rgba(255,255,255,${s.opacity})`,
          }}
        />
      ))}

      {/* 태양 */}
      <View
        style={{
          position: 'absolute',
          top: normalize(108),
          right: normalize(70),
          width: normalize(36),
          height: normalize(36),
          borderRadius: normalize(18),
          backgroundColor: 'rgba(248,216,176,0.7)',
        }}
      />

      {/* 지형 — 산 실루엣 */}
      <Svg
        width="100%"
        height={normalize(70)}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
      >
        <Polygon
          points="0,55 10,35 22,50 38,18 52,38 68,10 82,32 100,18 100,100 0,100"
          fill="rgba(0,0,0,0.12)"
        />
      </Svg>

      {/* 상단 네비 */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + normalize(8),
          left: GRID_PADDING,
          right: GRID_PADDING,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Image
            source={require('../../../assets/images/logo/logo.png')}
            style={{ width: normalize(26), height: normalize(26) }}
            resizeMode="contain"
          />
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: FONT_LG,
              color: '#fff',
              letterSpacing: -0.5,
            }}
          >
            Pic N Go
          </Text>
        </View>

        <Pressable
          onPress={onNotificationPress}
          hitSlop={8}
          style={{ width: normalize(38), height: normalize(38), alignItems: 'center', justifyContent: 'center' }}
        >
          <IconBell size={ICON_MD} color="rgba(255,255,255,0.8)" strokeWidth={1.5} />
          {hasUnread && (
            <View
              style={{
                position: 'absolute',
                top: normalize(6),
                right: normalize(6),
                width: normalize(7),
                height: normalize(7),
                borderRadius: normalize(3.5),
                backgroundColor: '#E31B59',
                borderWidth: 1.5,
                borderColor: 'rgba(45,27,78,0.9)',
              }}
            />
          )}
        </Pressable>
      </View>

      {/* 타이틀 + 날씨 — HTML: nav padding-top 62 + nav height 38 + space-xl 32 = 132px */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + normalize(78),
          left: GRID_PADDING,
          right: GRID_PADDING,
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: normalizeFontSize(30),
            color: '#fff',
            letterSpacing: -0.6,
            lineHeight: normalizeFontSize(30) * 1.35,
          }}
        >
          {'오늘의 출사,\n어디로 떠나볼까요?'}
        </Text>
        {/* TODO: 날씨 API 연동 시 실제 데이터로 교체 */}
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: FONT_MD,
            color: 'rgba(255,255,255,0.65)',
            letterSpacing: -0.15,
            marginTop: normalize(10),
          }}
        >
          서울 · 맑음 · 미세먼지 좋음 · 골든아워 18:42
        </Text>
      </View>
    </View>
  );
}
