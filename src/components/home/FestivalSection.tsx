import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_2XS, FONT_MD, FONT_SM, FONT_TITLE, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';
import { useFestivals } from '@/hooks/useFestival';
import { regionLabelFrom } from '@/utils/spotMappers';
import Skeleton from '@/components/common/Skeleton';
import { SPOT_CATEGORY_MAP } from '@/constants/spotCategories';

interface Props {
  onEventPress?: (id: string) => void;
  onViewAll?: () => void;
}

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return '상시 진행';
  if (!endDate || startDate === endDate) {
    return startDate.replace(/-/g, '.');
  }
  const [sy, sm, sd] = startDate.split('-');
  const [ey, em, ed] = endDate.split('-');
  if (sy && ey && sy === ey) {
    return `${sy}.${sm}.${sd} ~ ${em}.${ed}`;
  }
  return `${startDate.replace(/-/g, '.')} ~ ${endDate.replace(/-/g, '.')}`;
}

const CARD_WIDTH = normalize(210);

export default function FestivalSection({ onEventPress, onViewAll }: Props) {
  // 백엔드가 종료된 축제를 제외한 목록을 기본 반환하므로 단일 쿼리로 안정적이고 빠르게 호출
  const { data: festivalData, isLoading, isError, refetch } = useFestivals({ size: 10 });

  const festivalList = React.useMemo(() => {
    const list = festivalData?.content ?? [];
    const sorted = [...list].sort((a, b) => {
      const hasDateA = a.eventStartDate ? 1 : 0;
      const hasDateB = b.eventStartDate ? 1 : 0;
      if (hasDateA !== hasDateB) return hasDateB - hasDateA;
      const order: Record<string, number> = { ONGOING: 0, UPCOMING: 1, UNKNOWN: 2, ENDED: 3 };
      return (order[a.progressStatus] ?? 99) - (order[b.progressStatus] ?? 99);
    });

    return sorted.slice(0, 6);
  }, [festivalData?.content]);

  return (
    <View className="mt-7">
      {/* 헤더 */}
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        <View className="flex-row justify-between items-baseline mb-1">
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, color: '#000', letterSpacing: -0.4 }}
          >
            이달의 축제 & 행사
          </Text>
          {onViewAll && (
            <Pressable onPress={onViewAll} hitSlop={8}>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: BRAND }}
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
          지금 전국에서 열리고 있는 축제 정보를 확인하세요
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
      ) : isError ? (
        <View style={{ paddingHorizontal: GRID_PADDING }}>
          <View className="items-center" style={{ padding: normalize(18), borderRadius: CARD_RADIUS, backgroundColor: CARD }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: TEXT_SUB, marginBottom: normalize(6) }}>
              축제 정보를 불러오지 못했습니다.
            </Text>
            <Pressable onPress={() => refetch()} hitSlop={8}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: BRAND }}>
                다시 시도
              </Text>
            </Pressable>
          </View>
        </View>
      ) : festivalList.length === 0 ? (
        <View style={{ paddingHorizontal: GRID_PADDING }}>
          <View className="items-center" style={{ padding: normalize(18), borderRadius: CARD_RADIUS, backgroundColor: CARD }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: TEXT_SUB }}>
              현재 예정된 축제 정보를 준비 중입니다.
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, gap: normalize(12) }}
        >
          {festivalList.map((festival) => {
            const isOngoing = festival.progressStatus === 'ONGOING';
            const statusLabel = isOngoing ? '진행중' : '개최예정';
            const statusColor = isOngoing ? '#34c759' : '#007aff';
            const statusBg = isOngoing ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)';
            const location = regionLabelFrom(festival.address) || festival.address || '전국';
            const categoryTag = festival.categories?.map((c: string) => SPOT_CATEGORY_MAP[c]?.label).filter(Boolean).join(' · ') || '축제 · 행사';
            const tipText = festival.overview ? festival.overview.replace(/\r?\n/g, ' ').slice(0, 24) : (festival.usetime || '인기 출사지');

            return (
              <View
                key={festival.id}
                style={{ width: CARD_WIDTH, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: CARD }}
              >
                <Pressable
                  onPress={onEventPress ? () => onEventPress(String(festival.id)) : undefined}
                  android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
                >
                  {/* 헤더 */}
                  <View style={{ backgroundColor: '#111111', paddingVertical: normalize(10), paddingHorizontal: normalize(14) }}>
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
                      {formatDateRange(festival.eventStartDate, festival.eventEndDate)}
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
                      {festival.name}
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

                    {/* 상태 뱃지 */}
                    <View
                      className="flex-row items-center justify-between"
                      style={{
                        height: normalize(30),
                        paddingHorizontal: normalize(10),
                        borderRadius: normalize(8),
                        backgroundColor: '#fff',
                        marginBottom: normalize(8),
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB }}
                      >
                        행사 상태
                      </Text>
                      <View style={{ backgroundColor: statusBg, paddingHorizontal: normalize(6), paddingVertical: normalize(2), borderRadius: normalize(4) }}>
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Pretendard-SemiBold',
                            fontSize: FONT_XS,
                            color: statusColor,
                          }}
                        >
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    {/* 테마 태그 */}
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
                        {categoryTag}
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
