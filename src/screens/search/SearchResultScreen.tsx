import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
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
} from '@tabler/icons-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/stacks/HomeStack';
import type { RootStackParamList } from '@/navigation';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import Skeleton from '@/components/common/Skeleton';
import { useSpots } from '@/hooks/useSpot';
import { mapPopularSpot } from '@/utils/spotMappers';
import { FONT_MD, FONT_SM, GRID_PADDING, HAIRLINE_WIDTH, SPACING_LG, SPACING_MD } from '@/constants/layout';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<HomeStackParamList, 'SearchResult'>;

// TODO: API 연동 시 GET /search?q= 로 교체
const MOCK_RESULTS = [
  { id: '1', name: '광안리 해수욕장', addr: '부산 수영구 · 2.1km', score: 92, tags: ['야경', '바다'] },
  { id: '2', name: '광안대교 전망대', addr: '부산 수영구 · 2.4km', score: 88, tags: ['야경', '도심'] },
  { id: '3', name: '민락수변공원', addr: '부산 수영구 · 1.8km', score: 85, tags: ['일출', '공원'] },
  { id: '4', name: '해운대 해수욕장', addr: '부산 해운대구 · 5.3km', score: 90, tags: ['바다', '일출'] },
  { id: '5', name: '황령산 전망대', addr: '부산 남구 · 6.1km', score: 87, tags: ['야경', '산'] },
];

const RECENT_INIT = ['광안리 해수욕장', '부산 야경', '제주 성산일출봉'];

const POPULAR = [
  { rank: 1, text: '광안리 해수욕장', badge: '▲ 2', badgeType: 'up' as const },
  { rank: 2, text: '제주 오름', badge: '▲ 1', badgeType: 'up' as const },
  { rank: 3, text: '경복궁 야경', badge: 'NEW', badgeType: 'new' as const },
  { rank: 4, text: '순천만 갈대밭', badge: '▼ 1', badgeType: 'down' as const },
  { rank: 5, text: '해운대 블루라인', badge: '▲ 3', badgeType: 'up' as const },
];

const BADGE_COLOR = { up: '#34c759', down: 'rgba(0,0,0,0.25)', new: BRAND } as const;

// 결과 행에 필요한 최소 정보. 검색(목업)과 인기순(실 API) 두 소스가 같은 행을 그린다.
interface ResultRow {
  id: string;
  name: string;
  addr: string;
  /** 포토제닉 지수. 인기순 목록에는 그리지 않는다 — 고정 컬럼 값이라 상세의 실시간 점수와 어긋난다. */
  score?: number;
  tags: string[];
}

const POPULAR_LIST_SIZE = 50;

export default function SearchResultScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(route.params?.query ?? '');
  const [submitted, setSubmitted] = useState(!!route.params?.query);
  const [recent, setRecent] = useState(RECENT_INIT);

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
      (popularData?.content ?? []).map(mapPopularSpot).map((s) => ({
        id: s.id,
        name: s.name,
        addr: s.location,
        tags: s.category ? [s.category] : [],
      })),
    [popularData?.content],
  );

  // 동일 인스턴스 재방문 시 새 query 파라미터를 상태에 동기화
  useEffect(() => {
    const q = route.params?.query ?? '';
    setQuery(q);
    setSubmitted(!!q);
  }, [route.params?.query]);

  function submit(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSubmitted(true);
    if (!recent.includes(trimmed)) {
      setRecent((prev) => [trimmed, ...prev]);
    }
    Keyboard.dismiss();
  }

  function removeRecent(item: string) {
    setRecent((prev) => prev.filter((v) => v !== item));
  }

  function backToFocus() {
    setSubmitted(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const results: ResultRow[] = popularMode
    ? popularRows
    : submitted
      ? MOCK_RESULTS.filter((r) => r.name.includes(query) || r.tags.some((t) => t.includes(query)))
      : [];

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
                  <Pressable onPress={() => setRecent([])} hitSlop={8}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)' }}>
                      전체 삭제
                    </Text>
                  </Pressable>
                </View>
                {recent.length === 0 ? (
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: 'rgba(0,0,0,0.3)', paddingVertical: SPACING_MD }}>
                    최근 검색어가 없어요
                  </Text>
                ) : (
                  recent.map((item) => (
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
                      <Pressable onPress={() => removeRecent(item)} hitSlop={8}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GRID_PADDING, paddingVertical: normalize(14) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: TEXT_SUB }}>
              스팟 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>{results.length}</Text>개
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

          {popularMode && isPopularLoading ? (
            <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14), gap: normalize(14) }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} width="100%" height={normalize(80)} borderRadius={normalize(12)} />
              ))}
            </View>
          ) : popularMode && isPopularError && popularRows.length === 0 ? (
            // 실패를 "아직 인기 스팟이 없어요"로 그리면 서버에 데이터가 없는 것처럼 읽힌다.
            // 홈 캐러셀·북마크 목록과 같은 인라인 에러 + 다시 시도.
            <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: TEXT_SUB }}>
                인기 스팟을 불러오지 못했어요.
              </Text>
              <Pressable onPress={() => refetchPopular()} hitSlop={8} style={{ marginTop: normalize(6) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: BRAND }}>
                  다시 시도
                </Text>
              </Pressable>
            </View>
          ) : results.length === 0 ? (
            // paddingBottom을 두지 않는다 — 탭바가 빠진 영역 안에서 그냥 가운데 정렬하면 된다.
            // 탭바 높이를 더하면 빈 상태가 위로 치우쳐 보인다.
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: normalize(12) }}>
              <IconSearch size={normalize(48)} color="rgba(0,0,0,0.12)" strokeWidth={1} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: 'rgba(0,0,0,0.5)' }}>
                {popularMode ? '아직 인기 스팟이 없어요' : '검색 결과가 없어요'}
              </Text>
              {!popularMode && (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: 'rgba(0,0,0,0.3)', textAlign: 'center', lineHeight: FONT_MD * 1.5 }}>
                  {'다른 키워드로 검색하거나\n철자를 확인해보세요'}
                </Text>
              )}
            </View>
          ) : (
            <FlatList
              data={results}
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
                  <View style={{ width: normalize(80), height: normalize(80), borderRadius: normalize(12), backgroundColor: CARD, flexShrink: 0 }} />
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
