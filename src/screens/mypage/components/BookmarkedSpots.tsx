import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, EMPTY_CARD_HEIGHT, FONT_SM, GRID_PADDING } from '@/constants/layout';
import { useBookmarkCollectionsWithSpots } from '@/hooks/useSpot';
import { BRAND, CARD } from '@/constants/colors';
import BookmarkCollectionRow from './BookmarkCollectionRow';

/**
 * MY 탭 "북마크한 스팟" — 스팟 목록이 아니라 컬렉션 목록이다.
 * 저장 시트에서 컬렉션을 골라 담은 게 여기서 그 컬렉션 단위로 다시 보여야 저장한 값이 드러난다.
 */
export default function BookmarkedSpots() {
  const navigation = useNavigation<NativeStackNavigationProp<MyPageStackParamList>>();
  // 컬렉션은 최대 5개(서버 MAX_COLLECTIONS)라 자르지 않고 다 그린다. 서버 순서(생성순)를 그대로 —
  // 개수순으로 정렬하고 3개만 잘랐더니 새로 만든 컬렉션이 뒤로 밀려 MY 탭에 안 나타났다.
  const { groups, distinctSpotCount, isLoading } = useBookmarkCollectionsWithSpots();

  // 로딩 중에는 빈 상태를 먼저 그리지 않는다 — 저장한 게 있는데도 "없어요"가 스쳐 보인다.
  if (!isLoading && distinctSpotCount === 0) {
    return (
      <View className="mb-10" style={{ paddingHorizontal: GRID_PADDING }}>
        {/* 헤더 행 구조를 다른 MY 탭 섹션과 똑같이 둔다 — 제목-카드 간격(mb-3)이 이 행에 달려 있다. */}
        <View className="flex-row justify-between items-center mb-3">
          <SectionTitle />
        </View>
        <View
          style={{
            height: EMPTY_CARD_HEIGHT,
            backgroundColor: CARD,
            borderRadius: CARD_RADIUS,
            alignItems: 'center',
            justifyContent: 'center',
            gap: normalize(12),
          }}
        >
          <Text
            className="tracking-tight font-normal text-center"
            style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.3)', lineHeight: FONT_SM * 1.5 }}
          >
            {'가고 싶은 스팟을 저장해 두면\n컬렉션별로 모아 볼 수 있어요'}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MapTab' as never)}
            className="items-center justify-center"
            style={{
              height: normalize(38),
              paddingHorizontal: normalize(20),
              borderRadius: normalize(19),
              backgroundColor: '#1d1d1f',
            }}
          >
            <Text className="font-semibold text-white tracking-tight" style={{ fontSize: FONT_SM }}>
              스팟 둘러보기
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-10">
      <View className="flex-row justify-between items-center mb-3" style={{ paddingHorizontal: GRID_PADDING }}>
        <SectionTitle count={distinctSpotCount} />
        {distinctSpotCount > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('BookmarkedSpotList')}>
            <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: BRAND }}>
              전체보기
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ paddingHorizontal: GRID_PADDING, gap: normalize(8) }}>
        {groups.map(({ collection, spots, isLoading: spotsLoading }) => (
          <BookmarkCollectionRow
            key={collection.id}
            collection={collection}
            spots={spots}
            isLoading={spotsLoading}
            onPress={() => navigation.navigate('BookmarkedSpotList', { collectionId: collection.id })}
          />
        ))}
      </View>
    </View>
  );
}

function SectionTitle({ count }: { count?: number }) {
  return (
    <View className="flex-row items-baseline" style={{ gap: normalize(6) }}>
      <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
        북마크한 스팟
      </Text>
      {/* 0은 그리지 않는다 — 빈 상태 카드가 이미 같은 말을 한다. */}
      {!!count && (
        <Text className="font-normal" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.3)' }}>
          {count}
        </Text>
      )}
    </View>
  );
}
