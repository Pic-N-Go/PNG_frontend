import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconInfoCircle, IconX } from '@tabler/icons-react-native';
import { PhotoExifSheetContent } from '@/components/common/PhotoExifSheet';
import { PhotoExifData } from '@/types/photo';
import { BOTTOM_SHEET_RADIUS, FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

interface Props {
  /** 표시할 사진 URL 목록. visible=true인데 비어 있으면 uri가 undefined가 되므로 호출부가 보장해야 한다. */
  photos: string[];
  /** 처음 보여줄 사진 인덱스 */
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

// 퍼센트 높이는 부모 높이가 확정돼야 해석돼 이미지가 0높이로 접히는 일이 있었다.
// Modal 안에서는 실측 화면 크기로 고정하는 편이 확실하다.
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.7;

// ponytail: 리뷰 사진은 실제 업로드본이라 EXIF를 클라에서 읽지도, 서버가 반환하지도 않는다
// (ReviewWriteScreen의 image-picker에 exif 옵션이 없고, 백엔드 ExifExtractor도 미연결).
// UI 레이아웃만 먼저 맞춰두는 자리 — 실제 파이프라인 연동 시 이 상수를 걷어내고 API 값으로 교체.
const PLACEHOLDER_EXIF: PhotoExifData = {
  camera: 'Sony ILCE-7M4',
  lens: 'Sony FE 24-70mm F2.8 GM',
  iso: 100,
  aperture: 'f/2.8',
  shutter: '1/500',
  focalLength: '24',
  exposureMode: '수동',
  metering: '다분할측광',
  whiteBalance: '자동',
  flash: '사용 안 함',
  focalLength35mm: '24mm',
  software: 'Adobe Lightroom Classic 12.3',
  gpsLat: 35.153386,
  gpsLng: 129.118785,
};

/**
 * 사진 확대 오버레이. 라우트가 아니라 Modal인 이유: 딥링크로 도달할 대상이 아니고
 * 스팟 상세 위에 겹쳐 뜨는 일시적 레이어이기 때문이다(PhotoDetail 라우트는 스팟 사진 전용).
 */
export default function PhotoLightbox({ photos, initialIndex, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = React.useState(initialIndex);
  const [exifOpen, setExifOpen] = React.useState(false);
  const exifTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // 다른 리뷰의 사진을 열면 시작 인덱스가 바뀌므로 열릴 때마다 맞춘다.
  React.useEffect(() => {
    if (visible) setIndex(initialIndex);
    if (!visible) setExifOpen(false);
  }, [visible, initialIndex]);

  useEffect(() => {
    Animated.timing(exifTranslateY, {
      toValue: exifOpen ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [exifOpen, exifTranslateY]);

  // visible로만 판정한다. photos가 비는 순간 Modal을 언마운트하면 fade 종료 애니메이션이 생략된다.
  if (!visible && photos.length === 0) return null;
  const uri = photos[Math.min(index, Math.max(photos.length - 1, 0))];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center' }}>
        {/* 배경을 눌러도 닫히게 — 전체화면에서 X만 유일한 탈출구면 답답하다. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Image
          source={{ uri }}
          resizeMode="contain"
          // presigned URL 만료(환경 설정값, 로컬 60분) 시 조용히 빈 화면이 되므로 원인을 남긴다.
          onError={(e) => __DEV__ && console.warn('[lightbox] 이미지 로드 실패:', e.nativeEvent, uri?.slice(0, 90))}
          style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
        />

        <View
          style={{
            position: 'absolute',
            top: normalize(52),
            left: normalize(16),
            right: normalize(16),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            style={{
              width: normalize(36),
              height: normalize(36),
              borderRadius: normalize(18),
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconX size={normalize(20)} color="#fff" strokeWidth={2} />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
            {photos.length > 1 && (
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: '#fff' }}>
                {`${index + 1} / ${photos.length}`}
              </Text>
            )}
            <Pressable
              onPress={() => setExifOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="사진 정보"
              style={{
                width: normalize(36),
                height: normalize(36),
                borderRadius: normalize(18),
                backgroundColor: 'rgba(0,0,0,0.4)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconInfoCircle size={normalize(20)} color="#fff" strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* 여러 장이면 하단 썸네일로 전환. 화살표보다 현재 위치가 한눈에 보인다. */}
        {photos.length > 1 && (
          <View
            style={{
              position: 'absolute',
              bottom: normalize(48),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: normalize(8),
            }}
          >
            {photos.map((thumbUri, i) => (
              <Pressable key={thumbUri} onPress={() => setIndex(i)}>
                <Image
                  source={{ uri: thumbUri }}
                  resizeMode="cover"
                  style={{
                    width: normalize(48),
                    height: normalize(48),
                    borderRadius: normalize(8),
                    opacity: i === index ? 1 : 0.4,
                    borderWidth: i === index ? 1.5 : 0,
                    borderColor: '#fff',
                  }}
                />
              </Pressable>
            ))}
          </View>
        )}

        {exifOpen && (
          <Pressable
            onPress={() => setExifOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 5 }}
          />
        )}
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: '80%',
            backgroundColor: '#fff',
            borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
            borderTopRightRadius: BOTTOM_SHEET_RADIUS,
            paddingBottom: insets.bottom + normalize(8),
            transform: [{ translateY: exifTranslateY }],
            zIndex: 6,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: normalize(10), paddingBottom: normalize(8) }}>
            <View style={{ width: normalize(36), height: normalize(4), borderRadius: normalize(2), backgroundColor: 'rgba(0,0,0,0.12)' }} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <PhotoExifSheetContent exif={PLACEHOLDER_EXIF} onClose={() => setExifOpen(false)} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
