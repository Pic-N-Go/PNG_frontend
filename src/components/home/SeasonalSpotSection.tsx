import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_MD, FONT_SM, FONT_TITLE, GRID_PADDING, SPACING_XS } from '@/constants/layout';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';
import { useSearchSpots, useSpots } from '@/hooks/useSpot';
import { regionLabelFrom } from '@/utils/spotMappers';
import Skeleton from '@/components/common/Skeleton';
import type { SpotResponse } from '@/types/spot';

interface Props {
  onSpotPress?: (id: string) => void;
  onViewAll?: (query: string) => void;
}

interface SeasonThemeInfo {
  title: string;
  keyword: string;
  category: string;
  timeTip: string;
  cameraTip: string;
  tag: string;
}

export const MONTHLY_SEASON_THEMES: Record<number, SeasonThemeInfo> = {
  1: {
    title: '새해 일출 & 설경',
    keyword: '일출',
    category: 'SUNRISE_SUNSET',
    timeTip: '아침 06:30 ~ 07:30',
    cameraTip: '일출 30분 전 삼각대 세팅',
    tag: '일출 · 일몰',
  },
  2: {
    title: '눈꽃 & 순백의 설경',
    keyword: '설경',
    category: 'FOREST',
    timeTip: '오전 09:00 ~ 12:00',
    cameraTip: '노출 보정 +1.0EV 밝게',
    tag: '설경 · 겨울',
  },
  3: {
    title: '매화 & 산수유 꽃망울',
    keyword: '매화',
    category: 'FLOWER',
    timeTip: '오전 09:00 ~ 11:00',
    cameraTip: '단렌즈 얕은 심도로 꽃잎 강조',
    tag: '꽃 · 벚꽃',
  },
  4: {
    title: '전국 벚꽃 & 유채꽃',
    keyword: '벚꽃',
    category: 'FLOWER',
    timeTip: '오후 16:00 ~ 18:00',
    cameraTip: '망원렌즈로 벚꽃 터널 압축 효과',
    tag: '꽃 · 벚꽃',
  },
  5: {
    title: '초여름 청보리밭 & 양귀비',
    keyword: '청보리',
    category: 'FLOWER',
    timeTip: '오후 15:00 ~ 17:00',
    cameraTip: '셔터스피드 1/30초로 물결 표현',
    tag: '자연 · 초원',
  },
  6: {
    title: '보랏빛 수국 & 라벤더',
    keyword: '수국',
    category: 'FLOWER',
    timeTip: '오전 10:00 ~ 12:00',
    cameraTip: '화사한 색감 · 인물 스냅 추천',
    tag: '꽃 · 정원',
  },
  7: {
    title: '연꽃 & 파도치는 해변',
    keyword: '바다',
    category: 'BEACH',
    timeTip: '오후 18:30 ~ 19:30',
    cameraTip: '골든아워 노을 실루엣 샷',
    tag: '바다 · 해변',
  },
  8: {
    title: '은하수 & 쏟아지는 밤하늘',
    keyword: '야경',
    category: 'NIGHT_VIEW',
    timeTip: '밤 22:00 ~ 새벽 03:00',
    cameraTip: '삼각대 필수 · F2.8 이하 개방',
    tag: '야경 · 별',
  },
  9: {
    title: '황금빛 메밀꽃 & 코스모스',
    keyword: '꽃',
    category: 'FLOWER',
    timeTip: '오후 16:00 ~ 18:00',
    cameraTip: '황금빛 햇살 역광 촬영 추천',
    tag: '꽃 · 가을',
  },
  10: {
    title: '분홍빛 핑크뮬리 & 억새',
    keyword: '단풍',
    category: 'FOREST',
    timeTip: '오후 16:30 ~ 18:00',
    cameraTip: '따뜻한 웜톤 노을빛 보정',
    tag: '가을 · 억새',
  },
  11: {
    title: '붉게 물든 단풍 & 은행나무',
    keyword: '단풍',
    category: 'FOREST',
    timeTip: '오전 10:00 ~ 오후 14:00',
    cameraTip: 'CPL 편광필터로 잎 색감 강조',
    tag: '단풍 · 숲',
  },
  12: {
    title: '도심 빛축제 & 감성 야경',
    keyword: '야경',
    category: 'NIGHT_VIEW',
    timeTip: '저녁 18:00 ~ 22:00',
    cameraTip: '조리개 F8~F11 조여서 빛갈라짐',
    tag: '도심 · 야경',
  },
};

const CARD_WIDTH = normalize(210);

export default function SeasonalSpotSection({ onSpotPress, onViewAll }: Props) {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const season = useMemo(() => MONTHLY_SEASON_THEMES[currentMonth] || MONTHLY_SEASON_THEMES[8], [currentMonth]);

  // 1. 백엔드 자연어/오버뷰 의미 검색 시도
  const { data: searchData, isLoading: isSearchLoading } = useSearchSpots({
    keyword: season.keyword,
    size: 8,
  });

  // 2. 만약 검색 결과가 부족할 때를 위한 카테고리 인기 스팟 폴백
  const { data: categoryData, isLoading: isCategoryLoading } = useSpots({
    category: season.category,
    sort: 'popular',
    size: 8,
  }, { enabled: !searchData?.content || searchData.content.length === 0 });

  const isLoading = isSearchLoading && isCategoryLoading;

  const spotList: SpotResponse[] = useMemo(() => {
    const fromSearch = searchData?.content ?? [];
    if (fromSearch.length > 0) return fromSearch.slice(0, 6);
    return (categoryData?.content ?? []).slice(0, 6);
  }, [searchData?.content, categoryData?.content]);

  if (!isLoading && spotList.length === 0) {
    return null;
  }

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
            이달의 추천 포토스팟
          </Text>
          {onViewAll && (
            <Pressable onPress={() => onViewAll(season.keyword)} hitSlop={8}>
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
          {`${currentMonth}월에 가장 아름다운 ${season.title} 명소`}
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
          {spotList.map((spot) => {
            const location = regionLabelFrom(spot.address) || spot.address || '전국';
            const tipText = spot.overview
              ? spot.overview.replace(/\r?\n/g, ' ').slice(0, 24)
              : season.cameraTip;

            return (
              <View
                key={spot.id}
                style={{ width: CARD_WIDTH, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: CARD }}
              >
                <Pressable
                  onPress={onSpotPress ? () => onSpotPress(String(spot.id)) : undefined}
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
                      {`${currentMonth}월 추천 · ${season.timeTip}`}
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
                      {spot.name}
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
                          이달의 출사지
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
                        {season.tag}
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
