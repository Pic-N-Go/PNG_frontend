import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_2XS, FONT_MD, FONT_SM, FONT_TITLE, GRID_PADDING } from '@/constants/layout';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';
import { useSeasonalSpots } from '@/hooks/useSeasonalSpots';
import { regionLabelFrom } from '@/utils/spotMappers';
import Skeleton from '@/components/common/Skeleton';

interface Props {
  onSpotPress?: (id: string) => void;
  onViewAll?: (query: string) => void;
}

const CARD_WIDTH = normalize(210);

export default function SeasonalSpotSection({ onSpotPress, onViewAll }: Props) {
  const { spots: spotList, season, currentMonth, isLoading } = useSeasonalSpots(6);

  return (
    <View className="mt-7">
      {/* 헤더 */}
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        <View className="flex-row justify-between items-baseline mb-1">
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, color: '#000', letterSpacing: -0.4 }}
          >
            이달의 추천 출사스팟
          </Text>
          {onViewAll && (
            <Pressable onPress={() => onViewAll(season.keyword)} hitSlop={8}>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: BRAND }}
              >
                모두 보기
              </Text>
            </Pressable>
          )}
        </View>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Pretendard-Regular',
            fontSize: FONT_SM,
            color: TEXT_SUB,
            letterSpacing: -0.1,
            marginBottom: normalize(14),
          }}
        >
          {`${currentMonth}월에 가장 아름다운 ${season.title} 명소`}
        </Text>
      </View>

      {/* 가로 횡 스크롤 카드 목록 */}
      {isLoading ? (
        <View className="flex-row" style={{ gap: normalize(12), paddingHorizontal: GRID_PADDING }}>
          <View style={{ width: CARD_WIDTH }}>
            <Skeleton width="100%" height={normalize(180)} borderRadius={CARD_RADIUS} />
          </View>
          <View style={{ width: CARD_WIDTH }}>
            <Skeleton width="100%" height={normalize(180)} borderRadius={CARD_RADIUS} />
          </View>
        </View>
      ) : spotList.length === 0 ? (
        <View style={{ paddingHorizontal: GRID_PADDING }}>
          <View className="items-center" style={{ padding: normalize(18), borderRadius: CARD_RADIUS, backgroundColor: CARD }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: TEXT_SUB }}>
              이달의 추천 출사스팟 정보를 준비 중입니다.
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, gap: normalize(12) }}
        >
          {spotList.map((spot) => {
            const location = regionLabelFrom(spot.address) || spot.address || '전국';
            const tipText = spot.overview
              ? spot.overview.replace(/\r?\n/g, ' ').slice(0, 24)
              : season.cameraTip;

            return (
              <View
                key={spot.id}
                style={{ width: CARD_WIDTH, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: CARD }}
              >
                <Pressable
                  onPress={onSpotPress ? () => onSpotPress(String(spot.id)) : undefined}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                >
                  {/* 헤더 */}
                  <View style={{ backgroundColor: '#1d1d1f', paddingVertical: normalize(10), paddingHorizontal: normalize(14) }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: FONT_2XS,
                        color: 'rgba(255,255,255,0.65)',
                        letterSpacing: 0.5,
                        marginBottom: normalize(4),
                      }}
                      numberOfLines={1}
                    >
                      {season.timeTip}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: FONT_MD,
                        color: '#fff',
                      }}
                      numberOfLines={1}
                    >
                      {spot.name}
                    </Text>
                  </View>

                  {/* 바디 */}
                  <View style={{ paddingTop: normalize(12), paddingHorizontal: normalize(14), paddingBottom: normalize(14) }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-Medium',
                        fontSize: FONT_SM,
                        color: '#000',
                        marginBottom: normalize(2),
                      }}
                      numberOfLines={1}
                    >
                      {location}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-Regular',
                        fontSize: FONT_SM,
                        color: TEXT_SUB,
                        marginBottom: normalize(10),
                      }}
                      numberOfLines={1}
                    >
                      {tipText}
                    </Text>

                    {/* 카테고리 태그 */}
                    <View
                      className="self-start items-center justify-center"
                      style={{
                        height: normalize(22),
                        paddingHorizontal: normalize(8),
                        borderRadius: normalize(11),
                        backgroundColor: '#fff',
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Pretendard-Regular',
                          fontSize: FONT_2XS,
                          color: TEXT_SUB,
                        }}
                        numberOfLines={1}
                      >
                        {season.tag}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
