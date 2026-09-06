import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconRoute } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { getFallbackGradient } from '@/utils/gradient';

interface CourseCardThumbnailProps {
  courseId: number;
  thumbnails: string[];
  height?: number;
}

function ThumbnailSlot({
  url,
  seed,
  style,
}: {
  url: string;
  seed: string;
  style?: any;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
      <LinearGradient
        colors={getFallbackGradient(seed)}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {!failed && (
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

export default function CourseCardThumbnail({
  courseId,
  thumbnails,
  height = normalize(120),
}: CourseCardThumbnailProps) {
  const validThumbnails = (thumbnails || [])
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter((u) => u.length > 0)
    .filter((u, idx, arr) => arr.indexOf(u) === idx)
    .slice(0, 3);

  const count = validThumbnails.length;

  // 1. 이미지가 0개인 경우: 콘테스트 스타일의 목업 그라데이션 배너
  if (count === 0) {
    return (
      <View style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}>
        <LinearGradient
          colors={getFallbackGradient(courseId)}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <IconRoute size={normalize(26)} color="rgba(255,255,255,0.45)" strokeWidth={1.6} />
        </View>
      </View>
    );
  }

  // 2. 이미지가 1개인 경우: 단일 전체 썸네일
  if (count === 1) {
    return (
      <View style={{ width: '100%', height, position: 'relative', overflow: 'hidden' }}>
        <ThumbnailSlot
          url={validThumbnails[0]}
          seed={`${courseId}_0`}
          style={{ width: '100%', height: '100%' }}
        />
      </View>
    );
  }

  // 3. 이미지가 2개인 경우: 2분할 콜라주
  if (count === 2) {
    return (
      <View style={{ flexDirection: 'row', width: '100%', height, overflow: 'hidden' }}>
        <ThumbnailSlot
          url={validThumbnails[0]}
          seed={`${courseId}_0`}
          style={{ flex: 1, height: '100%', borderRightWidth: 1.5, borderColor: '#ffffff' }}
        />
        <ThumbnailSlot
          url={validThumbnails[1]}
          seed={`${courseId}_1`}
          style={{ flex: 1, height: '100%' }}
        />
      </View>
    );
  }

  // 4. 이미지가 3개인 경우: 3분할 콜라주 (메인 1.6 : 서브 1 : 서브 1)
  return (
    <View style={{ flexDirection: 'row', width: '100%', height, overflow: 'hidden' }}>
      <ThumbnailSlot
        url={validThumbnails[0]}
        seed={`${courseId}_0`}
        style={{ flex: 1.6, height: '100%', borderRightWidth: 1.5, borderColor: '#ffffff' }}
      />
      <ThumbnailSlot
        url={validThumbnails[1]}
        seed={`${courseId}_1`}
        style={{ flex: 1, height: '100%', borderRightWidth: 1.5, borderColor: '#ffffff' }}
      />
      <ThumbnailSlot
        url={validThumbnails[2]}
        seed={`${courseId}_2`}
        style={{ flex: 1, height: '100%' }}
      />
    </View>
  );
}
