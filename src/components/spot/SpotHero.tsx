import React, { useState } from 'react';
import { Dimensions, Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { IconBookmark, IconChevronLeft, IconShare } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';

export const HERO_HEIGHT = normalize(360);

const SCREEN_WIDTH = Dimensions.get('window').width;

const LANDSCAPE_POINTS = '0,60 12,40 25,55 40,20 55,38 68,10 82,30 100,15 100,100 0,100';

// 목업엔 실제 사진이 없어 히어로 페이지마다 다른 그라디언트로 구분 (photoTotal 만큼 순환)
const HERO_GRADIENT_SETS: [string, string, string, string][] = [
  ['#0f2027', '#203a43', '#2c5364', '#4a7c8a'],
  ['#1a1530', '#2d1b4e', '#8b4a6b', '#d4856a'],
  ['#0f2027', '#2c5364', '#4a7c8a', '#8da9c4'],
  ['#203a43', '#2c5364', '#4a7c8a', '#a8c5da'],
  ['#1a1530', '#4a3060', '#8b4a6b', '#e8a87c'],
];

interface Props {
  scrollY: SharedValue<number>;
  photoTotal: number;
  isBookmarked: boolean;
  imageUrl?: string | null;
  onBack: () => void;
  onShare: () => void;
  onBookmark: () => void;
}

export default function SpotHero({
  scrollY,
  photoTotal,
  isBookmarked,
  imageUrl,
  onBack,
  onShare,
  onBookmark,
}: Props) {
  const insets = useSafeAreaInsets();
  const [currentPhoto, setCurrentPhoto] = useState(0);
  // 대표 이미지(단일)가 있으면 그것을 히어로로. 없으면 기존 placeholder 그라디언트.
  const hasImage = !!imageUrl;
  const swipeable = photoTotal >= 2;

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 200], [0, -100], Extrapolation.CLAMP),
      },
    ],
  }));

  function handlePhotoScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentPhoto(index);
  }

  return (
    <Animated.View style={[{ height: HERO_HEIGHT, overflow: 'hidden' }, heroStyle]}>
      {hasImage ? (
        <Image
          source={{ uri: imageUrl! }}
          style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT, backgroundColor: '#203a43' }}
          resizeMode="cover"
          accessibilityLabel="스팟 대표 이미지"
        />
      ) : swipeable ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handlePhotoScroll}
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
        >
          {Array.from({ length: photoTotal }).map((_, i) => (
            <LinearGradient
              key={i}
              colors={HERO_GRADIENT_SETS[i % HERO_GRADIENT_SETS.length]}
              locations={[0, 0.35, 0.65, 1]}
              style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}
            />
          ))}
        </ScrollView>
      ) : (
        <LinearGradient
          colors={HERO_GRADIENT_SETS[0]}
          locations={[0, 0.35, 0.65, 1]}
          style={{ position: 'absolute', inset: 0 }}
        />
      )}

      {/* 상단 페이드 */}
      <LinearGradient
        colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: normalize(100) }}
        pointerEvents="none"
      />
      {/* 하단 페이드 */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: normalize(100) }}
        pointerEvents="none"
      />

      {/* 지형 실루엣 */}
      <Svg
        width="100%"
        height={normalize(80)}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
        pointerEvents="none"
      >
        <Polygon points={LANDSCAPE_POINTS} fill="rgba(0,0,0,0.12)" />
      </Svg>
      <View style={{ position: 'absolute', bottom: normalize(60), left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' }} pointerEvents="none" />

      {/* 액션 버튼 */}
      <View
        style={{
          position: 'absolute',
          top: insets.top + normalize(6),
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: normalize(12),
        }}
      >
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(18), backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconChevronLeft size={normalize(18)} color="#fff" strokeWidth={2} />
        </Pressable>
        <View style={{ flexDirection: 'row', gap: normalize(10) }}>
          <Pressable
            onPress={onShare}
            hitSlop={8}
            style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(18), backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconShare size={normalize(18)} color="#fff" strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={onBookmark}
            hitSlop={8}
            style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(18), backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' }}
          >
            <IconBookmark
              size={normalize(18)}
              color="#fff"
              strokeWidth={2}
              fill={isBookmarked ? '#fff' : 'none'}
            />
          </Pressable>
        </View>
      </View>

      {/* 카운터 — placeholder 스와이프일 때만 (대표 이미지 단일이면 숨김) */}
      {swipeable && !hasImage && (
        <View
          style={{
            position: 'absolute',
            bottom: normalize(14),
            right: normalize(16),
            height: normalize(26),
            paddingHorizontal: normalize(12),
            borderRadius: normalize(13),
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(12), color: '#fff' }}>
            {currentPhoto + 1} / {photoTotal}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
