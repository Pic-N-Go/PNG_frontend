import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { normalize } from '@/utils/normalize';
import { FONT_SM, GRID_PADDING } from '@/constants/layout';
import type { CategoryItem } from '@/types/spot';

const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: '전체' },
  { id: 'night', label: '야경' },
  { id: 'sea', label: '바다' },
  { id: 'hanok', label: '한옥' },
  { id: 'flower', label: '꽃' },
  { id: 'cafe', label: '카페' },
  { id: 'portrait', label: '인물' },
  { id: 'festival', label: '축제' },
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
