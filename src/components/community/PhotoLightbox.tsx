import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
// RN의 Animated(아래 EXIF 시트가 쓴다)와 이름이 겹치므로 별칭으로 가져온다.
import Reanimated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Info, X } from 'lucide-react-native';
import { PhotoExifSheetContent } from '@/components/common/PhotoExifSheet';
import { PostDetail } from '@/types/community';
import { BOTTOM_SHEET_RADIUS, FONT_2XS, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

/** 이 거리(px)보다 더 아래로 끌면 닫는다. 짧으면 스크롤하려다 닫히고, 길면 안 닫힌다. */
const CLOSE_DRAG_DISTANCE = 120;
const MAX_ZOOM = 4;
/** 이 거리(px)보다 옆으로 끌면 다음/이전 사진으로 넘긴다. */
const SWIPE_DISTANCE = 60;

interface Props {
  visible: boolean;
  onClose: () => void;
  exifOpen: boolean;
  onOpenExif: () => void;
  onCloseExif: () => void;
  /** 라이트박스를 닫은 뒤 작성자 프로필로 이동한다(Modal 위로 화면이 push되지 않도록 호출부가 순서를 잡는다) */
  onPressAuthor: () => void;
  post: PostDetail;
}

/**
 * EXIF는 원본 목업에서도 라이트박스 위 z-index 레이어일 뿐 별도 모달이 아니다 — 그대로
 * `PhotoLightbox`의 Modal 안에서 렌더한다. RN에서 Modal 두 개를 동시에 띄우면 두 번째가
 * 안 뜨는 경우가 있어(iOS 네이티브 모달 프레젠테이션 제약), 별도 Modal로 분리하지 않는다.
 */
export default function PhotoLightbox({ visible, onClose, exifOpen, onOpenExif, onCloseExif, onPressAuthor, post }: Props) {
  const insets = useSafeAreaInsets();
  const exifTranslateY = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    Animated.timing(exifTranslateY, {
      toValue: exifOpen ? 0 : Dimensions.get('window').height,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [exifOpen, exifTranslateY]);

  // 확대 배율과 이동량. saved*는 제스처가 끝난 시점의 값으로, 다음 제스처의 기준이 된다.
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  /**
   * 팬 시작 시점의 확대 여부. onEnd에서 scale을 보면, 2배에서 손가락을 아래로 움직이며
   * 1배까지 축소한 경우 "확대 안 한 상태의 아래 스와이프"로 잘못 읽혀 라이트박스가 닫힌다.
   */
  const panStartedZoomed = useSharedValue(false);

  const photos = post.imageUrls ?? [];
  const [index, setIndex] = useState(0);
  // 인덱스는 게시글이 바뀌거나 라이트박스를 다시 열 때 첫 장으로 되돌린다.
  const currentExif = post.exifList?.[index] ?? {};
  // 제스처 콜백은 worklet이라 React state를 읽을 수 없다. 공유 값으로 따로 들고 있는다.
  const indexShared = useSharedValue(0);
  useEffect(() => {
    indexShared.value = index;
  }, [index, indexShared]);

  function resetTransform() {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
  }

  // 확대한 채로 닫았다가 다시 열면 그 상태가 남아 있으면 안 된다.
  useEffect(() => {
    if (visible) {
      setIndex(0);
      resetTransform();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /** 사진을 넘기면 확대·이동 상태를 초기화한다(이전 장의 배율이 남으면 안 된다). */
  function goTo(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= photos.length) return;
    setIndex(nextIndex);
    resetTransform();
  }

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      // 1배 미만으로는 줄지 않게 막는다 — 축소했다 놓으면 사진이 화면에서 사라진 것처럼 보인다.
      scale.value = Math.min(Math.max(savedScale.value * e.scale, 1), MAX_ZOOM);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      // 원래 배율로 돌아왔으면 이동도 함께 되돌린다(사진이 화면 밖에 치우친 채 남는 걸 막는다).
      if (scale.value <= 1) {
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        savedTx.value = 0;
        savedTy.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      panStartedZoomed.value = scale.value > 1;
    })
    .onUpdate((e) => {
      if (scale.value > 1) {
        // 확대 상태에서는 사진을 이동시킨다.
        tx.value = savedTx.value + e.translationX;
        ty.value = savedTy.value + e.translationY;
      } else {
        // 확대 전에는 좌우 전환과 아래로 끌어 닫기만 받는다(위로 끌어 올리면 닫기 의도가 아니다).
        tx.value = photos.length > 1 ? e.translationX : 0;
        ty.value = Math.max(0, e.translationY);
      }
    })
    .onEnd((e) => {
      if (panStartedZoomed.value || scale.value > 1) {
        savedTx.value = tx.value;
        savedTy.value = ty.value;
        return;
      }
      // 가로 움직임이 더 크면 사진 전환으로 읽는다.
      if (Math.abs(e.translationX) > Math.abs(e.translationY) && Math.abs(e.translationX) > SWIPE_DISTANCE) {
        runOnJS(goTo)(e.translationX < 0 ? indexShared.value + 1 : indexShared.value - 1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        return;
      }
      if (e.translationY > CLOSE_DRAG_DISTANCE) {
        runOnJS(onClose)();
        return;
      }
      tx.value = withTiming(0);
      ty.value = withTiming(0);
    });

  // 두 제스처를 동시에 인식시킨다 — 확대하면서 위치를 잡는 동작이 자연스럽다.
  const photoGesture = Gesture.Simultaneous(pinch, pan);

  const photoStyle = useAnimatedStyle(() => ({
    flex: 1,
    width: '100%',
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      {/* Modal은 별도 네이티브 뷰 계층이라 App.tsx의 GestureHandlerRootView가 닿지 않는다.
          여기서 다시 감싸지 않으면 아래 제스처가 전혀 인식되지 않는다. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
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

        {/* EXIF는 메인(첫 번째) 사진 기준이라 라이트박스도 같은 사진을 보여준다.
            비율을 고정하지 않고 남는 영역을 전부 쓴다 — 3:2로 박아두면 세로 사진이 그 높이에
            맞춰 축소돼 화면 1/3만 차지한다. 위아래 패딩은 닫기 버튼·작성자 바가 사진을 가리지
            않을 만큼만 비운다. */}
        <GestureDetector gesture={photoGesture}>
          <View
            style={{
              flex: 1,
              width: '100%',
              paddingTop: insets.top + normalize(60),
              paddingBottom: insets.bottom + normalize(120),
            }}
          >
            <Reanimated.View style={photoStyle}>
              {photos[index] ? (
                <Image source={{ uri: photos[index] }} resizeMode="contain" style={{ flex: 1, width: '100%' }} />
              ) : (
                <View style={{ flex: 1, backgroundColor: post.photoGradient[0] }} />
              )}
            </Reanimated.View>
            {/* 확대 보기에서는 사진을 가리지 않도록 위치 태그를 띄우지 않는다 */}
          </View>
        </GestureDetector>

        {/* 여러 장이면 몇 번째인지 보여준다. 없으면 옆으로 넘길 수 있다는 걸 알 방법이 없다. */}
        {photos.length > 1 && (
          <View
            className="flex-row items-center justify-center absolute"
            style={{ bottom: insets.bottom + normalize(120), left: 0, right: 0, gap: normalize(6), zIndex: 2 }}
          >
            {photos.map((uri, i) => (
              <View
                key={uri}
                style={{
                  width: normalize(6),
                  height: normalize(6),
                  borderRadius: normalize(3),
                  backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </View>
        )}

        <Text
          allowFontScaling={false}
          className="text-center absolute"
          style={{ bottom: insets.bottom + normalize(96), left: 0, right: 0, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.4)', letterSpacing: -0.1 }}
        >
          {photos.length > 1 ? '좌우로 넘기기 · 두 손가락 확대 · 아래로 스와이프하여 닫기' : '두 손가락 확대 · 아래로 스와이프하여 닫기'}
        </Text>

        <View
          className="flex-row items-center absolute"
          style={{ bottom: insets.bottom + normalize(40), left: normalize(20), right: normalize(20), gap: normalize(16), zIndex: 2 }}
        >
          {/* 아바타·닉네임 묶어서 프로필 진입 — 목록 카드(PostCard)와 같은 규칙 */}
          <Pressable onPress={onPressAuthor} className="flex-row items-center" style={{ flex: 1, minWidth: 0, gap: normalize(16) }}>
            <View
              className="items-center justify-center overflow-hidden"
              style={{ width: normalize(38), height: normalize(38), borderRadius: normalize(19), backgroundColor: post.author.avatarGradient[0] }}
            >
              {post.author.profileImageUrl ? (
                <Image source={{ uri: post.author.profileImageUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1 }}>
                  {post.author.initials}
                </Text>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#fff', letterSpacing: -0.2 }}>
                {post.author.handle}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.5)', letterSpacing: -0.1, marginTop: normalize(1) }}>
                {post.createdAtLabel} · {currentExif.shotAtLabel}
              </Text>
            </View>
          </Pressable>
          {/* 좋아요는 여기서 토글하지 않는다(표시 전용) — 다만 내가 누른 글인지는 구분돼야 한다 */}
          <View className="flex-row items-center" style={{ gap: normalize(5) }}>
            <Heart
              size={normalize(13)}
              color={post.isLiked ? '#ff453a' : '#fff'}
              fill={post.isLiked ? '#ff453a' : 'none'}
              strokeWidth={1.8}
            />
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
            <PhotoExifSheetContent exif={currentExif} onClose={onCloseExif} />
          </ScrollView>
        </Animated.View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
