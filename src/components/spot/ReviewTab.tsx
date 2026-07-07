import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconCamera, IconEdit } from '@tabler/icons-react-native';
import Chip from '@/components/common/Chip';
import StarRating from '@/components/common/StarRating';
import InitialAvatar from '@/components/common/InitialAvatar';
import { BUTTON_RADIUS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { Review, ReviewSortOption, ReviewSummaryData } from '@/types/spot';

export const MOCK_REVIEW_SUMMARY: ReviewSummaryData = {
  score: 4.8,
  reviewCount: 324,
  distribution: [
    { star: 5, percent: 72 },
    { star: 4, percent: 18 },
    { star: 3, percent: 7 },
    { star: 2, percent: 2 },
    { star: 1, percent: 1 },
  ],
};

export const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    name: '한강뷰어',
    avatarInitial: '한',
    avatarColor: '#2c5364',
    rating: 5,
    badge: '야경',
    date: '2026.04.12',
    text: '광안대교 야경이 정말 환상적이에요. 삼각대 없으면 흔들려서 꼭 챙겨가세요. 일몰 30분 후가 골든타임이고 광안대교 불빛이 바다에 비칠 때가 가장 예쁩니다. 주차는 수영구 공영주차장 추천해요.',
    photoColors: ['#0f2027', '#203a43'],
    equipment: 'Sony A7IV · 16-35mm f/2.8 GM',
  },
  {
    id: '2',
    name: '골든아워헌터',
    avatarInitial: '골',
    avatarColor: '#6b3a2a',
    rating: 5,
    badge: '일출',
    date: '2026.03.28',
    text: '새벽 5시 30분에 도착했는데 이미 사진가들이 꽤 있었어요. 일출 포인트는 해변 오른쪽 끝 방파제 근처가 제일 좋아요. 미세먼지 없는 날 노을 색감은 말이 필요 없을 정도예요.',
    equipment: 'Canon EOS R5 · 24-70mm f/2.8',
  },
  {
    id: '3',
    name: '봄날의사진',
    avatarInitial: '봄',
    avatarColor: '#4a3060',
    rating: 4,
    badge: '낮',
    date: '2026.03.15',
    text: '주말 낮에 방문했더니 사람이 꽤 많았어요. 인물 사진보다는 풍경 위주로 찍기 좋은 곳인 것 같아요. 백사장이 넓어서 구도 잡기는 편한 편이에요. 다음엔 평일 이른 아침에 와보려고요.',
    photoColors: ['#c9d6df'],
    equipment: 'Nikon Z6II',
  },
  {
    id: '4',
    name: '야경마스터',
    avatarInitial: '야',
    avatarColor: '#2a2a5a',
    rating: 5,
    badge: '야간',
    date: '2026.02.20',
    text: '광안대교 야경 촬영의 성지입니다. ISO 800, f/8, 15초 셔터스피드 조합 추천해요. 방파제 위에서 찍으면 대교가 정면으로 딱 들어와요. 겨울엔 바람이 많이 부니까 따뜻하게 입고 가세요.',
    photoColors: ['#020010', '#0f2027', '#1a1530'],
    equipment: 'Sony A7IV · 16-35mm f/2.8 GM',
  },
];

const SORT_OPTIONS: ReviewSortOption[] = ['최신순', '별점 높은순', '별점 낮은순'];

interface Props {
  onWriteReview: () => void;
}

export default function ReviewTab({ onWriteReview }: Props) {
  const [sort, setSort] = useState<ReviewSortOption>('최신순');

  return (
    <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(20) }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: normalize(20), padding: normalize(20), borderRadius: normalize(16), backgroundColor: '#F5F5F7', marginBottom: normalize(16) }}>
        <View style={{ width: normalize(80), alignItems: 'center' }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(44), color: '#000', letterSpacing: -1, lineHeight: normalizeFontSize(44) }}>
            {MOCK_REVIEW_SUMMARY.score.toFixed(1)}
          </Text>
          <View style={{ marginTop: normalize(6), marginBottom: normalize(4) }}>
            <StarRating rating={MOCK_REVIEW_SUMMARY.score} size={normalizeFontSize(14)} />
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.35)' }}>
            {`${MOCK_REVIEW_SUMMARY.reviewCount}건`}
          </Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', gap: normalize(6) }}>
          {MOCK_REVIEW_SUMMARY.distribution.map((row) => (
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

      <View style={{ flexDirection: 'row', gap: normalize(6), marginBottom: normalize(16) }}>
        {SORT_OPTIONS.map((option) => (
          <Chip key={option} label={option} selected={sort === option} onPress={() => setSort(option)} variant="dark" height={normalize(30)} fontSize={normalizeFontSize(12)} paddingHorizontal={normalize(12)} />
        ))}
      </View>

      <View>
        {MOCK_REVIEWS.map((review, idx) => (
          <View
            key={review.id}
            style={{
              paddingVertical: normalize(18),
              borderBottomWidth: idx < MOCK_REVIEWS.length - 1 ? 0.5 : 0,
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
                  <View style={{ height: normalize(18), paddingHorizontal: normalize(7), borderRadius: normalize(9), backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(10), fontFamily: 'Pretendard-Medium', color: 'rgba(0,0,0,0.45)' }}>
                      {review.badge}
                    </Text>
                  </View>
                  <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.35)' }}>{review.date}</Text>
                </View>
              </View>
            </View>

            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.72)', lineHeight: normalizeFontSize(14) * 1.6, letterSpacing: -0.15, marginBottom: normalize(10) }}>
              {review.text}
            </Text>

            {review.photoColors && review.photoColors.length > 0 && (
              <View style={{ flexDirection: 'row', gap: normalize(6), marginBottom: normalize(10) }}>
                {review.photoColors.map((color, i) => (
                  <View key={i} style={{ width: normalize(68), height: normalize(68), borderRadius: normalize(10), backgroundColor: color }} />
                ))}
              </View>
            )}

            {review.equipment && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
                <IconCamera size={normalize(14)} color="rgba(0,0,0,0.3)" strokeWidth={2} />
                <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}>
                  {review.equipment}
                </Text>
              </View>
            )}
          </View>
        ))}
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
