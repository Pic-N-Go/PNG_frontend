import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar,
  ActivityIndicator, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft, IconTrash } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_XS, FONT_SM, FONT_MD } from '@/constants/layout';
import Toast from '@/components/auth/Toast';
import { useDeleteReview, useMyReviews } from '@/hooks/useSpot';
import type { MyReview } from '@/types/spot';

export default function MyReviewsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage } = useMyReviews();
  const deleteReview = useDeleteReview();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const reviews = data ?? [];

  const handleDelete = (review: MyReview) => {
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
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator color="#E31B59" />
          </View>
        ) : isError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>리뷰를 불러오지 못했어요</Text>
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
                  <TouchableOpacity
                    style={styles.delBtn}
                    onPress={() => handleDelete(review)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="리뷰 삭제"
                  >
                    <IconTrash size={normalize(16)} color="#ff453a" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.reviewText} numberOfLines={2}>
                  {review.text}
                </Text>

                {review.photos.length > 0 && (
                  <View style={styles.photosRow}>
                    {review.photos.map((uri) => (
                      <Image key={uri} source={{ uri }} resizeMode="cover" style={styles.photoThumb} />
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
  badgeText: { fontSize: normalizeFontSize(10), fontWeight: '500', color: 'rgba(0,0,0,0.4)' },
  dateText: { fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' },

  reviewText: { fontSize: FONT_SM, color: 'rgba(0,0,0,0.6)', lineHeight: normalize(22), letterSpacing: -0.1 },

  photosRow: { flexDirection: 'row', gap: normalize(5), marginTop: normalize(4) },
  photoThumb: { width: normalize(52), height: normalize(52), borderRadius: normalize(8) },

  delBtn: { width: normalize(30), height: normalize(30), borderRadius: normalize(15), backgroundColor: 'rgba(255,69,58,0.07)', alignItems: 'center', justifyContent: 'center', marginTop: normalize(2) },

  emptyContainer: { paddingVertical: normalize(40), alignItems: 'center' },
  emptyText: { fontSize: FONT_SM, color: 'rgba(0,0,0,0.3)' },
});
