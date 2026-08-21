import React from 'react';
import SpotCarouselSection from '@/components/home/SpotCarouselSection';
import { useSpots } from '@/hooks/useSpot';
import { mapPopularSpot } from '@/utils/spotMappers';

interface Props {
  onSpotPress?: (id: string) => void;
  onViewAll?: () => void;
}

const POPULAR_SIZE = 10;

export default function PopularSpotsSection({ onSpotPress, onViewAll }: Props) {
  // ponytail: 전용 GET /spots/popular 대신 기존 useSpots 재사용 — 백엔드가 두 경로 모두
  // SpotService.resolveSort()의 동일 정렬(bookmarkCount DESC, reviewCount DESC)을 탄다.
  // 주간 집계는 서버에 없다(누적 카운트). 그래서 섹션 제목도 "이번 주"가 아닌 "인기 스팟".
  // 주간 집계 API가 생기면 전용 함수로 교체 → docs/ai/specs/feature/home-popular-spots-api/
  const { data, isLoading, isError, refetch } = useSpots({ sort: 'popular', size: POPULAR_SIZE });

  const spots = React.useMemo(() => (data?.content ?? []).map(mapPopularSpot), [data?.content]);

  return (
    <SpotCarouselSection
      title="인기 스팟"
      // 정렬 기준(저장 수 + 리뷰 수)을 그대로 말한다 — 주간 집계가 아니라서 "이번 주"는 쓸 수 없다.
      subtitle="다른 사용자들이 많이 저장하고 리뷰한 곳"
      spots={spots}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      errorText="인기 스팟을 불러오지 못했어요."
      emptyText="아직 인기 스팟이 없어요."
      onSpotPress={onSpotPress}
      actionLabel="모두 보기"
      onAction={onViewAll}
    />
  );
}
