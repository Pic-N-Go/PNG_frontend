import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon } from 'react-native-svg';
import { IconBell } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_MD, FONT_XS, GRID_PADDING, ICON_MD } from '@/constants/layout';
import { BRAND } from '@/constants/colors';
import { useCurrentWeather } from '@/hooks/useCurrentWeather';

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
  /** 현재 위치. 없으면(권한 거부·측위 전) 날씨 줄을 비워둔다. */
  lat?: number;
  lng?: number;
}

export default function HeroSection({ onNotificationPress, hasUnread, lat, lng }: Props) {
  const insets = useSafeAreaInsets();
  const { data: weather } = useCurrentWeather(lat, lng);

  // 서버가 항목별로 실패를 허용한다 — 온 것만 이어 붙인다. 하나도 없으면 줄 자체를 그리지 않는다
  // (자리만 남으면 로딩이 끝난 뒤에도 고장난 것처럼 보인다).
  const weatherLine = [
    weather?.region,
    weather?.weatherStatus,
    weather?.fineDust?.grade && `미세먼지 ${weather.fineDust.grade}`,
    // "다음" 없이 시각만 붙이면 현재 시각으로 읽힌다 — 실제로는 아직 오지 않은 시작 시각이다.
    weather?.goldenHour && `다음 골든아워 ${weather.goldenHour}`,
  ]
    .filter(Boolean)
    .join(' · ');

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* 마크 전용(icon.png) + 투명 배경 → 어두운 hero 위 대비 위해 흰 원형 배경 */}
          <View
            style={{
              width: normalize(26),
              height: normalize(26),
              borderRadius: normalize(13),
              backgroundColor: '#fff',
              overflow: 'hidden',
              padding: normalize(1),
            }}
          >
            <Image
              source={require('../../../assets/images/logo/icon.png')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          <Text
            allowFontScaling={false}
            style={{
              // LoginScreen의 'PIC N GO' 서브 워드마크와 동일 규격, 두께만 SemiBold
              fontFamily: 'Pretendard-SemiBold',
              fontSize: FONT_XS,
              color: '#fff',
              letterSpacing: 3.5,
            }}
          >
            PIC N GO
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
                backgroundColor: BRAND,
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
        {weatherLine.length > 0 && (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: FONT_MD,
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: -0.15,
              marginTop: normalize(10),
            }}
          >
            {weatherLine}
          </Text>
        )}
      </View>
    </View>
  );
}
