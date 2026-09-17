import { useMemo } from 'react';
import { useSearchSpots, useSpots } from '@/hooks/useSpot';
import type { SpotResponse } from '@/types/spot';

export interface SeasonThemeInfo {
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

/**
 * "이달의 추천 출사스팟" 데이터. 홈 섹션과 검색 패널의 추천 스팟이 같은 결과를 보여주도록
 * 훅으로 뺐다 — 검색 쪽이 쓰던 useRecommendedSpots(관심 테마)는 로그인해야만 값이 와서
 * 비로그인 사용자에게는 섹션이 통째로 비었다.
 */
export function useSeasonalSpots(size = 6) {
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const season = useMemo(() => MONTHLY_SEASON_THEMES[currentMonth] || MONTHLY_SEASON_THEMES[8], [currentMonth]);

  // 1. 백엔드 자연어/오버뷰 의미 검색 시도
  const { data: searchData, isLoading: isSearchLoading } = useSearchSpots({ keyword: season.keyword, size: 8 });

  // 2. 검색 결과가 비었을 때를 위한 카테고리 인기 스팟 폴백
  const { data: categoryData, isLoading: isCategoryLoading } = useSpots(
    { category: season.category, sort: 'popular', size: 8 },
    { enabled: !searchData?.content || searchData.content.length === 0 },
  );

  const hasSearchResult = !!searchData?.content && searchData.content.length > 0;

  const spots: SpotResponse[] = useMemo(() => {
    const fromSearch = searchData?.content ?? [];
    if (fromSearch.length > 0) return fromSearch.slice(0, size);
    return (categoryData?.content ?? []).slice(0, size);
  }, [searchData?.content, categoryData?.content, size]);

  return {
    spots,
    season,
    currentMonth,
    isLoading: isSearchLoading || (isCategoryLoading && !hasSearchResult),
  };
}
