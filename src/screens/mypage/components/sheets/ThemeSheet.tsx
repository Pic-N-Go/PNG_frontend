import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { IconX } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants/layout';
import { THEMES } from '@/constants/themes';
import { CARD, TEXT_SUB } from '@/constants/colors';

interface ThemeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

// 회원가입 관심 테마와 같은 목록(@/constants/themes → spotCategories 단일 출처).
// 인물·커플·반려동물·드론·비오는날·필름은 백엔드 SpotCategory에 대응값이 없어 제거했다.
const ALL_THEMES = THEMES;
// MOCK. 라벨이 ALL_THEMES에 없으면 칩이 아예 안 그려져 선택 상태가 보이지 않는다 —
// BEACH 라벨이 '바다'에서 '해변'으로 통일되면서 함께 맞춘다.
const INITIAL_THEMES = ['야경', '해변', '축제'];

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
            <IconX size={normalize(24)} color={TEXT_SUB} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <Text className="tracking-tight mb-4 font-normal" style={{ fontSize: FONT_SM, color: TEXT_SUB, letterSpacing: -0.1 }}>
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
                  backgroundColor: isSelected ? '#1d1d1f' : CARD,
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
          className="w-full items-center justify-center bg-brand mt-6"
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
