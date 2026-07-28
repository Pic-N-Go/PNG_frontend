import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { IconCamera, IconEdit } from '@tabler/icons-react-native';
import Chip from '@/components/common/Chip';
import StarRating from '@/components/common/StarRating';
import InitialAvatar from '@/components/common/InitialAvatar';
import { useSpotReviews } from '@/hooks/useSpot';
import { SORT_TO_API } from '@/utils/spotMappers';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_2XS, FONT_MD, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { ReviewSortOption, ReviewSummaryData } from '@/types/spot';

const SORT_OPTIONS: ReviewSortOption[] = ['최신순', '별점 높은순', '별점 낮은순'];

const EMPTY_SUMMARY: ReviewSummaryData = {
  score: 0,
  reviewCount: 0,
  distribution: [5, 4, 3, 2, 1].map((star) => ({ star, percent: 0 })),
};

interface Props {
  spotId: string;
  onWriteReview: () => void;
}

export default function ReviewTab({ spotId, onWriteReview }: Props) {
  const [sort, setSort] = useState<ReviewSortOption>('최신순');
  const {
    data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage,
  } = useSpotReviews(spotId, SORT_TO_API[sort]);

  const summary = data?.summary ?? EMPTY_SUMMARY;
  const reviews = data?.reviews ?? [];

  return (
    <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(20) }}>
      {!isError && (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: normalize(20), padding: normalize(20), borderRadius: normalize(16), backgroundColor: '#F5F5F7', marginBottom: normalize(16) }}>
        <View style={{ width: normalize(80), alignItems: 'center' }}>
          {/* 44는 폰트 스케일 토큰(최대 28) 밖이지만 본문이 아니라 요약 카드의 디스플레이 수치다(목업 44px). */}
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(44), color: '#000', letterSpacing: -1, lineHeight: normalizeFontSize(44) }}>
            {summary.score.toFixed(1)}
          </Text>
          <View style={{ marginTop: normalize(6), marginBottom: normalize(4) }}>
            <StarRating rating={summary.score} size={normalizeFontSize(14)} />
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}>
            {`${summary.reviewCount}건`}
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', gap: normalize(6) }}>
          {summary.distribution.map((row) => (
            <View key={row.star} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
              <Text allowFontScaling={false} style={{ width: normalize(14), textAlign: 'right', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)' }}>
                {row.star}
              </Text>
              <View style={{ flex: 1, height: normalize(4), borderRadius: normalize(2), backgroundColor: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <View style={{ width: `${row.percent}%`, height: '100%', borderRadius: normalize(2), backgroundColor: '#FF9F0A' }} />
              </View>
              <Text allowFontScaling={false} style={{ width: normalize(26), textAlign: 'right', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.3)' }}>
                {`${row.percent}%`}
              </Text>
            </View>
          ))}
        </View>
      </View>
      )}

      <View style={{ flexDirection: 'row', gap: normalize(6), marginBottom: normalize(16) }}>
        {SORT_OPTIONS.map((option) => (
          <Chip key={option} label={option} selected={sort === option} onPress={() => setSort(option)} variant="dark" height={normalize(30)} fontSize={FONT_SM} paddingHorizontal={normalize(12)} />
        ))}
      </View>

      <View>
        {isLoading ? (
          <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
            <ActivityIndicator color="#E31B59" />
          </View>
        ) : isError ? (
          <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
              리뷰를 불러오지 못했어요.
            </Text>
          </View>
        ) : reviews.length === 0 ? (
          <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
              아직 등록된 리뷰가 없어요.
            </Text>
          </View>
        ) : (
          reviews.map((review, idx) => (
            <View
              key={review.id}
              style={{
                paddingVertical: normalize(18),
                borderBottomWidth: idx < reviews.length - 1 ? 0.5 : 0,
                borderBottomColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), marginBottom: normalize(10) }}>
                <InitialAvatar initial={review.avatarInitial} backgroundColor={review.avatarColor} size={normalize(36)} fontSize={FONT_MD} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), marginBottom: normalize(3) }}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.15 }}>
                      {review.name}
                    </Text>
                    <StarRating rating={review.rating} size={FONT_XS} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
                    {review.badge && (
                      <View style={{ height: normalize(18), paddingHorizontal: normalize(7), borderRadius: normalize(9), backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text allowFontScaling={false} style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Medium', color: 'rgba(0,0,0,0.45)' }}>
                          {review.badge}
                        </Text>
                      </View>
                    )}
                    <Text allowFontScaling={false} style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}>{review.date}</Text>
                  </View>
                </View>
              </View>

              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.72)', lineHeight: normalizeFontSize(14) * 1.6, letterSpacing: -0.15, marginBottom: normalize(10) }}>
                {review.text}
              </Text>

              {review.photos && review.photos.length > 0 ? (
                <View style={{ flexDirection: 'row', gap: normalize(6), marginBottom: normalize(10) }}>
                  {review.photos.map((uri) => (
                    <Image key={uri} source={{ uri }} style={{ width: normalize(68), height: normalize(68), borderRadius: normalize(10), backgroundColor: '#E5E5EA' }} />
                  ))}
                </View>
              ) : review.photoColors && review.photoColors.length > 0 ? (
                <View style={{ flexDirection: 'row', gap: normalize(6), marginBottom: normalize(10) }}>
                  {review.photoColors.map((color, i) => (
                    <View key={i} style={{ width: normalize(68), height: normalize(68), borderRadius: normalize(10), backgroundColor: color }} />
                  ))}
                </View>
              ) : null}

              {review.equipment && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
                  <IconCamera size={normalize(14)} color="rgba(0,0,0,0.3)" strokeWidth={2} />
                  <Text allowFontScaling={false} style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}>
                    {review.equipment}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      {/* 목업의 구분선(.review-write-sticky border-top)은 제외. 목업엔 CTA 하나뿐이라 목록과 갈라주는
          역할이 있었지만, 회색 더보기 + 핑크 CTA가 나란히 오면 선이 둘 사이를 끊어 간격만 어긋난다. */}
      <View className="gap-2" style={{ paddingTop: normalize(12), paddingBottom: normalize(24) }}>
        {/* 더보기 — 부모가 Animated.ScrollView라 중첩 FlatList/무한 스크롤 대신 명시 버튼으로 페이지를 넘긴다. */}
        {hasNextPage && (
          <Pressable
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full items-center justify-center"
            style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: '#F5F5F7' }}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator color="rgba(0,0,0,0.4)" />
            ) : (
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, color: 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                더보기
              </Text>
            )}
          </Pressable>
        )}

        <Pressable
          onPress={onWriteReview}
          className="w-full flex-row items-center justify-center gap-2"
          style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: '#e31b59' }}
        >
          <IconEdit size={normalize(16)} color="#fff" strokeWidth={2} />
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, color: '#fff', letterSpacing: -0.2 }}>
            리뷰 작성하기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
