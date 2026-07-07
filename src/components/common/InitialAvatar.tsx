import React from 'react';
import { Text, View } from 'react-native';
import { FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

interface Props {
  initial: string;
  backgroundColor: string;
  size?: number;
  fontSize?: number;
}

export default function InitialAvatar({ initial, backgroundColor, size = normalize(36), fontSize = FONT_SM }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize, color: '#fff' }}>
        {initial}
      </Text>
    </View>
  );
}
