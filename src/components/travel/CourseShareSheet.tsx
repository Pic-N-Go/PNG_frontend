import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { 
  IconLink, 
  IconPhoto, 
  IconFileDownload,
  IconMessageCircle, // Using as KaKao mock
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandX,
  IconDotsCircleHorizontal
} from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { normalizeFontSize } from '@/utils/normalize';
import { GRID_PADDING } from '@/constants/layout';

interface CourseShareSheetProps {
  visible: boolean;
  onClose: () => void;
  courseName: string;
  spotCount: number;
  onCopyLink: () => void;
  onSaveImage: () => void;
  onExportPdf: () => void;
  onShareSocial: (platform: string) => void;
}

export default function CourseShareSheet({
  visible,
  onClose,
  courseName,
  spotCount,
  onCopyLink,
  onSaveImage,
  onExportPdf,
  onShareSocial
}: CourseShareSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="pt-[12px] pb-[16px]" style={{ paddingHorizontal: GRID_PADDING }}>
        <View className="w-10 h-1 bg-[#E0E0E0] rounded-sm self-center mb-[20px]" />
        <Text className="font-semibold text-black tracking-[-0.5px] mb-1" style={{ fontSize: normalizeFontSize(20) }}>공유하기</Text>
        <Text className="font-normal text-[#666] tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(13) }}>{courseName} · 포토스팟 {spotCount}곳</Text>
      </View>

      <View className="pb-[20px] border-b border-[#F0F0F0] mb-[16px]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GRID_PADDING }}>
          <TouchableOpacity className="items-center mr-5" onPress={() => { onClose(); onShareSocial('kakao'); }}>
            <View className="w-[60px] h-[60px] rounded-[20px] items-center justify-center mb-2 bg-[#FEE500]">
              <IconMessageCircle size={28} color="#381E1F" strokeWidth={1.5} />
            </View>
            <Text className="font-normal text-[#333]" style={{ fontSize: normalizeFontSize(11) }}>카카오톡</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center mr-5" onPress={() => { onClose(); onShareSocial('instagram'); }}>
            <View className="w-[60px] h-[60px] rounded-[20px] items-center justify-center mb-2 bg-[#E1306C]">
              <IconBrandInstagram size={28} color="#FFF" strokeWidth={1.5} />
            </View>
            <Text className="font-normal text-[#333]" style={{ fontSize: normalizeFontSize(11) }}>인스타 스토리</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center mr-5" onPress={() => { onClose(); onShareSocial('facebook'); }}>
            <View className="w-[60px] h-[60px] rounded-[20px] items-center justify-center mb-2 bg-[#1877F2]">
              <IconBrandFacebook size={28} color="#FFF" strokeWidth={1.5} />
            </View>
            <Text className="font-normal text-[#333]" style={{ fontSize: normalizeFontSize(11) }}>페이스북</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center mr-5" onPress={() => { onClose(); onShareSocial('x'); }}>
            <View className="w-[60px] h-[60px] rounded-[20px] items-center justify-center mb-2 bg-[#1DA1F2]">
              <IconBrandX size={28} color="#FFF" strokeWidth={1.5} />
            </View>
            <Text className="font-normal text-[#333]" style={{ fontSize: normalizeFontSize(11) }}>X (트위터)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="items-center mr-5" onPress={() => { onClose(); onShareSocial('more'); }}>
            <View className="w-[60px] h-[60px] rounded-[20px] items-center justify-center mb-2 bg-[#F0F0F0]">
              <IconDotsCircleHorizontal size={28} color="#666" strokeWidth={1.5} />
            </View>
            <Text className="font-normal text-[#333]" style={{ fontSize: normalizeFontSize(11) }}>더보기</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View className="pb-[40px]" style={{ paddingHorizontal: GRID_PADDING }}>
        <TouchableOpacity className="flex-row items-center bg-[#F5F5F7] rounded-2xl p-[16px] mb-[10px]" onPress={() => { onClose(); onCopyLink(); }}>
          <View className="w-10 h-10 rounded-lg items-center justify-center mr-3">
            <IconLink size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View className="flex-1 justify-center">
            <Text className="font-semibold text-black tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(16) }}>링크 복사</Text>
            <Text className="font-normal text-[#888] mt-0.5 tracking-[-0.2px]" style={{ fontSize: normalizeFontSize(12) }}>png.travel/plan/abc123</Text>
          </View>
          <Text className="font-semibold text-[#E31B59]" style={{ fontSize: normalizeFontSize(14) }}>복사</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center bg-[#F5F5F7] rounded-2xl p-[16px] mb-[10px]" onPress={() => { onClose(); onSaveImage(); }}>
          <View className="w-10 h-10 rounded-lg items-center justify-center mr-3">
            <IconPhoto size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View className="flex-1 justify-center">
            <Text className="font-semibold text-black tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(16) }}>이미지로 저장</Text>
            <Text className="font-normal text-[#888] mt-0.5 tracking-[-0.2px]" style={{ fontSize: normalizeFontSize(12) }}>지도 + 일정표를 PNG 로</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center bg-[#F5F5F7] rounded-2xl p-[16px] mb-[10px]" onPress={() => { onClose(); onExportPdf(); }}>
          <View className="w-10 h-10 rounded-lg items-center justify-center mr-3">
            <IconFileDownload size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View className="flex-1 justify-center flex-row items-center">
            <View className="flex-1">
              <Text className="font-semibold text-black tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(16) }}>PDF 로 내보내기</Text>
              <Text className="font-normal text-[#888] mt-0.5 tracking-[-0.2px]" style={{ fontSize: normalizeFontSize(12) }}>인쇄용 상세 일정</Text>
            </View>
            <View className="bg-black px-2 py-1 rounded-xl">
              <Text className="text-white font-semibold" style={{ fontSize: normalizeFontSize(10) }}>BETA</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
