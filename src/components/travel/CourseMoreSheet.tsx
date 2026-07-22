import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { 
  IconEdit, 
  IconCopy, 
  IconUserPlus, 
  IconCalendarPlus, 
  IconTrash 
} from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { normalizeFontSize } from '@/utils/normalize';
import { CONTENT_PADDING, GRID_PADDING } from '@/constants/layout';

interface CourseMoreSheetProps {
  visible: boolean;
  onClose: () => void;
  courseName: string;
  onEditName: () => void;
  onDuplicate: () => void;
  onInvite: () => void;
  onAddToCalendar: () => void;
  onDelete: () => void;
}

export default function CourseMoreSheet({
  visible,
  onClose,
  courseName,
  onEditName,
  onDuplicate,
  onInvite,
  onAddToCalendar,
  onDelete
}: CourseMoreSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View className="pt-[12px] pb-[16px]" style={{ paddingHorizontal: CONTENT_PADDING }}>
        <View className="w-10 h-1 bg-[#E0E0E0] rounded-sm self-center mb-[20px]" />
        <Text className="font-semibold text-black tracking-[-0.5px] mb-1" style={{ fontSize: normalizeFontSize(20) }}>더보기</Text>
        <Text className="font-normal text-[#666] tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(13) }}>{courseName}</Text>
      </View>

      <View className="pb-[40px]" style={{ paddingHorizontal: GRID_PADDING }}>
        <TouchableOpacity className="flex-row items-center bg-[#F5F5F7] rounded-2xl p-[16px] mb-[10px]" onPress={() => { onClose(); onEditName(); }}>
          <View className="w-10 h-10 rounded-lg items-center justify-center mr-3">
            <IconEdit size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View className="flex-1 justify-center">
            <Text className="font-semibold text-black tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(16) }}>이름 변경</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center bg-[#F5F5F7] rounded-2xl p-[16px] mb-[10px]" onPress={() => { onClose(); onDuplicate(); }}>
          <View className="w-10 h-10 rounded-lg items-center justify-center mr-3">
            <IconCopy size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View className="flex-1 justify-center">
            <Text className="font-semibold text-black tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(16) }}>복제</Text>
            <Text className="font-normal text-[#888] mt-0.5 tracking-[-0.2px]" style={{ fontSize: normalizeFontSize(12) }}>같은 스팟으로 새 계획 만들기</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center bg-[#F5F5F7] rounded-2xl p-[16px] mb-[10px]" onPress={() => { onClose(); onInvite(); }}>
          <View className="w-10 h-10 rounded-lg items-center justify-center mr-3">
            <IconUserPlus size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View className="flex-1 justify-center flex-row items-center">
            <View className="flex-1">
              <Text className="font-semibold text-black tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(16) }}>공동 편집자 초대</Text>
              <Text className="font-normal text-[#888] mt-0.5 tracking-[-0.2px]" style={{ fontSize: normalizeFontSize(12) }}>함께 갈 친구 추가</Text>
            </View>
            <View className="bg-black px-2 py-1 rounded-xl">
              <Text className="text-white font-semibold" style={{ fontSize: normalizeFontSize(10) }}>BETA</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center bg-[#F5F5F7] rounded-2xl p-[16px] mb-[10px]" onPress={() => { onClose(); onAddToCalendar(); }}>
          <View className="w-10 h-10 rounded-lg items-center justify-center mr-3">
            <IconCalendarPlus size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View className="flex-1 justify-center">
            <Text className="font-semibold text-black tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(16) }}>캘린더에 추가</Text>
            <Text className="font-normal text-[#888] mt-0.5 tracking-[-0.2px]" style={{ fontSize: normalizeFontSize(12) }}>iOS 캘린더 · Google 캘린더</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center bg-[#FFF0F3] rounded-2xl p-[16px] mb-[10px] mt-[10px]" onPress={() => { onClose(); onDelete(); }}>
          <View className="w-10 h-10 rounded-lg items-center justify-center mr-3 bg-transparent">
            <IconTrash size={20} color="#E31B59" strokeWidth={1.5} />
          </View>
          <View className="flex-1 justify-center">
            <Text className="font-semibold text-[#E31B59] tracking-[-0.3px]" style={{ fontSize: normalizeFontSize(16) }}>이 계획 전체 삭제</Text>
            <Text className="font-normal text-[#E31B59] opacity-70 mt-0.5 tracking-[-0.2px]" style={{ fontSize: normalizeFontSize(12) }}>{"스팟 개별 삭제는 '코스 편집'에서 · 되돌릴 수 없어요"}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
