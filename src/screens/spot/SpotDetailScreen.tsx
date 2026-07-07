import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue, runOnJS } from 'react-native-reanimated';
import { IconChevronLeft } from '@tabler/icons-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SpotStackParamList } from '@/navigation/stacks/SpotStack';
import Toast from '@/components/auth/Toast';
import SpotHero from '@/components/spot/SpotHero';
import SpotInfoHeader from '@/components/spot/SpotInfoHeader';
import SpotTabBar, { type SpotTabKey } from '@/components/spot/SpotTabBar';
import PhotogenicScoreCard from '@/components/spot/PhotogenicScoreCard';
import ConvenienceInfoSection, { MOCK_CONVENIENCE_INFO } from '@/components/spot/ConvenienceInfoSection';
import ChecklistSection from '@/components/spot/ChecklistSection';
import SpotWishlistBanner from '@/components/spot/SpotWishlistBanner';
import PhotoGridTab from '@/components/spot/PhotoGridTab';
import ReviewTab from '@/components/spot/ReviewTab';
import ChatTab from '@/components/spot/ChatTab';
import SaveToPlanSheet from '@/components/spot/SaveToPlanSheet';
import NaviSheet from '@/components/spot/NaviSheet';
import ShareSheet from '@/components/spot/ShareSheet';
import BookmarkSheet from '@/components/spot/BookmarkSheet';
import { BUTTON_RADIUS, GRID_PADDING, TAB_BAR_HEIGHT } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { PhotogenicScoreData, SpotDetailInfo } from '@/types/spot';

const MOCK_SPOT: SpotDetailInfo = {
  id: 'gwangalli',
  badge: '관광공사 인증',
  name: '광안리 해수욕장',
  address: '부산광역시 수영구 광안해변로 219',
  rating: 4.8,
  reviewCount: 324,
  photoCount: 1247,
  tags: ['#채광맛집', '#야경', '#바다', '#일출명소'],
  heroPhotoCount: 12,
};

const MOCK_PHOTOGENIC_SCORE: PhotogenicScoreData = {
  score: 87,
  maxScore: 100,
  grade: '매우 좋음',
  goldenHourMinutesLeft: 23,
  goldenHourTime: '오후 6:53',
  factors: [
    { key: 'weather', label: '날씨', value: '옅은 구름', score: 18, valueColor: '#000', iconBg: '#E8F3FF', iconColor: '#0071E3', barColor: '#0071E3', barPercent: 90 },
    { key: 'goldenHour', label: '골든아워', value: '23분 후', score: 20, valueColor: '#FF9F0A', iconBg: '#FFF3E0', iconColor: '#FF9500', barColor: '#FF9500', barPercent: 100 },
    { key: 'dust', label: '미세먼지', value: '좋음', score: 15, valueColor: '#34C759', iconBg: '#E8F5EB', iconColor: '#34C759', barColor: '#34C759', barPercent: 75 },
    // '시즌' 팩터는 단일 항목이 아니라 카테고리 슬롯 — 실제로는 벚꽃 개화율(봄)/단풍 절정(가을)/설경(겨울) 등
    // 여러 시즌별 지표 중 현재 날짜에 해당하는 것 하나만 노출되어야 함. 아래 값은 봄 시즌(벚꽃) 예시 하드코딩.
    // TODO: 시즌 API 연동 시 현재 날짜 기준으로 어떤 시즌 카테고리를 보여줄지 결정하는 로직 추가
    { key: 'season', label: '시즌 — 벚꽃 개화율', value: '92%', score: 20, valueColor: '#E31B59', iconBg: '#FFF0F3', iconColor: '#E31B59', barColor: '#E31B59', barPercent: 92, wide: true },
  ],
};

type Props = NativeStackScreenProps<SpotStackParamList, 'SpotDetail'>;

export default function SpotDetailScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  const [activeTab, setActiveTab] = useState<SpotTabKey>('info');
  const [photoLoadSignal, setPhotoLoadSignal] = useState(0);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [savedCollectionName, setSavedCollectionName] = useState('내 즐겨찾기');

  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [naviSheetVisible, setNaviSheetVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [bookmarkSheetVisible, setBookmarkSheetVisible] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // TEMP: 스켈레톤 UI 미리보기용 가짜 로딩 — 5초 뒤 자동으로 loading=false 처리
  // TODO(API 연동): 아래 useState(true) + setTimeout 블록을 통째로 지우고,
  //   편의정보 조회 useQuery(예: useConvenienceInfo(spotId))의 isLoading을 convenienceLoading 자리에 연결할 것.
  //   ConvenienceInfoSection의 loading prop 계약(아이콘/라벨 고정 노출, 값만 스켈레톤)은 그대로 유지.
  const [convenienceLoading, setConvenienceLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setConvenienceLoading(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  function showToast(message: string) {
    setToastMessage(message);
    setToastVisible(true);
  }

  function handleTabChange(tab: SpotTabKey) {
    setActiveTab(tab);
    scrollY.value = 0;
    if (tab !== 'chat') {
      scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }
  }

  function triggerPhotoLoadMore() {
    setPhotoLoadSignal((prev) => prev + 1);
  }

  const hasTriggeredLoadMore = useSharedValue(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const nearBottom =
        event.contentOffset.y + event.layoutMeasurement.height >= event.contentSize.height - 300;
      if (nearBottom) {
        if (!hasTriggeredLoadMore.value) {
          hasTriggeredLoadMore.value = true;
          runOnJS(triggerPhotoLoadMore)();
        }
      } else {
        hasTriggeredLoadMore.value = false;
      }
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {activeTab === 'chat' ? (
        <>
          <View style={{ paddingTop: insets.top, paddingHorizontal: normalize(12), paddingBottom: normalize(6) }}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={8}
              style={{ width: normalize(36), height: normalize(36), alignItems: 'center', justifyContent: 'center' }}
            >
              <IconChevronLeft size={normalize(20)} color="#000" strokeWidth={2} />
            </Pressable>
          </View>
          <SpotInfoHeader spot={MOCK_SPOT} />
          <SpotTabBar activeTab={activeTab} onChange={handleTabChange} />
          <View style={{ flex: 1, paddingBottom: insets.bottom }}>
            <ChatTab />
          </View>
        </>
      ) : (
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          stickyHeaderIndices={[2]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + insets.bottom }}
        >
          <SpotHero
            scrollY={scrollY}
            photoTotal={MOCK_SPOT.heroPhotoCount}
            isBookmarked={isBookmarked}
            onBack={() => navigation.goBack()}
            onShare={() => setShareSheetVisible(true)}
            onBookmark={() => setBookmarkSheetVisible(true)}
          />
          <SpotInfoHeader spot={MOCK_SPOT} />
          <SpotTabBar activeTab={activeTab} onChange={handleTabChange} />

          <View>
            {activeTab === 'info' && (
              <View>
                <PhotogenicScoreCard spotName={MOCK_SPOT.name} data={MOCK_PHOTOGENIC_SCORE} />
                <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: GRID_PADDING, marginVertical: normalize(24) }} />
                <ConvenienceInfoSection info={MOCK_CONVENIENCE_INFO} loading={convenienceLoading} />
                <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: GRID_PADDING, marginVertical: normalize(24) }} />
                <ChecklistSection />
                <View style={{ height: normalize(24) }} />
                <SpotWishlistBanner
                  onPress={() => {
                    // TODO: WishlistStack 연결 (스코프 밖 — 진입 경로는 후속 이슈에서 연결)
                  }}
                />
                <View style={{ height: normalize(24) }} />
                <View style={{ flexDirection: 'row', gap: normalize(12), paddingHorizontal: GRID_PADDING }}>
                  <Pressable
                    onPress={() => setSaveSheetVisible(true)}
                    style={{ flex: 1, height: normalize(52), borderRadius: BUTTON_RADIUS, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(16), color: '#000', letterSpacing: -0.2 }}>
                      코스에 저장
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setNaviSheetVisible(true)}
                    style={{ flex: 1, height: normalize(52), borderRadius: BUTTON_RADIUS, backgroundColor: '#E31B59', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(16), color: '#fff', letterSpacing: -0.2 }}>
                      바로 출발
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {activeTab === 'photo' && <PhotoGridTab loadMoreSignal={photoLoadSignal} />}

            {activeTab === 'review' && (
              <ReviewTab onWriteReview={() => navigation.navigate('ReviewWrite', { spotId: MOCK_SPOT.id })} />
            )}
          </View>
        </Animated.ScrollView>
      )}

      <SaveToPlanSheet
        visible={saveSheetVisible}
        onClose={() => setSaveSheetVisible(false)}
        onSaved={(message) => {
          setSaveSheetVisible(false);
          showToast(message);
        }}
      />
      <NaviSheet
        visible={naviSheetVisible}
        onClose={() => setNaviSheetVisible(false)}
        spotName={MOCK_SPOT.name}
        address={MOCK_SPOT.address}
        onLaunched={(message) => {
          setNaviSheetVisible(false);
          showToast(message);
        }}
      />
      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        onShared={(message) => showToast(message)}
      />
      <BookmarkSheet
        visible={bookmarkSheetVisible}
        onClose={() => setBookmarkSheetVisible(false)}
        isSaved={isBookmarked}
        spotName={MOCK_SPOT.name}
        savedCollectionName={savedCollectionName}
        onConfirm={(_id, name) => {
          setIsBookmarked(true);
          setSavedCollectionName(name);
          setBookmarkSheetVisible(false);
          showToast(`${name}에 저장됐어요`);
        }}
        onRemove={() => {
          setIsBookmarked(false);
          setBookmarkSheetVisible(false);
          showToast('즐겨찾기에서 제거됐어요');
        }}
        onViewFavorites={() => {
          setBookmarkSheetVisible(false);
          // TODO: MyPageStack 즐겨찾기 화면 연결 (스코프 밖)
        }}
      />

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}
