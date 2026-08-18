import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_MD, FONT_XL, GRID_PADDING, SPACING_XS } from '@/constants/layout';
import Skeleton from '@/components/common/Skeleton';
import SpotCard from '@/components/home/SpotCard';
import BookmarkSheet from '@/components/spot/BookmarkSheet';
import { useSpots } from '@/hooks/useSpot';
import { useAuthStore } from '@/store/useAuthStore';
import { mapPopularSpot } from '@/utils/spotMappers';

interface Props {
  onSpotPress?: (id: string) => void;
  onViewAll?: () => void;
}

const POPULAR_SIZE = 10;
const CARD_WIDTH = normalize(220);
// 흰 박스(28) + 그 위 여백(10)을 걷어낸 만큼 스켈레톤도 줄인다 — 안 줄이면 로딩 중에만 카드가 길다.
const CARD_HEIGHT = normalize(262);

// 캐러셀과 스켈레톤이 같은 여백을 쓰도록 한 곳에서 관리
const ROW_STYLE = {
  paddingHorizontal: GRID_PADDING,
  paddingTop: normalize(14),
  gap: normalize(12),
} as const;

export default function PopularSpotsSection({ onSpotPress, onViewAll }: Props) {
  // ponytail: 전용 GET /spots/popular 대신 기존 useSpots 재사용 — 백엔드가 두 경로 모두
  // SpotService.resolveSort()의 동일 정렬(bookmarkCount DESC, reviewCount DESC)을 탄다.
  // 주간 집계는 서버에 없다(누적 카운트). 그래서 섹션 제목도 "이번 주"가 아닌 "인기 스팟".
  // 주간 집계 API가 생기면 전용 함수로 교체 → docs/ai/specs/feature/home-popular-spots-api/
  const { data, isLoading, isError, refetch } = useSpots({ sort: 'popular', size: POPULAR_SIZE });

  const spots = React.useMemo(() => (data?.content ?? []).map(mapPopularSpot), [data?.content]);

  // 담을 컬렉션이 없는 비로그인 상태에서는 북마크 아이콘을 아예 그리지 않는다.
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const [sheetSpotId, setSheetSpotId] = React.useState<string | null>(null);

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
          인기 스팟
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

      {isLoading ? (
        <View style={{ flexDirection: 'row', ...ROW_STYLE }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={CARD_RADIUS} />
          ))}
        </View>
      ) : isError && spots.length === 0 ? (
        // 성공 후 백그라운드 refetch가 실패해도 data는 남는다(staleTime 60초라 홈 재진입 때 흔하다).
        // 그때 보이던 캐러셀을 에러 문구로 갈아치우면 있던 정보를 뺏는 셈이라, 캐시가 있으면 그대로 둔다.
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14) }}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: 'rgba(0,0,0,0.4)' }}
          >
            인기 스팟을 불러오지 못했어요.
          </Text>
          <Pressable onPress={() => refetch()} hitSlop={8} style={{ marginTop: normalize(6) }}>
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#E31B59' }}
            >
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : spots.length === 0 ? (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14) }}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: 'rgba(0,0,0,0.4)' }}
          >
            아직 인기 스팟이 없어요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={spots}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={ROW_STYLE}
          renderItem={({ item }) => (
            <SpotCard
              item={item}
              onPress={onSpotPress ? () => onSpotPress(item.id) : undefined}
              onBookmarkPress={isLoggedIn ? () => setSheetSpotId(item.id) : undefined}
            />
          )}
        />
      )}

      {/* 카드마다 두면 10개가 마운트된다. 섹션에 하나만 두고 대상 스팟만 바꾼다. */}
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
