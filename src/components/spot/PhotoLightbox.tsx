import React from 'react';
import { Animated, Dimensions, Image, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconX } from '@tabler/icons-react-native';
import { Info } from 'lucide-react-native';
import { PhotoExifSheetContent } from '@/components/common/PhotoExifSheet';
import { useReviewExif } from '@/hooks/useSpot';
import { hasAnyExif } from '@/utils/spotMappers';
import { BOTTOM_SHEET_RADIUS, FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

interface Props {
  /** 표시할 사진 URL 목록. visible=true인데 비어 있으면 uri가 undefined가 되므로 호출부가 보장해야 한다. */
  photos: string[];
  /** 처음 보여줄 사진 인덱스 */
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  /**
   * EXIF 조회용. 리뷰 사진일 때만 넘긴다 — 스팟 사진(`SpotPhoto`)은 TourAPI 외부 이미지라
   * EXIF가 없다. 없으면 정보 버튼 자체를 그리지 않는다.
   */
  reviewId?: string | number | null;
  /** photos와 같은 순서의 photoId. EXIF 응답을 imageId로 매칭한다(URL은 presigned라 키가 못 된다). */
  photoIds?: number[];
}

// 퍼센트 높이는 부모 높이가 확정돼야 해석돼 이미지가 0높이로 접히는 일이 있었다.
// Modal 안에서는 실측 화면 크기로 고정하는 편이 확실하다.
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.7;

/**
 * 사진 확대 오버레이. 라우트가 아니라 Modal인 이유: 딥링크로 도달할 대상이 아니고
 * 스팟 상세 위에 겹쳐 뜨는 일시적 레이어이기 때문이다.
 *
 * EXIF는 별도 Modal이 아니라 이 Modal 안의 레이어로 올린다 — RN에서 Modal 두 개를 동시에
 * 띄우면 두 번째가 안 뜨는 경우가 있다(iOS 네이티브 모달 프레젠테이션 제약).
 * community/PhotoLightbox와 같은 구조다.
 */
export default function PhotoLightbox({ photos, initialIndex, visible, onClose, reviewId, photoIds }: Props) {
  const [index, setIndex] = React.useState(initialIndex);
  const [exifOpen, setExifOpen] = React.useState(false);
  const insets = useSafeAreaInsets();
  const exifTranslateY = React.useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // 다른 리뷰의 사진을 열면 시작 인덱스가 바뀌므로 열릴 때마다 맞춘다.
  React.useEffect(() => {
    if (visible) setIndex(initialIndex);
    else setExifOpen(false); // 닫았다 다시 열면 사진부터 보여야 한다
  }, [visible, initialIndex]);

  React.useEffect(() => {
    Animated.timing(exifTranslateY, {
      toValue: exifOpen ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [exifOpen, exifTranslateY]);

  // 시트를 한 번 열기 전에는 호출하지 않는다. 닫은 뒤에도 유지해 재오픈 시 깜빡이지 않게 한다.
  const [exifRequested, setExifRequested] = React.useState(false);
  const { data: exifByPhotoId, isLoading: exifLoading, isError: exifError } = useReviewExif(
    reviewId ?? null,
    exifRequested,
  );

  // visible로만 판정한다. photos가 비는 순간 Modal을 언마운트하면 fade 종료 애니메이션이 생략된다.
  if (!visible && photos.length === 0) return null;
  const safeIndex = Math.min(index, Math.max(photos.length - 1, 0));
  const uri = photos[safeIndex];

  const currentPhotoId = photoIds?.[safeIndex];
  const exif = currentPhotoId != null ? exifByPhotoId?.[currentPhotoId] : undefined;
  const canShowExif = reviewId != null && photoIds != null && photoIds.length === photos.length;

  const openExif = () => {
    setExifRequested(true);
    setExifOpen(true);
  };

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
          className="absolute flex-row items-center justify-between"
          style={{ top: normalize(52), left: normalize(16), right: normalize(16) }}
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
              backgroundColor: 'rgba(0,0,0,0.4)',
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
                  backgroundColor: 'rgba(0,0,0,0.4)',
                }}
              >
                <Info size={normalize(18)} color="#fff" strokeWidth={1.8} />
              </Pressable>
            )}
          </View>
        </View>

        {/* 여러 장이면 하단 썸네일로 전환. 화살표보다 현재 위치가 한눈에 보인다. */}
        {photos.length > 1 && !exifOpen && (
          <View
            className="absolute flex-row items-center justify-center"
            style={{ bottom: normalize(48), gap: normalize(8) }}
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
                    opacity: i === safeIndex ? 1 : 0.4,
                    borderWidth: i === safeIndex ? 1.5 : 0,
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
            {/* EXIF는 카톡·인스타를 거친 사진에서 제거되는 일이 흔해 '없음'이 정상 케이스다. */}
            {exifLoading || exifError || !hasAnyExif(exif) ? (
              <View style={{ paddingHorizontal: normalize(28), paddingVertical: normalize(32), alignItems: 'center' }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                  {exifLoading ? '사진 정보를 불러오는 중' : exifError ? '사진 정보를 불러올 수 없어요' : '이 사진에는 촬영 정보가 없어요'}
                </Text>
              </View>
            ) : (
              <PhotoExifSheetContent exif={exif!} onClose={() => setExifOpen(false)} />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
