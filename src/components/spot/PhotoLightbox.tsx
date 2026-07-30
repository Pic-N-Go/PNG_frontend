import React from 'react';
import { Dimensions, Image, Modal, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { IconX } from '@tabler/icons-react-native';
import { FONT_SM } from '@/constants/layout';
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

/**
 * 사진 확대 오버레이. 라우트가 아니라 Modal인 이유: 딥링크로 도달할 대상이 아니고
 * 스팟 상세 위에 겹쳐 뜨는 일시적 레이어이기 때문이다(PhotoDetail 라우트는 스팟 사진 전용).
 */
export default function PhotoLightbox({ photos, initialIndex, visible, onClose }: Props) {
  const [index, setIndex] = React.useState(initialIndex);

  // 다른 리뷰의 사진을 열면 시작 인덱스가 바뀌므로 열릴 때마다 맞춘다.
  React.useEffect(() => {
    if (visible) setIndex(initialIndex);
  }, [visible, initialIndex]);

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
          {photos.length > 1 && (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: '#fff' }}>
              {`${index + 1} / ${photos.length}`}
            </Text>
          )}
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
      </View>
    </Modal>
  );
}
