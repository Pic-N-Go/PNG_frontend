import React from 'react';
import { Image, Text, View } from 'react-native';
import { FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

interface Props {
  initial: string;
  backgroundColor: string;
  size?: number;
  fontSize?: number;
  /** 프로필 이미지. 없거나 로드에 실패하면 이니셜이 그대로 보인다. */
  uri?: string;
}

export default function InitialAvatar({
  initial,
  backgroundColor,
  size = normalize(36),
  fontSize = FONT_SM,
  uri,
}: Props) {
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
        overflow: 'hidden',
      }}
    >
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize, color: '#fff' }}>
        {initial}
      </Text>
      {/* 이니셜을 바닥에 깔고 이미지를 덮는다. 로딩 중에는 이니셜이 보이고, 로드에 실패하면
          이미지가 투명하게 남아 이니셜이 그대로 드러나므로 별도 실패 상태가 필요 없다.
          (카카오는 JPEG를 주므로 투명 배경 이미지가 이니셜과 겹칠 일은 없다) */}
      {!!uri && (
        <Image
          source={{ uri }}
          resizeMode="cover"
          style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2 }}
        />
      )}
    </View>
  );
}
