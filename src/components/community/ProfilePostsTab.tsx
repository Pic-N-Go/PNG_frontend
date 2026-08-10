import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { Heart, Trophy } from 'lucide-react-native';
import { ProfilePostItem } from '@/types/community';
import { FONT_2XS, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const CELL_GAP = normalize(3);

interface Props {
  items: ProfilePostItem[];
}

export default function ProfilePostsTab({ items }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  // width:'%' + aspectRatio를 같은 노드에 함께 주면 flexWrap 컨테이너 안에서 높이가
  // 제대로 계산되지 않는 RN(Yoga) 이슈가 있어 실제 너비 기준 픽셀 크기를 직접 계산한다(3열).
  const cellSize = (windowWidth - GRID_PADDING * 2 - CELL_GAP * 2) / 3;

  return (
    // cellSize가 GRID_PADDING 기준으로 계산되므로 실제 패딩도 같은 상수를 써야 한다 — 리터럴이면 상수 조정 시 3열이 줄바꿈된다
    <View className="flex-row flex-wrap" style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14), paddingBottom: normalize(20), gap: CELL_GAP }}>
      {items.map((item) => {
        return (
          <View key={item.id} style={{ width: cellSize, height: cellSize, position: 'relative' }}>
            <View style={{ flex: 1, backgroundColor: item.photoGradient[0] }} />
            <View
              className="flex-row items-center absolute"
              style={{ right: normalize(6), bottom: normalize(6), gap: normalize(3), height: normalize(18), paddingHorizontal: normalize(6), borderRadius: normalize(9), backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              <Heart size={normalize(8)} color="#ff453a" fill="#ff453a" strokeWidth={0} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff' }}>
                {item.likeCount}
              </Text>
            </View>
            {item.contestRank != null && (
              <View
                className="flex-row items-center absolute"
                style={{ left: normalize(6), top: normalize(6), gap: normalize(3), height: normalize(18), paddingHorizontal: normalize(6), borderRadius: normalize(9), backgroundColor: ACCENT }}
              >
                <Trophy size={normalize(8)} color="#fff" fill="#fff" strokeWidth={0} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff', letterSpacing: 0.3 }}>
                  {item.contestRank}위
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}
