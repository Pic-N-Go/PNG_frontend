import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING, FONT_MD, FONT_2XL } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

export default function MyPageScreen({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f7] justify-center" style={{ paddingHorizontal: CONTENT_PADDING }}>
      <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_2XL, marginBottom: normalize(30) }}>
        프로필(MY) 탭 임시 화면
      </Text>
      
      <TouchableOpacity
        className="bg-[#E31B59] items-center justify-center"
        style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
        onPress={() => navigation.navigate('Wishlist')}
      >
        <Text className="font-medium text-white" style={{ fontSize: FONT_MD }}>위시리스트 화면 보기</Text>
      </TouchableOpacity>

      {/* TODO: 마이페이지 정식 구현 시 프로필 헤더의 설정(gear) 진입점으로 대체 */}
      <TouchableOpacity
        className="bg-[#E31B59] items-center justify-center"
        style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, marginTop: normalize(12) }}
        onPress={() => navigation.navigate('Setting')}
      >
        <Text className="font-medium text-white" style={{ fontSize: FONT_MD }}>설정 화면 보기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
