import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, Alert } from 'react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { IconCircleDot, IconClock, IconMessageCircleFilled, IconCompass } from '@tabler/icons-react-native';

interface SpotInfo {
  name: string;
  desc: string;
  lat: number;
  lng: number;
}

interface DepartModalProps {
  visible: boolean;
  onClose: () => void;
  firstSpot: SpotInfo | null;
  day: string;
}

export default function DepartModal({ visible, onClose, firstSpot, day }: DepartModalProps) {
  const [selectedApp, setSelectedApp] = useState<'kakao' | 'naver' | 'apple'>('kakao');

  const handleDepart = async () => {
    if (!firstSpot) return;

    let url = '';
    switch (selectedApp) {
      case 'kakao':
        url = `kakaomap://route?ep=${firstSpot.lat},${firstSpot.lng}&by=CAR`;
        break;
      case 'naver':
        url = `nmap://route/car?dlat=${firstSpot.lat}&dlng=${firstSpot.lng}&dname=${encodeURIComponent(firstSpot.name)}`;
        break;
      case 'apple':
        url = `http://maps.apple.com/?daddr=${firstSpot.lat},${firstSpot.lng}`;
        break;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('앱을 찾을 수 없습니다.', '해당 길 안내 앱이 설치되어 있지 않거나 열 수 없습니다.');
      }
    } catch (error) {
      Alert.alert('오류 발생', '길 안내 앱을 실행하는 중 문제가 발생했습니다.');
    }
  };

  if (!firstSpot) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="px-5 pt-4 pb-2">
        <Text className="text-[18px] font-bold text-black mb-5">바로 출발</Text>

        {/* Route Info Box */}
        <View className="bg-[#f5f5f7] rounded-xl p-5 mb-4 relative">
          {/* Vertical line connecting the two circles */}
          <View className="absolute left-[29px] top-[34px] bottom-[34px] w-[1px] bg-[#e5e5ea]" />

          <View className="flex-row items-center mb-5">
            <IconCircleDot size={18} color="#22c55e" />
            <Text className="text-[14px] font-medium text-black/40 ml-3">현재 위치</Text>
          </View>

          <View className="flex-row items-center">
            <IconCircleDot size={18} color="#e31b59" />
            <View className="ml-3">
              <Text className="text-[15px] font-bold text-black">{firstSpot.name}</Text>
              <Text className="text-[13px] text-black/40 mt-0.5">{firstSpot.desc}</Text>
            </View>
          </View>
        </View>

        {/* Time Info Box */}
        <View className="bg-[#f5f5f7] rounded-xl p-4 flex-row items-center mb-6">
          <View className="w-8 h-8 rounded-full bg-[#e31b59]/10 items-center justify-center mr-3">
            <IconClock size={16} color="#e31b59" />
          </View>
          <View>
            <Text className="text-[14px] font-bold text-black">DAY {day} 첫 번째 스팟까지 차로 약 18분</Text>
            <Text className="text-[12px] text-black/40 mt-0.5">실시간 교통 기준</Text>
          </View>
        </View>

        {/* Map Apps Selection */}
        <Text className="text-[12px] text-black/40 mb-3 ml-1">길 안내 앱 선택</Text>
        <View className="flex-row justify-center gap-[56px] mb-8">
          {/* KakaoMap */}
          <TouchableOpacity 
            onPress={() => setSelectedApp('kakao')}
            className="items-center"
          >
            <View className="w-16 h-16 rounded-2xl items-center justify-center mb-2 bg-[#fae100]">
              <IconMessageCircleFilled size={28} color="#3c1e1e" />
            </View>
            <Text className={`text-[12px] ${selectedApp === 'kakao' ? 'text-black font-semibold' : 'text-black/40'}`}>카카오맵</Text>
          </TouchableOpacity>

          {/* NaverMap */}
          <TouchableOpacity 
            onPress={() => setSelectedApp('naver')}
            className="items-center"
          >
            <View className="w-16 h-16 rounded-2xl items-center justify-center mb-2 bg-[#03c75a]">
              <Text className="text-[28px] font-bold text-white">N</Text>
            </View>
            <Text className={`text-[12px] ${selectedApp === 'naver' ? 'text-black font-semibold' : 'text-black/40'}`}>네이버 지도</Text>
          </TouchableOpacity>

          {/* AppleMap */}
          <TouchableOpacity 
            onPress={() => setSelectedApp('apple')}
            className="items-center"
          >
            <View className="w-16 h-16 rounded-2xl items-center justify-center mb-2 bg-[#f5f5f7]">
              <IconCompass size={28} color="#8e8e93" />
            </View>
            <Text className={`text-[12px] ${selectedApp === 'apple' ? 'text-black font-semibold' : 'text-black/40'}`}>Apple 지도</Text>
          </TouchableOpacity>
        </View>

        {/* Depart Action Button */}
        <TouchableOpacity 
          onPress={handleDepart}
          className="w-full h-[56px] rounded-full bg-[#e31b59] items-center justify-center mb-4 shadow-sm"
        >
          <Text className="text-[16px] font-bold text-white">바로 출발</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
