import React from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_LG, FONT_MD, GRID_PADDING, SPACING_LG } from '@/constants/layout';
import { TEXT_SUB } from '@/constants/colors';
import Chip from '@/components/common/Chip';
import Skeleton from '@/components/common/Skeleton';
import BookmarkSheet from '@/components/spot/BookmarkSheet';
import { useBookmarkedSpots, useCollectionSpots, useMyBookmarkCollections } from '@/hooks/useSpot';
import { mapPopularSpot } from '@/utils/spotMappers';
import BookmarkedSpotRow from './components/BookmarkedSpotRow';

type Props = NativeStackScreenProps<MyPageStackParamList, 'BookmarkedSpotList'>;

const ROW_HEIGHT = normalize(88);

export default function BookmarkedSpotListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [sheetSpotId, setSheetSpotId] = React.useState<string | null>(null);
  /** null = "전체" 탭. 컬렉션을 고르면 그 컬렉션만 조회한다. */
  const [collectionId, setCollectionId] = React.useState<number | null>(null);

  const { data: collections = [] } = useMyBookmarkCollections();

  // 두 쿼리 중 선택된 쪽만 활성이다 — enabled로 갈리므로 동시에 요청하지 않는다.
  const all = useBookmarkedSpots({ enabled: collectionId === null });
  const one = useCollectionSpots(collectionId);
  const { data, isLoading, isError, refetch } = collectionId === null ? all : one;

  const spots = React.useMemo(() => (data ?? []).map(mapPopularSpot), [data]);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* PIC MAP(PhotoMapScreen) 헤더와 같은 배치 — 제목 중앙, 좌우 36 대칭, 행 높이 54.
          크기는 18px 대신 FONT_LG(17px)다. 8단계 스케일에 18이 없고 1px 차이는 보이지 않는다. */}
      <View
        className="flex-row items-center justify-between"
        style={{
          marginTop: insets.top,
          height: normalize(54),
          paddingHorizontal: normalize(20),
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityLabel="뒤로"
          className="items-center justify-center"
          style={{ width: normalize(36), height: normalize(36), marginLeft: -normalize(8) }}
        >
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.65)" />
        </Pressable>
        <Text
          allowFontScaling={false}
          className="font-semibold text-black"
          style={{ fontSize: FONT_LG, letterSpacing: -0.3 }}
        >
          북마크한 스팟
        </Text>
        <View style={{ width: normalize(36) }} />
      </View>

      {/* 컬렉션 필터 — 홈 CategoryFilter와 같은 공용 Chip을 쓴다.
          활성색은 블랙: 같은 화면 안에서 목록만 거르는 중립 컨트롤이다.
          컬렉션이 하나뿐이면 고를 게 없어 그리지 않는다(기본 "내 즐겨찾기"만 있는 상태). */}
      {collections.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: GRID_PADDING,
            // 목록의 paddingTop(8)과 합쳐서 12가 된다 — 여기서 12를 더 주면 칩이 떠 보인다.
            paddingBottom: normalize(4),
            gap: normalize(6),
            // 가로 ScrollView의 자식은 기본으로 높이가 늘어난다 — 안 잡으면 칩이 세로로 길어진다.
            alignItems: 'center',
          }}
        >
          <Chip
            label="전체"
            selected={collectionId === null}
            onPress={() => setCollectionId(null)}
            height={normalize(34)}
            paddingHorizontal={normalize(16)}
          />
          {collections.map((c) => (
            <Chip
              key={c.id}
              label={`${c.name} ${c.spotCount}`}
              selected={collectionId === c.id}
              onPress={() => setCollectionId(c.id)}
              height={normalize(34)}
              paddingHorizontal={normalize(16)}
            />
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), gap: normalize(8) }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height={ROW_HEIGHT} borderRadius={CARD_RADIUS} />
          ))}
        </View>
      ) : isError && spots.length === 0 ? (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14) }}>
          <Text allowFontScaling={false} className="font-normal" style={{ fontSize: FONT_MD, color: TEXT_SUB }}>
            북마크를 불러오지 못했어요.
          </Text>
          <Pressable onPress={() => refetch()} hitSlop={8} style={{ marginTop: normalize(6) }}>
            <Text allowFontScaling={false} className="font-semibold text-brand" style={{ fontSize: FONT_MD }}>
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={spots}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: GRID_PADDING,
            paddingTop: normalize(8),
            paddingBottom: SPACING_LG,
            gap: normalize(8),
          }}
          renderItem={({ item }) => (
            <BookmarkedSpotRow item={item} onBookmarkPress={() => setSheetSpotId(item.id)} />
          )}
          ListEmptyComponent={
            <Text
              allowFontScaling={false}
              className="font-normal"
              style={{ fontSize: normalizeFontSize(14), color: TEXT_SUB, paddingTop: normalize(14) }}
            >
              {collectionId === null ? '저장한 스팟이 없어요.' : '이 컬렉션에 담은 스팟이 없어요.'}
            </Text>
          }
        />
      )}

      {/* 목록 전체가 아니라 화면에 하나만 마운트한다 (MY 탭 섹션과 같은 방식). */}
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
