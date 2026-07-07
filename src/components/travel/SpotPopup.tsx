import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { IconMapPin, IconX, IconStarFilled, IconHeart, IconBookmark } from '@tabler/icons-react-native';
import { Spot } from '@/store/useTravelStore';

interface Props {
  activeSpot: Spot | null;
  onClose: () => void;
  renderButtons?: () => React.ReactNode;
}

export default function SpotPopup({ activeSpot, onClose, renderButtons }: Props) {
  const translateY = useRef(new Animated.Value(400)).current;
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
        toValue: 400,
        duration: 250,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [activeSpot]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: 400,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  };

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
      <View className="w-full relative rounded-t-[24px] overflow-hidden bg-white shadow-lg" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16 }}>
        
        {/* Handle Bar floating over the image */}
        <View
          className="absolute top-2.5 left-1/2 -ml-[20px] w-10 h-1.5 bg-white/95 rounded-full z-40"
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 3 }}
        />

        {displaySpot && (
          <>
            {/* Photos */}
            <View className="h-[190px] w-full relative bg-gray-200">
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
                <Text className="text-[13px] font-bold text-white">{displaySpot.score}점</Text>
              </View>
            </View>

            {/* Body */}
            <View className="px-4 pt-5 pb-6">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-[20px] font-bold text-black">{displaySpot.name}</Text>

                  <View className="flex-row items-center mt-1.5">
                    <View className="flex-row mr-1.5">
                      <IconStarFilled size={14} color="#FBBF24" />
                      <IconStarFilled size={14} color="#FBBF24" />
                      <IconStarFilled size={14} color="#FBBF24" />
                      <IconStarFilled size={14} color="#FBBF24" />
                      <IconStarFilled size={14} color="#FBBF24" />
                    </View>
                    <Text className="text-[13px] text-black/40">{displaySpot.score} · 리뷰 324건</Text>
                  </View>

                  <View className="flex-row items-center mt-2.5 mb-1">
                    <IconMapPin size={14} color="rgba(0,0,0,0.4)" />
                    <Text className="text-[13px] text-black/50 ml-1">{displaySpot.loc}</Text>
                  </View>
                </View>

                <TouchableOpacity className="p-1">
                  <IconBookmark size={26} color="#ccc" />
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-1.5 mt-3 mb-1">
                {(displaySpot.tags || []).map((tag: string) => (
                  <View key={tag} className="px-2.5 py-1 bg-[#f5f5f7] rounded-full">
                    <Text className="text-[12px] text-black/50">{tag}</Text>
                  </View>
                ))}
              </View>

              {renderButtons && renderButtons()}
            </View>
          </>
        )}
      </View>
      
      {/* 스프링 애니메이션 바운스(오버슈팅) 시 밑바닥에 지도가 비어보이는 현상을 막기 위한 여유 배경 */}
      <View className="absolute top-full left-0 right-0 h-[200px] bg-white" />
    </Animated.View>
  );
}
