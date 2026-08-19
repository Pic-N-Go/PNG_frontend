import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSearch, IconX, IconClock, IconMapPin, IconChevronRight, IconChevronLeft } from '@tabler/icons-react-native';
import { useSearchStore } from '@/store/useSearchStore';
import { useSpots, useSearchSpots } from '@/hooks/useSpot';
import { useDebounce } from '@/hooks/useDebounce';
import { Spot } from '@/store/useCourseStore';
import { SpotResponse } from '@/types/spot';
import { normalize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, GRID_PADDING } from '@/constants/layout';
import Chip from '@/components/common/Chip';

export type SearchCategory = 'all' | 'post' | 'photo' | 'spot' | 'user';

export interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  defaultCategory?: SearchCategory;
  onSelectSpot?: (spot: Spot) => void;
  onSelectKeyword?: (keyword: string) => void;
  placeholder?: string;
}

const BRAND = '#E31B59';

const POPULAR_KEYWORDS = [
  '골든아워',
  '벚꽃 명소',
  '야경',
  '스냅사진',
  '해변',
  '경복궁',
];

const CATEGORIES: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'spot', label: '스팟' },
];

export default function SearchModal({
  visible,
  onClose,
  defaultCategory = 'spot',
  onSelectSpot,
  onSelectKeyword,
  placeholder = '스팟 검색',
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>(defaultCategory);

  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useSearchStore();

  // 추천 스팟 목록 (포토제닉 점수 순) - 모달이 열려있을 때만 가져온다.
  const { data: recSpotsData, isLoading: isRecLoading } = useSpots(
    { sort: 'score' },
    { enabled: visible }
  );
  const recSpots: SpotResponse[] = React.useMemo(
    () => recSpotsData?.content || [],
    [recSpotsData?.content]
  );

  const debouncedQuery = useDebounce(query, 500);

  // 실시간 스팟 검색 결과 (500ms 디바운스 적용)
  const { data: searchResultsData, isLoading: isSearchLoading } = useSearchSpots({ keyword: debouncedQuery });
  const apiResults: SpotResponse[] = React.useMemo(
    () => searchResultsData?.content || [],
    [searchResultsData?.content]
  );

  const searchResults = React.useMemo(() => {
    if (!query.trim()) return [];
    if (apiResults.length > 0) return apiResults;

    const q = query.trim().toLowerCase();
    const filteredRec = recSpots.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.categories?.some((c) => c.toLowerCase().includes(q))
    );
    if (filteredRec.length > 0) return filteredRec;

    return [];
  }, [query, apiResults, recSpots]);

  useEffect(() => {
    if (visible) {
      setSelectedCategory(defaultCategory);
    } else {
      setQuery('');
    }
  }, [visible, defaultCategory]);

  const handleSearchSubmit = (targetQuery?: string) => {
    const searchQuery = targetQuery ?? query;
    if (!searchQuery.trim()) return;
    addRecentSearch(searchQuery.trim());
    Keyboard.dismiss();
    onSelectKeyword?.(searchQuery.trim());
  };

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
      onSelectSpot?.(courseSpot);
      onClose();
    },
    [addRecentSearch, onSelectSpot, onClose]
  );

  const isQueryEmpty = query.trim().length === 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
        {/* ── 1. 헤더 (뒤로가기/취소 버튼 + 검색 입력창) ── */}
        <View
          className="flex-row items-center border-b border-black/5 bg-white"
          style={{ paddingHorizontal: GRID_PADDING, paddingVertical: normalize(10), gap: normalize(10) }}
        >
          <TouchableOpacity onPress={onClose} hitSlop={8} style={{ paddingRight: normalize(2) }}>
            <IconChevronLeft size={normalize(24)} color="#111" strokeWidth={2} />
          </TouchableOpacity>

          <View
            className="flex-1 flex-row items-center bg-[#f5f5f7]"
            style={{
              height: normalize(44),
              borderRadius: normalize(22),
              paddingHorizontal: normalize(14),
            }}
          >
            <IconSearch size={normalize(18)} color="rgba(0,0,0,0.35)" strokeWidth={1.75} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={placeholder}
              placeholderTextColor="rgba(0,0,0,0.35)"
              allowFontScaling={false}
              returnKeyType="search"
              onSubmitEditing={() => handleSearchSubmit()}
              autoFocus={visible}
              style={{
                flex: 1,
                marginLeft: normalize(8),
                fontSize: FONT_MD,
                color: '#111',
                paddingVertical: 0,
              }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <View
                  className="items-center justify-center rounded-full bg-black/15"
                  style={{ width: normalize(18), height: normalize(18) }}
                >
                  <IconX size={normalize(12)} color="#fff" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── 2. 카테고리 탭 칩 ── */}
        <View style={{ paddingVertical: normalize(12) }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: GRID_PADDING, gap: normalize(8) }}
          >
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.label}
                selected={selectedCategory === cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                height={normalize(34)}
                paddingHorizontal={normalize(16)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── 3. 메인 콘텐츠 ── */}
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: normalize(30) }}
        >
          {isQueryEmpty ? (
            /* ── 검색어 입력 전 (기본 뷰) ── */
            <View>
              {/* 최근 검색어 */}
              {recentSearches.length > 0 && (
                <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(16) }}>
                  <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(8) }}>
                    <Text className="font-semibold text-black/70" style={{ fontSize: FONT_SM }}>
                      최근 검색
                    </Text>
                    <TouchableOpacity onPress={clearRecentSearches} hitSlop={8}>
                      <Text className="font-medium text-black/40" style={{ fontSize: FONT_XS }}>
                        모두 지우기
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ gap: normalize(12) }}>
                    {recentSearches.map((item, index) => (
                      <View key={index} className="flex-row items-center justify-between">
                        <TouchableOpacity
                          className="flex-1 flex-row items-center"
                          style={{ gap: normalize(10) }}
                          onPress={() => {
                            setQuery(item);
                            handleSearchSubmit(item);
                          }}
                        >
                          <IconClock size={normalize(16)} color="rgba(0,0,0,0.35)" strokeWidth={1.75} />
                          <Text className="font-medium text-black/85 flex-1" style={{ fontSize: FONT_MD }}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeRecentSearch(item)} hitSlop={8}>
                          <IconX size={normalize(14)} color="rgba(0,0,0,0.25)" strokeWidth={1.75} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 인기 검색어 */}
              <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(20) }}>
                <Text className="font-semibold text-black/70" style={{ fontSize: FONT_SM, marginBottom: normalize(12) }}>
                  인기 검색어
                </Text>
                <View className="flex-row flex-wrap" style={{ gap: normalize(8) }}>
                  {POPULAR_KEYWORDS.map((keyword, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setQuery(keyword);
                        handleSearchSubmit(keyword);
                      }}
                      className="flex-row items-center bg-[#f5f5f7]"
                      style={{
                        paddingHorizontal: normalize(14),
                        paddingVertical: normalize(8),
                        borderRadius: normalize(12),
                        gap: normalize(6),
                      }}
                    >
                      <Text className="font-bold" style={{ fontSize: FONT_SM, color: idx < 3 ? BRAND : 'rgba(0,0,0,0.5)' }}>
                        {idx + 1}
                      </Text>
                      <Text className="font-medium text-black/80" style={{ fontSize: FONT_SM }}>
                        {keyword}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 추천 스팟 (가로 카드 뷰) */}
              <View style={{ paddingTop: normalize(8) }}>
                <View className="flex-row items-center justify-between" style={{ paddingHorizontal: GRID_PADDING, marginBottom: normalize(12) }}>
                  <Text className="font-semibold text-black/70" style={{ fontSize: FONT_SM }}>
                    추천 스팟
                  </Text>
                </View>

                {isRecLoading ? (
                  <View style={{ paddingVertical: normalize(20) }}>
                    <ActivityIndicator size="small" color={BRAND} />
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: GRID_PADDING, gap: normalize(12) }}
                  >
                    {recSpots.slice(0, 8).map((spot) => (
                      <TouchableOpacity
                        key={spot.id}
                        onPress={() => handleSelectSpot(spot)}
                        style={{ width: normalize(160) }}
                      >
                        <View
                          className="overflow-hidden bg-[#e5e5ea]"
                          style={{
                            width: normalize(160),
                            height: normalize(110),
                            borderRadius: normalize(14),
                          }}
                        >
                          {spot.thumbnailUrl || spot.imageUrl ? (
                            <Image
                              source={{ uri: spot.thumbnailUrl || spot.imageUrl || '' }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-full h-full items-center justify-center bg-gray-200">
                              <IconMapPin size={normalize(24)} color="rgba(0,0,0,0.3)" />
                            </View>
                          )}
                        </View>
                        <Text
                          className="font-bold text-black tracking-tight"
                          numberOfLines={1}
                          style={{ fontSize: FONT_MD, marginTop: normalize(8) }}
                        >
                          {spot.name}
                        </Text>
                        <Text
                          className="font-medium text-black/40"
                          numberOfLines={1}
                          style={{ fontSize: FONT_XS, marginTop: normalize(2) }}
                        >
                          {spot.address || spot.categories?.[0] || '포토 스팟'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          ) : (
            /* ── 검색어 입력 후 (검색 결과 목록) ── */
            <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8) }}>
              <Text className="font-semibold text-black/70" style={{ fontSize: FONT_SM, marginBottom: normalize(12) }}>
                검색 결과 ({searchResults.length})
              </Text>

              {isSearchLoading ? (
                <View style={{ paddingVertical: normalize(40) }}>
                  <ActivityIndicator size="small" color={BRAND} />
                </View>
              ) : searchResults.length === 0 ? (
                <View className="items-center justify-center" style={{ paddingVertical: normalize(60) }}>
                  <Text className="font-medium text-black/40" style={{ fontSize: FONT_MD }}>
                    검색 결과가 없어요.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: normalize(12) }}>
                  {searchResults.map((spot) => (
                    <TouchableOpacity
                      key={spot.id}
                      onPress={() => handleSelectSpot(spot)}
                      className="flex-row items-center bg-[#f8f9fa] border border-black/5"
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
                            <IconMapPin size={normalize(20)} color="rgba(0,0,0,0.3)" />
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
                        {/* 포토제닉 점수 대신 평점 — 고정 컬럼이라 상세의 실시간 지수와 어긋난다.
                            정렬(sort: 'score')은 그대로 두고 표기만 바꾼다. */}
                        {spot.reviewAverage != null && (
                          <Text className="font-medium" style={{ fontSize: FONT_XS, color: BRAND, marginTop: normalize(4) }}>
                            ★ {spot.reviewAverage.toFixed(1)} · 리뷰 {spot.reviewCount ?? 0}
                          </Text>
                        )}
                      </View>

                      <IconChevronRight size={normalize(16)} color="rgba(0,0,0,0.25)" strokeWidth={1.75} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
