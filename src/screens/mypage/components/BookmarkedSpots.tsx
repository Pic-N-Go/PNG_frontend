import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, EMPTY_CARD_HEIGHT, FONT_SM, GRID_PADDING } from '@/constants/layout';
import { useBookmarkedSpots } from '@/hooks/useSpot';
import { mapPopularSpot } from '@/utils/spotMappers';
import { BRAND, CARD } from '@/constants/colors';
import BookmarkSheet from '@/components/spot/BookmarkSheet';
import BookmarkedSpotRow from './BookmarkedSpotRow';

/** MY 탭에 미리 보여줄 개수. 나머지는 "전체보기"에서 본다. */
const PREVIEW_COUNT = 3;

export default function BookmarkedSpots() {
  const navigation = useNavigation();
  const { data, isLoading } = useBookmarkedSpots();
  const [sheetSpotId, setSheetSpotId] = React.useState<string | null>(null);

  const spots = React.useMemo(() => (data ?? []).map(mapPopularSpot), [data]);

  // 로딩 중에는 빈 상태를 먼저 그리지 않는다 — 저장한 게 있는데도 "없어요"가 스쳐 보인다.
  if (!isLoading && spots.length === 0) {
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
            {'가고 싶은 스팟을 저장해 두면\n여기서 모아 볼 수 있어요'}
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
        <SectionTitle count={spots.length} />
        {spots.length > PREVIEW_COUNT && (
          <TouchableOpacity onPress={() => navigation.navigate('BookmarkedSpotList' as never)}>
            <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: BRAND }}>
              전체보기
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ paddingHorizontal: GRID_PADDING, gap: normalize(8) }}>
        {spots.slice(0, PREVIEW_COUNT).map((spot) => (
          <BookmarkedSpotRow
            key={spot.id}
            item={spot}
            onBookmarkPress={() => setSheetSpotId(spot.id)}
          />
        ))}
      </View>

      {/* 행마다 두면 3개가 마운트된다. 섹션에 하나만 두고 대상 스팟만 바꾼다(홈 캐러셀과 같은 방식).
          해제하면 useSyncSpotBookmarks가 ['spots'] 캐시를 지워 목록에서 알아서 빠진다. */}
      {sheetSpotId && (
        <BookmarkSheet
          visible
          spotId={sheetSpotId}
          onClose={() => setSheetSpotId(null)}
          onSaved={() => setSheetSpotId(null)}
        />
      )}
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
