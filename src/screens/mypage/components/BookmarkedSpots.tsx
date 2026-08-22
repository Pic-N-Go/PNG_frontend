import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, EMPTY_CARD_HEIGHT, FONT_SM, FONT_TITLE, GRID_PADDING } from '@/constants/layout';
import { useBookmarkCollectionsWithSpots } from '@/hooks/useSpot';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';
import BookmarkCollectionRow from '@/screens/mypage/components/BookmarkCollectionRow';

/**
 * MY 탭 "즐겨찾기 스팟" — 스팟 목록이 아니라 컬렉션 목록이다.
 * 저장 시트에서 컬렉션을 골라 담은 게 여기서 그 컬렉션 단위로 다시 보여야 저장한 값이 드러난다.
 */
export default function BookmarkedSpots() {
  const navigation = useNavigation<NativeStackNavigationProp<MyPageStackParamList>>();
  // 컬렉션은 최대 5개(서버 MAX_COLLECTIONS)라 자르지 않고 다 그린다. 서버 순서(생성순)를 그대로 —
  // 개수순으로 정렬하고 3개만 잘랐더니 새로 만든 컬렉션이 뒤로 밀려 MY 탭에 안 나타났다.
  const { groups, distinctSpotCount, isLoading, isError, refetch } = useBookmarkCollectionsWithSpots();

  // 조회 실패를 빈 상태로 그리면 저장한 게 있는데도 "없어요"가 보이고 빠져나갈 길도 없다.
  // 목록 화면(BookmarkedSpotListScreen)과 같은 인라인 에러 + 다시 시도로 맞춘다.
  if (!isLoading && isError && distinctSpotCount === 0) {
    return (
      <View className="mb-10" style={{ paddingHorizontal: GRID_PADDING }}>
        <View className="flex-row justify-between items-center mb-3">
          <SectionTitle />
        </View>
        <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: TEXT_SUB }}>
          북마크를 불러오지 못했어요.
        </Text>
        <TouchableOpacity onPress={() => refetch()} hitSlop={8} style={{ marginTop: normalize(6) }}>
          <Text className="tracking-tight font-semibold" style={{ fontSize: FONT_SM, color: BRAND }}>
            다시 시도
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 컬렉션 목록조차 안 왔을 때는 카드 자리가 비어 높이가 0이 된다 — 로딩이 끝나는 순간
  // 카드가 생기며 아래 섹션이 밀린다. 빈 카드와 같은 높이로 자리를 먼저 잡는다.
  if (isLoading && groups.length === 0) {
    return (
      <View className="mb-10" style={{ paddingHorizontal: GRID_PADDING }}>
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
          }}
        >
          <ActivityIndicator color={BRAND} size="small" />
        </View>
      </View>
    );
  }

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
          {/* 알약 버튼이 아니라 텍스트 링크 — 빈 카드 안에서 버튼은 무게가 과하다. hitSlop으로 터치 영역만 확보한다. */}
          <TouchableOpacity onPress={() => navigation.navigate('MapTab' as never)} hitSlop={12}>
            <Text
              className="font-semibold tracking-tight"
              style={{ fontSize: FONT_SM, color: BRAND, textDecorationLine: 'underline', textDecorationColor: BRAND }}
            >
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
      <Text className="font-semibold tracking-tight text-black" style={{ fontSize: FONT_TITLE }}>
        즐겨찾기 스팟
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
