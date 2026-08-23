import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Easing, PanResponder, Dimensions } from 'react-native';
import { BOTTOM_SHEET_RADIUS, FONT_SM, FONT_TITLE } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { IconMapPin, IconX, IconHeart, IconBookmark } from '@tabler/icons-react-native';
import StarRating from '@/components/common/StarRating';
import { Spot } from '@/store/useCourseStore';
import { useBookmarkCollections, useSpotDetail, useSpotPhotos, useSpotSummary } from '@/hooks/useSpot';
import { useAuthStore } from '@/store/useAuthStore';
import BookmarkSheet from '@/components/spot/BookmarkSheet';
import Toast from '@/components/common/Toast';
import { BRAND, TEXT_SUB } from '@/constants/colors';

interface Props {
  activeSpot: Spot | null;
  onClose: () => void;
  /** 팝업이 실제로 그리고 있는 스팟을 넘겨준다 (닫히는 중에도 표시 중인 스팟과 버튼 동작을 일치시키기 위함) */
  renderButtons?: (spot: Spot) => React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

// 네이티브 드라이버는 네이티브 뷰만 변형하고 JS 쪽 위치는 그대로 두므로,
// 화면에 보이는 위치와 터치 판정 위치가 어긋나 첫 탭이 버튼에 닿지 않는다.
// (팝업을 처음 열 때만 translateY가 SCREEN_HEIGHT → 0으로 크게 움직여 증상이 첫 오픈에만 발생했다)
// PanResponder가 translateY.setValue()로 같은 값을 직접 건드리기도 해서, JS 드라이버로 통일한다.
const USE_NATIVE_DRIVER = false;

export default function SpotPopup({ activeSpot, onClose, renderButtons }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const lastSpot = useRef<Spot | null>(null);

  if (activeSpot) {
    lastSpot.current = activeSpot;
  }

  const displaySpot = activeSpot || lastSpot.current;
  const spotId = displaySpot?.id ? String(displaySpot.id) : '';

  // 실시간 스팟 상세 통계(별점, 리뷰수, 사진수), 요약(북마크수, 실시간 점수), 사진 목록, 북마크 상태 조회
  const { data: detail } = useSpotDetail(spotId);
  const { data: summary } = useSpotSummary(spotId || null);
  const { data: photos } = useSpotPhotos(spotId);
  const { data: bookmarkCollections } = useBookmarkCollections(spotId);

  const isBookmarked = bookmarkCollections?.some((c) => c.contains) ?? false;

  const [bookmarkSheetVisible, setBookmarkSheetVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleBookmarkPress = () => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      showToast('로그인이 필요한 기능이에요.');
      return;
    }
    setBookmarkSheetVisible(true);
  };

  const effectiveSpot: Spot | null = useMemo(() => {
    if (!displaySpot) return null;
    const name = detail?.info?.name || summary?.name || displaySpot.name;
    const loc = detail?.info?.address || summary?.address || displaySpot.loc || '';
    const score = summary?.photogenicScore !== undefined
      ? String(summary.photogenicScore)
      : (displaySpot.score ?? '0');
    const photo = detail?.info?.imageUrl || summary?.thumbnailUrl || displaySpot.photo;
    const tags = detail?.info?.tags?.length
      ? detail.info.tags
      : (displaySpot.tags?.length
          ? displaySpot.tags
          : (summary?.category ? [summary.category] : []));
    return {
      ...displaySpot,
      name,
      loc,
      score,
      photo,
      tags,
    };
  }, [displaySpot, detail, summary]);

  const displayPhotos = useMemo(() => {
    const list: string[] = [];
    if (effectiveSpot?.photo) list.push(effectiveSpot.photo);
    if (photos && Array.isArray(photos)) {
      photos.forEach((p) => {
        if (p && !list.includes(p)) list.push(p);
      });
    }
    return list.slice(0, 3);
  }, [effectiveSpot?.photo, photos]);

  useEffect(() => {
    if (activeSpot) {
      Animated.spring(translateY, {
        toValue: 0,
        stiffness: 200,
        damping: 20,
        mass: 0.8,
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    }
  }, [activeSpot, translateY]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start(({ finished }) => {
      if (finished) onCloseRef.current();
    });
  };

  const panResponder = useRef<any>(null);
  if (!panResponder.current) {
    panResponder.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            stiffness: 200,
            damping: 20,
            mass: 0.8,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start();
        }
      },
    });
  }

  const currentSpot = effectiveSpot || displaySpot;
  const rating = detail?.info?.rating ?? summary?.reviewAverage ?? 0;
  const reviewCount = detail?.info?.reviewCount ?? 0;
  const bookmarkCount = summary?.bookmarkCount ?? 0;
  const photoCount = detail?.info?.photoCount ?? 0;

  return (
    <>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          elevation: 5,
          transform: [{ translateY }],
        }}
        pointerEvents={activeSpot ? 'auto' : 'none'}
      >
        <View className="w-full relative overflow-hidden bg-white shadow-lg" style={{ borderTopLeftRadius: BOTTOM_SHEET_RADIUS, borderTopRightRadius: BOTTOM_SHEET_RADIUS, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16 }}>
          
          {/* Handle Bar floating over the image */}
          <View
            {...panResponder.current.panHandlers}
            className="absolute top-0 left-12 right-12 h-12 z-40 items-center pt-2.5"
          >
            <View
              className="w-10 h-1.5 bg-white/95 rounded-full"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 3 }}
            />
          </View>

          {currentSpot && (
            <>
              {/* Photos */}
              <View className="w-full relative bg-gray-200" style={{ height: normalize(140) }}>
                {displayPhotos.length > 0 ? (
                  <View className="flex-row w-full h-full gap-[2px] bg-white">
                    {displayPhotos.map((url, idx) => (
                      <Image
                        key={`${url}-${idx}`}
                        source={{ uri: url }}
                        className="flex-1 h-full bg-gray-200"
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                ) : (
                  <View className="w-full h-full items-center justify-center bg-gray-100">
                    <IconHeart size={40} color="#ccc" />
                  </View>
                )}

                <TouchableOpacity onPress={handleClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 items-center justify-center z-10">
                  <IconX size={18} color="#fff" />
                </TouchableOpacity>

                <View className="absolute top-3 left-3 h-7 px-3 rounded-full bg-brand items-center justify-center z-10 shadow-sm shadow-brand/30">
                  <Text className="font-semibold text-white" style={{ fontSize: FONT_SM }}>{currentSpot.score}점</Text>
                </View>
              </View>

              {/* Body */}
              <View className="px-4 pt-5 pb-6">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-2">
                    <Text className="font-semibold text-black" style={{ fontSize: normalizeFontSize(20) }}>{currentSpot.name}</Text>

                    <View className="flex-row items-center mt-1.5 flex-wrap">
                      <StarRating rating={rating} size={normalizeFontSize(14)} />
                      <Text className="font-semibold text-black ml-1.5" style={{ fontSize: FONT_SM }}>
                        {rating > 0 ? rating.toFixed(1) : '0.0'}
                      </Text>
                      <Text className="text-sub ml-1 font-normal" style={{ fontSize: FONT_SM }}>
                        {` · 리뷰 ${reviewCount}건`}
                      </Text>
                      <Text className="text-sub ml-1 font-normal" style={{ fontSize: FONT_SM }}>
                        {` · 저장 ${bookmarkCount.toLocaleString()}`}
                      </Text>
                      <Text className="text-sub ml-1 font-normal" style={{ fontSize: FONT_SM }}>
                        {` · 사진 ${photoCount.toLocaleString()}장`}
                      </Text>
                    </View>

                    <View className="flex-row items-center mt-2.5 mb-1">
                      <IconMapPin size={14} color={TEXT_SUB} />
                      <Text className="text-black/50 ml-1 flex-1 font-normal" style={{ fontSize: FONT_SM }} numberOfLines={1}>
                        {currentSpot.loc || '주소 정보 없음'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleBookmarkPress}
                    className="p-1"
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <IconBookmark
                      size={26}
                      color={isBookmarked ? BRAND : '#ccc'}
                      fill={isBookmarked ? BRAND : 'none'}
                    />
                  </TouchableOpacity>
                </View>

                <View className="flex-row flex-wrap gap-1.5 mt-3 mb-1">
                  {(currentSpot.tags || []).map((tag: string) => (
                    <View key={tag} className="px-2.5 py-1 bg-card rounded-full">
                      <Text className="text-black/50 font-normal" style={{ fontSize: normalizeFontSize(12) }}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {renderButtons && renderButtons(currentSpot)}
              </View>
            </>
          )}
        </View>
        
        {/* 스프링 애니메이션 바운스(오버슈팅) 시 밑바닥에 지도가 비어보이는 현상을 막기 위한 여유 배경 */}
        <View className="absolute top-full left-0 right-0 bg-white" style={{ height: normalize(200) }} />
      </Animated.View>

      <BookmarkSheet
        visible={bookmarkSheetVisible}
        spotId={spotId}
        onClose={() => setBookmarkSheetVisible(false)}
        onSaved={(count) => {
          setBookmarkSheetVisible(false);
          showToast(count > 0 ? `${count}개 컬렉션에 저장됐어요` : '즐겨찾기에서 제거됐어요');
        }}
      />

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </>
  );
}
