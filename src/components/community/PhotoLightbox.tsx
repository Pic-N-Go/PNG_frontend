import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Info, MapPin, X } from 'lucide-react-native';
import { PhotoExifLayer } from '@/components/common/PhotoExifSheet';
import { PostDetail } from '@/types/community';
import { FONT_2XS, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

interface Props {
  visible: boolean;
  onClose: () => void;
  exifOpen: boolean;
  onOpenExif: () => void;
  onCloseExif: () => void;
  post: PostDetail;
}

/**
 * EXIF는 원본 목업에서도 라이트박스 위 z-index 레이어일 뿐 별도 모달이 아니다 — 그대로
 * `PhotoLightbox`의 Modal 안에서 렌더한다. RN에서 Modal 두 개를 동시에 띄우면 두 번째가
 * 안 뜨는 경우가 있어(iOS 네이티브 모달 프레젠테이션 제약), 별도 Modal로 분리하지 않는다.
 */
export default function PhotoLightbox({ visible, onClose, exifOpen, onOpenExif, onCloseExif, post }: Props) {
  const insets = useSafeAreaInsets();

  return (
    // Android 백 버튼은 여기로만 온다(Modal이 떠 있는 동안 BackHandler는 발행되지 않는다).
    // EXIF 시트가 열려 있으면 시트만 닫고 사진은 남긴다.
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => (exifOpen ? onCloseExif() : onClose())}
    >
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
        <View
          className="flex-row items-center justify-end absolute"
          style={{ top: insets.top + normalize(16), left: normalize(20), right: normalize(20), zIndex: 2 }}
        >
          <Pressable
            onPress={onClose}
            className="items-center justify-center"
            style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(18), backgroundColor: 'rgba(255,255,255,0.15)' }}
            accessibilityLabel="닫기"
          >
            <X size={normalize(18)} color="#fff" strokeWidth={2} />
          </Pressable>
        </View>

        <View style={{ width: '100%', aspectRatio: 3 / 2, backgroundColor: post.photoGradient[0], position: 'relative' }}>
          <View
            className="flex-row items-center absolute"
            style={{ top: normalize(14), left: normalize(14), gap: normalize(5), height: normalize(30), paddingHorizontal: normalize(12), borderRadius: normalize(15), backgroundColor: 'rgba(0,0,0,0.4)' }}
          >
            <MapPin size={normalize(12)} color="#fff" strokeWidth={2} />
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', letterSpacing: -0.1 }}>
              {post.location}
            </Text>
          </View>
        </View>

        <Text
          allowFontScaling={false}
          className="text-center absolute"
          style={{ bottom: insets.bottom + normalize(96), left: 0, right: 0, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.4)', letterSpacing: -0.1 }}
        >
          두 손가락 확대 · 아래로 스와이프하여 닫기
        </Text>

        <View
          className="flex-row items-center absolute"
          style={{ bottom: insets.bottom + normalize(40), left: normalize(20), right: normalize(20), gap: normalize(16), zIndex: 2 }}
        >
          <View
            className="items-center justify-center"
            style={{ width: normalize(38), height: normalize(38), borderRadius: normalize(19), backgroundColor: post.author.avatarGradient[0] }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1 }}>
              {post.author.initials}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#fff', letterSpacing: -0.2 }}>
              @{post.author.handle}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.5)', letterSpacing: -0.1, marginTop: normalize(1) }}>
              {post.createdAtLabel} · {post.exif.shotAtLabel}
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: normalize(5) }}>
            <Heart size={normalize(13)} color="#ff453a" fill="#ff453a" strokeWidth={0} />
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#fff' }}>
              {post.likeCount}
            </Text>
          </View>
          <Pressable
            onPress={onOpenExif}
            className="items-center justify-center"
            style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(18), backgroundColor: 'rgba(255,255,255,0.15)' }}
            accessibilityLabel="사진 정보"
          >
            <Info size={normalize(16)} color="#fff" strokeWidth={1.8} />
          </Pressable>
        </View>

        <PhotoExifLayer open={exifOpen} onClose={onCloseExif} exif={post.exif} />
      </View>
    </Modal>
  );
}
