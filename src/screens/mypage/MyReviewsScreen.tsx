import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar,
  ActivityIndicator, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_2XS, FONT_XS, FONT_SM, FONT_MD } from '@/constants/layout';
import Toast from '@/components/common/Toast';
import type { RootStackParamList } from '@/navigation';
import ReviewActionSheet from '@/components/spot/ReviewActionSheet';
import ReviewMenuButton from '@/components/spot/ReviewMenuButton';
import ReviewTagRow from '@/components/spot/ReviewTagRow';
import PhotoLightbox from '@/components/spot/PhotoLightbox';
import { useDeleteReview, useMyReviews } from '@/hooks/useSpot';
import { useAuthStore } from '@/store/useAuthStore';
import type { MyReview } from '@/types/spot';

export default function MyReviewsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useMyReviews();
  const deleteReview = useDeleteReview();
  // 토큰이 없으면 쿼리가 enabled:false로 아예 실행되지 않는다. 그때 isLoading도 false여서
  // 빈 배열이 되는데, 이를 "리뷰 없음"으로 표시하면 조회 실패를 데이터 없음으로 오인시킨다.
  const isLoggedOut = useAuthStore((st) => !st.accessToken);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [menuTarget, setMenuTarget] = useState<MyReview | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);

  const reviews = data ?? [];

  // 수정 화면은 SpotStack 소속이라 루트를 경유해 이동한다(navigation/index.tsx의 딥링크 처리와 같은 방식).
  const goEdit = (review: MyReview) => {
    setMenuTarget(null);
    navigation.navigate('SpotStack', {
      screen: 'ReviewWrite',
      params: {
        spotId: String(review.spotId),
        edit: {
          reviewId: review.reviewId,
          rating: review.rating,
          content: review.text,
          timePeriod: review.timePeriod,
          visitedAt: review.visitedAtISO,
          equipmentInfo: review.equipment ?? null,
          tags: review.tags,
          photos: review.photos,
        },
      },
    });
  };

  const handleDelete = (review: MyReview) => {
    setMenuTarget(null);
    Alert.alert('리뷰 삭제', '삭제한 리뷰는 되돌릴 수 없어요. 첨부한 사진도 함께 삭제돼요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          deleteReview.mutate(
            { reviewId: review.reviewId, spotId: String(review.spotId) },
            {
              onSuccess: () => {
                setToastMessage('리뷰가 삭제되었습니다.');
                setToastVisible(true);
              },
              onError: (err) =>
                Alert.alert('삭제 실패', err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.'),
            },
          ),
      },
    ]);
  };

  const renderStars = (count: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Text key={i} style={styles.starText}>
          {i < count ? '★' : '☆'}
        </Text>
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />
      
      {/* NavBar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.65)" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>내가 쓴 리뷰</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.listContainer}
      >
        {isLoggedOut ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>로그인이 필요해요</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator color="#E31B59" />
          </View>
        ) : isError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>리뷰를 불러오지 못했어요</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>다시 시도</Text>
            </TouchableOpacity>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 작성한 리뷰가 없어요</Text>
          </View>
        ) : (
          <>
            {reviews.map((review, index) => (
              <View key={review.reviewId} style={[styles.reviewItem, index === reviews.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.itemTop}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.spotName}>{review.spotName}</Text>
                    <View style={styles.metaRow}>
                      {renderStars(review.rating)}
                      {review.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{review.badge}</Text>
                        </View>
                      )}
                      <Text style={styles.dateText}>{review.date}</Text>
                    </View>
                  </View>
                  <ReviewMenuButton onPress={() => setMenuTarget(review)} />
                </View>

                <Text style={styles.reviewText} numberOfLines={2}>
                  {review.text}
                </Text>

                <ReviewTagRow tags={review.tags} />

                {review.photos.length > 0 && (
                  <View style={styles.photosRow}>
                    {review.photos.map((photo, photoIdx) => (
                      <TouchableOpacity
                        key={photo.photoId}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="사진 크게 보기"
                        onPress={() => setLightbox({ photos: review.photos.map((p) => p.url), index: photoIdx })}
                      >
                        <Image source={{ uri: photo.url }} resizeMode="cover" style={styles.photoThumb} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {hasNextPage && (
              <TouchableOpacity
                style={styles.moreBtn}
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                activeOpacity={0.7}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator color="rgba(0,0,0,0.4)" />
                ) : (
                  <Text style={styles.moreText}>더보기</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <ReviewActionSheet
        visible={menuTarget !== null}
        onClose={() => setMenuTarget(null)}
        onEdit={() => menuTarget && goEdit(menuTarget)}
        onDelete={() => menuTarget && handleDelete(menuTarget)}
      />

      <PhotoLightbox
        photos={lightbox?.photos ?? []}
        initialIndex={lightbox?.index ?? 0}
        visible={lightbox !== null}
        onClose={() => setLightbox(null)}
      />

      {/* 공통 토스트 */}
      <Toast 
        visible={toastVisible} 
        message={toastMessage} 
        onHide={() => setToastVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  moreBtn: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalize(12),
  },
  moreText: { fontSize: FONT_MD, fontWeight: '500', color: 'rgba(0,0,0,0.55)', letterSpacing: -0.2 },
  navBar: {
    height: normalize(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { width: normalize(36), height: normalize(36), alignItems: 'center', justifyContent: 'center', marginLeft: -normalize(8) },
  navTitle: { fontSize: normalizeFontSize(18), fontWeight: '600', color: '#000', letterSpacing: -0.3 },
  placeholder: { width: normalize(36) },

  listContainer: { paddingHorizontal: normalize(20), paddingVertical: normalize(4), paddingBottom: normalize(40) },
  
  reviewItem: {
    paddingVertical: normalize(14),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'column',
    gap: normalize(6),
  },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: normalize(10) },
  itemLeft: { flex: 1 },
  spotName: { fontSize: FONT_MD, fontWeight: '600', color: '#000', letterSpacing: -0.2, marginBottom: normalize(4) },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: normalize(6) },
  starsContainer: { flexDirection: 'row', letterSpacing: 1 },
  starText: { fontSize: FONT_XS, color: '#f59e0b' },
  
  badge: { height: normalize(16), paddingHorizontal: normalize(6), borderRadius: normalize(8), backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: FONT_2XS, fontWeight: '500', color: 'rgba(0,0,0,0.4)' },
  dateText: { fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' },

  reviewText: { fontSize: FONT_SM, color: 'rgba(0,0,0,0.6)', lineHeight: normalize(22), letterSpacing: -0.1 },

  photosRow: { flexDirection: 'row', gap: normalize(5), marginTop: normalize(4) },
  photoThumb: { width: normalize(52), height: normalize(52), borderRadius: normalize(8) },


  emptyContainer: { paddingVertical: normalize(40), alignItems: 'center', gap: normalize(12) },
  emptyText: { fontSize: FONT_SM, color: 'rgba(0,0,0,0.3)' },
  retryBtn: {
    height: normalize(44),
    paddingHorizontal: normalize(24),
    borderRadius: BUTTON_RADIUS,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: { fontSize: normalizeFontSize(14), fontWeight: '600', color: '#000', letterSpacing: -0.2 },
});
