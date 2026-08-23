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
  interpolate,
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
const DISMISS_DRAG_DISTANCE = 110;
const MAX_ZOOM = 4;

/**
 * 삼성/애플 갤러리 앱 수준의 커스텀 라이트박스.
 *
 * 1. 1:1 손가락 트래킹 수평 슬라이드: 좌우 스와이프 시 현재 사진과 이전/다음 사진이 나란히 배치되어 부드럽게 1:1로 넘어가며, 손을 떼면 슬라이드 끝까지 완성된 후 자연스럽게 교체됩니다.
 * 2. 방향 락 (Strict Axis Locking): 스와이프 시작 시 가로/세로 방향을 결정하여 대각선 쏠림 현상을 100% 방지합니다.
 * 3. 아래로 끌어 닫기: 수직 아래 방향으로 내리면 뷰어 전체의 투명도와 스케일이 축소되며 자연스럽게 닫힙니다.
 */
export default function PhotoLightbox({ photos, initialIndex, visible, onClose, reviewId, photoIds, exifs }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [exifOpen, setExifOpen] = useState(false);

  // 제스처 애니메이션 Shared Values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // 방향 고정 (Axis Locking)
  const isHorizontal = useSharedValue(false);
  const isVertical = useSharedValue(false);
  const panStartedZoomed = useSharedValue(false);
  const usedMultiTouch = useSharedValue(false);

  function resetTransform() {
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
      const targetIndex = Math.min(Math.max(initialIndex, 0), Math.max(photos.length - 1, 0));
      setIndex(targetIndex);
      resetTransform();
    } else {
      setExifOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, initialIndex, photos.length]);

  const changeIndex = (nextIdx: number) => {
    setIndex(nextIdx);
    tx.value = 0;
    savedTx.value = 0;
    isHorizontal.value = false;
  };

  const handleSelectThumbnail = (targetIdx: number) => {
    if (targetIdx === index) return;
    const direction = targetIdx > index ? -1 : 1;
    tx.value = withTiming(direction * SCREEN_WIDTH, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(changeIndex)(targetIdx);
      }
    });
  };

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
        scale.value = withTiming(1, { duration: 150 });
        savedScale.value = 1;
        tx.value = withTiming(0, { duration: 150 });
        ty.value = withTiming(0, { duration: 150 });
        savedTx.value = 0;
        savedTy.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      isHorizontal.value = false;
      isVertical.value = false;
      panStartedZoomed.value = scale.value > 1;
      usedMultiTouch.value = false;
    })
    .onUpdate((e) => {
      if (e.numberOfPointers > 1) {
        usedMultiTouch.value = true;
        return;
      }

      // 1. 확대 상태일 때는 사진 자유 이동
      if (scale.value > 1) {
        tx.value = savedTx.value + e.translationX;
        ty.value = savedTy.value + e.translationY;
        return;
      }

      // 2. 방향 미정 상태: 8px 이상 움직였을 때 가로/세로 축 결정
      if (!isHorizontal.value && !isVertical.value) {
        const absX = Math.abs(e.translationX);
        const absY = Math.abs(e.translationY);
        if (absX > 8 || absY > 8) {
          if (absX >= absY) {
            isHorizontal.value = true;
          } else if (e.translationY > 0) {
            isVertical.value = true;
          }
        }
      }

      // 3. 수평 스와이프 처리
      if (isHorizontal.value) {
        let x = e.translationX;
        // 양 끝 경계 고무줄 저항 처리
        if ((index === 0 && x > 0) || (index === photos.length - 1 && x < 0)) {
          x = x * 0.35;
        }
        tx.value = x;
        ty.value = 0;
      }
      // 4. 수직 아래로 끌어 닫기 처리
      else if (isVertical.value) {
        tx.value = 0;
        ty.value = Math.max(0, e.translationY);
      }
    })
    .onEnd((e, success) => {
      if (panStartedZoomed.value || scale.value > 1) {
        savedTx.value = tx.value;
        savedTy.value = ty.value;
        return;
      }

      if (!success || usedMultiTouch.value) {
        tx.value = withTiming(0, { duration: 180 });
        ty.value = withTiming(0, { duration: 180 });
        return;
      }

      if (isHorizontal.value) {
        const threshold = SCREEN_WIDTH * 0.22;
        const velocity = e.velocityX;

        // 왼쪽으로 넘어감 (다음 사진)
        if ((e.translationX < -threshold || velocity < -500) && index < photos.length - 1) {
          tx.value = withTiming(-SCREEN_WIDTH, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(changeIndex)(index + 1);
            }
          });
        }
        // 오른쪽으로 넘어감 (이전 사진)
        else if ((e.translationX > threshold || velocity > 500) && index > 0) {
          tx.value = withTiming(SCREEN_WIDTH, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(changeIndex)(index - 1);
            }
          });
        }
        // 임계값 미달 시 제자리 복귀
        else {
          tx.value = withTiming(0, { duration: 180 });
        }
      } else if (isVertical.value) {
        if (e.translationY > DISMISS_DRAG_DISTANCE || e.velocityY > 500) {
          ty.value = withTiming(SCREEN_HEIGHT, { duration: 200 }, (finished) => {
            if (finished) {
              runOnJS(onClose)();
            }
          });
        } else {
          ty.value = withTiming(0, { duration: 180 });
        }
      } else {
        tx.value = withTiming(0, { duration: 180 });
        ty.value = withTiming(0, { duration: 180 });
      }
    });

  const photoGesture = Gesture.Simultaneous(pinch, pan);

  // 세로 드래그 시 배경 투명도 & 스케일 애니메이션
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(ty.value, [0, 250], [1, 0.4]);
    const scaleVal = interpolate(ty.value, [0, 250], [1, 0.88]);
    return {
      flex: 1,
      opacity,
      transform: [{ translateY: ty.value }, { scale: scaleVal }],
    };
  });

  // 현재 중심 사진 스타일
  const currPhotoStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: tx.value }, { scale: scale.value }],
  }));

  // 이전 사진 스타일 (왼쪽에 나란히 배치)
  const prevPhotoStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: tx.value - SCREEN_WIDTH }],
  }));

  // 다음 사진 스타일 (오른쪽에 나란히 배치)
  const nextPhotoStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: tx.value + SCREEN_WIDTH }],
  }));

  // EXIF 데이터 처리
  const [exifRequestedFor, setExifRequestedFor] = useState<number | null>(null);
  const exifRequested = exifRequestedFor != null && reviewId != null && exifRequestedFor === Number(reviewId);
  const { data: exifByPhotoId, isLoading: exifLoading, isError: exifError } = useReviewExif(
    reviewId ?? null,
    exifRequested,
  );

  if (!visible && photos.length === 0) return null;
  const safeIndex = Math.min(index, Math.max(photos.length - 1, 0));

  const currUri = photos[safeIndex];
  const prevUri = safeIndex > 0 ? photos[safeIndex - 1] : null;
  const nextUri = safeIndex < photos.length - 1 ? photos[safeIndex + 1] : null;

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
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)', justifyContent: 'center' }}>
          {/* 배경 누르면 닫기 */}
          <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

          {/* 메인 뷰어 영역 (제스처 감지) */}
          <GestureDetector gesture={photoGesture}>
            <Reanimated.View style={containerAnimatedStyle}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {/* 이전 사진 (왼쪽) */}
                {prevUri && (
                  <Reanimated.View style={prevPhotoStyle}>
                    <Image
                      source={{ uri: prevUri }}
                      resizeMode="contain"
                      style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
                    />
                  </Reanimated.View>
                )}

                {/* 현재 사진 (중앙) */}
                {currUri && (
                  <Reanimated.View style={currPhotoStyle}>
                    <Image
                      source={{ uri: currUri }}
                      resizeMode="contain"
                      onError={(e) => __DEV__ && console.warn('[lightbox] 이미지 로드 실패:', e.nativeEvent, currUri?.slice(0, 90))}
                      style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
                    />
                  </Reanimated.View>
                )}

                {/* 다음 사진 (오른쪽) */}
                {nextUri && (
                  <Reanimated.View style={nextPhotoStyle}>
                    <Image
                      source={{ uri: nextUri }}
                      resizeMode="contain"
                      style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
                    />
                  </Reanimated.View>
                )}
              </View>
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
                  key={thumbUri}
                  onPress={() => handleSelectThumbnail(i)}
                  hitSlop={4}
                >
                  <Image
                    source={{ uri: thumbUri }}
                    resizeMode="cover"
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
