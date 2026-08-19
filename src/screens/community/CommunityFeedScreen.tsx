import React, { useState } from 'react';
import { ActivityIndicator, Image, NativeSyntheticEvent, NativeScrollEvent, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, Plus, Heart, ChevronDown, X } from 'lucide-react-native';
import PostCard from '@/components/community/PostCard';
import SearchOverlay from '@/components/community/SearchOverlay';
import ContestSegment from '@/components/community/ContestSegment';
import OptionSheet from '@/components/common/OptionSheet';
import { useAuthStore } from '@/store/useAuthStore';
import { useCommunityFeed, useToggleBookmark, useToggleFollow, useToggleLike } from '@/hooks/useCommunity';
import type { RootStackParamList } from '@/navigation';
import { ContestPastMonthItem, ContestSubmitTarget, Post, PostSortApi } from '@/types/community';
import { CONTENT_PADDING, FONT_LG, FONT_SM, FONT_2XL, FONT_2XS, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { layoutGalleryGrid } from '@/utils/galleryGrid';

const GALLERY_POPULAR_COUNT = 2;
const GALLERY_GAP = normalize(3);

type FeedSortOption = '인기' | '최신' | '팔로잉' | '내 글';
const FEED_SORT_OPTIONS: FeedSortOption[] = ['인기', '최신', '팔로잉', '내 글'];

// 정렬·필터는 전부 서버가 처리한다(GET /posts?sort=). 클라이언트에서 다시 정렬하면
// 한 페이지 안에서만 맞는 순서가 나와 페이지를 넘길 때 순서가 뒤섞인다.
const SORT_TO_API: Record<FeedSortOption, PostSortApi> = {
  인기: 'POPULAR',
  최신: 'LATEST',
  팔로잉: 'FOLLOWING',
  '내 글': 'MY_POSTS',
};

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

type SegmentKey = 'posts' | 'gallery' | 'contest';

const SEGMENTS: { key: SegmentKey; label: string }[] = [
  { key: 'posts', label: '게시글' },
  { key: 'gallery', label: '갤러리' },
  { key: 'contest', label: '콘테스트' },
];

interface GalleryPhoto {
  id: string;
  /** 사진 URL. 로드 전·실패 시 color가 보인다 */
  uri?: string;
  color: string;
  likeCount: number;
  postId: string;
  isMine: boolean;
}

/** 갤러리 탭은 같은 피드의 사진만 격자로 다시 보여준다 — 전용 API가 없다. */
function toGalleryPhotos(posts: Post[]): GalleryPhoto[] {
  return posts.flatMap((post) =>
    post.imageUrls.map((uri, idx) => ({
      id: `${post.id}-${idx}`,
      uri,
      color: post.photoGradient[0],
      likeCount: post.likeCount,
      postId: post.id,
      isMine: post.isMine,
    })),
  );
}

function pickPopularIds(photos: GalleryPhoto[], count: number): Set<string> {
  const ranked = [...photos].sort((a, b) => b.likeCount - a.likeCount).slice(0, count);
  return new Set(ranked.map((p) => p.id));
}

export default function CommunityFeedScreen() {
  const navigation = useNavigation();
  // PostDetail/CommunityWrite/ContestResult/UserProfile은 탭바 없는 push 화면이라
  // CommunityStack(탭 안쪽)이 아니라 RootStack 형제 스크린(CommunityDetailStack)에 있음 —
  // SpotStack과 동일하게 상위 네비게이터로 액션이 자동 전파(bubbling)된다.
  const rootNavigation = navigation as unknown as NativeStackNavigationProp<RootStackParamList>;
  const { width: windowWidth } = useWindowDimensions();
  const [segment, setSegment] = useState<SegmentKey>('posts');
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [feedSort, setFeedSort] = useState<FeedSortOption>('인기');
  const [feedSortSheetVisible, setFeedSortSheetVisible] = useState(false);

  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useCommunityFeed(SORT_TO_API[feedSort], keyword);
  // `?? []`를 그대로 쓰면 매 렌더마다 새 배열이 되어 아래 갤러리 useMemo가 항상 다시 계산된다.
  const displayedPosts = React.useMemo(() => data?.posts ?? [], [data?.posts]);

  const toggleLike = useToggleLike();
  const toggleBookmark = useToggleBookmark();
  const toggleFollow = useToggleFollow();

  // 팔로잉·내 글은 서버가 토큰을 요구한다. 비로그인이면 조회를 아예 안 하므로 안내를 따로 띄운다.
  const needsLogin = !isLoggedIn && (feedSort === '팔로잉' || feedSort === '내 글');

  // 카드 목록 대신 안내 한 줄만 띄우는 상태. null이면 정상 목록을 그린다.
  const postsState: 'login' | 'loading' | 'error' | 'empty' | null =
    needsLogin ? 'login'
    : isLoading ? 'loading'
    : isError ? 'error'
    : displayedPosts.length === 0 ? 'empty'
    : null;

  // CSS의 `grid-template-columns: repeat(3, 1fr)`와 동일하게, 고정 픽셀이 아니라
  // 실제 사용 가능한 너비(화면 너비 - 좌우 패딩 - 갤럼 사이 gap 2개)를 3등분해서 셀 크기를 구한다.
  const galleryCellSize = (windowWidth - GRID_PADDING * 2 - GALLERY_GAP * 2) / 3;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsScrolled(e.nativeEvent.contentOffset.y > 44);
  };

  const galleryPhotos = React.useMemo(() => toGalleryPhotos(displayedPosts), [displayedPosts]);
  const galleryCells = React.useMemo(() => {
    // 2x2 한 칸이 일반 칸 4개를 먹는다. 사진이 적을 때 상한을 그대로 쓰면 격자 대부분이
    // 큰 칸이 되어 빈자리가 남고 배치가 뒤죽박죽으로 보인다 — 사진 수에 비례시킨다.
    const popularCount = Math.min(GALLERY_POPULAR_COUNT, Math.floor(galleryPhotos.length / 6));
    const popularIds = pickPopularIds(galleryPhotos, popularCount);
    return layoutGalleryGrid(galleryPhotos, (photo) => popularIds.has(photo.id));
  }, [galleryPhotos]);
  const galleryRowCount = galleryCells.reduce((max, cell) => Math.max(max, cell.row + cell.span), 0);
  const galleryHeight = galleryRowCount * galleryCellSize + Math.max(galleryRowCount - 1, 0) * GALLERY_GAP;

  const goToPost = (post: Post) =>
    rootNavigation.navigate('CommunityDetailStack', { screen: 'PostDetail', params: { postId: post.id, isMyPost: post.isMine } });
  const goToPostById = (postId: string, isMine: boolean) =>
    rootNavigation.navigate('CommunityDetailStack', { screen: 'PostDetail', params: { postId, isMyPost: isMine } });
  const goToProfile = (userId: string) =>
    rootNavigation.navigate('CommunityDetailStack', { screen: 'UserProfile', params: { userId } });
  const goToContestResult = (item: ContestPastMonthItem) =>
    rootNavigation.navigate('CommunityDetailStack', {
      screen: 'ContestResult',
      params: { monthLabel: item.monthLabel, myRank: item.myRank },
    });
  const goToAllEntries = (submitTarget: ContestSubmitTarget) =>
    rootNavigation.navigate('CommunityDetailStack', { screen: 'ContestAllEntries', params: { submitTarget } });
  const goToContestSubmit = (target: ContestSubmitTarget) =>
    rootNavigation.navigate('CommunityDetailStack', { screen: 'ContestSubmit', params: target });
  const goToContestEntry = (entryId: string) =>
    rootNavigation.navigate('CommunityDetailStack', { screen: 'ContestEntryDetail', params: { entryId } });
  const goToContestResultByRank = (monthLabel: string, myRank: number | null) =>
    rootNavigation.navigate('CommunityDetailStack', { screen: 'ContestResult', params: { monthLabel, myRank } });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View style={{ backgroundColor: '#fff', zIndex: 5 }}>
        <View style={{ height: normalize(36), paddingHorizontal: CONTENT_PADDING, alignItems: 'center', justifyContent: 'center' }}>
          {isScrolled && (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4 }}>
              커뮤니티
            </Text>
          )}
        </View>
        {!isScrolled && (
          <View className="flex-row items-center" style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(6), paddingBottom: normalize(10), gap: normalize(10) }}>
            <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XL, color: '#000', letterSpacing: -1.2 }}>
              커뮤니티
            </Text>
            {/* 검색은 게시글·갤러리 콘텐츠 대상이라 콘테스트 탭에서는 숨긴다(대상이 없음). + 버튼은 유지. */}
            {segment !== 'contest' && (
              <Pressable onPress={() => setSearchVisible(true)} className="items-center justify-center" style={{ width: normalize(38), height: normalize(38), borderRadius: normalize(19), backgroundColor: SURFACE }}>
                <Search size={normalize(18)} color="#000" strokeWidth={1.8} />
              </Pressable>
            )}
            <Pressable
              onPress={() => rootNavigation.navigate('CommunityDetailStack', { screen: 'CommunityWrite' })}
              className="items-center justify-center"
              style={{ width: normalize(38), height: normalize(38), borderRadius: normalize(19), backgroundColor: ACCENT }}
            >
              <Plus size={normalize(16)} color="#fff" strokeWidth={2} />
            </Pressable>
          </View>
        )}
        <View className="flex-row items-center" style={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(14), gap: normalize(10) }}>
          <View className="flex-1 flex-row" style={{ backgroundColor: SURFACE, borderRadius: normalize(22), padding: normalize(3), height: normalize(36) }}>
            {SEGMENTS.map((seg) => {
              const isActive = seg.key === segment;
              return (
                <Pressable
                  key={seg.key}
                  onPress={() => setSegment(seg.key)}
                  className="flex-1 items-center justify-center"
                  style={{ borderRadius: normalize(15), backgroundColor: isActive ? '#000' : 'transparent' }}
                >
                  <Text allowFontScaling={false} style={{ fontFamily: isActive ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, color: isActive ? '#fff' : 'rgba(0,0,0,0.45)', letterSpacing: -0.2 }}>
                    {seg.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {segment === 'posts' && (
            <Pressable onPress={() => setFeedSortSheetVisible(true)} className="flex-row items-center" style={{ gap: normalize(3) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                {feedSort}
              </Text>
              <ChevronDown size={normalize(12)} color="rgba(0,0,0,0.55)" strokeWidth={2} />
            </Pressable>
          )}
        </View>
        {/* 검색어가 걸린 동안에는 게시글·갤러리가 모두 결과로 좁혀진다 — 해제 수단을 항상 보이게 둔다 */}
        {!!keyword && segment !== 'contest' && (
          <View className="flex-row" style={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(14) }}>
            <Pressable
              onPress={() => setKeyword('')}
              className="flex-row items-center"
              style={{ gap: normalize(6), height: normalize(30), paddingHorizontal: normalize(12), borderRadius: normalize(15), backgroundColor: '#000' }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', letterSpacing: -0.2 }}>
                {`'${keyword}' 검색 결과`}
              </Text>
              <X size={normalize(11)} color="#fff" strokeWidth={2.4} />
            </Pressable>
          </View>
        )}
      </View>

      {segment === 'contest' ? (
        <ContestSegment
          onSelectPastItem={goToContestResult}
          onSeeAllEntries={goToAllEntries}
          onOpenSubmit={goToContestSubmit}
          onOpenEntry={goToContestEntry}
          onOpenResult={goToContestResultByRank}
        />
      ) : (
        <ScrollView onScroll={handleScroll} scrollEventThrottle={16} contentContainerStyle={{ flexGrow: 1, paddingBottom: normalize(20) }}>
          {/* contentContainerStyle의 flexGrow: 1 — 내용이 화면보다 짧아도 컨테이너가 남은 높이를
              차지해야 아래 빈 상태 문구를 그 안에서 세로 중앙에 놓을 수 있다 */}
          {segment === 'posts' && (
            postsState ? (
              <View className="items-center justify-center" style={{ flex: 1, gap: normalize(12), paddingHorizontal: GRID_PADDING }}>
                {postsState === 'login' && (
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                    로그인이 필요해요
                  </Text>
                )}
                {postsState === 'loading' && <ActivityIndicator color={ACCENT} />}
                {postsState === 'error' && (
                  <>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                      게시글을 불러오지 못했어요
                    </Text>
                    <Pressable onPress={() => refetch()} style={{ height: normalize(34), paddingHorizontal: normalize(16), borderRadius: normalize(17), backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: 'rgba(0,0,0,0.6)', letterSpacing: -0.2 }}>
                        다시 시도
                      </Text>
                    </Pressable>
                  </>
                )}
                {postsState === 'empty' && (
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                    {keyword ? '검색 결과가 없어요' : feedSort === '팔로잉' ? '팔로잉한 유저의 게시글이 없어요' : '표시할 게시글이 없어요'}
                  </Text>
                )}
              </View>
            ) : (
              <View style={{ paddingHorizontal: GRID_PADDING, gap: normalize(20) }}>
                <>
                  {displayedPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onPress={() => goToPost(post)}
                      onToggleLike={() => toggleLike.mutate({ postId: post.id, next: !post.isLiked })}
                      onToggleBookmark={() => toggleBookmark.mutate({ postId: post.id, next: !post.isBookmarked })}
                      onToggleFollow={() => toggleFollow.mutate({ userId: post.author.id, next: !post.isFollowingAuthor })}
                      onPressUsername={() => goToProfile(post.author.id)}
                    />
                  ))}
                  {hasNextPage && (
                    <Pressable
                      onPress={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="items-center justify-center"
                      style={{ height: normalize(44), borderRadius: normalize(22), backgroundColor: SURFACE }}
                    >
                      {isFetchingNextPage ? (
                        <ActivityIndicator color="rgba(0,0,0,0.4)" size="small" />
                      ) : (
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                          게시글 더 보기
                        </Text>
                      )}
                    </Pressable>
                  )}
                </>
              </View>
            )
          )}
          {segment === 'gallery' && galleryCells.length === 0 && !isLoading && (
            <View style={{ paddingVertical: normalize(48), alignItems: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                표시할 사진이 없어요
              </Text>
            </View>
          )}
          {segment === 'gallery' && (
            <View style={{ height: galleryHeight, position: 'relative' }}>
              {galleryCells.map(({ item: cell, row, col, span }) => {
                const size = span * galleryCellSize + (span - 1) * GALLERY_GAP;
                const isPopular = span === 2;
                return (
                  <Pressable
                    key={cell.id}
                    onPress={() => goToPostById(cell.postId, cell.isMine)}
                    style={{
                      position: 'absolute',
                      top: row * (galleryCellSize + GALLERY_GAP),
                      left: GRID_PADDING + col * (galleryCellSize + GALLERY_GAP),
                      width: size,
                      height: size,
                      backgroundColor: cell.color,
                    }}
                  >
                    {!!cell.uri && <Image source={{ uri: cell.uri }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />}
                    {isPopular && (
                      <>
                        <View style={{ position: 'absolute', top: normalize(10), left: normalize(10), height: normalize(22), paddingHorizontal: normalize(9), borderRadius: normalize(11), backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
                          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: ACCENT, letterSpacing: 0.3 }}>
                            인기
                          </Text>
                        </View>
                        <View className="flex-row items-center" style={{ position: 'absolute', bottom: normalize(10), left: normalize(10), gap: normalize(5) }}>
                          <Heart size={normalize(12)} color="#ff453a" fill="#ff453a" strokeWidth={0} />
                          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', letterSpacing: -0.1 }}>
                            {cell.likeCount}
                          </Text>
                        </View>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <SearchOverlay
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSubmitKeyword={(next) => {
          setKeyword(next);
          setSearchVisible(false);
        }}
        // 스팟·사용자 결과는 오버레이 안에서 고르고, 상세로 넘어갈 때 오버레이를 닫는다.
        onOpenSpot={(spotId) => {
          setSearchVisible(false);
          rootNavigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: String(spotId) } });
        }}
        onOpenUser={(userId) => {
          setSearchVisible(false);
          goToProfile(String(userId));
        }}
        onOpenPost={(postId, isMine) => {
          setSearchVisible(false);
          goToPostById(postId, isMine);
        }}
      />
      <OptionSheet
        visible={feedSortSheetVisible}
        title="정렬 · 필터"
        options={FEED_SORT_OPTIONS}
        selected={feedSort}
        onSelect={(option) => setFeedSort(option as FeedSortOption)}
        onClose={() => setFeedSortSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
