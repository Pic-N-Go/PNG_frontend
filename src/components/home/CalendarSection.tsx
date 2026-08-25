import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_MD, FONT_SM, FONT_TITLE, GRID_PADDING, SPACING_XS } from '@/constants/layout';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';
import { useFestivals } from '@/hooks/useFestival';
import { useSpots } from '@/hooks/useSpot';
import { regionLabelFrom } from '@/utils/spotMappers';
import Skeleton from '@/components/common/Skeleton';
import { SPOT_CATEGORY_MAP } from '@/constants/spotCategories';

interface Props {
  onEventPress?: (id: string) => void;
  onViewAll?: () => void;
}

interface SeasonThemeConfig {
  seasonTitle: string;
  seasonDate: string;
  seasonCategory: string;
  categoryLabel: string;
  defaultPlace: string;
  defaultTip: string;
}

function getCurrentSeasonTheme(): SeasonThemeConfig {
  const month = new Date().getMonth() + 1; // 1 ~ 12
  if (month >= 3 && month <= 5) {
    return {
      seasonTitle: '꽃 · 벚꽃 시즌',
      seasonDate: `${month}월 중 · 오전 촬영 추천`,
      seasonCategory: 'FLOWER',
      categoryLabel: '꽃 · 벚꽃',
      defaultPlace: '전국 벚꽃 & 봄꽃 명소',
      defaultTip: '만개 시기 · 햇살 좋은 날 추천',
    };
  }
  if (month >= 6 && month <= 8) {
    return {
      seasonTitle: '은하수 & 야경 시즌',
      seasonDate: `${month}월 중 · 밤 10시 ~ 새벽`,
      seasonCategory: 'MILKY_WAY',
      categoryLabel: '은하수 · 별',
      defaultPlace: '영월 별마로천문대 / 강릉 안반데기',
      defaultTip: '달 없는 맑은 밤 · 삼각대 필수',
    };
  }
  if (month >= 9 && month <= 11) {
    return {
      seasonTitle: '단풍 & 갈대밭 시즌',
      seasonDate: `${month}월 중 · 오후 골든아워`,
      seasonCategory: 'FOREST',
      categoryLabel: '숲 · 수목원',
      defaultPlace: '순천만 습지 / 화담숲',
      defaultTip: '일몰 1시간 전 · 따뜻한 색감',
    };
  }
  // 12 ~ 2월
  return {
    seasonTitle: '일출 & 설경 시즌',
    seasonDate: `${month}월 중 · 매일 아침 일출 시`,
    seasonCategory: 'SUNRISE_SUNSET',
    categoryLabel: '일출 · 일몰',
    defaultPlace: '정동진 / 덕유산 설경',
    defaultTip: '일출 30분 전 · 방한 준비 필수',
  };
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return '상시 진행';
  if (!endDate || startDate === endDate) {
    return startDate.replace(/-/g, '.');
  }
  const [sy, sm, sd] = startDate.split('-');
  const [ey, em, ed] = endDate.split('-');
  if (sy && ey && sy === ey) {
    return `${sy}.${sm}.${sd} ~ ${em}.${ed}`;
  }
  return `${startDate.replace(/-/g, '.')} ~ ${endDate.replace(/-/g, '.')}`;
}

const CARD_WIDTH = normalize(210);

export default function CalendarSection({ onEventPress, onViewAll }: Props) {
  const seasonConfig = React.useMemo(() => getCurrentSeasonTheme(), []);

  // 1. 축제 API 조회 (진행중 및 개최예정 축제)
  const { data: ongoingData, isLoading: isOngoingLoading } = useFestivals({ status: 'ONGOING', size: 10 });
  const { data: upcomingData, isLoading: isUpcomingLoading } = useFestivals({ status: 'UPCOMING', size: 10 });

  // 2. 현재 시즌 테마에 맞는 인기 스팟 조회
  const { data: seasonSpotData, isLoading: isSeasonLoading } = useSpots({
    category: seasonConfig.seasonCategory,
    sort: 'popular',
    size: 1,
  });

  const isLoading = isOngoingLoading || isUpcomingLoading || isSeasonLoading;

  // 축제 아이템들 선별 (상위 4개)
  const festivalList = React.useMemo(() => {
    const list = [...(ongoingData?.content ?? []), ...(upcomingData?.content ?? [])];
    const seen = new Set<number>();
    const unique = list.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    const sorted = unique.sort((a, b) => {
      const hasDateA = a.eventStartDate ? 1 : 0;
      const hasDateB = b.eventStartDate ? 1 : 0;
      if (hasDateA !== hasDateB) return hasDateB - hasDateA;
      const order: Record<string, number> = { ONGOING: 0, UPCOMING: 1, UNKNOWN: 2, ENDED: 3 };
      return (order[a.progressStatus] ?? 99) - (order[b.progressStatus] ?? 99);
    });

    return sorted.slice(0, 4);
  }, [ongoingData?.content, upcomingData?.content]);

  // 시즌 스팟 아이템
  const topSeasonSpot = seasonSpotData?.content?.[0] || null;

  return (
    <View style={{ marginTop: normalize(28) }}>
      {/* 헤더 */}
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: SPACING_XS,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, color: '#000', letterSpacing: -0.4 }}
          >
            이달의 출사 캘린더
          </Text>
          {onViewAll && (
            <Pressable onPress={onViewAll} hitSlop={8}>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: BRAND }}
              >
                모두 보기
              </Text>
            </Pressable>
          )}
        </View>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: FONT_SM,
            color: TEXT_SUB,
            letterSpacing: -0.1,
            marginBottom: normalize(14),
          }}
        >
          시기별 추천 축제와 포토스팟을 놓치지 마세요
        </Text>
      </View>

      {/* 가로 횡 스크롤 카드 목록 */}
      {isLoading ? (
        <View style={{ flexDirection: 'row', gap: normalize(12), paddingHorizontal: GRID_PADDING }}>
          <View style={{ width: CARD_WIDTH }}>
            <Skeleton width="100%" height={normalize(180)} borderRadius={CARD_RADIUS} />
          </View>
          <View style={{ width: CARD_WIDTH }}>
            <Skeleton width="100%" height={normalize(180)} borderRadius={CARD_RADIUS} />
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, gap: normalize(12) }}
        >
          {/* 1번 카드: 이달의 시즌 테마 스팟 */}
          <View style={{ width: CARD_WIDTH, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: CARD }}>
            <Pressable
              onPress={topSeasonSpot && onEventPress ? () => onEventPress(String(topSeasonSpot.id)) : undefined}
              android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
            >
              {/* 헤더 */}
              <View style={{ backgroundColor: '#1d1d1f', paddingVertical: normalize(10), paddingHorizontal: normalize(14) }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: normalizeFontSize(10),
                    color: 'rgba(255,255,255,0.65)',
                    letterSpacing: 0.5,
                    marginBottom: normalize(4),
                  }}
                  numberOfLines={1}
                >
                  {seasonConfig.seasonDate}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-SemiBold',
                    fontSize: FONT_MD,
                    color: '#fff',
                  }}
                  numberOfLines={1}
                >
                  {seasonConfig.seasonTitle}
                </Text>
              </View>

              {/* 바디 */}
              <View style={{ paddingTop: normalize(12), paddingHorizontal: normalize(14), paddingBottom: normalize(14) }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Medium',
                    fontSize: FONT_SM,
                    color: '#000',
                    marginBottom: normalize(2),
                  }}
                  numberOfLines={1}
                >
                  {topSeasonSpot ? topSeasonSpot.name : seasonConfig.defaultPlace}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Regular',
                    fontSize: normalizeFontSize(12),
                    color: TEXT_SUB,
                    marginBottom: normalize(10),
                  }}
                  numberOfLines={1}
                >
                  {topSeasonSpot?.address ? (regionLabelFrom(topSeasonSpot.address) || topSeasonSpot.address) : seasonConfig.defaultTip}
                </Text>

                {/* 테마 뱃지 */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: normalize(30),
                    paddingHorizontal: normalize(10),
                    borderRadius: normalize(8),
                    backgroundColor: '#fff',
                    marginBottom: normalize(8),
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(11), color: TEXT_SUB }}
                  >
                    추천 테마
                  </Text>
                  <View style={{ backgroundColor: 'rgba(227, 27, 89, 0.1)', paddingHorizontal: normalize(6), paddingVertical: normalize(2), borderRadius: normalize(4) }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: normalizeFontSize(11),
                        color: BRAND,
                      }}
                    >
                      이달의 테마
                    </Text>
                  </View>
                </View>

                {/* 카테고리 태그 */}
                <View
                  style={{
                    alignSelf: 'flex-start',
                    height: normalize(22),
                    paddingHorizontal: normalize(8),
                    borderRadius: normalize(11),
                    backgroundColor: '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Pretendard-Regular',
                      fontSize: normalizeFontSize(10),
                      color: TEXT_SUB,
                    }}
                    numberOfLines={1}
                  >
                    {seasonConfig.categoryLabel}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          {/* 2~5번 카드: 전국 축제 & 행사 카드들 */}
          {festivalList.map((festival) => {
            const isOngoing = festival.progressStatus === 'ONGOING';
            const statusLabel = isOngoing ? '진행중' : '개최예정';
            const statusColor = isOngoing ? '#34c759' : '#007aff';
            const statusBg = isOngoing ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)';
            const location = regionLabelFrom(festival.address) || festival.address || '전국';
            const categoryTag = festival.categories?.map((c: string) => SPOT_CATEGORY_MAP[c]?.label).filter(Boolean).join(' · ') || '축제 · 행사';
            const tipText = festival.overview ? festival.overview.replace(/\r?\n/g, ' ').slice(0, 24) : (festival.usetime || '인기 출사지');

            return (
              <View
                key={festival.id}
                style={{ width: CARD_WIDTH, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: CARD }}
              >
                <Pressable
                  onPress={onEventPress ? () => onEventPress(String(festival.id)) : undefined}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                >
                  {/* 헤더 */}
                  <View style={{ backgroundColor: '#111111', paddingVertical: normalize(10), paddingHorizontal: normalize(14) }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: normalizeFontSize(10),
                        color: 'rgba(255,255,255,0.65)',
                        letterSpacing: 0.5,
                        marginBottom: normalize(4),
                      }}
                      numberOfLines={1}
                    >
                      {formatDateRange(festival.eventStartDate, festival.eventEndDate)}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: FONT_MD,
                        color: '#fff',
                      }}
                      numberOfLines={1}
                    >
                      {festival.name}
                    </Text>
                  </View>

                  {/* 바디 */}
                  <View style={{ paddingTop: normalize(12), paddingHorizontal: normalize(14), paddingBottom: normalize(14) }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-Medium',
                        fontSize: FONT_SM,
                        color: '#000',
                        marginBottom: normalize(2),
                      }}
                      numberOfLines={1}
                    >
                      {location}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-Regular',
                        fontSize: normalizeFontSize(12),
                        color: TEXT_SUB,
                        marginBottom: normalize(10),
                      }}
                      numberOfLines={1}
                    >
                      {tipText}
                    </Text>

                    {/* 상태 뱃지 */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        height: normalize(30),
                        paddingHorizontal: normalize(10),
                        borderRadius: normalize(8),
                        backgroundColor: '#fff',
                        marginBottom: normalize(8),
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(11), color: TEXT_SUB }}
                      >
                        행사 상태
                      </Text>
                      <View style={{ backgroundColor: statusBg, paddingHorizontal: normalize(6), paddingVertical: normalize(2), borderRadius: normalize(4) }}>
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Pretendard-SemiBold',
                            fontSize: normalizeFontSize(11),
                            color: statusColor,
                          }}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    {/* 테마 태그 */}
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        height: normalize(22),
                        paddingHorizontal: normalize(8),
                        borderRadius: normalize(11),
                        backgroundColor: '#fff',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Pretendard-Regular',
                          fontSize: normalizeFontSize(10),
                          color: TEXT_SUB,
                        }}
                        numberOfLines={1}
                      >
                        {categoryTag}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
