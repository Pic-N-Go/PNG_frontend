import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconBookmark } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_MD, FONT_SM } from '@/constants/layout';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';
import type { SpotItem } from '@/types/spot';

/** 사진 없는 스팟용 폴백 — SpotCard와 같은 색을 쓴다. */
const FALLBACK_GRADIENT: [string, string, string] = ['#2C3E50', '#4A6572', '#8B9DA8'];

interface Props {
  item: SpotItem;
  /**
   * 북마크 아이콘 탭. 홈 카드와 같이 컬렉션 시트를 여는 용도 —
   * 한 번 탭으로 바로 지우지 않는다(되돌릴 방법이 없다). 넘기지 않으면 아이콘을 그리지 않는다.
   */
  onBookmarkPress?: () => void;
}

/**
 * 북마크 목록의 한 줄. 왼쪽에 [썸네일 · 이름/지역/평점], 오른쪽에 북마크 아이콘만 둔다.
 * 별 표기는 홈 SpotCard와 같다 — 목업의 거리·추천 시기는 서버에 없어 넣지 않았다.
 */
export default function BookmarkedSpotRow({ item, onBookmarkPress }: Props) {
  const navigation = useNavigation<any>();
  const [imageFailed, setImageFailed] = React.useState(false);
  React.useEffect(() => setImageFailed(false), [item.imageUrl]);

  const rating = item.rating ?? 0;
  const stars = Array.from({ length: 5 }, (_, i) => (i < Math.round(rating) ? '★' : '☆')).join('');

  return (
    // 레이아웃은 바깥 View가 갖는다 — Pressable의 함수형 style에 넣으면 NativeWind가 먹는다.
    <View style={{ borderRadius: CARD_RADIUS, backgroundColor: CARD, overflow: 'hidden' }}>
      <Pressable
        onPress={() =>
          navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: item.id } })
        }
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View className="flex-row items-center" style={{ padding: normalize(10), gap: normalize(12) }}>
          <View
            style={{
              width: normalize(56),
              height: normalize(56),
              borderRadius: normalize(10),
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {item.imageUrl && !imageFailed ? (
              <Image
                source={{ uri: item.imageUrl }}
                resizeMode="cover"
                onError={() => setImageFailed(true)}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <LinearGradient colors={FALLBACK_GRADIENT} style={{ flex: 1 }} />
            )}
          </View>

          <View className="flex-1">
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              className="font-semibold text-black tracking-tight"
              style={{ fontSize: FONT_MD, marginBottom: normalize(3) }}
            >
              {item.name}
            </Text>
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              className="font-normal"
              style={{ fontSize: normalizeFontSize(12), color: TEXT_SUB }}
            >
              {item.location}
            </Text>

            {/* 별·평점·리뷰 수 조합은 홈 SpotCard와 동일하다 (리뷰 0건이면 "리뷰 없음"까지). */}
            <View
              className="flex-row items-center"
              style={{ gap: normalize(4), marginTop: normalize(4) }}
            >
              {item.reviewCount ? (
                <>
                  <Text
                    allowFontScaling={false}
                    className="font-normal"
                    style={{ fontSize: normalizeFontSize(12), color: '#ff9f0a' }}
                  >
                    {stars}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className="font-semibold text-black"
                    style={{ fontSize: FONT_SM }}
                  >
                    {rating.toFixed(1)}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    className="font-normal"
                    style={{ fontSize: FONT_SM, color: '#8e8e93' }}
                  >
                    ({item.reviewCount})
                  </Text>
                </>
              ) : (
                <Text
                  allowFontScaling={false}
                  className="font-normal"
                  style={{ fontSize: FONT_SM, color: '#8e8e93' }}
                >
                  리뷰 없음
                </Text>
              )}
            </View>
          </View>

          {onBookmarkPress && (
            <Pressable
              onPress={onBookmarkPress}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="즐겨찾기 관리"
              className="shrink-0"
            >
              <IconBookmark size={normalize(16)} color={BRAND} strokeWidth={1.5} fill={BRAND} />
            </Pressable>
          )}
        </View>
      </Pressable>
    </View>
  );
}
