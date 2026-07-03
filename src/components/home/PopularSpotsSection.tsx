import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { normalize } from '@/utils/normalize';
import { FONT_MD, FONT_XL, GRID_PADDING, SPACING_MD, SPACING_XS } from '@/constants/layout';
import SpotCard from '@/components/home/SpotCard';
import type { SpotItem } from '@/types/spot';

// TODO: API 연동 시 GET /spots/popular 로 교체
const MOCK_SPOTS: SpotItem[] = [
  {
    id: '1',
    name: '광안리 해수욕장',
    location: '부산 수영구 · 야경/바다',
    category: '야경',
    rating: 4.8,
    photoScore: 87,
    badge: 'HOT',
    isBookmarked: false,
    gradientColors: ['#0f2027', '#203a43', '#2c5364'],
  },
  {
    id: '2',
    name: '경복궁 야간개장',
    location: '서울 종로구 · 야경/한옥',
    category: '한옥',
    rating: 4.9,
    photoScore: 91,
    badge: 'NEW',
    isBookmarked: false,
    gradientColors: ['#232526', '#414345', '#8e7b5a'],
  },
  {
    id: '3',
    name: '제주 사려니숲길',
    location: '제주 서귀포시 · 숲/안개',
    category: '숲',
    rating: 4.7,
    photoScore: 78,
    isBookmarked: false,
    gradientColors: ['#1d4350', '#4a8d7e', '#a3d9c8'],
  },
];

interface Props {
  // TODO: 스팟 상세 네비게이션 파라미터 확정 후 onSpotPress 연결
  onSpotPress?: (id: string) => void;
  onViewAll?: () => void;
}

export default function PopularSpotsSection({ onSpotPress, onViewAll }: Props) {
  return (
    <View style={{ marginTop: normalize(28) }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingHorizontal: GRID_PADDING,
          marginBottom: SPACING_XS,
        }}
      >
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, color: '#000', letterSpacing: -0.4 }}
        >
          이번 주 인기 스팟
        </Text>
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: '#E31B59' }}
          >
            모두 보기
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={MOCK_SPOTS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14), gap: normalize(12) }}
        renderItem={({ item }) => (
          <SpotCard
            item={item}
            onPress={onSpotPress ? () => onSpotPress(item.id) : undefined}
          />
        )}
      />
    </View>
  );
}
