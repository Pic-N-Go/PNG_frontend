import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, StatusBar 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft, IconTrash } from '@tabler/icons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG } from '@/constants/layout';
import Toast from '@/components/auth/Toast';

interface ReviewData {
  id: number;
  spot: string;
  stars: number;
  period: string;
  date: string;
  text: string;
  photos: string[][]; // array of gradient colors
}

const INITIAL_REVIEWS: ReviewData[] = [
  {
    id: 1,
    spot: '광안리 해수욕장',
    stars: 5,
    period: '야경',
    date: '2026.04.12',
    text: '광안대교 야경이 정말 환상적이에요. 삼각대 없으면 흔들려서 꼭 챙겨가세요. 일몰 30분 후가 골든타임입니다.',
    photos: [['#0f2027', '#2c5364'], ['#203a43', '#4a7c8a']]
  },
  {
    id: 2,
    spot: '진해 경화역',
    stars: 5,
    period: '낮',
    date: '2026.04.02',
    text: '벚꽃 시즌에 다녀왔는데 정말 예뻤어요. 기차와 벚꽃 조합이 환상적입니다. 주말엔 사람이 많으니 평일 오전 추천해요.',
    photos: [['#8b4a6b', '#f0c89a']]
  },
  {
    id: 3,
    spot: '제주 사려니숲',
    stars: 4,
    period: '낮',
    date: '2026.04.15',
    text: '피톤치드 가득한 숲길에서 촬영했어요. 빛이 나무 사이로 들어오는 장면이 정말 좋았습니다.',
    photos: []
  },
  {
    id: 4,
    spot: '경복궁',
    stars: 5,
    period: '야경',
    date: '2026.03.08',
    text: '야간 개장 때 촬영했어요. 조명이 정말 멋지고 인파가 있어도 구도 잘 잡으면 훌륭한 사진을 얻을 수 있어요.',
    photos: [['#1a1530', '#b44a3a']]
  },
];

export default function MyReviewsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<ReviewData[]>(INITIAL_REVIEWS);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleDelete = (id: number) => {
    Alert.alert(
      "리뷰 삭제",
      "정말 이 리뷰를 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive",
          onPress: () => {
            setReviews(prev => prev.filter(r => r.id !== id));
            setToastMessage("리뷰가 삭제되었습니다.");
            setToastVisible(true);
          }
        }
      ]
    );
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
    return <Text style={styles.starsContainer}>{stars}</Text>;
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
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>아직 작성한 리뷰가 없어요</Text>
          </View>
        ) : (
          reviews.map((review, index) => (
            <View key={review.id} style={[styles.reviewItem, index === reviews.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.itemTop}>
                <View style={styles.itemLeft}>
                  <Text style={styles.spotName}>{review.spot}</Text>
                  <View style={styles.metaRow}>
                    {renderStars(review.stars)}
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{review.period}</Text>
                    </View>
                    <Text style={styles.dateText}>{review.date}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.delBtn} 
                  onPress={() => handleDelete(review.id)}
                  activeOpacity={0.7}
                >
                  <IconTrash size={normalize(16)} color="#ff453a" />
                </TouchableOpacity>
              </View>

              <Text style={styles.reviewText} numberOfLines={2}>
                {review.text}
              </Text>

              {review.photos.length > 0 && (
                <View style={styles.photosRow}>
                  {review.photos.map((colors, idx) => (
                    <LinearGradient
                      key={idx}
                      colors={colors as [string, string]}
                      style={styles.photoThumb}
                    />
                  ))}
                </View>
              )}
            </View>
          ))
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
