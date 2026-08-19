import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, MapPin, X } from 'lucide-react-native';
import UserRow from '@/components/common/UserRow';
import { useSearchUsers } from '@/hooks/useUser';
import { useRecommendedSpots, useSearchSpots } from '@/hooks/useSpot';
import { GRID_PADDING, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { FollowUserResponse } from '@/types/user';
import type { SpotResponse } from '@/types/spot';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

/** 최근 검색 저장 키. 서버 API가 없어 기기에만 둔다. */
const RECENT_KEY = 'community.recentSearches';
const RECENT_MAX = 10;

/**
 * "사진"은 게시글이 곧 사진이라 게시글 칩과 구분이 없어 뺐다.
 * 나머지 셋은 각각 다른 엔드포인트로 실제 분기한다.
 */
const CHIPS = [
  { key: 'posts', label: '게시글' },
  { key: 'spots', label: '스팟' },
  { key: 'users', label: '사용자' },
] as const;

type ChipKey = (typeof CHIPS)[number]['key'];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 게시글 검색 — 오버레이를 닫고 피드가 `GET /posts?keyword=`로 결과를 보여준다 */
  onSubmitKeyword: (keyword: string) => void;
  /** 스팟·사용자 결과 탭 — 각자의 상세 화면으로 보낸다 */
  onOpenSpot: (spotId: number) => void;
  onOpenUser: (userId: number) => void;
}

export default function SearchOverlay({ visible, onClose, onSubmitKeyword, onOpenSpot, onOpenUser }: Props) {
  // 부모 SafeAreaView의 상단 패딩은 position:absolute 자식에게 적용되지 않는다.
  // 직접 인셋만큼 내려주지 않으면 내용이 상태바 아래로 파고들고, 그 자리에 놓인
  // "취소" 버튼은 iOS가 상태바 탭을 가로채 눌리지 않는다.
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<ChipKey>('posts');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  /** 검색이 실행된 키워드. query와 분리해야 타이핑 중에 매 글자 요청이 나가지 않는다. */
  const [submitted, setSubmitted] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setRecentSearches(parsed.filter((t) => typeof t === 'string'));
      })
      // 저장 형식이 깨졌거나 읽기가 실패해도 검색 자체는 되어야 한다.
      .catch(() => undefined);
  }, []);

  // 스팟·사용자만 오버레이 안에서 결과를 그린다. 게시글은 피드로 넘어간다.
  const wantSpots = chip === 'spots' && !!submitted;
  const wantUsers = chip === 'users' && !!submitted;
  const spotResults = useSearchSpots({ keyword: submitted }, { enabled: wantSpots });
  const userResults = useSearchUsers(submitted, wantUsers);

  const persistRecent = (next: string[]) => {
    setRecentSearches(next);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const submit = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    persistRecent([trimmed, ...recentSearches.filter((t) => t !== trimmed)].slice(0, RECENT_MAX));
    setQuery(trimmed);
    setSubmitted(trimmed);
    // 게시글은 기존 경로 그대로 — 피드가 키워드 필터를 이미 갖고 있다.
    if (chip === 'posts') onSubmitKeyword(trimmed);
  };

  // 칩을 바꾸면 같은 키워드로 다시 검색한다 — 결과 종류만 갈아끼우는 것이 기대 동작이다.
  const changeChip = (next: ChipKey) => {
    setChip(next);
    if (!submitted) return;
    if (next === 'posts') onSubmitKeyword(submitted);
  };

  if (!visible) return null;

  const showResults = wantSpots || wantUsers;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingTop: insets.top, backgroundColor: '#fff', zIndex: 40 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: normalize(80) }} keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center" style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(6), paddingBottom: normalize(12), gap: normalize(12) }}>
          <View className="flex-1 flex-row items-center" style={{ height: normalize(40), paddingHorizontal: normalize(14), borderRadius: normalize(20), backgroundColor: SURFACE, gap: normalize(10) }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="스팟, 게시글, 사용자 검색"
              placeholderTextColor="rgba(0,0,0,0.35)"
              allowFontScaling={false}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={() => submit(query)}
              style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2 }}
            />
            {query.length > 0 && (
              <Pressable
                onPress={() => {
                  setQuery('');
                  setSubmitted('');
                }}
                className="items-center justify-center"
                style={{ width: normalize(22), height: normalize(22), borderRadius: normalize(11), backgroundColor: 'rgba(0,0,0,0.1)' }}
              >
                <X size={normalize(9)} color="rgba(0,0,0,0.55)" strokeWidth={2.4} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: ACCENT, letterSpacing: -0.2 }}>
              취소
            </Text>
          </Pressable>
        </View>

        <View className="flex-row" style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(14), gap: normalize(6) }}>
          {CHIPS.map((item) => {
            const isActive = item.key === chip;
            return (
              <Pressable
                key={item.key}
                onPress={() => changeChip(item.key)}
                style={{ height: normalize(30), paddingHorizontal: normalize(13), borderRadius: normalize(15), backgroundColor: isActive ? '#000' : SURFACE, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: isActive ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, color: isActive ? '#fff' : 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showResults ? (
          <ResultList
            chip={chip}
            spots={spotResults}
            users={userResults}
            onOpenSpot={onOpenSpot}
            onOpenUser={onOpenUser}
          />
        ) : (
          <>
            {recentSearches.length > 0 && (
              <>
                <View className="flex-row items-center justify-between" style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(4) }}>
                  <SectionLabel text="최근 검색" />
                  <Pressable onPress={() => persistRecent([])}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.2 }}>
                      모두 지우기
                    </Text>
                  </Pressable>
                </View>
                <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(8) }}>
                  {recentSearches.map((term) => (
                    <Pressable key={term} onPress={() => submit(term)} className="flex-row items-center" style={{ gap: normalize(12), paddingVertical: normalize(11) }}>
                      <Clock size={normalize(16)} color="rgba(0,0,0,0.35)" strokeWidth={1.8} />
                      <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2 }}>
                        {term}
                      </Text>
                      <Pressable
                        onPress={() => persistRecent(recentSearches.filter((t) => t !== term))}
                        style={{ padding: normalize(4) }}
                      >
                        <X size={normalize(12)} color="rgba(0,0,0,0.25)" strokeWidth={2} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {/* 인기 검색어 섹션은 제거했다 — 검색 로그 집계 API가 없어 순위를 지어낼 수밖에 없었다.
                그 자리는 실데이터인 추천 스팟이 넓게 쓴다. */}
            <RecommendedSpots onOpenSpot={onOpenSpot} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: 0.4 }}>
      {text}
    </Text>
  );
}

function StatusText({ text }: { text: string }) {
  return (
    <Text
      allowFontScaling={false}
      className="text-center"
      style={{ paddingVertical: normalize(40), fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.2 }}
    >
      {text}
    </Text>
  );
}

type QueryLike<T> = { data?: T; isLoading: boolean; isError: boolean };

function ResultList({
  chip,
  spots,
  users,
  onOpenSpot,
  onOpenUser,
}: {
  chip: ChipKey;
  spots: QueryLike<{ content: SpotResponse[] }>;
  users: QueryLike<{ content: FollowUserResponse[] }>;
  onOpenSpot: (spotId: number) => void;
  onOpenUser: (userId: number) => void;
}) {
  const active = chip === 'spots' ? spots : users;

  if (active.isLoading) {
    return (
      <View style={{ paddingVertical: normalize(40) }}>
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }
  if (active.isError) return <StatusText text="검색 결과를 불러오지 못했어요" />;

  if (chip === 'users') {
    const found = users.data?.content ?? [];
    if (found.length === 0) return <StatusText text="일치하는 사용자가 없어요" />;
    return (
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        {found.map((user) => (
          <UserRow key={user.id} user={user} onPress={() => onOpenUser(user.id)} />
        ))}
      </View>
    );
  }

  const found = spots.data?.content ?? [];
  if (found.length === 0) return <StatusText text="일치하는 스팟이 없어요" />;
  return (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      {found.map((spot) => (
        <Pressable
          key={spot.id}
          onPress={() => onOpenSpot(spot.id)}
          className="flex-row items-center"
          style={{ gap: normalize(12), paddingVertical: normalize(12), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}
        >
          <View className="items-center justify-center overflow-hidden" style={{ width: normalize(44), height: normalize(44), borderRadius: normalize(12), backgroundColor: SURFACE }}>
            {spot.thumbnailUrl ? (
              <Image source={{ uri: spot.thumbnailUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            ) : (
              <MapPin size={normalize(18)} color="rgba(0,0,0,0.25)" strokeWidth={1.8} />
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2 }}>
              {spot.name}
            </Text>
            <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.1, marginTop: normalize(2) }}>
              {spot.address}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function RecommendedSpots({ onOpenSpot }: { onOpenSpot: (spotId: number) => void }) {
  // 로그인해야 오는 데이터라 비로그인·실패 시에는 섹션째로 감춘다(빈 제목만 남으면 고장처럼 보인다).
  const { data = [], isError } = useRecommendedSpots(4);
  if (isError || data.length === 0) return null;

  return (
    <>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(4) }}>
        <SectionLabel text="추천 스팟" />
      </View>
      <View className="flex-row flex-wrap" style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(24), gap: normalize(8) }}>
        {/* 게시글 수는 서버가 스팟별로 세어주지 않아 표시하지 않는다 — 리뷰 수는 실제 값이다 */}
        {data.map((spot) => (
          <Pressable key={spot.id} onPress={() => onOpenSpot(spot.id)} style={{ width: '47%', gap: normalize(8) }}>
            <View className="overflow-hidden" style={{ height: normalize(100), borderRadius: normalize(12), backgroundColor: SURFACE }}>
              {spot.thumbnailUrl ? (
                <Image source={{ uri: spot.thumbnailUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
              ) : (
                <View className="items-center justify-center" style={{ flex: 1 }}>
                  <MapPin size={normalize(20)} color="rgba(0,0,0,0.2)" strokeWidth={1.8} />
                </View>
              )}
            </View>
            <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2 }}>
              {spot.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}
