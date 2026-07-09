import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

export default function MyPageScreen({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f7] justify-center" style={{ paddingHorizontal: CONTENT_PADDING }}>
      <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(24), marginBottom: normalize(30) }}>
        프로필(MY) 탭 임시 화면
      </Text>
      
      <TouchableOpacity 
        className="bg-[#E31B59] items-center justify-center"
        style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
        onPress={() => navigation.navigate('Wishlist')}
      >
        <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(16) }}>위시리스트 화면 보기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
