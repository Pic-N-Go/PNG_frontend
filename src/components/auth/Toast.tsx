import React, { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONT_MD } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

type Props = {
  message: string;
  visible: boolean;
  onHide: () => void;
};

export default function Toast({ message, visible, onHide }: Props) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(16);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 16, duration: 300, useNativeDriver: true }),
      ]).start(() => onHideRef.current());
    }, 2500);

    return () => clearTimeout(timer);
  }, [visible, message, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: insets.bottom + normalize(16),
        alignSelf: 'center',
        opacity,
        transform: [{ translateY }],
        height: 44,
        paddingHorizontal: 20,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.75)',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 300,
      }}
    >
      <Text
        style={{
          fontSize: FONT_MD,
          fontFamily: 'Pretendard-Medium',
          color: '#fff',
          letterSpacing: -0.2,
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
