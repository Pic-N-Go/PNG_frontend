import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, ViewStyle } from 'react-native';
import { normalize } from '@/utils/normalize';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  style?: ViewStyle;
}

export default function CustomToggle({ value, onValueChange, style }: CustomToggleProps) {
  // width: 44, height: 26
  // handle: 22, offset: 2
  // maxTranslate: 44 - 22 - 4 = 18
  const width = normalize(44);
  const height = normalize(26);
  const handleSize = normalize(22);
  const padding = normalize(2);
  const maxTranslate = width - handleSize - padding * 2;

  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // color interpolation requires false
    }).start();
  }, [value, animValue]);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxTranslate],
  });

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0.15)', '#34c759'],
  });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[{ width, height }, style]}
    >
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: height / 2,
          backgroundColor,
          padding,
        }}
      >
        <Animated.View
          style={{
            width: handleSize,
            height: handleSize,
            borderRadius: handleSize / 2,
            backgroundColor: '#ffffff',
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: normalize(1) },
            shadowOpacity: 0.2,
            shadowRadius: normalize(3),
            elevation: 2,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
