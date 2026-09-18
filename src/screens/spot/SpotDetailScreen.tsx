import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useSharedValue, runOnJS } from 'react-native-reanimated';
import { IconBell, IconCalendarEvent, IconChevronLeft, IconClock } from '@tabler/icons-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SpotStackParamList } from '@/navigation/stacks/SpotStack';
import Toast from '@/components/common/Toast';
import SpotHero from '@/components/spot/SpotHero';
import SpotInfoHeader from '@/components/spot/SpotInfoHeader';
import SpotTabBar, { type SpotTabKey } from '@/components/spot/SpotTabBar';
import PhotogenicScoreCard from '@/components/spot/PhotogenicScoreCard';
import SpotCongestionCard from '@/components/spot/SpotCongestionCard';
import ConvenienceInfoSection from '@/components/spot/ConvenienceInfoSection';
import RelatedSpotsCard from '@/components/spot/RelatedSpotsCard';
import LinkBanner from '@/components/common/LinkBanner';
import PhotoGridTab from '@/components/spot/PhotoGridTab';
import ReviewTab from '@/components/spot/ReviewTab';
import ChatTab from '@/components/spot/ChatTab';
import SaveToPlanSheet from '@/components/spot/SaveToPlanSheet';
import NaviSheet from '@/components/spot/NaviSheet';
import BookmarkSheet from '@/components/spot/BookmarkSheet';
import PhotoLightbox from '@/components/spot/PhotoLightbox';
import { useBookmarkCollections, useSpotDetail, useSpotPhotogenicScore, useSpotPhotos, useSpotSummary } from '@/hooks/useSpot';
import { useFestival } from '@/hooks/useFestival';
import { useKeyboardOverlap } from '@/hooks/useKeyboardHeight';
import { exifFromPhotoUrl, toHttps } from '@/utils/spotMappers';
import { BUTTON_RADIUS, FONT_TITLE, GRID_PADDING, HAIRLINE_WIDTH, SPACING_LG } from '@/constants/layout';
import { shareContent } from '@/utils/share';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<SpotStackParamList, 'SpotDetail'>;

export default function SpotDetailScreen({ navigation, route }: Props) {
  const { spotId, initialDate } = route.params;
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  const [selectedPlanDate, setSelectedPlanDate] = useState<string | undefined>(initialDate);

  const dateDiffDays = useMemo(() => {
    if (!selectedPlanDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(selectedPlanDate);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [selectedPlanDate]);

  const { data: detail, isLoading, isError, refetch } = useSpotDetail(spotId);
  const spot = detail?.info;
  const convenience = detail?.convenience;
  const { data: summary } = useSpotSummary(spotId);
  const { data: photogenic } = useSpotPhotogenicScore(spotId);
  const { data: heroPhotos } = useSpotPhotos(spotId);

  const isFestival = spot?.categories?.includes('FESTIVAL');
  const { data: festival } = useFestival(spotId, { enabled: !!isFestival });

  // 히어로에 보이는 대표 이미지가 항상 뷰어의 1번째 사진이 되도록 맨 앞에 고정 + 갤러리(유저 업로드 제외) 나머지를 뒤에 이어붙임.
  // 갤러리 API가 비어있거나 로딩 중이어도 대표 이미지 1장은 항상 풀스크린으로 볼 수 있게 fallback.
  // Set으로 대표 이미지뿐 아니라 갤러리 내부 중복 URL까지 제거 (뷰어 중복 페이지·카운터 부풀림 방지)
  const viewerPhotos = Array.from(
    new Set([...(spot?.imageUrl ? [spot.imageUrl] : []), ...(heroPhotos ?? [])]),
  );
  // 스팟 사진은 서버에 EXIF가 없어 URL에서 뽑히는 파일명·형식만 채운다.
  const viewerExifs = viewerPhotos.map(exifFromPhotoUrl);
  const [photoViewerVisible, setPhotoViewerVisible] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);

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

  const eventPeriodData =
    festival?.eventStartDate && festival?.eventEndDate
      ? {
          startDate: festival.eventStartDate,
          endDate: festival.eventEndDate,
          status: festival.progressStatus,
        }
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
          {!chatInputFocused && <SpotInfoHeader spot={spot} bookmarkCount={summary?.bookmarkCount} eventPeriod={eventPeriodData} />}
          <SpotTabBar activeTab={activeTab} onChange={handleTabChange} />
          <View style={{ flex: 1, paddingBottom: keyboardOverlap || insets.bottom }}>
            <ChatTab
              spotId={Number(spot.id)}
              spotName={spot.name}
              onFocusChange={setChatInputFocused}
            />
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
            photos={viewerPhotos}
            onPressPhoto={
              viewerPhotos.length
                ? (i) => {
                    setPhotoViewerIndex(i);
                    setPhotoViewerVisible(true);
                  }
                : undefined
            }
            onBack={() => navigation.goBack()}
            onShare={handleShare}
            onBookmark={() => setBookmarkSheetVisible(true)}
          />
          <SpotInfoHeader spot={spot} bookmarkCount={summary?.bookmarkCount} photoCount={viewerPhotos.length} eventPeriod={eventPeriodData} />
          <SpotTabBar activeTab={activeTab} onChange={handleTabChange} />

          <View>
            {activeTab === 'info' && (
              <View>
                {/* 코스에서 날짜를 지정하여 진입했을 때 상단 안내 배너 */}
                {selectedPlanDate && (
                  <View
                    style={{
                      marginHorizontal: GRID_PADDING,
                      marginTop: normalize(16),
                      marginBottom: normalize(4),
                      backgroundColor: '#F0F5FA',
                      borderRadius: normalize(14),
                      paddingVertical: normalize(10),
                      paddingHorizontal: normalize(14),
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), flex: 1 }}>
                      <IconCalendarEvent size={normalize(16)} color={BRAND} strokeWidth={2} />
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Pretendard-Medium',
                          fontSize: normalizeFontSize(13),
                          color: '#333',
                        }}
                      >
                        선택한 코스 일정 ({selectedPlanDate}) 기준
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setSelectedPlanDate(undefined)}
                      hitSlop={8}
                      style={{
                        paddingVertical: normalize(4),
                        paddingHorizontal: normalize(8),
                        borderRadius: normalize(6),
                        backgroundColor: '#fff',
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Pretendard-Medium',
                          fontSize: normalizeFontSize(11.5),
                          color: TEXT_SUB,
                        }}
                      >
                        오늘 기준
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* D+0 ~ D+2: 단기예보 범위 (포토제닉 점수 + 혼잡도) */}
                {(!selectedPlanDate || (dateDiffDays >= 0 && dateDiffDays <= 2)) && (
                  <>
                    <PhotogenicScoreCard spotId={spot.id} spotName={spot.name} initialDate={selectedPlanDate} />
                    <SpotCongestionCard
                      spotId={spot.id}
                      spotName={spot.name}
                      targetDate={selectedPlanDate}
                    />
                  </>
                )}

                {/* D+3 ~ D+30: 중기 범위 (단기예보 준비 중 안내 + 30일 집중률 혼잡도 핵심 표시) */}
                {selectedPlanDate && dateDiffDays >= 3 && dateDiffDays <= 30 && (
                  <>
                    <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(20) }}>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Pretendard-SemiBold',
                          fontSize: FONT_TITLE,
                          color: '#000',
                          letterSpacing: -0.4,
                          marginBottom: normalize(12),
                        }}
                      >
                        포토제닉 지수
                      </Text>
                      <View
                        style={{
                          backgroundColor: CARD,
                          borderRadius: normalize(20),
                          padding: normalize(20),
                          alignItems: 'center',
                        }}
                      >
                        <View
                          style={{
                            width: normalize(44),
                            height: normalize(44),
                            borderRadius: normalize(22),
                            backgroundColor: BRAND_TINT,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: normalize(10),
                          }}
                        >
                          <IconClock size={normalize(22)} color={BRAND} strokeWidth={2} />
                        </View>
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Pretendard-SemiBold',
                            fontSize: normalizeFontSize(15),
                            color: '#000',
                            marginBottom: normalize(4),
                          }}
                        >
                          방문 3일 전부터 날씨 예보가 제공돼요
                        </Text>
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Pretendard-Regular',
                            fontSize: normalizeFontSize(13),
                            color: TEXT_SUB,
                            textAlign: 'center',
                            lineHeight: normalize(18),
                          }}
                        >
                          선택하신 일정({selectedPlanDate})은 기상청 단기예보 범위 외 일정이에요.{'\n'}
                          아래의 30일 빅데이터 혼잡도 추이를 확인해 보세요!
                        </Text>
                      </View>
                    </View>

                    <SpotCongestionCard
                      spotId={spot.id}
                      spotName={spot.name}
                      targetDate={selectedPlanDate}
                    />
                  </>
                )}

                {/* D+31 이상 또는 과거 일정: 예보 및 혼잡도 범위 초과 안내 */}
                {selectedPlanDate && (dateDiffDays > 30 || dateDiffDays < 0) && (
                  <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(20) }}>
                    <View
                      style={{
                        backgroundColor: CARD,
                        borderRadius: normalize(20),
                        padding: normalize(22),
                        alignItems: 'center',
                      }}
                    >
                      <IconCalendarEvent size={normalize(28)} color="rgba(0,0,0,0.3)" strokeWidth={1.8} />
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Pretendard-SemiBold',
                          fontSize: normalizeFontSize(15),
                          color: '#000',
                          marginTop: normalize(10),
                          marginBottom: normalize(4),
                        }}
                      >
                        출사 예측 범위 외 일정이에요
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Pretendard-Regular',
                          fontSize: normalizeFontSize(13),
                          color: TEXT_SUB,
                          textAlign: 'center',
                          lineHeight: normalize(18),
                          marginBottom: normalize(14),
                        }}
                      >
                        선택하신 일정({selectedPlanDate})은 장기 일정이에요.{'\n'}
                        날씨 예보는 방문 3일 전부터, 혼잡도 예측은 30일 전부터 확인하실 수 있어요.
                      </Text>
                      <Pressable
                        onPress={() => setSelectedPlanDate(undefined)}
                        style={{
                          paddingHorizontal: normalize(16),
                          paddingVertical: normalize(10),
                          borderRadius: normalize(10),
                          backgroundColor: '#000',
                        }}
                      >
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Pretendard-Medium',
                            fontSize: normalizeFontSize(13),
                            color: '#fff',
                          }}
                        >
                          오늘 날씨 및 스팟 정보 보기
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* 관광사진 공모전 수상작 레퍼런스 카드 (해당 스팟 수상작 존재 시 노출) */}
                {spot.photoAward && (
                  <View style={{ marginHorizontal: GRID_PADDING, marginTop: normalize(20) }}>
                    <View
                      style={{
                        backgroundColor: CARD,
                        borderRadius: normalize(16),
                        padding: normalize(16),
                        borderWidth: HAIRLINE_WIDTH,
                        borderColor: HAIRLINE,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), marginBottom: normalize(10) }}>
                        <View style={{ backgroundColor: BRAND_TINT, paddingHorizontal: normalize(8), paddingVertical: normalize(4), borderRadius: normalize(6) }}>
                          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(11.5), color: BRAND }}>
                            대한민국 관광공모전 {spot.photoAward.awardName ? `· ${spot.photoAward.awardName}` : '수상작'}
                          </Text>
                        </View>
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(12), color: TEXT_SUB }}>
                          공식 레퍼런스
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: normalize(14) }}>
                        {toHttps(spot.photoAward.imageUrl || spot.photoAward.thumbnailUrl) ? (
                          <Image
                            source={{ uri: toHttps(spot.photoAward.imageUrl || spot.photoAward.thumbnailUrl)! }}
                            style={{ width: normalize(84), height: normalize(84), borderRadius: normalize(10), backgroundColor: '#f0f0f0' }}
                            resizeMode="cover"
                          />
                        ) : null}

                        <View style={{ flex: 1, justifyContent: 'center' }}>
                          <Text
                            allowFontScaling={false}
                            numberOfLines={1}
                            style={{ fontFamily: 'Pretendard-Bold', fontSize: normalizeFontSize(14.5), color: '#222', marginBottom: normalize(4) }}
                          >
                            {spot.photoAward.title}
                          </Text>
                          {spot.photoAward.photographer && (
                            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12.5), color: TEXT_SUB, marginBottom: normalize(2) }}>
                              촬영: {spot.photoAward.photographer}
                            </Text>
                          )}
                          {spot.photoAward.awardYearMonth && (
                            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(11.5), color: TEXT_SUB, marginBottom: normalize(4) }}>
                              촬영연월: {spot.photoAward.awardYearMonth}
                            </Text>
                          )}
                          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(10.5), color: '#999' }}>
                            {spot.photoAward.copyrightNotice}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: GRID_PADDING, marginVertical: normalize(24) }} />
                <ConvenienceInfoSection
                  info={convenience}
                  eventPeriod={eventPeriodData}
                />
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
                <RelatedSpotsCard
                  spotId={spot.id}
                  spotName={spot.name}
                  onViewAll={() => navigation.navigate('RelatedSpots', { spotId: spot.id, spotName: spot.name })}
                  onSpotPress={(id) => navigation.push('SpotDetail', { spotId: id })}
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
                {/* 데이터 출처 표기 */}
                <View style={{ marginTop: normalize(24), marginBottom: normalize(8), alignItems: 'center' }}>
                  <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(12), fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.35)', letterSpacing: -0.2 }}>
                    출처: ⓒ한국관광공사
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'photo' && <PhotoGridTab spotId={spotId} loadMoreSignal={photoLoadSignal} />}

            {activeTab === 'review' && (
              <ReviewTab
                spotId={spot.id}
                onWriteReview={() => navigation.navigate('ReviewWrite', { spotId: spot.id })}
                onEditReview={(edit) => navigation.navigate('ReviewWrite', { spotId: spot.id, edit })}
                onNotify={showToast}
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
        initialIndex={photoViewerIndex}
        onClose={() => setPhotoViewerVisible(false)}
      />

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}
