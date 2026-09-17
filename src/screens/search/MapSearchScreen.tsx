import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconMapPin, IconChevronRight } from '@tabler/icons-react-native';
import { useSearchStore } from '@/store/useSearchStore';
import { useSpots, useSearchSpots } from '@/hooks/useSpot';
import { useDebounce } from '@/hooks/useDebounce';
import { Spot } from '@/store/useCourseStore';
import { SpotResponse } from '@/types/spot';
import { normalize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, GRID_PADDING } from '@/constants/layout';
import { RecentSearches, RecommendedSpots, SearchField } from '@/components/common/SearchPanel';
import { BRAND, iconGray } from '@/constants/colors';


/**
 * 지도 탭 검색 화면.
 *
 * 원래 RN Modal(SearchModal)이었는데 화면으로 바꿨다 — 안드로이드에서 Modal은 별도 dialog
 * 창이라 그 안의 TextInput은 autoFocus를 줘도 키보드가 올라오지 않는다(뷰 포커스는 잡혀
 * 커서만 깜빡였다). 화면은 메인 윈도우에 살기 때문에 autoFocus가 그대로 동작한다.
 *
 * 선택 결과는 Map 화면 파라미터로 돌려준다. merge를 주는 이유는 Map이 source/planData 같은
 * 진입 파라미터를 함께 들고 있어서, 통째로 덮으면 코스 보기 모드가 풀리기 때문이다.
 *
 * MapScreen과 마찬가지로 이 화면도 MapStack·CourseStack·RootStack 세 곳에 등록돼 있다(코스
 * 만들기에서도 지도로 넘어와 검색한다). 스택마다 파라미터 목록이 달라 navigation은 느슨하게 둔다.
 */
export default function MapSearchScreen() {
  const navigation = useNavigation<any>();

  const [query, setQuery] = useState('');

  const addRecentSearch = useSearchStore((state) => state.addRecentSearch);

  // 디바운스가 끝나기 전까지 즉시 보여줄 로컬 필터용 풀 (포토제닉 점수 순)
  const { data: recSpotsData } = useSpots({ sort: 'score' });
  const recSpots: SpotResponse[] = React.useMemo(
    () => recSpotsData?.content || [],
    [recSpotsData?.content]
  );

  const debouncedQuery = useDebounce(query, 500);

  // 실시간 스팟 검색 결과 (500ms 디바운스 적용)
  const {
    data: searchResultsData,
    isLoading: isSearchLoading,
    isError: isSearchError,
    isPlaceholderData: isSearchPlaceholder,
  } = useSearchSpots({ keyword: debouncedQuery });
  const apiResults: SpotResponse[] = React.useMemo(
    () => searchResultsData?.content || [],
    [searchResultsData?.content]
  );

  const searchResults = React.useMemo(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    // 검색 API가 0건을 돌려준 것도 확정된 답이다 — 로컬 필터로 흘려보내면 서버가 없다고 한
    // 스팟이 결과처럼 뜬다. 로컬 폴백은 아직 응답이 없거나(placeholder) 요청이 실패했을 때만.
    const isDebouncedMatch = debouncedQuery.trim().toLowerCase() === trimmedQuery.toLowerCase();
    if (isDebouncedMatch && !isSearchPlaceholder && !isSearchError) return apiResults;

    const q = trimmedQuery.toLowerCase();
    return recSpots.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.categories?.some((c) => c.toLowerCase().includes(q))
    );
  }, [query, debouncedQuery, apiResults, isSearchPlaceholder, isSearchError, recSpots]);

  // 같은 값을 다시 골라도 지도 쪽 effect가 다시 돌도록 매번 새 nonce를 붙인다.
  const returnToMap = useCallback(
    (params: { searchSelectedSpot?: Spot; searchKeyword?: string }) => {
      navigation.navigate('Map', { ...params, searchNonce: Date.now() }, { merge: true });
    },
    [navigation]
  );

  const handleSelectSpot = useCallback(
    (spot: SpotResponse) => {
      addRecentSearch(spot.name);
      const courseSpot: Spot = {
        id: String(spot.id),
        name: spot.name,
        loc: spot.address || '',
        lat: spot.latitude,
        lng: spot.longitude,
        tags: spot.categories || [],
        score: spot.photogenicScore !== undefined ? spot.photogenicScore.toFixed(1) : '0.0',
        photo: spot.thumbnailUrl || spot.imageUrl || '',
      };
      returnToMap({ searchSelectedSpot: courseSpot });
    },
    [addRecentSearch, returnToMap]
  );

  const handleSearchSubmit = (targetQuery?: string) => {
    const searchQuery = (targetQuery ?? query).trim();
    if (!searchQuery) return;
    if (targetQuery) {
      setQuery(targetQuery);
    }
    addRecentSearch(searchQuery);
    Keyboard.dismiss();
  };

  const isQueryEmpty = query.trim().length === 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
      <SearchField
        value={query}
        onChangeText={setQuery}
        onSubmit={(keyword) => handleSearchSubmit(keyword)}
        onCancel={() => navigation.goBack()}
        placeholder="스팟 검색"
      />

      {/* ── 2. 메인 콘텐츠 ── */}
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: normalize(30) }}
      >
        {isQueryEmpty ? (
          /* ── 검색어 입력 전 (기본 뷰) ── */
          <View>
            <RecentSearches
              onSelect={(keyword) => {
                setQuery(keyword);
                handleSearchSubmit(keyword);
              }}
            />
            <RecommendedSpots onOpenSpot={handleSelectSpot} />
          </View>
        ) : (
          /* ── 검색어 입력 후 (검색 결과 목록) ── */
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8) }}>
            <Text className="font-semibold text-black/70" style={{ fontSize: FONT_SM, marginBottom: normalize(12) }}>
              검색 결과 ({searchResults.length})
            </Text>

            {isSearchLoading || isSearchPlaceholder ? (
              <View style={{ paddingVertical: normalize(40) }}>
                <ActivityIndicator size="small" color={BRAND} />
              </View>
            ) : searchResults.length === 0 ? (
              <View className="items-center justify-center" style={{ paddingVertical: normalize(60) }}>
                <Text className="font-medium text-sub" style={{ fontSize: FONT_MD }}>
                  검색 결과가 없어요.
                </Text>
              </View>
            ) : (
              <View style={{ gap: normalize(12) }}>
                {searchResults.map((spot) => (
                  <TouchableOpacity
                    key={spot.id}
                    onPress={() => handleSelectSpot(spot)}
                    className="flex-row items-center bg-card"
                    style={{
                      padding: normalize(12),
                      borderRadius: normalize(16),
                      gap: normalize(12),
                    }}
                  >
                    <View
                      className="overflow-hidden bg-gray-200"
                      style={{
                        width: normalize(56),
                        height: normalize(56),
                        borderRadius: normalize(12),
                      }}
                    >
                      {spot.thumbnailUrl || spot.imageUrl ? (
                        <Image source={{ uri: spot.thumbnailUrl || spot.imageUrl || '' }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-gray-200">
                          <IconMapPin size={normalize(20)} color={iconGray(0.3)} />
                        </View>
                      )}
                    </View>

                    <View className="flex-1">
                      <Text className="font-semibold text-black" numberOfLines={1} style={{ fontSize: FONT_MD }}>
                        {spot.name}
                      </Text>
                      <Text className="font-medium text-black/45" numberOfLines={1} style={{ fontSize: FONT_XS, marginTop: normalize(2) }}>
                        {spot.address || '위치 정보 없음'}
                      </Text>
                      {spot.photogenicScore !== undefined && (
                        <Text className="font-medium" style={{ fontSize: FONT_XS, color: BRAND, marginTop: normalize(4) }}>
                          ★ 포토제닉 {spot.photogenicScore.toFixed(1)}
                        </Text>
                      )}
                    </View>

                    <IconChevronRight size={normalize(16)} color={iconGray(0.25)} strokeWidth={1.75} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
