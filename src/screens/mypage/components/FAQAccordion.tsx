import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { IconChevronRight } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD } from '@/constants/layout';

interface FAQAccordionProps {
  question: string;
  answer: string;
  isFirst?: boolean;
}

export default function FAQAccordion({ question, answer, isFirst = false }: FAQAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  const toggleAccordion = () => {
    const toValue = isOpen ? 0 : 1;
    setIsOpen(!isOpen);
    Animated.timing(animValue, {
      toValue,
      duration: 200,
      useNativeDriver: false, // height interpolation cannot use native driver
    }).start();
  };

  const contentMaxHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, normalize(300)], // Sufficient max height
  });

  const arrowRotation = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={{ borderTopWidth: isFirst ? 0 : 0.5, borderTopColor: 'rgba(0, 0, 0, 0.05)' }}>
      <TouchableOpacity
        onPress={toggleAccordion}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: normalize(14),
          paddingHorizontal: normalize(16),
        }}
      >
        <Text
          className="font-medium text-black tracking-tight"
          style={{ fontSize: FONT_MD, flex: 1, marginRight: normalize(10) }}
        >
          {question}
        </Text>
        <Animated.View style={{ transform: [{ rotate: arrowRotation }] }}>
          <IconChevronRight size={normalize(18)} color="rgba(0, 0, 0, 0.25)" strokeWidth={2} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight: contentMaxHeight, overflow: 'hidden' }}>
        <View style={{ paddingHorizontal: normalize(16), paddingBottom: normalize(14) }}>
          <Text
            className="leading-relaxed tracking-tight"
            style={{ fontSize: FONT_SM, color: 'rgba(0, 0, 0, 0.5)' }}
          >
            {answer}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
