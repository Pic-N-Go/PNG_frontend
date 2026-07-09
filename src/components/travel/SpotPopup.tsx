import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Easing, PanResponder, Dimensions } from 'react-native';
import { FONT_SM, BOTTOM_SHEET_RADIUS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { IconMapPin, IconX, IconStarFilled, IconHeart, IconBookmark } from '@tabler/icons-react-native';
import { Spot } from '@/store/useTravelStore';

interface Props {
  activeSpot: Spot | null;
  onClose: () => void;
  renderButtons?: () => React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function SpotPopup({ activeSpot, onClose, renderButtons }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const lastSpot = useRef<Spot | null>(null);

  if (activeSpot) {
    lastSpot.current = activeSpot;
  }

  const displaySpot = activeSpot || lastSpot.current;

  useEffect(() => {
    if (activeSpot) {
      Animated.spring(translateY, {
        toValue: 0,
        stiffness: 200,
        damping: 20,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
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
      useNativeDriver: true,
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
            useNativeDriver: true,
          }).start();
        }
      },
    });
  }

  return (
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

        {displaySpot && (
          <>
            {/* Photos */}
            <View className="w-full relative bg-gray-200" style={{ height: normalize(140) }}>
              {displaySpot.photo ? (
                <View className="flex-row w-full h-full gap-[2px] bg-white">
                  <Image source={{ uri: displaySpot.photo }} className="flex-1 h-full bg-gray-200" resizeMode="cover" />
                  <Image source={{ uri: displaySpot.photo }} className="flex-1 h-full bg-gray-200" resizeMode="cover" />
                  <Image source={{ uri: displaySpot.photo }} className="flex-1 h-full bg-gray-200" resizeMode="cover" />
                </View>
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <IconHeart size={40} color="#ccc" />
                </View>
              )}

              <TouchableOpacity onPress={handleClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 items-center justify-center z-10">
                <IconX size={18} color="#fff" />
              </TouchableOpacity>

              <View className="absolute top-3 left-3 h-7 px-3 rounded-full bg-[#E31B59] items-center justify-center z-10 shadow-sm shadow-[#E31B59]/30">
                <Text className="font-semibold text-white" style={{ fontSize: FONT_SM }}>{displaySpot.score}점</Text>
              </View>
            </View>

            {/* Body */}
            <View className="px-4 pt-5 pb-6">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-black" style={{ fontSize: normalizeFontSize(20) }}>{displaySpot.name}</Text>

                  <View className="flex-row items-center mt-1.5">
                    <View className="flex-row mr-1.5">
                      <IconStarFilled size={14} color="#FBBF24" />
                      <IconStarFilled size={14} color="#FBBF24" />
                      <IconStarFilled size={14} color="#FBBF24" />
                      <IconStarFilled size={14} color="#FBBF24" />
                      <IconStarFilled size={14} color="#FBBF24" />
                    </View>
                    <Text className="text-black/40" style={{ fontSize: FONT_SM }}>{displaySpot.score} · 리뷰 324건</Text>
                  </View>

                  <View className="flex-row items-center mt-2.5 mb-1">
                    <IconMapPin size={14} color="rgba(0,0,0,0.4)" />
                    <Text className="text-black/50 ml-1" style={{ fontSize: FONT_SM }}>{displaySpot.loc}</Text>
                  </View>
                </View>

                <TouchableOpacity className="p-1">
                  <IconBookmark size={26} color="#ccc" />
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-1.5 mt-3 mb-1">
                {(displaySpot.tags || []).map((tag: string) => (
                  <View key={tag} className="px-2.5 py-1 bg-[#f5f5f7] rounded-full">
                    <Text className="text-black/50" style={{ fontSize: normalizeFontSize(12) }}>{tag}</Text>
                  </View>
                ))}
              </View>

              {renderButtons && renderButtons()}
            </View>
          </>
        )}
      </View>
      
      {/* 스프링 애니메이션 바운스(오버슈팅) 시 밑바닥에 지도가 비어보이는 현상을 막기 위한 여유 배경 */}
      <View className="absolute top-full left-0 right-0 bg-white" style={{ height: normalize(200) }} />
    </Animated.View>
  );
}
