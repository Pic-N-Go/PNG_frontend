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
import { useBookmarkCollectionsWithSpots, useBookmarkedSpots } from '@/hooks/useSpot';
import { palOf } from '@/components/spot/collectionStyle';
import { mapPopularSpot } from '@/utils/spotMappers';
import BookmarkedSpotRow from './components/BookmarkedSpotRow';

type Props = NativeStackScreenProps<MyPageStackParamList, 'BookmarkedSpotList'>;

const ROW_HEIGHT = normalize(88);

export default function BookmarkedSpotListScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const [sheetSpotId, setSheetSpotId] = React.useState<string | null>(null);
  /** null = "전체" 탭. MY 탭 컬렉션 줄에서 오면 그 컬렉션이 선택된 채로 시작한다. */
  const [collectionId, setCollectionId] = React.useState<number | null>(route.params?.collectionId ?? null);

  // 컬렉션별 스팟을 한 번에 받아 둔다 — 칩 필터와 행 우측 소속 배지가 같은 데이터를 쓴다.
  const { groups, badgesOf, distinctSpotCount, isLoading: groupsLoading, isError: groupsError } =
    useBookmarkCollectionsWithSpots();
  const collections = groups.map((g) => g.collection);

  const all = useBookmarkedSpots({ enabled: collectionId === null });

  // 컬렉션 탭은 위에서 이미 받은 목록을 고르기만 한다 — 같은 것을 또 요청하지 않는다.
  const data = collectionId === null ? all.data : groups.find((g) => g.collection.id === collectionId)?.spots;
  const isLoading = collectionId === null ? all.isLoading : groupsLoading;
  const isError = collectionId === null ? all.isError : groupsError;
  const refetch = collectionId === null ? all.refetch : () => {};

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
        // 가로 ScrollView는 flex 컬럼에서 남은 높이를 다 먹는다(그러면 칩이 화면 중앙에 뜬다).
        // View로 감싸 콘텐츠 높이로 고정한다 — MapScreen 카테고리 필터와 같은 구조.
        <View style={{ paddingBottom: normalize(4) }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: GRID_PADDING,
              gap: normalize(6),
              alignItems: 'center',
            }}
          >
            <Chip
              label={`전체 ${distinctSpotCount}`}
              selected={collectionId === null}
              onPress={() => setCollectionId(null)}
              height={normalize(34)}
              paddingHorizontal={normalize(16)}
            />
            {/* 컬렉션 색 점을 달아 어떤 컬렉션인지 배지와 같은 색으로 잇는다.
                개수는 칩에서 뺐다 — 색 점이 붙으면서 한 줄에 정보가 너무 많아진다. */}
            {collections.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={collectionId === c.id}
                onPress={() => setCollectionId(c.id)}
                showDot
                dotColor={palOf(c.color).s}
                height={normalize(34)}
                paddingHorizontal={normalize(16)}
              />
            ))}
          </ScrollView>
        </View>
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
            <BookmarkedSpotRow
              item={item}
              badges={badgesOf(item.id)}
              onBookmarkPress={() => setSheetSpotId(item.id)}
            />
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
