import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { IconChevronRight, IconMapPin } from '@tabler/icons-react-native';
import { useRelatedSpots } from '@/hooks/useSpot';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, GRID_PADDING } from '@/constants/layout';
import { BRAND, BRAND_TINT, BRAND_TINT_ACTIVE, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';
import type { RelatedSpotDTO } from '@/types/spot';

interface Props {
  spotId: string;
  spotName?: string;
  onViewAll?: () => void;
  onSpotPress?: (spotId: string) => void;
}

export default function RelatedSpotsCard({ spotId, spotName, onViewAll, onSpotPress }: Props) {
  const { data, isLoading } = useRelatedSpots(spotId, 10);

  if (isLoading || !data || data.length === 0) {
    return null;
  }

  const previewItems = data.slice(0, 2);

  const formatDistance = (km: number | null) => {
    if (km == null) return null;
    if (km < 1) return `${Math.round(km * 1000)}m`;
    return `${km.toFixed(1)}km`;
  };

  return (
    <View style={{ marginTop: normalize(24), paddingHorizontal: GRID_PADDING }}>
      {/* 헤더: 제목 및 전체보기 버튼 */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: normalize(4),
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-SemiBold',
            fontSize: normalizeFontSize(18),
            color: '#000',
            letterSpacing: -0.3,
          }}
        >
          다음으로 방문하기 좋은 스팟
        </Text>
        {onViewAll && (
          <Pressable onPress={onViewAll} hitSlop={8}>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Medium',
                fontSize: normalizeFontSize(13),
                color: BRAND,
              }}
            >
              전체보기
            </Text>
          </Pressable>
        )}
      </View>

      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'Pretendard-Regular',
          fontSize: normalizeFontSize(13),
          color: TEXT_SUB,
          marginBottom: normalize(12),
        }}
      >
        이곳을 찾은 여행객들이 함께 많이 방문한 장소예요
      </Text>

      {/* 2개 스팟 미리보기 카드 */}
      <View
        style={{
          backgroundColor: CARD,
          borderRadius: CARD_RADIUS,
          padding: normalize(16),
        }}
      >
        {previewItems.map((item, index) => {
          const isFirst = index === 0;
          const isClickable = item.spotId != null;
          const distanceStr = formatDistance(item.distanceKm);

          return (
            <React.Fragment key={`${item.name}-${item.rank}`}>
              {index > 0 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: HAIRLINE,
                    marginVertical: normalize(12),
                  }}
                />
              )}

              <Pressable
                onPress={() => {
                  if (isClickable && onSpotPress) {
                    onSpotPress(String(item.spotId));
                  }
                }}
                disabled={!isClickable}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {/* 순위 배지 */}
                <View
                  style={{
                    width: normalize(26),
                    height: normalize(26),
                    borderRadius: normalize(13),
                    backgroundColor: isFirst ? BRAND_TINT_ACTIVE : BRAND_TINT,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: normalize(10),
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Pretendard-Bold',
                      fontSize: normalizeFontSize(12),
                      color: BRAND,
                    }}
                  >
                    {item.rank}
                  </Text>
                </View>

                {/* 썸네일 이미지 */}
                <View
                  style={{
                    width: normalize(56),
                    height: normalize(56),
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
                    <IconMapPin size={normalize(22)} color={TEXT_SUB} strokeWidth={1.5} />
                  )}
                </View>

                {/* 정보 영역 */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={{
                      fontFamily: 'Pretendard-SemiBold',
                      fontSize: normalizeFontSize(15),
                      color: '#000',
                      letterSpacing: -0.2,
                    }}
                  >
                    {item.name}
                  </Text>

                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={{
                      fontFamily: 'Pretendard-Regular',
                      fontSize: normalizeFontSize(12),
                      color: TEXT_SUB,
                      marginTop: normalize(2),
                    }}
                  >
                    {[item.category, item.region].filter(Boolean).join(' · ')}
                  </Text>

                  {(item.matched || distanceStr) && (
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
                            fontSize: normalizeFontSize(11),
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
                            fontSize: normalizeFontSize(11),
                            color: TEXT_SUB,
                          }}
                        >
                          {distanceStr}
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* 우측 이동 아이콘 */}
                {isClickable && (
                  <IconChevronRight
                    size={normalize(18)}
                    color="rgba(0,0,0,0.25)"
                    strokeWidth={1.8}
                  />
                )}
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
