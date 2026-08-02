import React, { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Aperture, Camera } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { GearSheetKind } from '@/types/community';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

// 목업의 "자주 쓰는 카메라 / 렌즈" 프리셋 — 장비 등록 API가 없어 고정 목록으로 대체한다.
const CAMERA_PRESETS = ['Sony A7IV', 'Sony A7C II', 'Canon R6 II', 'Canon R8', 'Nikon Z6 III', 'Fujifilm X-T5', 'iPhone 15 Pro'];
const LENS_PRESETS = ['24mm f/2.8', '35mm f/1.4', '50mm f/1.8', '24-70mm f/2.8', '70-200mm f/2.8', '16-35mm f/4'];

interface Props {
  visible: boolean;
  kind: GearSheetKind;
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function GearSheet({ visible, kind, value, onSelect, onClose }: Props) {
  const [input, setInput] = useState(value);

  // 시트를 열 때마다 현재 값으로 입력창을 되돌린다(카메라 시트를 닫고 렌즈 시트를 여는 경우 포함).
  useEffect(() => {
    if (visible) setInput(value);
  }, [visible, value]);

  const isCamera = kind === 'camera';
  const title = isCamera ? '카메라' : '렌즈';
  const label = isCamera ? '자주 쓰는 카메라' : '자주 쓰는 렌즈';
  const presets = isCamera ? CAMERA_PRESETS : LENS_PRESETS;
  const Icon = isCamera ? Camera : Aperture;
  const trimmed = input.trim();

  const confirm = (name: string) => {
    onSelect(name);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4, marginBottom: normalize(16) }}>
          {title}
        </Text>

        <View
          className="flex-row items-center"
          style={{ gap: normalize(10), backgroundColor: SURFACE, borderRadius: normalize(13), paddingHorizontal: normalize(14), height: normalize(48) }}
        >
          <Icon size={normalize(15)} color="rgba(0,0,0,0.35)" strokeWidth={1.8} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={isCamera ? '카메라 직접 입력' : '렌즈 직접 입력'}
            placeholderTextColor="rgba(0,0,0,0.3)"
            allowFontScaling={false}
            style={{ flex: 1, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}
          />
        </View>

        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.4)', letterSpacing: 0.3, marginTop: normalize(16), marginBottom: normalize(8) }}>
          {label}
        </Text>
        <View className="flex-row flex-wrap" style={{ gap: normalize(6) }}>
          {presets.map((preset) => {
            const selected = preset === trimmed;
            return (
              <Pressable
                key={preset}
                onPress={() => setInput(preset)}
                className="items-center justify-center"
                style={{
                  height: normalize(30),
                  paddingHorizontal: normalize(12),
                  borderRadius: normalize(15),
                  backgroundColor: selected ? 'rgba(227,27,89,0.08)' : SURFACE,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: selected ? 'Pretendard-SemiBold' : 'Pretendard-Regular', fontSize: FONT_SM, color: selected ? ACCENT : 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}
                >
                  {preset}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => confirm(trimmed || value)}
          className="items-center justify-center"
          style={{ width: '100%', height: BUTTON_HEIGHT, marginTop: normalize(20), borderRadius: BUTTON_RADIUS, backgroundColor: ACCENT }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#fff', letterSpacing: -0.2 }}>
            확인
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
