import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface Props {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: object;
}

export default function Skeleton({ width, height, borderRadius = 8, style }: Props) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: '#E5E5EA', opacity },
        style,
      ]}
    />
  );
}
