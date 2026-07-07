import React from 'react';
import { Text } from 'react-native';
import { FONT_SM } from '@/constants/layout';

interface Props {
  rating: number;
  size?: number;
  color?: string;
}

export default function StarRating({ rating, size = FONT_SM, color = '#FF9F0A' }: Props) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  const stars = '★'.repeat(filled) + '☆'.repeat(5 - filled);

  return (
    <Text allowFontScaling={false} style={{ fontSize: size, color, letterSpacing: 1 }}>
      {stars}
    </Text>
  );
}
