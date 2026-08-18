import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { normalize } from '@/utils/normalize';
import { FONT_SM, GRID_PADDING } from '@/constants/layout';
import type { CategoryItem } from '@/types/spot';
import { CATEGORY_CODES, SPOT_CATEGORY_MAP } from '@/constants/spotCategories';

// id를 백엔드 enum 코드로 맞춘다 — 예전의 'night'·'sea' 같은 자체 id는 서버 값으로 되돌릴 수 없었다.
// '인물'은 백엔드 SpotCategory에 대응값이 없어 제거했다.
const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: '전체' },
  ...CATEGORY_CODES.map((code) => ({ id: code, label: SPOT_CATEGORY_MAP[code].label })),
];

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingTop: GRID_PADDING, gap: normalize(6) }}
    >
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            style={{
              height: normalize(34),
              paddingHorizontal: normalize(16),
              borderRadius: normalize(17),
              backgroundColor: isActive ? '#E31B59' : '#F5F5F7',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: isActive ? 'Pretendard-Medium' : 'Pretendard-Regular',
                fontSize: FONT_SM,
                color: isActive ? '#fff' : 'rgba(0,0,0,0.55)',
                letterSpacing: -0.1,
              }}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
