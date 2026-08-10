import React, { useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, Plus, Heart, ChevronDown } from 'lucide-react-native';
import PostCard from '@/components/community/PostCard';
import SearchOverlay from '@/components/community/SearchOverlay';
import ContestSegment from '@/components/community/ContestSegment';
import OptionSheet from '@/components/common/OptionSheet';
import type { RootStackParamList } from '@/navigation';
import { ContestPastMonthItem, ContestSubmitTarget, Post } from '@/types/community';
import { CONTENT_PADDING, FONT_LG, FONT_SM, FONT_2XL, FONT_2XS, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { layoutGalleryGrid } from '@/utils/galleryGrid';

const GALLERY_POPULAR_COUNT = 2;
const GALLERY_GAP = normalize(3);

type FeedSortOption = '인기' | '최신' | '팔로잉' | '내 글';
const FEED_SORT_OPTIONS: FeedSortOption[] = ['인기', '최신', '팔로잉', '내 글'];

function sortPosts(posts: Post[], sort: FeedSortOption): Post[] {
  switch (sort) {
    case '인기':
      return [...posts].sort((a, b) => b.likeCount - a.likeCount);
    case '팔로잉':
      return posts.filter((p) => p.isFollowingAuthor);
    case '내 글':
      return posts.filter((p) => p.isMine);
    case '최신':
    default:
      return posts;
  }
}

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

type SegmentKey = 'posts' | 'gallery' | 'contest';

const SEGMENTS: { key: SegmentKey; label: string }[] = [
  { key: 'posts', label: '게시글' },
  { key: 'gallery', label: '갤러리' },
  { key: 'contest', label: '콘테스트' },
];

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    author: { id: 'u1', handle: 'sunset_jk', initials: 'JK', avatarGradient: ['#2c5364', '#4a7c8a'] },
    isMine: false,
    photoGradient: ['#0f2027', '#203a43', '#4a7c8a'],
    caption: '새벽 5시에 일어난 보람이 있는 일출',
    location: '광안리 해수욕장',
    createdAtLabel: '2시간 전',
    likeCount: 248,
    isLiked: true,
    commentCount: 32,
    shareCount: 0,
    isSaved: false,
    isFollowingAuthor: false,
    photogenicScore: 87,
    shotMeta: { time: '05:30', weather: '맑음', weatherIcon: 'clear-day', gear: 'Sony A7IV · 24mm f/2.8' },
  },
  {
    id: '2',
    author: { id: 'u2', handle: 'photo_yujin', initials: 'YJ', avatarGradient: ['#8b4a6b', '#d4856a'] },
    isMine: false,
    photoGradient: ['#1a1530', '#4a1942', '#e8855a'],
    caption: '한복 입고 야간개장, 무료입장 꿀팁까지',
    location: '경복궁 야간개장',
    createdAtLabel: '5시간 전',
    likeCount: 512,
    isLiked: false,
    commentCount: 67,
    shareCount: 0,
    isSaved: true,
    isFollowingAuthor: true,
    photogenicScore: 91,
    shotMeta: { time: '20:30', weather: '야간', weatherIcon: 'clear-night', gear: 'Canon R6II · 35mm f/1.4' },
  },
  {
    id: '3',
    author: { id: 'me', handle: 'my_username', initials: 'ME', avatarGradient: ['#3a506b', '#5bc0be'] },
    isMine: true,
    photoGradient: ['#0b132b', '#1c2541', '#3a506b'],
    caption: '해변 열차 타고 찍은 노을 사진',
    location: '해운대 블루라인파크',
    createdAtLabel: '1일 전',
    likeCount: 156,
    isLiked: false,
    commentCount: 12,
    shareCount: 0,
    isSaved: false,
    isFollowingAuthor: false,
    photogenicScore: 79,
    shotMeta: { time: '18:20', weather: '흐림', weatherIcon: 'cloudy', gear: 'Fujifilm X-T5 · 23mm f/2' },
  },
];

interface GalleryPhoto {
  id: string;
  color: string;
  likeCount: number;
}

const GALLERY_CELLS: GalleryPhoto[] = [
  { id: 'g1', color: '#0a1a0f', likeCount: 58 }, { id: 'g2', color: '#1a1530', likeCount: 91 },
  { id: 'g3', color: '#232526', likeCount: 34 }, { id: 'g4', color: '#0f2027', likeCount: 122 },
  { id: 'g5', color: '#4a1942', likeCount: 512 }, { id: 'g6', color: '#020010', likeCount: 47 },
  { id: 'g7', color: '#2a2e35', likeCount: 76 }, { id: 'g8', color: '#1a1510', likeCount: 29 },
  { id: 'g9', color: '#1a0f1e', likeCount: 88 }, { id: 'g10', color: '#0a1520', likeCount: 63 },
  { id: 'g11', color: '#1a0a0a', likeCount: 41 }, { id: 'g12', color: '#0a1510', likeCount: 55 },
  { id: 'g13', color: '#b44a3a', likeCount: 97 }, { id: 'g14', color: '#0f2027', likeCount: 68 },
  { id: 'g15', color: '#4a8060', likeCount: 342 }, { id: 'g16', color: '#020010', likeCount: 39 },
  { id: 'g17', color: '#1a0510', likeCount: 52 }, { id: 'g18', color: '#0a2020', likeCount: 71 },
];

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
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [feedSort, setFeedSort] = useState<FeedSortOption>('인기');
  const [feedSortSheetVisible, setFeedSortSheetVisible] = useState(false);
  const displayedPosts = React.useMemo(() => sortPosts(posts, feedSort), [posts, feedSort]);

  // CSS의 `grid-template-columns: repeat(3, 1fr)`와 동일하게, 고정 픽셀이 아니라
  // 실제 사용 가능한 너비(화면 너비 - 좌우 패딩 - 갤럼 사이 gap 2개)를 3등분해서 셀 크기를 구한다.
  const galleryCellSize = (windowWidth - GRID_PADDING * 2 - GALLERY_GAP * 2) / 3;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsScrolled(e.nativeEvent.contentOffset.y > 44);
  };

  const toggleLike = (id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) } : p)));
  };
  const toggleSave = (id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isSaved: !p.isSaved } : p)));
  };
  const toggleFollow = (id: string) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, isFollowingAuthor: !p.isFollowingAuthor } : p)));
  };

  const galleryCells = React.useMemo(() => {
    const popularIds = pickPopularIds(GALLERY_CELLS, GALLERY_POPULAR_COUNT);
    return layoutGalleryGrid(GALLERY_CELLS, (photo) => popularIds.has(photo.id));
  }, []);
  const galleryRowCount = galleryCells.reduce((max, cell) => Math.max(max, cell.row + cell.span), 0);
  const galleryHeight = galleryRowCount * galleryCellSize + Math.max(galleryRowCount - 1, 0) * GALLERY_GAP;

  const goToPost = (post: Post) =>
    rootNavigation.navigate('CommunityDetailStack', { screen: 'PostDetail', params: { isMyPost: post.isMine } });
  const goToProfile = () => rootNavigation.navigate('CommunityDetailStack', { screen: 'UserProfile' });
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
        <ScrollView onScroll={handleScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: normalize(20) }}>
          {segment === 'posts' && (
            <View style={{ paddingHorizontal: GRID_PADDING, gap: normalize(20) }}>
              {displayedPosts.length === 0 ? (
                <View style={{ paddingVertical: normalize(48), alignItems: 'center' }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                    {feedSort === '팔로잉' ? '팔로잉한 유저의 게시글이 없어요' : '표시할 게시글이 없어요'}
                  </Text>
                </View>
              ) : (
                displayedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPress={() => goToPost(post)}
                    onToggleLike={() => toggleLike(post.id)}
                    onToggleSave={() => toggleSave(post.id)}
                    onToggleFollow={() => toggleFollow(post.id)}
                    onPressUsername={goToProfile}
                  />
                ))
              )}
            </View>
          )}
          {segment === 'gallery' && (
            <View style={{ height: galleryHeight, position: 'relative' }}>
              {galleryCells.map(({ item: cell, row, col, span }) => {
                const size = span * galleryCellSize + (span - 1) * GALLERY_GAP;
                const isPopular = span === 2;
                return (
                  <View
                    key={cell.id}
                    style={{
                      position: 'absolute',
                      top: row * (galleryCellSize + GALLERY_GAP),
                      left: GRID_PADDING + col * (galleryCellSize + GALLERY_GAP),
                      width: size,
                      height: size,
                      backgroundColor: cell.color,
                    }}
                  >
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
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
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
