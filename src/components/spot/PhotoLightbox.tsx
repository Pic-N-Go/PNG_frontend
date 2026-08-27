import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { IconX } from '@tabler/icons-react-native';
import { Info } from 'lucide-react-native';
import { PhotoExifLayer } from '@/components/common/PhotoExifSheet';
import { useReviewExif } from '@/hooks/useSpot';
import type { PhotoExifData } from '@/types/photo';
import { FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { SCRIM } from '@/constants/colors';

interface Props {
  /** 표시할 사진 URL 목록. visible=true인데 비어 있으면 uri가 undefined가 되므로 호출부가 보장해야 한다. */
  photos: string[];
  /** 처음 보여줄 사진 인덱스 */
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  /**
   * 리뷰 사진일 때만 넘긴다. 넘기면 `GET /reviews/{id}/exif`로 사진별 EXIF를 조회한다.
   */
  reviewId?: string | number | null;
  /** photos와 같은 순서의 photoId. EXIF 응답을 imageId로 매칭한다(URL은 presigned라 키가 못 된다). */
  photoIds?: number[];
  /**
   * 이미 아는 사진 정보를 photos와 같은 순서로 넘긴다. 서버 조회가 없는 스팟 사진용
   * (`exifFromPhotoUrl` 참고). reviewId와 함께 넘기면 서버 응답이 우선한다.
   */
  exifs?: (PhotoExifData | undefined)[];
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.7;
const CLOSE_DRAG_DISTANCE = 120;
const MAX_ZOOM = 4;
const SWIPE_DISTANCE = 50;

/**
 * 사진 확대 오버레이 (안정적인 제스처 + 축 고정 스와이프).
 *
 * 1. 좌우 스와이프: 손가락으로 가로로 밀면 이전/다음 사진으로 즉시 전환
 * 2. 축 고정 (Axis Locking): 가로 이동 중에는 세로 이동을 0으로 잠그고, 아래로 당길 때만 닫기 동작 수행 (대각선 쏠림 방지)
 * 3. 핀치 줌: 두 손가락 확대/축소 및 확대 상태에서 사진 이동 지원
 */
export default function PhotoLightbox({ photos, initialIndex, visible, onClose, reviewId, photoIds, exifs }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [exifOpen, setExifOpen] = useState(false);
  const [exifRequestedFor, setExifRequestedFor] = useState<number | null>(null);
  const isNavigating = useSharedValue(false);

  const exifRequested = exifRequestedFor != null && reviewId != null && exifRequestedFor === Number(reviewId);
  const { data: exifByPhotoId, isLoading: exifLoading, isError: exifError } = useReviewExif(
    reviewId ?? null,
    exifRequested,
  );

  // 확대 배율과 이동량.
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const opacity = useSharedValue(1);

  const isHorizontal = useSharedValue(false);
  const isVertical = useSharedValue(false);
  const panStartedZoomed = useSharedValue(false);
  const usedMultiTouch = useSharedValue(false);

  function resetTransform() {
    opacity.value = 1;
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
    isHorizontal.value = false;
    isVertical.value = false;
  }

  useEffect(() => {
    if (visible) {
      isNavigating.value = false;
      setIndex(initialIndex);
      resetTransform();
    } else {
      setExifOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialIndex]);

  function applyNextPhoto(nextIndex: number, enterOffset: number) {
    setIndex(nextIndex);
    scale.value = 1;
    savedScale.value = 1;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
    isHorizontal.value = false;
    isVertical.value = false;
    tx.value = enterOffset;
    tx.value = withTiming(0, { duration: 180 }, () => {
      isNavigating.value = false;
    });
    opacity.value = withTiming(1, { duration: 180 });
  }

  function goBy(delta: 1 | -1) {
    if (isNavigating.value) return;
    const next = index + delta;
    if (next < 0 || next >= photos.length) {
      tx.value = withTiming(0, { duration: 180 });
      return;
    }
    isNavigating.value = true;
    const exitTarget = delta > 0 ? -SCREEN_WIDTH * 0.6 : SCREEN_WIDTH * 0.6;
    const enterOffset = delta > 0 ? SCREEN_WIDTH * 0.4 : -SCREEN_WIDTH * 0.4;

    tx.value = withTiming(exitTarget, { duration: 110 });
    opacity.value = withTiming(0, { duration: 100 }, (finished) => {
      if (finished) {
        runOnJS(applyNextPhoto)(next, enterOffset);
      } else {
        isNavigating.value = false;
      }
    });
  }

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      usedMultiTouch.value = true;
    })
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), MAX_ZOOM);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        tx.value = withTiming(0, { duration: 150 });
        ty.value = withTiming(0, { duration: 150 });
        savedTx.value = 0;
        savedTy.value = 0;
      } else {
        const maxTx = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTy = (IMAGE_HEIGHT * (scale.value - 1)) / 2;
        const boundedTx = Math.min(Math.max(savedTx.value, -maxTx), maxTx);
        const boundedTy = Math.min(Math.max(savedTy.value, -maxTy), maxTy);
        if (savedTx.value !== boundedTx || savedTy.value !== boundedTy) {
          tx.value = withTiming(boundedTx, { duration: 150 });
          ty.value = withTiming(boundedTy, { duration: 150 });
          savedTx.value = boundedTx;
          savedTy.value = boundedTy;
        }
      }
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      panStartedZoomed.value = scale.value > 1;
      usedMultiTouch.value = false;
      isHorizontal.value = false;
      isVertical.value = false;
    })
    .onUpdate((e) => {
      if (e.numberOfPointers > 1) {
        usedMultiTouch.value = true;
      }

      // 확대 상태: 사진 자유 이동 (화면 밖 이탈 방지 clamp)
      if (scale.value > 1) {
        const maxTx = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTy = (IMAGE_HEIGHT * (scale.value - 1)) / 2;
        const rawTx = savedTx.value + e.translationX;
        const rawTy = savedTy.value + e.translationY;
        tx.value = Math.min(Math.max(rawTx, -maxTx), maxTx);
        ty.value = Math.min(Math.max(rawTy, -maxTy), maxTy);
        return;
      }

      // 축 결정 (Axis Locking)
      if (!isHorizontal.value && !isVertical.value) {
        const absX = Math.abs(e.translationX);
        const absY = Math.abs(e.translationY);
        if (absX > 6 || absY > 6) {
          if (absX >= absY) {
            isHorizontal.value = true;
          } else if (e.translationY > 0) {
            isVertical.value = true;
          }
        }
      }

      if (isHorizontal.value) {
        tx.value = photos.length > 1 ? e.translationX : e.translationX * 0.3;
        ty.value = 0;
      } else if (isVertical.value) {
        tx.value = 0;
        ty.value = Math.max(0, e.translationY);
      }
    })
    .onEnd((e, success) => {
      if (panStartedZoomed.value || scale.value > 1) {
        const maxTx = (SCREEN_WIDTH * (scale.value - 1)) / 2;
        const maxTy = (IMAGE_HEIGHT * (scale.value - 1)) / 2;
        const boundedTx = Math.min(Math.max(tx.value, -maxTx), maxTx);
        const boundedTy = Math.min(Math.max(ty.value, -maxTy), maxTy);
        tx.value = withTiming(boundedTx, { duration: 100 });
        ty.value = withTiming(boundedTy, { duration: 100 });
        savedTx.value = boundedTx;
        savedTy.value = boundedTy;
        return;
      }

      if (!success || usedMultiTouch.value) {
        tx.value = withTiming(0, { duration: 150 });
        ty.value = withTiming(0, { duration: 150 });
        return;
      }

      // 가로 스와이프 판정
      if (isHorizontal.value && (Math.abs(e.translationX) > SWIPE_DISTANCE || Math.abs(e.velocityX) > 400)) {
        runOnJS(goBy)(e.translationX < 0 ? 1 : -1);
        return;
      }

      // 세로 아래 드래그 닫기 판정
      if (isVertical.value && (e.translationY > CLOSE_DRAG_DISTANCE || e.velocityY > 500)) {
        runOnJS(onClose)();
        return;
      }

      tx.value = withTiming(0, { duration: 150 });
      ty.value = withTiming(0, { duration: 150 });
    });

  const photoGesture = Gesture.Simultaneous(pinch, pan);

  const photoStyle = useAnimatedStyle(() => ({
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: opacity.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  // visible로만 판정한다. photos가 비는 순간 Modal을 언마운트하면 fade 종료 애니메이션이 생략된다.
  if (!visible && photos.length === 0) return null;
  const safeIndex = Math.min(Math.max(index, 0), Math.max(photos.length - 1, 0));
  const uri = photos[safeIndex];

  // EXIF 데이터 처리

  const currentPhotoId = photoIds?.[safeIndex];
  const fetchedExif = currentPhotoId != null ? exifByPhotoId?.[currentPhotoId] : undefined;
  const exif = fetchedExif ?? exifs?.[safeIndex];
  const hasReviewExif = reviewId != null && photoIds != null && photoIds.length === photos.length;
  const canShowExif = hasReviewExif || (exifs != null && exifs.length === photos.length);

  const openExif = () => {
    if (reviewId != null) setExifRequestedFor(Number(reviewId));
    setExifOpen(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => (exifOpen ? setExifOpen(false) : onClose())}
    >
      <StatusBar barStyle="light-content" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', alignItems: 'center', justifyContent: 'center' }}>
          {/* 배경을 눌러도 닫히게 */}
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

          <GestureDetector gesture={photoGesture}>
            <Reanimated.View style={photoStyle}>
              {uri ? (
                <Image
                  source={{ uri }}
                  resizeMode="contain"
                  resizeMethod="resize"
                  onError={(e) => __DEV__ && console.warn('[lightbox] 이미지 로드 실패:', e.nativeEvent, uri?.slice(0, 90))}
                  style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
                />
              ) : null}
            </Reanimated.View>
          </GestureDetector>

          {/* 상단 헤더 (닫기, 인덱스 카운터, EXIF 정보) */}
          <View
            className="absolute flex-row items-center justify-between"
            style={{ top: normalize(52), left: normalize(16), right: normalize(16), zIndex: 10 }}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="닫기"
              className="items-center justify-center"
              style={{
                width: normalize(36),
                height: normalize(36),
                borderRadius: normalize(18),
                backgroundColor: SCRIM,
              }}
            >
              <IconX size={normalize(20)} color="#fff" strokeWidth={2} />
            </Pressable>

            <View className="flex-row items-center" style={{ gap: normalize(12) }}>
              {photos.length > 1 && (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: '#fff' }}>
                  {`${safeIndex + 1} / ${photos.length}`}
                </Text>
              )}
              {canShowExif && (
                <Pressable
                  onPress={openExif}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="사진 정보"
                  className="items-center justify-center"
                  style={{
                    width: normalize(36),
                    height: normalize(36),
                    borderRadius: normalize(18),
                    backgroundColor: SCRIM,
                  }}
                >
                  <Info size={normalize(18)} color="#fff" strokeWidth={1.8} />
                </Pressable>
              )}
            </View>
          </View>

          {/* 하단 썸네일 스트립 */}
          {photos.length > 1 && !exifOpen && (
            <View
              className="absolute flex-row items-center justify-center"
              style={{ bottom: normalize(48), left: 0, right: 0, gap: normalize(8), zIndex: 10 }}
              pointerEvents="box-none"
            >
              {photos.map((thumbUri, i) => (
                <Pressable
                  key={`${thumbUri}-${i}`}
                  onPress={() => {
                    if (isNavigating.value || i === safeIndex) return;
                    isNavigating.value = true;
                    const delta = i > safeIndex ? 1 : -1;
                    opacity.value = 0.2;
                    applyNextPhoto(i, delta * SCREEN_WIDTH * 0.4);
                  }}
                  hitSlop={4}
                >
                  <Image
                    source={{ uri: thumbUri }}
                    resizeMode="cover"
                    resizeMethod="resize"
                    style={{
                      width: normalize(48),
                      height: normalize(48),
                      borderRadius: normalize(8),
                      opacity: i === safeIndex ? 1 : 0.4,
                      borderWidth: i === safeIndex ? 1.5 : 0,
                      borderColor: '#fff',
                    }}
                  />
                </Pressable>
              ))}
            </View>
          )}

          <PhotoExifLayer
            open={exifOpen}
            onClose={() => setExifOpen(false)}
            exif={exif}
            loading={hasReviewExif && exifLoading}
            error={hasReviewExif && exifError}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
