import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  IconChevronLeft,
  IconSearch,
  IconX,
  IconChevronDown,
  IconMapPin,
} from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/stacks/HomeStack';
import type { RootStackParamList } from '@/navigation';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import Skeleton from '@/components/common/Skeleton';
import { useSpots, useSearchSpots } from '@/hooks/useSpot';
import { useSearchStore } from '@/store/useSearchStore';
import { mapPopularSpot } from '@/utils/spotMappers';
import { CATEGORY_CODES, SPOT_CATEGORY_MAP, CODE_BY_LABEL } from '@/constants/spotCategories';
import { Sparkles } from 'lucide-react-native';
import Chip from '@/components/common/Chip';
import { FONT_LG, FONT_MD, FONT_SM, GRID_PADDING, HAIRLINE_WIDTH, SPACING_LG, SPACING_MD } from '@/constants/layout';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<HomeStackParamList, 'SearchResult'>;

const CATEGORIES = [
  { id: 'all', label: '전체', icon: Sparkles },
  ...CATEGORY_CODES.map((code) => ({
    id: SPOT_CATEGORY_MAP[code].label,
    label: SPOT_CATEGORY_MAP[code].label,
    icon: SPOT_CATEGORY_MAP[code].Icon,
  })),
];

const POPULAR = [
  { rank: 1, text: '광안리 해수욕장', badge: '▲ 2', badgeType: 'up' as const },
  { rank: 2, text: '제주 오름', badge: '▲ 1', badgeType: 'up' as const },
  { rank: 3, text: '경복궁 야경', badge: 'NEW', badgeType: 'new' as const },
  { rank: 4, text: '순천만 갈대밭', badge: '▼ 1', badgeType: 'down' as const },
  { rank: 5, text: '해운대 블루라인', badge: '▲ 3', badgeType: 'up' as const },
];

const BADGE_COLOR = { up: '#34c759', down: 'rgba(0,0,0,0.25)', new: BRAND } as const;

// 결과 행에 필요한 최소 정보. 검색과 인기순 두 소스가 같은 행을 그린다.
interface ResultRow {
  id: string;
  name: string;
  addr: string;
  /** 포토제닉 지수. */
  score?: number;
  tags: string[];
  categories?: string[];
  imageUrl?: string | null;
}

const POPULAR_LIST_SIZE = 50;

export default function SearchResultScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(route.params?.query ?? '');
  const [submitted, setSubmitted] = useState(!!route.params?.query);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } = useSearchStore();

  // 홈 "모두 보기"로 들어온 인기순 전체 목록 모드. 검색어를 입력하면 평소 검색으로 넘어간다.
  const popularMode = route.params?.sort === 'popular' && !submitted;
  const {
    data: popularData,
    isLoading: isPopularLoading,
    isError: isPopularError,
    refetch: refetchPopular,
  } = useSpots({ sort: 'popular', size: POPULAR_LIST_SIZE }, { enabled: popularMode });

  const popularRows: ResultRow[] = React.useMemo(
    () =>
      (popularData?.content ?? []).map((s) => {
        const mapped = mapPopularSpot(s);
        return {
          id: mapped.id,
          name: mapped.name,
          addr: mapped.location,
          score: s.photogenicScore !== undefined ? Math.round(s.photogenicScore) : undefined,
          tags: mapped.category ? [mapped.category] : [],
          categories: s.categories ?? [],
          imageUrl: mapped.imageUrl,
        };
      }),
    [popularData?.content],
  );

  // 실시간 스팟 검색 (GET /spots/search?keyword=...&category=...)
  const selectedCategoryCode =
    selectedCategory !== 'all' && selectedCategory !== '전체'
      ? CODE_BY_LABEL[selectedCategory] || selectedCategory
      : undefined;

  const searchEnabled = submitted && !popularMode && query.trim().length > 0;
  const {
    data: searchData,
    isLoading: isSearchLoading,
    isError: isSearchError,
    refetch: refetchSearch,
  } = useSearchSpots(
    { keyword: query.trim(), category: selectedCategoryCode },
    { enabled: searchEnabled }
  );

  const searchRows: ResultRow[] = React.useMemo(
    () =>
      (searchData?.content ?? []).map((s) => {
        const mapped = mapPopularSpot(s);
        return {
          id: mapped.id,
          name: mapped.name,
          addr: mapped.location,
          score: s.photogenicScore !== undefined ? Math.round(s.photogenicScore) : undefined,
          tags: mapped.category ? [mapped.category] : [],
          categories: s.categories ?? [],
          imageUrl: mapped.imageUrl,
        };
      }),
    [searchData?.content],
  );

  // 동일 인스턴스 재방문 시 새 query 파라미터를 상태에 동기화
  useEffect(() => {
    const q = route.params?.query ?? '';
    setQuery(q);
    setSubmitted(!!q);
    setSelectedCategory('all');
  }, [route.params?.query]);

  function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSubmitted(true);
    setSelectedCategory('all');
    addRecentSearch(trimmed);
    Keyboard.dismiss();
  }

  function backToFocus() {
    setSubmitted(false);
    setSelectedCategory('all');
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const results: ResultRow[] = React.useMemo(() => {
    return popularMode ? popularRows : submitted ? searchRows : [];
  }, [popularMode, popularRows, submitted, searchRows]);
  const isLoading = popularMode ? isPopularLoading : isSearchLoading;
  const isError = popularMode ? isPopularError : isSearchError;
  const refetch = popularMode ? refetchPopular : refetchSearch;

  // 카테고리 필터링 적용된 최종 결과
  const filteredResults = React.useMemo(() => {
    if (selectedCategory === 'all' || selectedCategory === '전체') {
      return results;
    }
    if (!popularMode && submitted) {
      // 서버에서 이미 category 파라미터로 필터링되어 반환됨
      return searchRows;
    }
    const targetEnum = selectedCategoryCode || selectedCategory;
    return results.filter((item) => {
      const matchEnum = item.categories?.includes(targetEnum);
      const matchTag = item.tags.some(
        (t) => t === selectedCategory || t === targetEnum || t.includes(selectedCategory),
      );
      return matchEnum || matchTag;
    });
  }, [results, selectedCategory, popularMode, submitted, searchRows, selectedCategoryCode]);

  const resultCount = popularMode
    ? filteredResults.length
    : (searchData?.totalElements ?? filteredResults.length);

  // 인기순 모드에서도 결과 패널을 쓴다(포커스 패널의 최근·인기 검색어는 감춘다).
  const showResults = submitted || popularMode;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 검색 입력 행 */}
      <View
        style={{
          paddingTop: insets.top + normalize(12),
          paddingBottom: normalize(10),
          paddingHorizontal: normalize(16),
          flexDirection: 'row',
          alignItems: 'center',
          gap: normalize(10),
        }}
      >
        <Pressable onPress={submitted ? backToFocus : () => navigation.goBack()} hitSlop={8}>
          <IconChevronLeft size={normalize(18)} color="rgba(0,0,0,0.5)" strokeWidth={1.5} />
        </Pressable>

        <View
          style={{
            flex: 1,
            height: normalize(42),
            backgroundColor: CARD,
            borderRadius: normalize(12),
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: normalize(14),
            gap: normalize(8),
          }}
        >
          <IconSearch size={normalize(15)} color="rgba(0,0,0,0.28)" strokeWidth={1.5} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="장소, 테마, 키워드 검색"
            placeholderTextColor="rgba(0,0,0,0.3)"
            autoFocus={!submitted && route.params?.sort !== 'popular'}
            returnKeyType="search"
            onSubmitEditing={() => submit(query)}
            style={{
              flex: 1,
              fontFamily: 'Pretendard-Regular',
              fontSize: FONT_MD,
              color: '#000',
              letterSpacing: -0.2,
            }}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => { setQuery(''); setSubmitted(false); setTimeout(() => inputRef.current?.focus(), 50); }}
              hitSlop={8}
              style={{
                width: normalize(18),
                height: normalize(18),
                borderRadius: normalize(9),
                backgroundColor: 'rgba(0,0,0,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconX size={normalize(8)} color="#fff" strokeWidth={1.5} />
            </Pressable>
          )}
        </View>

        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: 'rgba(0,0,0,0.45)' }}
          >
            취소
          </Text>
        </Pressable>
      </View>

      <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

      {/* 포커스 패널 */}
      {!showResults && (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          // 탭바 높이·인셋을 더하지 않는다 — 화면 영역에서 이미 빠져 있다(HomeScreen 주석 참고).
          contentContainerStyle={{ paddingBottom: SPACING_LG }}
        >
          <>
              {/* 최근 검색어 */}
              <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(18) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(12) }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', letterSpacing: 0.1 }}>
                    최근 검색어
                  </Text>
                  <Pressable onPress={clearRecentSearches} hitSlop={8}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)' }}>
                      전체 삭제
                    </Text>
                  </Pressable>
                </View>
                {recentSearches.length === 0 ? (
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: 'rgba(0,0,0,0.3)', paddingVertical: SPACING_MD }}>
                    최근 검색어가 없어요
                  </Text>
                ) : (
                  recentSearches.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => submit(item)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: normalize(11), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
                        <IconSearch size={normalize(14)} color="rgba(0,0,0,0.2)" strokeWidth={1.5} />
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
                          {item}
                        </Text>
                      </View>
                      <Pressable onPress={() => removeRecentSearch(item)} hitSlop={8}>
                        <IconX size={normalize(10)} color="rgba(0,0,0,0.2)" strokeWidth={1.5} />
                      </Pressable>
                    </Pressable>
                  ))
                )}
              </View>

              {/* 인기 검색어 */}
              <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(26) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', letterSpacing: 0.1, marginBottom: normalize(12) }}>
                  인기 검색어
                </Text>
                {POPULAR.map((item) => (
                  <Pressable
                    key={item.rank}
                    onPress={() => submit(item.text)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), paddingVertical: normalize(11), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: FONT_MD,
                        color: item.rank <= 2 ? '#000' : BRAND,
                        width: normalize(18),
                        textAlign: 'center',
                      }}
                    >
                      {item.rank}
                    </Text>
                    <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
                      {item.text}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: item.badgeType === 'new' ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                        fontSize: FONT_SM,
                        color: BADGE_COLOR[item.badgeType],
                        backgroundColor: item.badgeType === 'new' ? BRAND_TINT : 'transparent',
                        paddingHorizontal: item.badgeType === 'new' ? normalize(7) : 0,
                        paddingVertical: item.badgeType === 'new' ? normalize(2) : 0,
                        borderRadius: item.badgeType === 'new' ? normalize(10) : 0,
                      }}
                    >
                      {item.badge}
                    </Text>
                  </Pressable>
                ))}
              </View>
          </>
        </ScrollView>
      )}

      {/* 결과 패널 */}
      {showResults && (
        <>
          {/* 1-Depth 카테고리 스마트 가로 칩 필터 */}
          <View style={{ backgroundColor: '#fff', paddingVertical: normalize(10), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: GRID_PADDING, gap: normalize(8) }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const IconComp = cat.icon;
                const iconColor = isSelected ? '#ffffff' : '#4b5563';
                return (
                  <Chip
                    key={cat.id}
                    label={cat.label}
                    selected={isSelected}
                    onPress={() => setSelectedCategory(cat.id)}
                    variant="brand"
                    icon={IconComp ? <IconComp size={normalize(13)} color={iconColor} strokeWidth={2} /> : undefined}
                    height={normalize(32)}
                  />
                );
              })}
            </ScrollView>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GRID_PADDING, paddingVertical: normalize(14) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: TEXT_SUB }}>
              스팟 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>{resultCount}</Text>개
            </Text>
            {/* TODO: 정렬 기능 미구현 — 정렬 옵션 시트 연결 필요 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)' }}>
                {popularMode ? '인기순' : '관련순'}
              </Text>
              <IconChevronDown size={normalize(10)} color="rgba(0,0,0,0.45)" strokeWidth={1.5} />
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

          {isLoading ? (
            <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14), gap: normalize(14) }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} width="100%" height={normalize(80)} borderRadius={normalize(12)} />
              ))}
            </View>
          ) : isError && filteredResults.length === 0 ? (
            <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: TEXT_SUB }}>
                {popularMode ? '인기 스팟을 불러오지 못했어요.' : '스팟 검색 결과를 불러오지 못했어요.'}
              </Text>
              <Pressable onPress={() => refetch()} hitSlop={8} style={{ marginTop: normalize(6) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: BRAND }}>
                  다시 시도
                </Text>
              </Pressable>
            </View>
          ) : filteredResults.length === 0 ? (
            // paddingBottom을 두지 않는다 — 탭바가 빠진 영역 안에서 그냥 가운데 정렬하면 된다.
            // 탭바 높이를 더하면 빈 상태가 위로 치우쳐 보인다.
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: normalize(12) }}>
              <IconSearch size={normalize(48)} color="rgba(0,0,0,0.12)" strokeWidth={1} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: 'rgba(0,0,0,0.5)' }}>
                {popularMode ? '아직 인기 스팟이 없어요' : '검색 결과가 없어요'}
              </Text>
              {!popularMode && (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: 'rgba(0,0,0,0.3)', textAlign: 'center', lineHeight: FONT_MD * 1.5 }}>
                  {selectedCategory !== 'all' && selectedCategory !== '전체'
                    ? `'${selectedCategory}' 카테고리에 해당하는 스팟이 없습니다.`
                    : '다른 키워드로 검색하거나\n철자를 확인해보세요'}
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              // 탭바 높이·인셋을 더하지 않는다 — 화면 영역에서 이미 빠져 있다(HomeScreen 주석 참고).
              contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingBottom: SPACING_LG }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    const rootNavigation = navigation as unknown as NativeStackNavigationProp<RootStackParamList>;
                    rootNavigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: item.id } });
                  }}
                  style={{ flexDirection: 'row', gap: normalize(14), paddingVertical: normalize(14), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}
                >
                  <View style={{ width: normalize(80), height: normalize(80), borderRadius: normalize(12), backgroundColor: CARD, overflow: 'hidden', flexShrink: 0 }}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <IconMapPin size={normalize(24)} color="rgba(0,0,0,0.2)" />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.3, marginBottom: normalize(3) }}>
                        {item.name}
                      </Text>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: TEXT_SUB, marginBottom: normalize(8) }}>
                        {item.addr}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), flexWrap: 'wrap' }}>
                      {item.score !== undefined && (
                        <View style={{ backgroundColor: BRAND_TINT, paddingHorizontal: normalize(8), paddingVertical: normalize(2), borderRadius: normalize(8) }}>
                          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(12), color: BRAND }}>
                            {item.score}점
                          </Text>
                        </View>
                      )}
                      {item.tags.map((tag) => (
                        <View key={tag} style={{ backgroundColor: CARD, paddingHorizontal: normalize(8), paddingVertical: normalize(2), borderRadius: normalize(8) }}>
                          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: TEXT_SUB }}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </Pressable>
              )}
            />
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}
