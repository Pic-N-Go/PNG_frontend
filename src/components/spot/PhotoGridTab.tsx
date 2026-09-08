import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import PhotoLightbox from '@/components/spot/PhotoLightbox';
import { useSpotReviews } from '@/hooks/useSpot';
import { GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BRAND, TEXT_SUB } from '@/constants/colors';

interface Props {
  spotId: string;
  loadMoreSignal: number;
}

/**
 * 사진 탭 = 이 스팟의 리뷰에 첨부된 사진을 한 그리드로 펼친 화면. 사진을 누르면 라이트박스에
 * 그 사진이 딸린 리뷰(작성자·별점·본문 2줄)를 함께 보여준다.
 *
 * 전용 엔드포인트를 만들지 않고 리뷰 목록(`GET /spots/{id}/reviews`)을 그대로 쓴다 — 응답에
 * `photos[{photoId,url}]`와 본문·작성자가 이미 함께 오고, 정렬이 LATEST면 리뷰 탭과 쿼리 키가
 * 같아 추가 요청이 0이다.
 *
 * ponytail: 페이징 단위가 "리뷰 10건"이라 사진은 페이지마다 0~50장씩 들쭉날쭉 들어오고,
 * 총 사진 장수와 태그 필터는 서버가 주지 않는다. 그 셋이 필요해지면
 * `GET /spots/{id}/review-photos`(사진 단위 페이징 + tag 파라미터)로 갈아탄다.
 */
export default function PhotoGridTab({ spotId, loadMoreSignal }: Props) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useSpotReviews(spotId, 'LATEST');

  const photos = useMemo(
    () => (data?.reviews ?? []).flatMap((review) => (review.photos ?? []).map((photo) => ({ photo, review }))),
    [data],
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (loadMoreSignal > 0 && hasNextPage && !isFetchingNextPage) fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMoreSignal]);

  // 사진 없는 리뷰만 담긴 페이지가 오면 그리드 높이가 그대로라 다음 스크롤 트리거가 안 생긴다
  // (바닥에 붙은 채로 멈춘다). 사진이 하나라도 늘 때까지 이어서 받는다.
  const seenCount = useRef(0);
  useEffect(() => {
    if (isLoading || isFetchingNextPage || !hasNextPage) return;
    if (photos.length === seenCount.current) fetchNextPage();
    else seenCount.current = photos.length;
  }, [photos.length, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

  if (isError) {
    return (
      <View style={{ paddingVertical: normalize(60), alignItems: 'center' }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: TEXT_SUB, letterSpacing: -0.2 }}>
          사진을 불러오지 못했어요.
        </Text>
      </View>
    );
  }

  // 사진 없는 페이지가 이어지는 동안(위 effect가 다음 페이지를 이어 받는다) 빈 상태 문구가 뜨지 않게 스피너를 유지한다
  if (isLoading || (photos.length === 0 && hasNextPage)) {
    return (
      <View style={{ paddingVertical: normalize(60), alignItems: 'center' }}>
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={{ paddingVertical: normalize(60), alignItems: 'center' }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: TEXT_SUB, letterSpacing: -0.2 }}>
          아직 리뷰에 올라온 사진이 없어요.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingTop: normalize(16) }}>
        {photos.map(({ photo }, i) => (
          <Pressable key={photo.photoId} onPress={() => setLightboxIndex(i)} style={{ width: '33.333%', aspectRatio: 1, padding: 1 }}>
            <Image
              source={{ uri: photo.url }}
              resizeMode="cover"
              resizeMethod="resize"
              style={{ flex: 1, backgroundColor: '#E5E5EA' }}
            />
          </Pressable>
        ))}
      </View>

      {isFetchingNextPage && (
        <View style={{ paddingVertical: normalize(20), alignItems: 'center' }}>
          <ActivityIndicator color={BRAND} />
        </View>
      )}

      <View style={{ height: GRID_PADDING }} />

      <PhotoLightbox
        photos={photos.map(({ photo }) => photo.url)}
        photoIds={photos.map(({ photo }) => photo.photoId)}
        reviewIds={photos.map(({ review }) => review.id)}
        captions={photos.map(({ review }) => ({
          name: review.name,
          rating: review.rating,
          date: review.date,
          text: review.text,
        }))}
        initialIndex={lightboxIndex ?? 0}
        visible={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </View>
  );
}
