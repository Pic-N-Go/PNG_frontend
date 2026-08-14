import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconBookmark } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_MD, FONT_XS } from '@/constants/layout';
import type { SpotItem } from '@/types/spot';

interface Props {
  item: SpotItem;
  // TODO: 스팟 상세 네비게이션 파라미터 확정 후 onPress 연결
  onPress?: () => void;
  /**
   * 북마크 아이콘 탭. 저장 여부는 `item.isBookmarked`(서버 값)만 신뢰하고 카드는 상태를 갖지 않는다 —
   * 컬렉션 선택 시트를 거쳐야 실제 저장이 끝나므로 낙관적 토글은 거짓 표시가 된다.
   * 넘기지 않으면 아이콘 자체를 그리지 않는다 (비로그인 — 담을 컬렉션이 없다).
   */
  onBookmarkPress?: () => void;
}

// 사진도 그라디언트도 없는 스팟용 폴백. 카드가 흰 사각형으로 비는 것만 막으면 되므로 한 벌만 둔다.
const FALLBACK_GRADIENT: [string, string, string] = ['#2C3E50', '#4A6572', '#8B9DA8'];

export default function SpotCard({ item, onPress, onBookmarkPress }: Props) {
  const bookmarked = item.isBookmarked;

  const rating = item.rating ?? 0;
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(rating) ? '★' : '☆').join('');

  return (
    <View style={{ width: normalize(220), borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: '#F5F5F7' }}>
    <Pressable
      onPress={onPress ?? undefined}
      style={({ pressed }) => ({
        opacity: onPress && pressed ? 0.95 : 1,
        transform: [{ scale: onPress && pressed ? 0.98 : 1 }],
      })}
    >
      {/* 사진 영역 */}
      <View style={{ height: normalize(160), position: 'relative' }}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            resizeMode="cover"
            style={{ position: 'absolute', inset: 0 }}
          />
        ) : (
          <LinearGradient
            colors={item.gradientColors ?? FALLBACK_GRADIENT}
            style={{ position: 'absolute', inset: 0 }}
          />
        )}

        {item.badge && (
          <View
            style={{
              position: 'absolute',
              top: normalize(10),
              left: normalize(10),
              height: normalize(22),
              paddingHorizontal: normalize(10),
              borderRadius: normalize(11),
              backgroundColor: item.badge === 'HOT' ? 'rgba(0,0,0,0.45)' : 'rgba(227,27,89,0.85)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: normalizeFontSize(10),
                color: '#fff',
                letterSpacing: 0.3,
              }}
            >
              {item.badge}
            </Text>
          </View>
        )}

        {onBookmarkPress && (
          <Pressable
            onPress={onBookmarkPress}
            hitSlop={8}
            style={{
              position: 'absolute',
              top: normalize(10),
              right: normalize(10),
              width: normalize(28),
              height: normalize(28),
              borderRadius: normalize(14),
              backgroundColor: bookmarked ? '#fff' : 'rgba(0,0,0,0.25)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconBookmark
              size={normalize(14)}
              color={bookmarked ? '#E31B59' : '#fff'}
              strokeWidth={1.5}
              fill={bookmarked ? '#E31B59' : 'none'}
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
          {item.name}
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: normalizeFontSize(12),
            color: 'rgba(0,0,0,0.4)',
            marginBottom: normalize(10),
          }}
          numberOfLines={1}
        >
          {item.location}
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: normalizeFontSize(12),
            color: '#ff9f0a',
            marginBottom: normalize(10),
          }}
        >
          {stars}{' '}
          <Text style={{ color: 'rgba(0,0,0,0.3)', marginLeft: normalize(4) }}>
            {rating.toFixed(1)}
          </Text>
        </Text>

        {/* 포토제닉 지수 */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: normalize(28),
            paddingHorizontal: normalize(10),
            borderRadius: normalize(8),
            backgroundColor: '#fff',
          }}
        >
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)' }}
          >
            포토제닉 지수
          </Text>
          <Text allowFontScaling={false}>
            <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#E31B59' }}>
              {item.photoScore ?? 0}
            </Text>
            <Text style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(10), color: 'rgba(0,0,0,0.2)' }}>
              /100
            </Text>
          </Text>
        </View>
      </View>
    </Pressable>
    </View>
  );
}
