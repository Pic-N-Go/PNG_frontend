import React from 'react';
import { Image, StyleProp, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * 출품작 사진. 목업이 사진 자리를 3색 그라디언트로 채워 두었던 곳을 전부 이걸로 바꾼다.
 *
 * 그라디언트를 지우지 않고 사진 뒤에 깔아 두는 이유는 두 가지다 — presigned URL이
 * 만료되거나 실패했을 때 검은 사각형 대신 뭔가 보이고, 로딩 중에도 카드가 비지 않는다.
 * 아직 서버에 붙지 않은 화면(mock)은 photoUrl 없이 그대로 그라디언트만 그린다.
 */
export default function ContestPhoto({
  photoUrl,
  gradient,
  style,
  radius,
}: {
  photoUrl?: string | null;
  gradient: [string, string, string];
  style?: StyleProp<ViewStyle>;
  /** 사진에도 같은 radius를 먹여야 모서리가 그라디언트와 어긋나지 않는다 */
  radius?: number;
}) {
  return (
    <View style={[{ overflow: 'hidden', borderRadius: radius }, style]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      ) : null}
    </View>
  );
}
