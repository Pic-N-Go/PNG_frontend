import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Info, X } from 'lucide-react-native';
import { PhotoExifSheetContent } from '@/components/common/PhotoExifSheet';
import { PostDetail } from '@/types/community';
import { BOTTOM_SHEET_RADIUS, FONT_2XS, FONT_SM, FONT_XS } from '@/constants/layout';
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
  const exifTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    Animated.timing(exifTranslateY, {
      toValue: exifOpen ? 0 : Dimensions.get('window').height,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [exifOpen, exifTranslateY]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
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

        {/* EXIF는 메인(첫 번째) 사진 기준이라 라이트박스도 같은 사진을 보여준다 */}
        <View style={{ width: '100%', aspectRatio: 3 / 2, backgroundColor: post.photoGradient[0], position: 'relative' }}>
          {!!post.imageUrls?.[0] && (
            <Image source={{ uri: post.imageUrls[0] }} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
          )}
          {/* 확대 보기에서는 사진을 가리지 않도록 위치 태그를 띄우지 않는다 */}
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

        {exifOpen && (
          <Pressable
            onPress={onCloseExif}
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
            <PhotoExifSheetContent exif={post.exif} onClose={onCloseExif} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
