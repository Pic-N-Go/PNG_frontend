import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/AuthStack';
import { normalize, normalizeFontSize } from '@/utils/normalize';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

const TRACK_W = normalize(100);
const TRACK_H = normalize(3);
const HOME_W = normalize(110);
const HOME_H = normalize(5);
const LOGO_SIZE = normalizeFontSize(80);
const SUB_SIZE = normalizeFontSize(12);

export default function SplashScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const loadBarScale = useRef(new Animated.Value(0)).current;
  const hasNavigated = useRef(false);

  // scaleX 0→1, left-anchored: translateX = TRACK_W/2 * (scale - 1)
  const barTranslateX = loadBarScale.interpolate({
    inputRange: [0, 1],
    outputRange: [-TRACK_W / 2, 0],
  });

  // Design ref: 390×844. Loading bar bottom = insets.bottom + 50dp scaled.
  const loadingBarBottom = insets.bottom + normalize(50);
  // Home indicator: sits inside bottom inset area
  const homeIndicatorBottom = Math.max(normalize(8), Math.round(insets.bottom * 0.5));

  useEffect(() => {
    Animated.timing(loadBarScale, {
      toValue: 1,
      duration: 2500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && !hasNavigated.current) {
          hasNavigated.current = true;
          navigation.replace('Login');
        }
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
      loadBarScale.stopAnimation();
      screenOpacity.stopAnimation();
    };
  }, [navigation, loadBarScale, screenOpacity]);

  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: '#E31B59', opacity: screenOpacity }}
    >
      {/* Logo — vertically centered */}
      <View className="flex-1 items-center justify-center">
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'FugazOne_400Regular',
            fontSize: LOGO_SIZE,
            color: '#ffffff',
            letterSpacing: -1,
            lineHeight: LOGO_SIZE * 1.1,
          }}
        >
          P N G
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: SUB_SIZE,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: 3.5,
            marginTop: normalize(8),
          }}
        >
          PIC N GO
        </Text>
      </View>

      {/* Loading bar */}
      <View
        style={{
          position: 'absolute',
          bottom: loadingBarBottom,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: TRACK_W,
            height: TRACK_H,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: TRACK_H / 2,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              width: TRACK_W,
              height: TRACK_H,
              backgroundColor: 'rgba(255,255,255,0.9)',
              transform: [{ translateX: barTranslateX }, { scaleX: loadBarScale }],
            }}
          />
        </View>
      </View>

      {/* Home indicator */}
      <View
        style={{
          position: 'absolute',
          bottom: homeIndicatorBottom,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: HOME_W,
            height: HOME_H,
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: HOME_H / 2,
          }}
        />
      </View>
    </Animated.View>
  );
}
