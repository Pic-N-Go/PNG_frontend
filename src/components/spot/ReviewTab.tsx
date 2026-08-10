import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { IconCamera, IconEdit } from '@tabler/icons-react-native';
import Chip from '@/components/common/Chip';
import StarRating from '@/components/common/StarRating';
import InitialAvatar from '@/components/common/InitialAvatar';
import PhotoLightbox from '@/components/spot/PhotoLightbox';
import ReviewActionSheet from '@/components/spot/ReviewActionSheet';
import ReviewMenuButton from '@/components/spot/ReviewMenuButton';
import ReviewTagRow from '@/components/spot/ReviewTagRow';
import { useDeleteReview, useFetchReview, useSpotDetail, useSpotReviews } from '@/hooks/useSpot';
import { ApiError } from '@/api/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { SORT_TO_API } from '@/utils/spotMappers';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_2XS, FONT_MD, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { ReviewEditSeed } from '@/navigation/stacks/SpotStack';
import type { Review, ReviewSortOption, ReviewSummaryData } from '@/types/spot';

// 아이콘 회색은 불투명 값으로 고정한다. rgba로 두면 획이 교차하는 지점에서 알파가 두 번
// 합성돼 그 점만 진해진다(ReviewWriteScreen과 동일 처리). 값은 흰 배경 위 등가 명도.
const ICON_WEAK = '#B3B3B3';  // 기존 rgba(0,0,0,0.3)

const SORT_OPTIONS: ReviewSortOption[] = ['최신순', '별점 높은순', '별점 낮은순'];

const EMPTY_SUMMARY: ReviewSummaryData = {
  score: 0,
  reviewCount: 0,
  distribution: [5, 4, 3, 2, 1].map((star) => ({ star, percent: 0 })),
};

interface Props {
  spotId: string;
  onWriteReview: () => void;
  /** 수정 화면으로의 이동은 화면(SpotDetailScreen)이 담당한다. 이 컴포넌트는 표현만. */
  onEditReview: (seed: ReviewEditSeed) => void;
}

export default function ReviewTab({ spotId, onWriteReview, onEditReview }: Props) {
  const [sort, setSort] = useState<ReviewSortOption>('최신순');
  const {
    data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage,
  } = useSpotReviews(spotId, SORT_TO_API[sort]);

  const myUserId = useAuthStore((s) => s.user?.id);
  const [menuTarget, setMenuTarget] = useState<Review | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const deleteReview = useDeleteReview();

  // 스팟당 1리뷰. 이미 썼으면 작성 대신 수정으로 보낸다 — 서버는 409로 막지만
  // 다 쓴 뒤에 알게 되는 건 막을 수 없어서 버튼 단계에서 갈라놓는다.
  const { data: spot } = useSpotDetail(spotId);
  const myReviewId = spot?.info.myReviewId ?? null;
  const fetchReview = useFetchReview();
  const qc = useQueryClient();
  const [loadingSeed, setLoadingSeed] = useState(false);

  const openMyReview = async () => {
    if (myReviewId === null || loadingSeed) return;
    setLoadingSeed(true);
    try {
      const dto = await fetchReview(myReviewId);
      onEditReview({
        reviewId: dto.id,
        rating: dto.rating,
        content: dto.content,
        timePeriod: dto.timePeriod,
        visitedAt: dto.visitedAt,
        equipmentInfo: dto.equipmentInfo,
        tags: dto.tags,
        photos: dto.photos,
      });
    } catch (err) {
      // 404 = 다른 기기·화면에서 이미 지워졌다. 상세를 다시 받아 작성 버튼으로 되돌린다.
      if (err instanceof ApiError && err.status === 404) {
        qc.invalidateQueries({ queryKey: ['spot', spotId, 'detail'] });
        Alert.alert('리뷰를 찾을 수 없어요', '이미 삭제된 리뷰예요. 새로 작성할 수 있어요.');
        return;
      }
      Alert.alert('리뷰를 불러오지 못했어요', err instanceof ApiError ? err.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setLoadingSeed(false);
    }
  };

  const summary = data?.summary ?? EMPTY_SUMMARY;
  const reviews = data?.reviews ?? [];

  const confirmDelete = (review: Review) => {
    setMenuTarget(null);
    Alert.alert('리뷰를 삭제할까요?', '삭제한 리뷰는 되돌릴 수 없어요. 첨부한 사진도 함께 삭제돼요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          deleteReview.mutate({ reviewId: Number(review.id), spotId }, {
            onError: (err) =>
              Alert.alert('삭제 실패', err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.'),
          }),
      },
    ]);
  };

  return (
    <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(20) }}>
      {/* 리뷰가 없으면 0.0과 0% 막대만 남아 의미가 없다. 로딩 중에는 유지해 레이아웃이 튀지 않게 한다. */}
      {!isError && (isLoading || summary.reviewCount > 0) && (
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
                <InitialAvatar initial={review.avatarInitial} backgroundColor={review.avatarColor} size={normalize(36)} fontSize={FONT_MD} uri={review.avatarUrl} />
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
                {/* 본인 리뷰에만 노출. 서버도 소유자를 검증하므로 이건 진입점 숨김이지 보안 장치가 아니다. */}
                {myUserId !== undefined && review.userId === myUserId && (
                  <ReviewMenuButton onPress={() => setMenuTarget(review)} />
                )}
              </View>

              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.72)', lineHeight: normalizeFontSize(14) * 1.6, letterSpacing: -0.15, marginBottom: normalize(10) }}>
                {review.text}
              </Text>

              <ReviewTagRow tags={review.tags} />

              {/* 68dp 타일 5장 + 간격이면 350dp(390 기준 콘텐츠 폭)를 넘겨 마지막 장이 잘린다.
                  사진 첨부가 열리면서 5장이 실제로 도달 가능해졌으므로 가로 스크롤로 처리한다. */}
              {review.photos && review.photos.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: normalize(6) }}
                  style={{ marginBottom: normalize(10) }}
                >
                  {review.photos.map((photo, photoIdx) => (
                    <Pressable
                      key={photo.photoId}
                      onPress={() => setLightbox({ photos: (review.photos ?? []).map((p) => p.url), index: photoIdx })}
                    >
                      <Image source={{ uri: photo.url }} resizeMode="cover" style={{ width: normalize(68), height: normalize(68), borderRadius: normalize(10), backgroundColor: '#E5E5EA' }} />
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}

              {review.equipment && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
                  <IconCamera size={normalize(14)} color={ICON_WEAK} strokeWidth={2} />
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
      {/* 하단 여백은 두지 않는다 — 이 탭이 스크롤뷰의 마지막 요소라
          SpotDetailScreen의 contentContainerStyle(24 + insets.bottom)과 겹쳐 두 겹이 된다. */}
      <View className="gap-2" style={{ paddingTop: normalize(12) }}>
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
          onPress={myReviewId === null ? onWriteReview : openMyReview}
          disabled={loadingSeed}
          className="w-full flex-row items-center justify-center gap-2"
          style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: '#e31b59', opacity: loadingSeed ? 0.6 : 1 }}
        >
          {loadingSeed ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconEdit size={normalize(16)} color="#fff" strokeWidth={2} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, color: '#fff', letterSpacing: -0.2 }}>
                {myReviewId === null ? '리뷰 작성하기' : '내 리뷰 수정하기'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <ReviewActionSheet
        visible={menuTarget !== null}
        onClose={() => setMenuTarget(null)}
        onEdit={() => {
          const target = menuTarget;
          setMenuTarget(null);
          if (!target) return;
          onEditReview({
            reviewId: Number(target.id),
            rating: target.rating,
            content: target.text,
            timePeriod: target.timePeriod,
            visitedAt: target.visitedAtISO,
            equipmentInfo: target.equipment ?? null,
            tags: target.tags,
            photos: target.photos ?? [],
          });
        }}
        onDelete={() => menuTarget && confirmDelete(menuTarget)}
      />

      <PhotoLightbox
        photos={lightbox?.photos ?? []}
        initialIndex={lightbox?.index ?? 0}
        visible={lightbox !== null}
        onClose={() => setLightbox(null)}
      />
    </View>
  );
}
