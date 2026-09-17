import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft, IconChevronRight, IconInfoCircle, IconMapPin } from '@tabler/icons-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SpotStackParamList } from '@/navigation/stacks/SpotStack';
import { useRelatedSpots } from '@/hooks/useSpot';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, GRID_PADDING } from '@/constants/layout';
import {
  BRAND,
  BRAND_TINT,
  BRAND_TINT_ACTIVE,
  CARD,
  HAIRLINE,
  TEXT_SUB,
} from '@/constants/colors';
import type { RelatedSpotDTO } from '@/types/spot';

type Props = NativeStackScreenProps<SpotStackParamList, 'RelatedSpots'>;

export default function RelatedSpotsScreen({ navigation, route }: Props) {
  const { spotId } = route.params;
  const insets = useSafeAreaInsets();

  const { data: spots, isLoading, isError, refetch } = useRelatedSpots(spotId, 10);

  const formatDistance = (km: number | null) => {
    if (km == null) return null;
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  const renderItem = ({ item }: { item: RelatedSpotDTO }) => {
    const isTop3 = item.rank <= 3;
    const isClickable = item.spotId != null;
    const distanceStr = formatDistance(item.distanceKm);

    return (
      <Pressable
        onPress={() => {
          if (isClickable) {
            navigation.push('SpotDetail', { spotId: String(item.spotId) });
          }
        }}
        disabled={!isClickable}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: CARD,
          borderRadius: CARD_RADIUS,
          padding: normalize(14),
          marginBottom: normalize(10),
        }}
      >
        {/* 순위 배지 */}
        <View
          style={{
            width: normalize(28),
            height: normalize(28),
            borderRadius: normalize(14),
            backgroundColor: isTop3 ? BRAND_TINT_ACTIVE : 'rgba(0,0,0,0.05)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: normalize(12),
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Bold',
              fontSize: normalizeFontSize(13),
              color: isTop3 ? BRAND : '#444',
            }}
          >
            {item.rank}
          </Text>
        </View>

        {/* 썸네일 */}
        <View
          style={{
            width: normalize(64),
            height: normalize(64),
            borderRadius: normalize(10),
            backgroundColor: 'rgba(0,0,0,0.04)',
            overflow: 'hidden',
            marginRight: normalize(12),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <IconMapPin size={normalize(24)} color={TEXT_SUB} strokeWidth={1.5} />
          )}
        </View>

        {/* 텍스트 정보 */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: normalizeFontSize(16),
              color: '#000',
              letterSpacing: -0.3,
            }}
          >
            {item.name}
          </Text>

          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: normalizeFontSize(13),
              color: TEXT_SUB,
              marginTop: normalize(2),
            }}
          >
            {[item.category, item.region].filter(Boolean).join(' · ')}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: normalize(4),
              gap: normalize(6),
            }}
          >
            {item.matched && item.rating > 0 && (
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Medium',
                  fontSize: normalizeFontSize(12),
                  color: '#F59E0B',
                }}
              >
                ★ {item.rating.toFixed(1)} ({item.reviewCount})
              </Text>
            )}
            {distanceStr && (
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Regular',
                  fontSize: normalizeFontSize(12),
                  color: TEXT_SUB,
                }}
              >
                {distanceStr}
              </Text>
            )}
            {!item.matched && (
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-Regular',
                  fontSize: normalizeFontSize(11),
                  color: TEXT_SUB,
                }}
              >
                관광공사 추천 명소
              </Text>
            )}
          </View>
        </View>

        {/* 우측 이동 아이콘 */}
        {isClickable && (
          <IconChevronRight
            size={normalize(20)}
            color="rgba(0,0,0,0.25)"
            strokeWidth={1.8}
          />
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 커스텀 헤더 */}
      <View
        style={{
          paddingTop: insets.top,
          borderBottomWidth: 1,
          borderBottomColor: HAIRLINE,
          backgroundColor: '#fff',
        }}
      >
        <View
          style={{
            height: normalize(52),
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: normalize(12),
          }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={{
              width: normalize(36),
              height: normalize(36),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
          </Pressable>
          <Text
            allowFontScaling={false}
            style={{
              flex: 1,
              fontFamily: 'Pretendard-SemiBold',
              fontSize: normalizeFontSize(17),
              color: '#000',
              textAlign: 'center',
              marginRight: normalize(36),
              letterSpacing: -0.3,
            }}
          >
            다음으로 방문하기 좋은 스팟
          </Text>
        </View>
      </View>

      {/* 안내 설명 배너 */}
      <View
        style={{
          marginHorizontal: GRID_PADDING,
          marginTop: normalize(16),
          marginBottom: normalize(12),
          padding: normalize(16),
          backgroundColor: BRAND_TINT,
          borderRadius: CARD_RADIUS,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        <IconInfoCircle
          size={normalize(20)}
          color={BRAND}
          strokeWidth={1.8}
          style={{ marginRight: normalize(10), marginTop: normalize(1) }}
        />
        <View style={{ flex: 1 }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: normalizeFontSize(14),
              color: '#000',
              letterSpacing: -0.2,
              lineHeight: normalize(20),
            }}
          >
            이곳을 찾은 사람들이 많이 방문한 장소예요
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: normalizeFontSize(12),
              color: TEXT_SUB,
              marginTop: normalize(4),
              lineHeight: normalize(17),
            }}
          >
            한국관광공사의 이동 및 연관 방문 데이터를 바탕으로, 다음 코스로 들르기 좋은 추천 명소입니다.
          </Text>
        </View>
      </View>

      {/* 목록 콘텐츠 */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={BRAND} size="large" />
        </View>
      ) : isError ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: GRID_PADDING,
            gap: normalize(12),
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: normalizeFontSize(15),
              color: TEXT_SUB,
              textAlign: 'center',
            }}
          >
            연관 스팟 정보를 불러오지 못했어요.
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={{
              height: normalize(40),
              paddingHorizontal: normalize(20),
              borderRadius: normalize(20),
              backgroundColor: CARD,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: normalizeFontSize(14),
                color: '#000',
              }}
            >
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : !spots || spots.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: normalizeFontSize(15),
              color: TEXT_SUB,
            }}
          >
            아직 연관된 스팟 정보가 없어요.
          </Text>
        </View>
      ) : (
        <FlatList
          data={spots.slice(0, 10)}
          keyExtractor={(item, index) => `${item.name}-${item.rank}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: GRID_PADDING,
            paddingBottom: insets.bottom + normalize(24),
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
