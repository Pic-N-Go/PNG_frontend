import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { IconX } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants/layout';

interface ThemeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ALL_THEMES = ['야경', '바다', '한옥', '꽃', '카페', '인물', '축제', '커플', '반려동물', '드론', '일출/일몰', '비오는날', '은하수', '필름'];
const INITIAL_THEMES = ['야경', '바다', '축제']; // MOCK

export default function ThemeSheet({ visible, onClose, onSave }: ThemeSheetProps) {
  const [selectedThemes, setSelectedThemes] = useState<string[]>(INITIAL_THEMES);

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev =>
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: normalize(20) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(8) }}>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(20) }}>
            관심 테마
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: normalize(4) }}>
            <IconX size={normalize(24)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text className="tracking-tight mb-4" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1 }}>
          홈 피드 및 스팟 추천에 반영돼요. 복수 선택 가능해요.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(8) }}>
          {ALL_THEMES.map(theme => {
            const isSelected = selectedThemes.includes(theme);
            return (
              <TouchableOpacity
                key={theme}
                onPress={() => toggleTheme(theme)}
                style={{
                  paddingHorizontal: normalize(14),
                  paddingVertical: normalize(8),
                  borderRadius: normalize(20),
                  backgroundColor: isSelected ? '#1d1d1f' : '#f8f8f9',
                }}
              >
                <Text
                  className="font-medium tracking-tight"
                  style={{ fontSize: FONT_SM, color: isSelected ? '#fff' : 'rgba(0,0,0,0.5)' }}
                >
                  {theme}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={onSave}
          className="w-full items-center justify-center bg-[#E31B59] mt-6"
          style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
        >
          <Text className="font-medium text-white tracking-tight" style={{ fontSize: FONT_MD }}>
            저장하기
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}
