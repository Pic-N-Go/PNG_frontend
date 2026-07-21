import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { IconCamera, IconEdit } from '@tabler/icons-react-native';
import Chip from '@/components/common/Chip';
import StarRating from '@/components/common/StarRating';
import InitialAvatar from '@/components/common/InitialAvatar';
import { useSpotReviews } from '@/hooks/useSpot';
import { SORT_TO_API } from '@/utils/spotMappers';
import { BUTTON_RADIUS, GRID_PADDING } from '@/constants/layout';
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
  const { data, isLoading, isError } = useSpotReviews(spotId, SORT_TO_API[sort]);

  const summary = data?.summary ?? EMPTY_SUMMARY;
  const reviews = data?.reviews ?? [];

  return (
    <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(20) }}>
      {!isError && (
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: normalize(20), padding: normalize(20), borderRadius: normalize(16), backgroundColor: '#F5F5F7', marginBottom: normalize(16) }}>
        <View style={{ width: normalize(80), alignItems: 'center' }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(44), color: '#000', letterSpacing: -1, lineHeight: normalizeFontSize(44) }}>
            {summary.score.toFixed(1)}
          </Text>
          <View style={{ marginTop: normalize(6), marginBottom: normalize(4) }}>
            <StarRating rating={summary.score} size={normalizeFontSize(14)} />
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.35)' }}>
            {`${summary.reviewCount}건`}
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', gap: normalize(6) }}>
          {summary.distribution.map((row) => (
            <View key={row.star} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
              <Text allowFontScaling={false} style={{ width: normalize(14), textAlign: 'right', fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.4)' }}>
                {row.star}
              </Text>
              <View style={{ flex: 1, height: normalize(4), borderRadius: normalize(2), backgroundColor: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                <View style={{ width: `${row.percent}%`, height: '100%', borderRadius: normalize(2), backgroundColor: '#FF9F0A' }} />
              </View>
              <Text allowFontScaling={false} style={{ width: normalize(26), textAlign: 'right', fontSize: normalizeFontSize(10), color: 'rgba(0,0,0,0.3)' }}>
                {`${row.percent}%`}
              </Text>
            </View>
          ))}
        </View>
      </View>
      )}

      <View style={{ flexDirection: 'row', gap: normalize(6), marginBottom: normalize(16) }}>
        {SORT_OPTIONS.map((option) => (
          <Chip key={option} label={option} selected={sort === option} onPress={() => setSort(option)} variant="dark" height={normalize(30)} fontSize={normalizeFontSize(12)} paddingHorizontal={normalize(12)} />
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
                <InitialAvatar initial={review.avatarInitial} backgroundColor={review.avatarColor} size={normalize(36)} fontSize={normalizeFontSize(15)} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), marginBottom: normalize(3) }}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.15 }}>
                      {review.name}
                    </Text>
                    <StarRating rating={review.rating} size={normalizeFontSize(12)} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
                    {review.badge && (
                      <View style={{ height: normalize(18), paddingHorizontal: normalize(7), borderRadius: normalize(9), backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(10), fontFamily: 'Pretendard-Medium', color: 'rgba(0,0,0,0.45)' }}>
                          {review.badge}
                        </Text>
                      </View>
                    )}
                    <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.35)' }}>{review.date}</Text>
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
                  <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}>
                    {review.equipment}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={{ paddingVertical: normalize(12), borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)', marginTop: normalize(4) }}>
        <Pressable
          onPress={onWriteReview}
          style={{
            width: '100%',
            height: normalize(52),
            borderRadius: BUTTON_RADIUS,
            backgroundColor: '#e31b59',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: normalize(8),
          }}
        >
          <IconEdit size={normalize(16)} color="#fff" strokeWidth={2} />
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(16), color: '#fff', letterSpacing: -0.2 }}>
            리뷰 작성하기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
