import React, { useState, useEffect, useMemo } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { IconRoute } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { iconGray } from '@/constants/colors';

interface CourseCardThumbnailProps {
  courseId: number;
  thumbnails: string[];
  height?: number;
}

export default function CourseCardThumbnail({
  courseId,
  thumbnails,
  height = normalize(120),
}: CourseCardThumbnailProps) {
  const initialThumbnails = useMemo(() => {
    return (thumbnails || [])
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter((u) => u.length > 0)
      .filter((u, idx, arr) => arr.indexOf(u) === idx)
      .slice(0, 3);
  }, [thumbnails]);

  // 로딩 실패(404, 네트워크 에러 등)한 URL을 추적하여 콜라주 목록에서 제외
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFailedUrls({});
  }, [thumbnails]);

  const handleImageError = (url: string) => {
    setFailedUrls((prev) => {
      if (prev[url]) return prev;
      return { ...prev, [url]: true };
    });
  };

  const validThumbnails = initialThumbnails.filter((url) => !failedUrls[url]);
  const count = validThumbnails.length;

  // 1. 유효한 이미지가 0개인 경우 (코스 목록 페이지에서는 목업 그래디언트를 띄우지 않고 단정한 중립 빈 상태 유지)
  if (count === 0) {
    return (
      <View
        className="flex-1 items-center justify-center bg-card"
        style={{ width: '100%', height, gap: normalize(8) }}
      >
        <IconRoute size={normalize(26)} color={iconGray(0.2)} strokeWidth={1.5} />
        <Text
          allowFontScaling={false}
          className="font-normal tracking-tight"
          style={{ fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.3)' }}
        >
          표시할 경로가 없어요
        </Text>
      </View>
    );
  }

  // 2. 유효한 이미지가 1개인 경우: 단일 전체 썸네일
  if (count === 1) {
    return (
      <View style={{ width: '100%', height, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
        <Image
          source={{ uri: validThumbnails[0] }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => handleImageError(validThumbnails[0])}
        />
      </View>
    );
  }

  // 3. 유효한 이미지가 2개인 경우: 2분할 콜라주
  if (count === 2) {
    return (
      <View style={{ flexDirection: 'row', width: '100%', height, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
        <View style={{ flex: 1, height: '100%', borderRightWidth: 1.5, borderColor: '#ffffff', overflow: 'hidden' }}>
          <Image
            source={{ uri: validThumbnails[0] }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => handleImageError(validThumbnails[0])}
          />
        </View>
        <View style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
          <Image
            source={{ uri: validThumbnails[1] }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            onError={() => handleImageError(validThumbnails[1])}
          />
        </View>
      </View>
    );
  }

  // 4. 유효한 이미지가 3개인 경우: 3분할 콜라주 (메인 1.6 : 서브 1 : 서브 1)
  return (
    <View style={{ flexDirection: 'row', width: '100%', height, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
      <View style={{ flex: 1.6, height: '100%', borderRightWidth: 1.5, borderColor: '#ffffff', overflow: 'hidden' }}>
        <Image
          source={{ uri: validThumbnails[0] }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => handleImageError(validThumbnails[0])}
        />
      </View>
      <View style={{ flex: 1, height: '100%', borderRightWidth: 1.5, borderColor: '#ffffff', overflow: 'hidden' }}>
        <Image
          source={{ uri: validThumbnails[1] }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => handleImageError(validThumbnails[1])}
        />
      </View>
      <View style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
        <Image
          source={{ uri: validThumbnails[2] }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
          onError={() => handleImageError(validThumbnails[2])}
        />
      </View>
    </View>
  );
}
