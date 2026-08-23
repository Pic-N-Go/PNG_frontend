import React from 'react';
import { Text, View } from 'react-native';
import { IconSparkles } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { FONT_TITLE, GRID_PADDING, SPACING_XS } from '@/constants/layout';
import LinkBanner from '@/components/common/LinkBanner';
import SpotCarouselSection from '@/components/home/SpotCarouselSection';
import { useRecommendedSpots } from '@/hooks/useSpot';
import { useAuthStore } from '@/store/useAuthStore';
import { mapRecommendedSpot } from '@/utils/spotMappers';

interface Props {
  onSpotPress?: (id: string) => void;
  /** 관심 테마 설정 화면으로 이동 (마이페이지 설정 > 관심 테마 시트) */
  onSetThemes?: () => void;
}

const RECOMMENDED_SIZE = 10;

export default function RecommendedSpotsSection({ onSpotPress, onSetThemes }: Props) {
  // GET /spots/recommended는 로그인 필수(관심 테마 기반)라 비로그인에는 섹션 자체를 감춘다.
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const hasThemes = useAuthStore((s) => (s.user?.spotCategories?.length ?? 0) > 0);
  const { data, isLoading, isError, refetch } = useRecommendedSpots(RECOMMENDED_SIZE);

  const spots = React.useMemo(() => (data ?? []).map(mapRecommendedSpot), [data]);

  if (!isLoggedIn) return null;

  // 서버가 관심 테마와 겹치는 스팟만 주므로 빈 응답은 두 경우다 — 테마 미설정, 또는 매칭 스팟 없음.
  // 둘 다 사용자가 할 수 있는 행동은 같아서(테마 설정/변경) 문구만 나눈다.
  if (!hasThemes || (!isLoading && !isError && spots.length === 0)) {
    return <ThemePrompt hasThemes={hasThemes} onPress={onSetThemes} />;
  }

  return (
    <SpotCarouselSection
      title="관심 스팟"
      subtitle="내 관심 테마와 어울리는 곳"
      spots={spots}
      isLoading={isLoading}
      isError={isError}
      refetch={refetch}
      errorText="추천 스팟을 불러오지 못했어요."
      emptyText="추천할 스팟이 아직 없어요."
      onSpotPress={onSpotPress}
      // "모두 보기"를 두지 않는다 — 서버 상한이 20개고 페이징이 없어 "전체"가 없다.
      // 캐러셀을 다 본 사용자가 원하는 건 더 긴 목록보다 다른 테마라, 시트를 여는 쪽이 유용하다.
      actionLabel="테마 변경"
      onAction={onSetThemes}
    />
  );
}

/** 캐러셀 자리를 대신하는 안내 배너. 카드 모양은 LinkBanner에 맡긴다 — 홈의 다른 이동 배너와 같은 형태. */
function ThemePrompt({ hasThemes, onPress }: { hasThemes: boolean; onPress?: () => void }) {
  return (
    <View style={{ marginTop: normalize(28) }}>
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'Pretendard-SemiBold',
          fontSize: FONT_TITLE,
          color: '#000',
          letterSpacing: -0.4,
          paddingHorizontal: GRID_PADDING,
          marginBottom: SPACING_XS,
        }}
      >
        관심 스팟
      </Text>

      <LinkBanner
        icon={IconSparkles}
        title={hasThemes ? '관심 테마를 넓혀 보세요' : '관심 테마를 설정해 주세요'}
        subtitle={
          hasThemes
            ? '지금 고른 테마와 맞는 스팟이 아직 없어요'
            : '좋아하는 테마를 고르면 어울리는 스팟을 추천해 드려요'
        }
        onPress={onPress}
        marginTop={normalize(14)}
      />
    </View>
  );
}
