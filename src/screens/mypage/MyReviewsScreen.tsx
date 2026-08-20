import React, { useState } from 'react';
import { 
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft, IconTrash } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, HAIRLINE_WIDTH } from '@/constants/layout';
import Toast from '@/components/common/Toast';
import type { RootStackParamList } from '@/navigation';
import ReviewTagRow from '@/components/spot/ReviewTagRow';
import PhotoLightbox from '@/components/spot/PhotoLightbox';
import { useDeleteReview, useMyReviews } from '@/hooks/useSpot';
import { useAuthStore } from '@/store/useAuthStore';
import type { MyReview } from '@/types/spot';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

export default function MyReviewsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } = useMyReviews();
  const deleteReview = useDeleteReview();
  const isLoggedOut = useAuthStore((st) => !st.accessToken);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  // reviewId·photoIds는 확대 화면의 EXIF 조회용 (photoId로 EXIF 응답을 매칭한다).
  const [lightbox, setLightbox] = useState<{ photos: string[]; photoIds: number[]; index: number; reviewId: number } | null>(null);

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
        <Text key={i} style={{ fontSize: FONT_XS, color: '#f59e0b', letterSpacing: 1 }}>
          {i < count ? '★' : '☆'}
        </Text>
      );
    }
    return <View className="flex-row items-center">{stars}</View>;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />
      
      {/* NavBar */}
      <View
        className="flex-row items-center justify-between"
        style={{
          height: normalize(54),
          paddingHorizontal: normalize(20),
          borderBottomWidth: HAIRLINE_WIDTH,
          borderBottomColor: HAIRLINE,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: normalize(36),
            height: normalize(36),
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: -normalize(8),
          }}
        >
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.65)" strokeWidth={2} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: FONT_LG,
            fontFamily: 'Pretendard-SemiBold',
            color: '#000',
            letterSpacing: -0.3,
          }}
        >
          내가 쓴 리뷰
        </Text>
        <View style={{ width: normalize(36) }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{
          paddingHorizontal: normalize(20),
          paddingVertical: normalize(4),
          paddingBottom: normalize(40),
        }}
      >
        {isLoggedOut ? (
          <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
            <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.3)' }}>
              로그인이 필요해요
            </Text>
          </View>
        ) : isLoading ? (
          <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
            <ActivityIndicator color={BRAND} />
          </View>
        ) : isError ? (
          <View style={{ paddingVertical: normalize(40), alignItems: 'center', gap: normalize(12) }}>
            <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.3)' }}>
              리뷰를 불러오지 못했어요
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{
                height: normalize(44),
                paddingHorizontal: normalize(24),
                borderRadius: BUTTON_RADIUS,
                backgroundColor: CARD,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: normalizeFontSize(14), fontFamily: 'Pretendard-SemiBold', color: '#000', letterSpacing: -0.2 }}>
                다시 시도
              </Text>
            </TouchableOpacity>
          </View>
        ) : reviews.length === 0 ? (
          <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
            <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.3)' }}>
              아직 작성한 리뷰가 없어요
            </Text>
          </View>
        ) : (
          <>
            {reviews.map((review, index) => (
              <View
                key={review.reviewId}
                style={{
                  paddingVertical: normalize(16),
                  borderBottomWidth: index === reviews.length - 1 ? 0 : HAIRLINE_WIDTH,
                  borderBottomColor: HAIRLINE,
                  gap: normalize(6),
                }}
              >
                <View className="flex-row items-start justify-between" style={{ gap: normalize(10) }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: FONT_MD,
                        fontFamily: 'Pretendard-SemiBold',
                        color: '#000',
                        letterSpacing: -0.2,
                        marginBottom: normalize(4),
                      }}
                    >
                      {review.spotName}
                    </Text>
                    <View className="flex-row items-center" style={{ gap: normalize(6) }}>
                      {renderStars(review.rating)}
                      {review.badge && (
                        <View
                          style={{
                            height: normalize(18),
                            paddingHorizontal: normalize(6),
                            borderRadius: normalize(9),
                            backgroundColor: 'rgba(0,0,0,0.05)',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Medium', color: 'rgba(0,0,0,0.45)' }}>
                            {review.badge}
                          </Text>
                        </View>
                      )}
                      <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.35)' }}>
                        {review.date}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleDelete(review)}
                    activeOpacity={0.7}
                    style={{
                      width: normalize(32),
                      height: normalize(32),
                      borderRadius: normalize(16),
                      backgroundColor: BRAND_TINT,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconTrash size={normalize(16)} color={BRAND} strokeWidth={1.75} />
                  </TouchableOpacity>
                </View>

                <Text
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-Regular',
                    color: 'rgba(0,0,0,0.7)',
                    lineHeight: normalize(20),
                    letterSpacing: -0.1,
                  }}
                  numberOfLines={3}
                >
                  {review.text}
                </Text>

                <ReviewTagRow tags={review.tags} />

                {review.photos.length > 0 && (
                  <View className="flex-row" style={{ gap: normalize(6), marginTop: normalize(4) }}>
                    {review.photos.map((photo, photoIdx) => (
                      <TouchableOpacity
                        key={photo.photoId}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="사진 크게 보기"
                        onPress={() =>
                          setLightbox({
                            photos: review.photos.map((p) => p.url),
                            photoIds: review.photos.map((p) => p.photoId),
                            index: photoIdx,
                            reviewId: review.reviewId,
                          })
                        }
                      >
                        <Image
                          source={{ uri: photo.url }}
                          resizeMode="cover"
                          style={{
                            width: normalize(56),
                            height: normalize(56),
                            borderRadius: normalize(8),
                            backgroundColor: CARD,
                          }}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {hasNextPage && (
              <TouchableOpacity
                style={{
                  height: BUTTON_HEIGHT,
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: CARD,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: normalize(12),
                }}
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                activeOpacity={0.7}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator color={TEXT_SUB} />
                ) : (
                  <Text style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-Medium', color: 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                    더보기
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <PhotoLightbox
        photos={lightbox?.photos ?? []}
        photoIds={lightbox?.photoIds}
        reviewId={lightbox?.reviewId}
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
