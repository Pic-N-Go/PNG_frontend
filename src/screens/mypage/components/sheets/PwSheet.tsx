import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { IconX } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_MD, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants/layout';

interface PwSheetProps {
  visible: boolean;
  onClose: () => void;
  onChangePw: () => void;
}

export default function PwSheet({ visible, onClose, onChangePw }: PwSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: normalize(20) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(16) }}>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(20) }}>
            비밀번호 변경
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: normalize(4) }}>
            <IconX size={normalize(24)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: normalize(14) }}>
          <Text className="font-medium tracking-tight mb-1.5" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)' }}>
            현재 비밀번호
          </Text>
          <TextInput
            placeholder="현재 비밀번호"
            placeholderTextColor="rgba(0,0,0,0.25)"
            secureTextEntry
            style={{
              height: BUTTON_HEIGHT,
              borderRadius: normalize(12),
              backgroundColor: '#f8f8f9',
              paddingHorizontal: normalize(14),
              fontSize: FONT_MD,
              color: '#000',
            }}
          />
        </View>

        <View style={{ marginBottom: normalize(14) }}>
          <Text className="font-medium tracking-tight mb-1.5" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)' }}>
            새 비밀번호
          </Text>
          <TextInput
            placeholder="8자 이상, 영문+숫자 조합"
            placeholderTextColor="rgba(0,0,0,0.25)"
            secureTextEntry
            style={{
              height: BUTTON_HEIGHT,
              borderRadius: normalize(12),
              backgroundColor: '#f8f8f9',
              paddingHorizontal: normalize(14),
              fontSize: FONT_MD,
              color: '#000',
            }}
          />
        </View>

        <View style={{ marginBottom: normalize(14) }}>
          <Text className="font-medium tracking-tight mb-1.5" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)' }}>
            새 비밀번호 확인
          </Text>
          <TextInput
            placeholder="새 비밀번호 재입력"
            placeholderTextColor="rgba(0,0,0,0.25)"
            secureTextEntry
            style={{
              height: BUTTON_HEIGHT,
              borderRadius: normalize(12),
              backgroundColor: '#f8f8f9',
              paddingHorizontal: normalize(14),
              fontSize: FONT_MD,
              color: '#000',
            }}
          />
        </View>

        <TouchableOpacity
          onPress={onChangePw}
          className="w-full items-center justify-center bg-[#E31B59] mt-2"
          style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
        >
          <Text className="font-medium text-white tracking-tight" style={{ fontSize: FONT_MD }}>
            변경하기
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
