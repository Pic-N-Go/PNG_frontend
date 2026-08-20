import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue, runOnJS } from 'react-native-reanimated';
import { IconBell, IconChevronLeft } from '@tabler/icons-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SpotStackParamList } from '@/navigation/stacks/SpotStack';
import Toast from '@/components/common/Toast';
import SpotHero from '@/components/spot/SpotHero';
import SpotInfoHeader from '@/components/spot/SpotInfoHeader';
import SpotTabBar, { type SpotTabKey } from '@/components/spot/SpotTabBar';
import PhotogenicScoreCard from '@/components/spot/PhotogenicScoreCard';
import ConvenienceInfoSection from '@/components/spot/ConvenienceInfoSection';
import LinkBanner from '@/components/common/LinkBanner';
import PhotoGridTab from '@/components/spot/PhotoGridTab';
import ReviewTab from '@/components/spot/ReviewTab';
import ChatTab from '@/components/spot/ChatTab';
import SaveToPlanSheet from '@/components/spot/SaveToPlanSheet';
import NaviSheet from '@/components/spot/NaviSheet';
import BookmarkSheet from '@/components/spot/BookmarkSheet';
import PhotoLightbox from '@/components/spot/PhotoLightbox';
import { useBookmarkCollections, useSpotDetail, useSpotPhotogenicScore, useSpotPhotos } from '@/hooks/useSpot';
import { useKeyboardOverlap } from '@/hooks/useKeyboardHeight';
import { exifFromPhotoUrl } from '@/utils/spotMappers';
import { BUTTON_RADIUS, GRID_PADDING, SPACING_LG } from '@/constants/layout';
import { shareContent } from '@/utils/share';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BRAND, CARD } from '@/constants/colors';

type Props = NativeStackScreenProps<SpotStackParamList, 'SpotDetail'>;

export default function SpotDetailScreen({ navigation, route }: Props) {
  const { spotId } = route.params;
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  const { data: detail, isLoading, isError, refetch } = useSpotDetail(spotId);
  const spot = detail?.info;
  const convenience = detail?.convenience;
  const { data: photogenic } = useSpotPhotogenicScore(spotId);
  const { data: heroPhotos } = useSpotPhotos(spotId);
  // 히어로에 보이는 대표 이미지가 항상 뷰어의 1번째 사진이 되도록 맨 앞에 고정 + 갤러리(유저 업로드 제외) 나머지를 뒤에 이어붙임.
  // 갤러리 API가 비어있거나 로딩 중이어도 대표 이미지 1장은 항상 풀스크린으로 볼 수 있게 fallback.
  // Set으로 대표 이미지뿐 아니라 갤러리 내부 중복 URL까지 제거 (뷰어 중복 페이지·카운터 부풀림 방지)
  const viewerPhotos = Array.from(
    new Set([...(spot?.imageUrl ? [spot.imageUrl] : []), ...(heroPhotos ?? [])]),
  );
  // 스팟 사진은 서버에 EXIF가 없어 URL에서 뽑히는 파일명·형식만 채운다.
  const viewerExifs = viewerPhotos.map(exifFromPhotoUrl);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);

  const [activeTab, setActiveTab] = useState<SpotTabKey>('info');
  const [photoLoadSignal, setPhotoLoadSignal] = useState(0);
  // 채팅 입력창 포커스 시 SpotInfoHeader를 접어 메시지 영역 확보
  const [chatInputFocused, setChatInputFocused] = useState(false);

  // 별표 상태 = 이 스팟이 1개 이상 컬렉션에 소속 (시트와 같은 쿼리키 공유)
  const { data: bookmarkCollections } = useBookmarkCollections(spotId);
  const isBookmarked = bookmarkCollections?.some((c) => c.contains) ?? false;

  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [naviSheetVisible, setNaviSheetVisible] = useState(false);
  const [bookmarkSheetVisible, setBookmarkSheetVisible] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  function showToast(message: string) {
    setToastMessage(message);
    setToastVisible(true);
  }

  // 공유할 웹 URL이 없어 텍스트만 보낸다. 스팟 웹 페이지·딥링크가 생기면 url을 함께 넘긴다.
  async function handleShare() {
    if (!spot) return;
    const ok = await shareContent({
      title: spot.name,
      message: [spot.name, spot.address].filter(Boolean).join('\n'),
    });
    // 성공 토스트는 띄우지 않는다 — Android는 취소해도 성공으로 오므로 거짓이 된다.
    if (!ok) showToast('공유 화면을 열지 못했어요');
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

  // ponytail: 컴포넌트 내부 컴포넌트 선언은 리렌더마다 재마운트 → 헬퍼 함수로
  const renderBackButton = () => (
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

  // ── 로딩 / 에러 게이트 ──
  if (isLoading || !spot || !convenience) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {renderBackButton()}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {isError ? (
            <View style={{ alignItems: 'center', gap: normalize(12), paddingHorizontal: GRID_PADDING }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(15), color: 'rgba(0,0,0,0.5)', letterSpacing: -0.2, textAlign: 'center' }}>
                스팟 정보를 불러오지 못했어요.
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={{ height: normalize(44), paddingHorizontal: normalize(24), borderRadius: BUTTON_RADIUS, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2 }}>
                  다시 시도
                </Text>
              </Pressable>
            </View>
          ) : (
            <ActivityIndicator color={BRAND} />
          )}
        </View>
        <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
      </View>
    );
  }

  // 길안내 좌표는 보정 좌표(navigation)를 우선 사용한다. 0도 유효한 좌표라 falsy 체크 대신 isFinite로 검증.
  const naviLat = spot.navigation?.latitude ?? spot.latitude;
  const naviLng = spot.navigation?.longitude ?? spot.longitude;
  const naviSpots = Number.isFinite(naviLat) && Number.isFinite(naviLng)
    ? [{
        name: spot.navigation?.name || spot.name,
        latitude: naviLat as number,
        longitude: naviLng as number,
        navigation: spot.navigation,
      }]
    : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {activeTab === 'chat' ? (
        // KeyboardAvoidingView를 쓰지 않는다 — Android의 KAV는 축소량이 정확하지 않고 키보드를
        // 닫을 때 직전 값이 남는다. useKeyboardOverlap은 화면 하단부터 키보드 상단까지를 직접 재므로
        // 열림·닫힘 양쪽이 확정적이다(기준 설명은 그 훅의 주석).
        // 키보드가 열렸으면 insets.bottom을 쓰지 않는다 — 내비바 구간이 overlap에 이미 포함돼 있다.
        <View style={{ flex: 1 }}>
          {renderBackButton()}
          {!chatInputFocused && <SpotInfoHeader spot={spot} />}
          <SpotTabBar activeTab={activeTab} onChange={handleTabChange} />
          <View style={{ flex: 1, paddingBottom: keyboardOverlap || insets.bottom }}>
            <ChatTab onFocusChange={setChatInputFocused} />
          </View>
        </View>
      ) : (
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          stickyHeaderIndices={[2]}
          showsVerticalScrollIndicator={false}
          // TAB_BAR_HEIGHT를 더하지 않는다 — SpotStack은 MainTab의 형제라(navigation/index.tsx)
          // 이 화면에서는 탭바가 가려져 보이지 않는다. 더하면 없는 탭바 자리로 80dp가 비어,
          // 리뷰 탭 CTA 아래에 커다란 흰 공백이 생긴다. 필요한 건 시스템 내비바·홈 인디케이터를
          // 피하는 인셋과 최소 여백뿐이다.
          contentContainerStyle={{ paddingBottom: SPACING_LG + insets.bottom }}
        >
          <SpotHero
            scrollY={scrollY}
            isBookmarked={isBookmarked}
            imageUrl={spot.imageUrl}
            categories={spot.categories}
            regionLabel={spot.regionLabel}
            heroPhotoCount={viewerPhotos.length}
            onPressPhoto={viewerPhotos.length ? () => setPhotoViewerVisible(true) : undefined}
            onBack={() => navigation.goBack()}
            onShare={handleShare}
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
                <View style={{ height: normalize(24) }} />
                <LinkBanner
                  icon={IconBell}
                  title="출사 알림 조건 설정"
                  subtitle="원하는 날씨가 되면 알려드려요"
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('WishlistSetting', { 
                      newSpot: {
                        id: spot.id,
                        name: spot.name,
                        loc: spot.regionLabel ?? '',
                        score: photogenic?.score ?? 0,
                      }
                    });
                  }}
                />
                <View style={{ height: normalize(24) }} />
                <View style={{ flexDirection: 'row', gap: normalize(12), paddingHorizontal: GRID_PADDING }}>
                  <Pressable
                    onPress={() => setSaveSheetVisible(true)}
                    style={{ flex: 1, height: normalize(52), borderRadius: BUTTON_RADIUS, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(16), color: '#000', letterSpacing: -0.2 }}>
                      코스에 저장
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setNaviSheetVisible(true)}
                    style={{ flex: 1, height: normalize(52), borderRadius: BUTTON_RADIUS, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' }}
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
              <ReviewTab
                spotId={spot.id}
                onWriteReview={() => navigation.navigate('ReviewWrite', { spotId: spot.id })}
                onEditReview={(edit) => navigation.navigate('ReviewWrite', { spotId: spot.id, edit })}
              />
            )}
          </View>
        </Animated.ScrollView>
      )}

      <SaveToPlanSheet
        visible={saveSheetVisible}
        onClose={() => setSaveSheetVisible(false)}
        spot={spot}
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
        navigation={spot.navigation}
        spots={naviSpots}
        onLaunched={(message) => {
          setNaviSheetVisible(false);
          showToast(message);
        }}
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

      <PhotoLightbox
        visible={photoViewerVisible}
        photos={viewerPhotos}
        exifs={viewerExifs}
        initialIndex={0}
        onClose={() => setPhotoViewerVisible(false)}
      />

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}
