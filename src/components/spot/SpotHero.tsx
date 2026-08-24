import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { IconBookmark, IconChevronLeft } from '@tabler/icons-react-native';
import { Share as ShareIcon } from 'lucide-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import SpotHeroPlaceholder, { HeroActionButton } from '@/components/spot/SpotHeroPlaceholder';
import { BRAND, SCRIM } from '@/constants/colors';

export const HERO_HEIGHT = normalize(360);

const SCREEN_WIDTH = Dimensions.get('window').width;

const LANDSCAPE_POINTS = '0,60 12,40 25,55 40,20 55,38 68,10 82,30 100,15 100,100 0,100';

interface Props {
  scrollY: SharedValue<number>;
  isBookmarked: boolean;
  imageUrl?: string | null;
  categories?: string[];
  regionLabel?: string | null;
  /** 대표 이미지 뒤에 있는 실제 전체 사진 장수. 2장 이상이면 카운터 노출 + 탭 시 풀스크린 뷰어 */
  heroPhotoCount?: number;
  onPressPhoto?: () => void;
  onBack: () => void;
  onShare: () => void;
  onBookmark: () => void;
}

export default function SpotHero({
  scrollY,
  isBookmarked,
  imageUrl,
  categories,
  regionLabel,
  heroPhotoCount = 0,
  onPressPhoto,
  onBack,
  onShare,
  onBookmark,
}: Props) {
  const insets = useSafeAreaInsets();
  // 대표 이미지 로드 실패 시에도 placeholder로 폴백 (핸드오프 6번 상태표)
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);
  const hasImage = !!imageUrl && !imageFailed;

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scrollY.value, [0, 200], [0, -100], Extrapolation.CLAMP),
      },
    ],
  }));

  if (!hasImage) {
    // 대표 이미지가 없거나 로드에 실패해도 갤러리 사진이 있으면 뷰어는 열 수 있어야 함.
    // 중첩 Pressable에서 헤더 버튼(뒤로/공유/저장)이 우선 처리되므로 그대로 동작한다.
    const canOpenViewer = !!onPressPhoto && heroPhotoCount > 0;
    return (
      <Animated.View style={[{ height: HERO_HEIGHT, overflow: 'hidden' }, heroStyle]}>
        <Pressable onPress={onPressPhoto} disabled={!canOpenViewer} style={{ flex: 1 }}>
          <SpotHeroPlaceholder
            categories={categories}
            regionLabel={regionLabel}
            height={HERO_HEIGHT}
            headerLeft={
              <HeroActionButton>
                <Pressable onPress={onBack} hitSlop={8}>
                  <IconChevronLeft size={normalize(20)} color="#111" strokeWidth={2} />
                </Pressable>
              </HeroActionButton>
            }
            headerRight={
              <>
                <HeroActionButton>
                  <Pressable onPress={onShare} hitSlop={8}>
                    <ShareIcon size={normalize(19)} color="#111" strokeWidth={2} />
                  </Pressable>
                </HeroActionButton>
                <HeroActionButton>
                  <Pressable onPress={onBookmark} hitSlop={8}>
                    <IconBookmark
                      size={normalize(19)}
                      color={isBookmarked ? BRAND : '#111'}
                      strokeWidth={2}
                      fill={isBookmarked ? BRAND : 'none'}
                    />
                  </Pressable>
                </HeroActionButton>
              </>
            }
          />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ height: HERO_HEIGHT, overflow: 'hidden' }, heroStyle]}>
      <Pressable onPress={onPressPhoto} disabled={!onPressPhoto} style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}>
        <Image
          source={{ uri: imageUrl! }}
          style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT, backgroundColor: '#203a43' }}
          resizeMode="cover"
          accessibilityLabel="스팟 대표 이미지"
          onError={() => setImageFailed(true)}
        />
      </Pressable>

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
            <ShareIcon size={normalize(18)} color="#fff" strokeWidth={2} />
          </Pressable>
          <Pressable
            onPress={onBookmark}
            hitSlop={8}
            style={{
              width: normalize(36),
              height: normalize(36),
              borderRadius: normalize(18),
              backgroundColor: isBookmarked ? '#fff' : 'rgba(0,0,0,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconBookmark
              size={normalize(18)}
              color={isBookmarked ? BRAND : '#fff'}
              strokeWidth={2}
              fill={isBookmarked ? BRAND : 'none'}
            />
          </Pressable>
        </View>
      </View>

      {/* 카운터 — 대표 이미지 뒤에 실제 사진이 2장 이상일 때. 탭하면 풀스크린 뷰어 */}
      {heroPhotoCount > 1 && (
        <View
          style={{
            position: 'absolute',
            bottom: normalize(14),
            right: normalize(16),
            height: normalize(26),
            paddingHorizontal: normalize(12),
            borderRadius: normalize(13),
            backgroundColor: SCRIM,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          pointerEvents="none"
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(12), color: '#fff' }}>
            1 / {heroPhotoCount}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
