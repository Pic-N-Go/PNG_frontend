import React, { useState, useMemo, useEffect } from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconBookmark, IconSparkles } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_2XS, FONT_MD, FONT_SM, FONT_TITLE, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { BRAND, BRAND_TINT, CARD, TEXT_SUB } from '@/constants/colors';
import Skeleton from '@/components/common/Skeleton';
import BookmarkSheet from '@/components/spot/BookmarkSheet';
import { useQueries } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useSpots } from '@/hooks/useSpot';
import { spotApi } from '@/api/spot';
import { mapPhotogenicScore, regionLabelFrom, toHttps } from '@/utils/spotMappers';
import { SPOT_CATEGORY_MAP } from '@/constants/spotCategories';
import type { SpotResponse } from '@/types/spot';

interface Props {
  onSpotPress?: (id: string) => void;
  onViewAll?: () => void;
}

const CARD_WIDTH = normalize(230);
const CARD_HEIGHT = normalize(255);

const ROW_STYLE = {
  paddingHorizontal: GRID_PADDING,
  paddingTop: normalize(14),
  gap: normalize(12),
} as const;

const FALLBACK_GRADIENT: [string, string, string] = ['#2C3E50', '#4A6572', '#8B9DA8'];

const RANK_CONFIG = [
  { label: '1위', bg: '#E5A100', text: '#FFFFFF' }, // Gold
  { label: '2위', bg: '#78909C', text: '#FFFFFF' }, // Silver
  { label: '3위', bg: '#A0522D', text: '#FFFFFF' }, // Bronze
  { label: '4위', bg: 'rgba(0,0,0,0.6)', text: '#FFFFFF' },
  { label: '5위', bg: 'rgba(0,0,0,0.6)', text: '#FFFFFF' },
];

function BestSpotCard({
  spot,
  index,
  isLoggedIn,
  onPress,
  onBookmarkPress,
}: {
  spot: SpotResponse;
  index: number;
  isLoggedIn: boolean;
  onPress?: () => void;
  onBookmarkPress?: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = toHttps(spot.thumbnailUrl || spot.imageUrl || null);
  useEffect(() => setImageFailed(false), [imageUrl]);

  const rank = RANK_CONFIG[index] ?? {
    label: `${index + 1}위`,
    bg: 'rgba(0,0,0,0.6)',
    text: '#FFFFFF',
  };

  const categoryLabels = (spot.categories ?? [])
    .map((code) => SPOT_CATEGORY_MAP[code]?.label)
    .filter((label): label is string => !!label)
    .slice(0, 2);

  const location = [regionLabelFrom(spot.address ?? ''), categoryLabels.join('/')]
    .filter(Boolean)
    .join(' · ') || '전국';

  return (
    <View
      style={{
        width: CARD_WIDTH,
        borderRadius: CARD_RADIUS,
        overflow: 'hidden',
        backgroundColor: CARD,
      }}
    >
      <Pressable onPress={onPress} android_ripple={{ color: 'rgba(0,0,0,0.06)' }}>
        {/* 사진 영역 */}
        <View style={{ height: normalize(150), position: 'relative' }}>
          {imageUrl && !imageFailed ? (
            <Image
              source={{ uri: imageUrl }}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
              style={{ position: 'absolute', inset: 0 }}
            />
          ) : (
            <LinearGradient
              colors={FALLBACK_GRADIENT}
              style={{ position: 'absolute', inset: 0 }}
            />
          )}

          {/* 랭킹 뱃지 */}
          <View
            style={{
              position: 'absolute',
              top: normalize(10),
              left: normalize(10),
              backgroundColor: rank.bg,
              paddingHorizontal: normalize(8),
              paddingVertical: normalize(3),
              borderRadius: normalize(6),
              zIndex: 1,
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Bold',
                fontSize: FONT_XS,
                color: rank.text,
                letterSpacing: -0.2,
              }}
            >
              {rank.label}
            </Text>
          </View>

          {/* 북마크 버튼 */}
          {isLoggedIn && (
            <Pressable
              onPress={onBookmarkPress}
              accessibilityRole="button"
              accessibilityLabel={spot.isBookmarked ? '즐겨찾기 관리' : '즐겨찾기에 추가'}
              hitSlop={8}
              style={{
                position: 'absolute',
                top: normalize(10),
                right: normalize(10),
                width: normalize(28),
                height: normalize(28),
                borderRadius: normalize(14),
                backgroundColor: spot.isBookmarked ? '#fff' : 'rgba(0,0,0,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <IconBookmark
                size={normalize(14)}
                color={spot.isBookmarked ? BRAND : '#fff'}
                strokeWidth={1.5}
                fill={spot.isBookmarked ? BRAND : 'none'}
              />
            </Pressable>
          )}
        </View>

        {/* 정보 영역 */}
        <View style={{ paddingTop: normalize(12), paddingHorizontal: normalize(14), paddingBottom: normalize(14) }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: FONT_MD,
              color: '#000',
              letterSpacing: -0.2,
              marginBottom: normalize(3),
            }}
            numberOfLines={1}
          >
            {spot.name}
          </Text>

          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: FONT_XS,
              color: TEXT_SUB,
              marginBottom: normalize(10),
            }}
            numberOfLines={1}
          >
            {location}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* 포토제닉 스코어 배지 */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: BRAND_TINT,
                paddingHorizontal: normalize(7),
                paddingVertical: normalize(2.5),
                borderRadius: normalize(6),
                gap: normalize(3),
              }}
            >
              <IconSparkles size={normalize(12)} color={BRAND} />
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: FONT_XS,
                  color: BRAND,
                }}
              >
                {Math.round(spot.photogenicScore) > 0
                  ? `포토제닉 ${Math.round(spot.photogenicScore)}점`
                  : '인기 출사지'}
              </Text>
            </View>

            {/* 별점 or 리뷰 수 */}
            {spot.reviewCount > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(2) }}>
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#ff9f0a' }}
                >
                  ★
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_XS, color: '#000' }}
                >
                  {(spot.reviewAverage ?? 0).toFixed(1)}
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_2XS, color: '#8e8e93' }}
                >
                  ({spot.reviewCount})
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default function TodayBestSpotsSection({ onSpotPress, onViewAll }: Props) {
  const isLoggedIn = useAuthStore((s) => !!s.accessToken);
  const [sheetSpotId, setSheetSpotId] = useState<string | null>(null);

  // 1. 전국 인기 출사지 후보군 조회 (북마크/리뷰 상위 스팟)
  const { data, isLoading, isError, refetch } = useSpots({ sort: 'popular', size: 8 });

  const candidateSpots = useMemo(() => {
    return data?.content ?? [];
  }, [data?.content]);

  // 2. 각 후보 스팟의 실시간 포토제닉 점수(실시간 날씨·미세먼지·골든아워 등 종합 계산) 병렬 조회
  const scoreQueries = useQueries({
    queries: candidateSpots.map((spot) => ({
      queryKey: ['spot', String(spot.id), 'photogenic', null, null],
      queryFn: () => spotApi.getPhotogenicScore(spot.id),
      select: mapPhotogenicScore,
      staleTime: 1000 * 60 * 10,
      enabled: candidateSpots.length > 0,
    })),
  });

  const isScoresLoading = scoreQueries.length > 0 && scoreQueries.some((q) => q.isLoading);

  // 3. 실시간 계산된 포토제닉 점수를 반영하고, 점수 내림차순으로 상위 5개 선별
  const spots = useMemo(() => {
    if (candidateSpots.length === 0) return [];

    const spotsWithScore = candidateSpots.map((spot, index) => {
      const liveScore = scoreQueries[index]?.data?.score;
      return {
        ...spot,
        photogenicScore: liveScore !== undefined && liveScore > 0 ? liveScore : spot.photogenicScore,
      };
    });

    return [...spotsWithScore]
      .sort((a, b) => b.photogenicScore - a.photogenicScore)
      .slice(0, 5);
  }, [candidateSpots, scoreQueries]);

  const showSkeleton = isLoading || (candidateSpots.length > 0 && isScoresLoading && spots.every((s) => s.photogenicScore === 0));

  const handleRefetch = () => {
    void refetch();
    scoreQueries.forEach((q) => void q.refetch());
  };

  return (
    <View style={{ marginTop: normalize(28) }}>
      {/* 헤더 */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingHorizontal: GRID_PADDING,
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: FONT_TITLE,
            color: '#000',
            letterSpacing: -0.4,
          }}
        >
          오늘의 베스트 출사지 TOP 5
        </Text>
        {onViewAll && (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: BRAND }}
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
          paddingHorizontal: GRID_PADDING,
          marginTop: normalize(4),
        }}
      >
        실시간 날씨와 환경 조건을 반영한 오늘의 최고 출사지
      </Text>

      {/* 가로 카드 목록 */}
      {showSkeleton ? (
        <View style={{ flexDirection: 'row', ...ROW_STYLE }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={CARD_WIDTH} height={CARD_HEIGHT} borderRadius={CARD_RADIUS} />
          ))}
        </View>
      ) : isError && spots.length === 0 ? (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14) }}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: TEXT_SUB }}
          >
            베스트 출사지를 불러오지 못했어요.
          </Text>
          <Pressable onPress={handleRefetch} hitSlop={8} style={{ marginTop: normalize(6) }}>
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: BRAND }}
            >
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : spots.length === 0 ? (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14) }}>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: TEXT_SUB }}
          >
            추천할 출사지 정보가 아직 없습니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={spots}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={ROW_STYLE}
          renderItem={({ item, index }) => (
            <BestSpotCard
              spot={item}
              index={index}
              isLoggedIn={isLoggedIn}
              onPress={onSpotPress ? () => onSpotPress(String(item.id)) : undefined}
              onBookmarkPress={isLoggedIn ? () => setSheetSpotId(String(item.id)) : undefined}
            />
          )}
        />
      )}

      {sheetSpotId && (
        <BookmarkSheet
          visible
          spotId={sheetSpotId}
          onClose={() => setSheetSpotId(null)}
          onSaved={() => setSheetSpotId(null)}
        />
      )}
    </View>
  );
}
