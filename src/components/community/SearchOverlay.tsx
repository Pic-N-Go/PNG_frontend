import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight, Clock, MapPin, X } from 'lucide-react-native';
import Chip from '@/components/common/Chip';
import UserRow from '@/components/common/UserRow';
import ProfilePostsTab from '@/components/community/ProfilePostsTab';
import { useSearchUsers } from '@/hooks/useUser';
import { useRecommendedSpots, useSearchSpots } from '@/hooks/useSpot';
import { useCommunityFeed } from '@/hooks/useCommunity';
import { GRID_PADDING, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { FollowUserResponse } from '@/types/user';
import type { SpotResponse } from '@/types/spot';
import type { Post, ProfilePostItem } from '@/types/community';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

/** 최근 검색 저장 키. 서버 API가 없어 기기에만 둔다. */
const RECENT_KEY = 'community.recentSearches';
const RECENT_MAX = 10;

/**
 * "전체"는 종류별 미리보기만 보여준다 — 전체 목록은 각 칩이 맡는다.
 *
 * ponytail: 스팟·사용자 칩의 "전체 목록"도 서버 기본 size(20)에서 잘리고 더 있다는 표시가 없다.
 * 실사용자가 20건을 넘기면 useInfiniteQuery로 올릴 것.
 */
const PREVIEW_ROWS = 3;
const PREVIEW_CELLS = 6;

/**
 * "사진"은 게시글이 곧 사진이라 게시글 칩과 구분이 없어 뺐다.
 * 나머지는 각각 다른 엔드포인트로 실제 분기한다.
 */
const CHIPS = [
  { key: 'all', label: '전체' },
  { key: 'posts', label: '게시글' },
  { key: 'spots', label: '스팟' },
  { key: 'users', label: '사용자' },
] as const;

type ChipKey = (typeof CHIPS)[number]['key'];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 게시글 전체 목록 — 오버레이를 닫고 피드가 `GET /posts?keyword=`로 보여준다 */
  onSubmitKeyword: (keyword: string) => void;
  onOpenSpot: (spotId: number) => void;
  onOpenUser: (userId: number) => void;
  onOpenPost: (postId: string, isMine: boolean) => void;
}

export default function SearchOverlay({ visible, onClose, onSubmitKeyword, onOpenSpot, onOpenUser, onOpenPost }: Props) {
  // 부모 SafeAreaView의 상단 패딩은 position:absolute 자식에게 적용되지 않는다.
  // 직접 인셋만큼 내려주지 않으면 내용이 상태바 아래로 파고들고, 그 자리에 놓인
  // "취소" 버튼은 iOS가 상태바 탭을 가로채 눌리지 않는다.
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  // 아무 필터도 고르지 않은 상태가 기본이어야 한다 — 특정 칩이 미리 선택돼 있으면 결과를 조용히 좁힌다.
  const [chip, setChip] = useState<ChipKey>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  /** 검색이 실행된 키워드. query와 분리해야 타이핑 중에 매 글자 요청이 나가지 않는다. */
  const [submitted, setSubmitted] = useState('');

  /**
   * `visible=false`에서 언마운트되지 않으므로(아래 return null) 상태가 그대로 남는다.
   *
   * 닫힐 때 비운다 — 열릴 때 비우면 닫힌 동안 submitted가 남아 세 쿼리가 계속 enabled인
   * 상태로 피드 화면에 붙어 있고(포커스·재연결 시 재요청), 다시 열 때 한 프레임 동안
   * 지난 검색 결과가 스친다.
   */
  useEffect(() => {
    if (visible) return;
    setQuery('');
    setSubmitted('');
    setChip('all');
  }, [visible]);

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

  const isAll = chip === 'all';
  const searching = !!submitted;
  // 미리보기와 전체 목록이 같은 쿼리를 쓴다(slice만 다르다) — 칩을 오가도 재요청이 없다.
  const spotResults = useSearchSpots({ keyword: submitted }, { enabled: searching && (isAll || chip === 'spots') });
  const userResults = useSearchUsers(submitted, searching && (isAll || chip === 'users'));
  // 게시글 전체 목록은 피드가 맡으므로 오버레이에서는 "전체" 미리보기용으로만 받는다.
  const postResults = useCommunityFeed('LATEST', submitted, { enabled: searching && isAll });

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
    // 게시글 칩만 화면을 옮긴다 — 피드가 키워드 필터를 이미 갖고 있다.
    if (chip === 'posts') onSubmitKeyword(trimmed);
  };

  // 칩을 바꾸면 같은 키워드로 결과 종류만 갈아끼운다.
  const changeChip = (next: ChipKey) => {
    setChip(next);
    if (submitted && next === 'posts') onSubmitKeyword(submitted);
  };

  if (!visible) return null;

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
          {/* 결과 종류를 거르는 필터라 활성색은 블랙이다. 공통 Chip을 쓴다 —
              직접 그리면 회색 톤·글자 색이 다른 필터 칩과 조금씩 어긋난다. */}
          {CHIPS.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              selected={item.key === chip}
              onPress={() => changeChip(item.key)}
              height={normalize(30)}
              paddingHorizontal={normalize(13)}
            />
          ))}
        </View>

        {!searching ? (
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
                        accessibilityRole="button"
                        accessibilityLabel={`${term} 최근 검색어 삭제`}
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
        ) : isAll ? (
          <AllPreview
            users={userResults}
            spots={spotResults}
            posts={postResults}
            onOpenUser={onOpenUser}
            onOpenSpot={onOpenSpot}
            onOpenPost={onOpenPost}
            onMore={changeChip}
          />
        ) : chip === 'users' ? (
          <UserResults query={userResults} onOpenUser={onOpenUser} />
        ) : chip === 'spots' ? (
          <SpotResults query={spotResults} onOpenSpot={onOpenSpot} />
        ) : (
          // 게시글 칩은 피드로 나가므로 오버레이에 남을 일이 거의 없다(전환 한 프레임용).
          <StatusText text="피드에서 결과를 보여드릴게요" />
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

function SectionHeader({ text, onMore }: { text: string; onMore: () => void }) {
  return (
    <View className="flex-row items-center justify-between" style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(12), paddingBottom: normalize(4) }}>
      <SectionLabel text={text} />
      <Pressable onPress={onMore} className="flex-row items-center" hitSlop={6} style={{ gap: normalize(2) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.2 }}>
          더보기
        </Text>
        <ChevronRight size={normalize(14)} color="rgba(0,0,0,0.3)" strokeWidth={2} />
      </Pressable>
    </View>
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

function Spinner() {
  return (
    <View style={{ paddingVertical: normalize(40) }}>
      <ActivityIndicator color={ACCENT} />
    </View>
  );
}

/**
 * isFetching까지 보는 이유: 스팟·게시글 쿼리는 keepPreviousData를 쓴다. 두 번째 검색에서는
 * status가 success로 유지돼 isLoading이 false가 되고, 검색어 B 아래에 A의 결과가 로딩 표시
 * 없이 남는다(사용자 쿼리는 keepPreviousData가 없어 정상적으로 비므로 한 화면에서 동작이 갈렸다).
 */
type QueryLike<T> = { data?: T; isLoading: boolean; isFetching: boolean; isError: boolean };
type UserQuery = QueryLike<{ content: FollowUserResponse[] }>;
type SpotQuery = QueryLike<{ content: SpotResponse[] }>;
type PostQuery = QueryLike<{ posts: Post[] }>;

/** 그리드는 프로필 게시글 탭과 같은 것을 쓴다 — 셀 모양이 갈리지 않게. */
function toGridItems(posts: Post[]): ProfilePostItem[] {
  return posts.map((post) => ({
    id: post.id,
    imageUrl: post.imageUrls[0],
    photoGradient: post.photoGradient,
    likeCount: post.likeCount,
  }));
}

function UserResults({ query, onOpenUser }: { query: UserQuery; onOpenUser: (userId: number) => void }) {
  if (query.isLoading || query.isFetching) return <Spinner />;
  if (query.isError) return <StatusText text="검색 결과를 불러오지 못했어요" />;
  const found = query.data?.content ?? [];
  if (found.length === 0) return <StatusText text="일치하는 사용자가 없어요" />;
  return (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      {found.map((user) => (
        <UserRow key={user.id} user={user} onPress={() => onOpenUser(user.id)} />
      ))}
    </View>
  );
}

function SpotRow({ spot, onPress }: { spot: SpotResponse; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${spot.name} 스팟 보기`}
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
  );
}

function SpotResults({ query, onOpenSpot }: { query: SpotQuery; onOpenSpot: (spotId: number) => void }) {
  if (query.isLoading || query.isFetching) return <Spinner />;
  if (query.isError) return <StatusText text="검색 결과를 불러오지 못했어요" />;
  const found = query.data?.content ?? [];
  if (found.length === 0) return <StatusText text="일치하는 스팟이 없어요" />;
  return (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      {found.map((spot) => (
        <SpotRow key={spot.id} spot={spot} onPress={() => onOpenSpot(spot.id)} />
      ))}
    </View>
  );
}

/**
 * "전체" 탭. 종류별로 앞 몇 건만 보여주고 전체 목록은 각 칩에 넘긴다.
 * 사용자·스팟을 위에 두는 이유는 목록이 짧고 의도가 뚜렷해서다 — 긴 사진 그리드가 위에 오면 나머지가 묻힌다.
 */
function AllPreview({
  users,
  spots,
  posts,
  onOpenUser,
  onOpenSpot,
  onOpenPost,
  onMore,
}: {
  users: UserQuery;
  spots: SpotQuery;
  posts: PostQuery;
  onOpenUser: (userId: number) => void;
  onOpenSpot: (spotId: number) => void;
  onOpenPost: (postId: string, isMine: boolean) => void;
  onMore: (chip: ChipKey) => void;
}) {
  const foundUsers = (users.data?.content ?? []).slice(0, PREVIEW_ROWS);
  const foundSpots = (spots.data?.content ?? []).slice(0, PREVIEW_ROWS);
  const foundPosts = (posts.data?.posts ?? []).slice(0, PREVIEW_CELLS);

  const loading = users.isFetching || spots.isFetching || posts.isFetching;
  const empty = foundUsers.length === 0 && foundSpots.length === 0 && foundPosts.length === 0;
  const allFailed = users.isError && spots.isError && posts.isError;

  // 셋 다 아직이면 스피너, 하나라도 왔으면 온 것부터 그린다(먼저 온 결과를 기다리게 하지 않는다).
  if (loading && empty) return <Spinner />;
  // 전부 실패한 걸 "결과가 없어요"로 보여주면 네트워크 오류를 빈 결과로 오인한다.
  if (allFailed) return <StatusText text="검색 결과를 불러오지 못했어요" />;
  if (empty) return <StatusText text="검색 결과가 없어요" />;

  return (
    <>
      {foundUsers.length > 0 && (
        <>
          <SectionHeader text="사용자" onMore={() => onMore('users')} />
          <View style={{ paddingHorizontal: GRID_PADDING }}>
            {foundUsers.map((user) => (
              <UserRow key={user.id} user={user} onPress={() => onOpenUser(user.id)} />
            ))}
          </View>
        </>
      )}

      {foundSpots.length > 0 && (
        <>
          <SectionHeader text="스팟" onMore={() => onMore('spots')} />
          <View style={{ paddingHorizontal: GRID_PADDING }}>
            {foundSpots.map((spot) => (
              <SpotRow key={spot.id} spot={spot} onPress={() => onOpenSpot(spot.id)} />
            ))}
          </View>
        </>
      )}

      {foundPosts.length > 0 && (
        <>
          <SectionHeader text="게시글" onMore={() => onMore('posts')} />
          <ProfilePostsTab
            items={toGridItems(foundPosts)}
            onSelectPost={(postId) => {
              const target = foundPosts.find((post) => post.id === postId);
              onOpenPost(postId, !!target?.isMine);
            }}
          />
        </>
      )}
    </>
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
