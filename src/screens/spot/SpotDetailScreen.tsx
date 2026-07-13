import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
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
import ConvenienceInfoSection from '@/components/spot/ConvenienceInfoSection';
import ChecklistSection from '@/components/spot/ChecklistSection';
import SpotWishlistBanner from '@/components/spot/SpotWishlistBanner';
import PhotoGridTab from '@/components/spot/PhotoGridTab';
import ReviewTab from '@/components/spot/ReviewTab';
import ChatTab from '@/components/spot/ChatTab';
import SaveToPlanSheet from '@/components/spot/SaveToPlanSheet';
import NaviSheet from '@/components/spot/NaviSheet';
import ShareSheet from '@/components/spot/ShareSheet';
import BookmarkSheet from '@/components/spot/BookmarkSheet';
import { useBookmarkCollections, useSpotDetail } from '@/hooks/useSpot';
import { BUTTON_RADIUS, GRID_PADDING, TAB_BAR_HEIGHT } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

// 히어로 이미지 갤러리는 사진 탭 담당자 스코프 — 실제 이미지 연동 전까지 플레이스홀더 페이지 수.
// TODO(사진 API): GET /spots/{id}/photos 연동 시 실제 이미지/개수로 대체.
const HERO_PLACEHOLDER_PAGES = 5;

type Props = NativeStackScreenProps<SpotStackParamList, 'SpotDetail'>;

export default function SpotDetailScreen({ navigation, route }: Props) {
  const { spotId } = route.params;
  const insets = useSafeAreaInsets();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  const { data: detail, isLoading, isError, refetch } = useSpotDetail(spotId);
  const spot = detail?.info;
  const convenience = detail?.convenience;

  const [activeTab, setActiveTab] = useState<SpotTabKey>('info');
  const [photoLoadSignal, setPhotoLoadSignal] = useState(0);
  // 채팅 입력창 포커스 시 SpotInfoHeader를 접어 메시지 영역 확보
  const [chatInputFocused, setChatInputFocused] = useState(false);

  // 별표 상태 = 이 스팟이 1개 이상 컬렉션에 소속 (시트와 같은 쿼리키 공유)
  const { data: bookmarkCollections } = useBookmarkCollections(spotId);
  const isBookmarked = bookmarkCollections?.some((c) => c.contains) ?? false;

  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [naviSheetVisible, setNaviSheetVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [bookmarkSheetVisible, setBookmarkSheetVisible] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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

  function BackButton() {
    return (
      <View style={{ paddingTop: insets.top, paddingHorizontal: normalize(12), paddingBottom: normalize(6) }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{ width: normalize(36), height: normalize(36), alignItems: 'center', justifyContent: 'center' }}
        >
          <IconChevronLeft size={normalize(20)} color="#000" strokeWidth={2} />
        </Pressable>
      </View>
    );
  }

  // ── 로딩 / 에러 게이트 ──
  if (isLoading || !spot || !convenience) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <BackButton />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {isError ? (
            <View style={{ alignItems: 'center', gap: normalize(12), paddingHorizontal: GRID_PADDING }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(15), color: 'rgba(0,0,0,0.5)', letterSpacing: -0.2, textAlign: 'center' }}>
                스팟 정보를 불러오지 못했어요.
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={{ height: normalize(44), paddingHorizontal: normalize(24), borderRadius: BUTTON_RADIUS, backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2 }}>
                  다시 시도
                </Text>
              </Pressable>
            </View>
          ) : (
            <ActivityIndicator color="#E31B59" />
          )}
        </View>
        <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {activeTab === 'chat' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <BackButton />
          {!chatInputFocused && <SpotInfoHeader spot={spot} />}
          <SpotTabBar activeTab={activeTab} onChange={handleTabChange} />
          <View style={{ flex: 1, paddingBottom: insets.bottom }}>
            <ChatTab onFocusChange={setChatInputFocused} />
          </View>
        </KeyboardAvoidingView>
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
            photoTotal={HERO_PLACEHOLDER_PAGES}
            isBookmarked={isBookmarked}
            onBack={() => navigation.goBack()}
            onShare={() => setShareSheetVisible(true)}
            onBookmark={() => setBookmarkSheetVisible(true)}
          />
          <SpotInfoHeader spot={spot} />
          <SpotTabBar activeTab={activeTab} onChange={handleTabChange} />

          <View>
            {activeTab === 'info' && (
              <View>
                <PhotogenicScoreCard spotId={spot.id} spotName={spot.name} />
                <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: GRID_PADDING, marginVertical: normalize(24) }} />
                <ConvenienceInfoSection info={convenience} />
                <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: GRID_PADDING, marginVertical: normalize(24) }} />
                <ChecklistSection spotId={spot.id} />
                <View style={{ height: normalize(24) }} />
                <SpotWishlistBanner
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('Wishlist');
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
              <ReviewTab spotId={spot.id} onWriteReview={() => navigation.navigate('ReviewWrite', { spotId: spot.id })} />
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
        spotName={spot.name}
        address={spot.address}
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
        spotId={spotId}
        onClose={() => setBookmarkSheetVisible(false)}
        onSaved={(count) => {
          setBookmarkSheetVisible(false);
          showToast(count > 0 ? `${count}개 컬렉션에 저장됐어요` : '즐겨찾기에서 제거됐어요');
        }}
      />

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}
