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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/stacks/HomeStack';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_MD, FONT_SM, GRID_PADDING, SPACING_MD, TAB_BAR_HEIGHT } from '@/constants/layout';

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

const BADGE_COLOR = { up: '#34c759', down: 'rgba(0,0,0,0.25)', new: '#E31B59' } as const;

export default function SearchResultScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(route.params?.query ?? '');
  const [submitted, setSubmitted] = useState(!!route.params?.query);
  const [recent, setRecent] = useState(RECENT_INIT);

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

  const results = submitted
    ? MOCK_RESULTS.filter((r) => r.name.includes(query) || r.tags.some((t) => t.includes(query)))
    : [];

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
            backgroundColor: '#F5F5F7',
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
            autoFocus={!submitted}
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
      {!submitted && (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}
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
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: normalize(11), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' }}
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
                    style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), paddingVertical: normalize(11), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: FONT_MD,
                        color: item.rank <= 2 ? '#000' : '#E31B59',
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
                        backgroundColor: item.badgeType === 'new' ? 'rgba(227,27,89,0.08)' : 'transparent',
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
      {submitted && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GRID_PADDING, paddingVertical: normalize(14) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)' }}>
              스팟 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>{results.length}</Text>개
            </Text>
            {/* TODO: 정렬 기능 미구현 — 정렬 옵션 시트 연결 필요 */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)' }}>관련순</Text>
              <IconChevronDown size={normalize(10)} color="rgba(0,0,0,0.45)" strokeWidth={1.5} />
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />

          {results.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: TAB_BAR_HEIGHT + insets.bottom, gap: normalize(12) }}>
              <IconSearch size={normalize(48)} color="rgba(0,0,0,0.12)" strokeWidth={1} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: 'rgba(0,0,0,0.5)' }}>
                검색 결과가 없어요
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: 'rgba(0,0,0,0.3)', textAlign: 'center', lineHeight: FONT_MD * 1.5 }}>
                {'다른 키워드로 검색하거나\n철자를 확인해보세요'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}
              renderItem={({ item }) => (
                // TODO: 스팟 상세 네비게이션 파라미터 확정 후 onPress 연결
                <Pressable
                  style={{ flexDirection: 'row', gap: normalize(14), paddingVertical: normalize(14), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
                >
                  <View style={{ width: normalize(80), height: normalize(80), borderRadius: normalize(12), backgroundColor: '#F5F5F7', flexShrink: 0 }} />
                  <View style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.3, marginBottom: normalize(3) }}>
                        {item.name}
                      </Text>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginBottom: normalize(8) }}>
                        {item.addr}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), flexWrap: 'wrap' }}>
                      <View style={{ backgroundColor: 'rgba(227,27,89,0.07)', paddingHorizontal: normalize(8), paddingVertical: normalize(2), borderRadius: normalize(8) }}>
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(12), color: '#E31B59' }}>
                          {item.score}점
                        </Text>
                      </View>
                      {item.tags.map((tag) => (
                        <View key={tag} style={{ backgroundColor: '#F5F5F7', paddingHorizontal: normalize(8), paddingVertical: normalize(2), borderRadius: normalize(8) }}>
                          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)' }}>
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
