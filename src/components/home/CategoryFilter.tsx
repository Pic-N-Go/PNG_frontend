import React from 'react';
import { ScrollView } from 'react-native';
import { normalize } from '@/utils/normalize';
import { GRID_PADDING } from '@/constants/layout';
import type { CategoryItem } from '@/types/spot';
import { CATEGORY_CODES, SPOT_CATEGORY_MAP } from '@/constants/spotCategories';
import Chip from '@/components/common/Chip';

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
      {/* 스팟 목록만 거르는 필터라 활성색은 블랙이다 — 핑크는 화면을 전환하거나 데이터를 바꾸는 컨트롤용 */}
      {CATEGORIES.map((cat) => (
        <Chip
          key={cat.id}
          label={cat.label}
          selected={selected === cat.id}
          onPress={() => onSelect(cat.id)}
          height={normalize(34)}
          paddingHorizontal={normalize(16)}
        />
      ))}
    </ScrollView>
  );
}
