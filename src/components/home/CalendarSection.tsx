import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_MD, FONT_SM, FONT_TITLE, GRID_PADDING, SPACING_XS } from '@/constants/layout';
import { CARD, TEXT_SUB } from '@/constants/colors';
import { useFestivals } from '@/hooks/useFestival';
import { regionLabelFrom } from '@/utils/spotMappers';
import Skeleton from '@/components/common/Skeleton';
import { SPOT_CATEGORY_MAP } from '@/constants/spotCategories';

interface Props {
  onEventPress?: (id: string) => void;
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

export default function CalendarSection({ onEventPress }: Props) {
  const { data: ongoingData, isLoading: isOngoingLoading } = useFestivals({ status: 'ONGOING', size: 10 });
  const { data: upcomingData, isLoading: isUpcomingLoading } = useFestivals({ status: 'UPCOMING', size: 10 });

  const isLoading = isOngoingLoading || isUpcomingLoading;

  const events = React.useMemo(() => {
    const ongoingList = ongoingData?.content ?? [];
    const upcomingList = upcomingData?.content ?? [];
    const combined = [...ongoingList, ...upcomingList];
    const seen = new Set<number>();
    const unique = combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    // 행사 날짜가 명시된 축제 우선 정렬 후 진행중(ONGOING) > 예정(UPCOMING) 순 배치
    const sorted = unique.sort((a, b) => {
      const hasDateA = a.eventStartDate ? 1 : 0;
      const hasDateB = b.eventStartDate ? 1 : 0;
      if (hasDateA !== hasDateB) return hasDateB - hasDateA;
      const order: Record<string, number> = { ONGOING: 0, UPCOMING: 1, UNKNOWN: 2, ENDED: 3 };
      return (order[a.progressStatus] ?? 99) - (order[b.progressStatus] ?? 99);
    });

    return sorted.slice(0, 6);
  }, [ongoingData?.content, upcomingData?.content]);

  const isMulti = events.length > 2;

  return (
    <View style={{ marginTop: normalize(28) }}>
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: SPACING_XS,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, color: '#000', letterSpacing: -0.4 }}
          >
            이달의 축제 & 행사
          </Text>
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
          지금 열리고 있는 축제와 행사 정보를 놓치지 마세요
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flexDirection: 'row', gap: normalize(12), paddingHorizontal: GRID_PADDING }}>
          <View style={{ flex: 1 }}>
            <Skeleton width="100%" height={normalize(180)} borderRadius={CARD_RADIUS} />
          </View>
          <View style={{ flex: 1 }}>
            <Skeleton width="100%" height={normalize(180)} borderRadius={CARD_RADIUS} />
          </View>
        </View>
      ) : events.length === 0 ? (
        <View style={{ paddingHorizontal: GRID_PADDING }}>
          <View style={{ padding: normalize(18), borderRadius: CARD_RADIUS, backgroundColor: CARD, alignItems: 'center' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: TEXT_SUB }}>
              현재 예정된 축제 정보를 준비 중입니다.
            </Text>
          </View>
        </View>
      ) : isMulti ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, gap: normalize(12) }}
        >
          {events.map((event) => renderEventCard(event, onEventPress, normalize(200)))}
        </ScrollView>
      ) : (
        <View style={{ flexDirection: 'row', gap: normalize(12), paddingHorizontal: GRID_PADDING }}>
          {events.map((event) => renderEventCard(event, onEventPress))}
        </View>
      )}
    </View>
  );
}

function renderEventCard(
  event: any,
  onEventPress?: (id: string) => void,
  fixedWidth?: number,
) {
  const dateRange = formatDateRange(event.eventStartDate, event.eventEndDate);
  const place = regionLabelFrom(event.address) || event.address || '전국';
  const isOngoing = event.progressStatus === 'ONGOING';
  const statusLabel = isOngoing ? '진행중' : '개최예정';
  const statusColor = isOngoing ? '#34c759' : '#007aff';
  const statusBg = isOngoing ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)';

  const categoryTag = event.categories
    ?.map((c: string) => SPOT_CATEGORY_MAP[c]?.label)
    .filter(Boolean)
    .join(' · ') || '축제 · 행사';

  const tipText = event.overview
    ? event.overview.replace(/\r?\n/g, ' ').slice(0, 24)
    : event.usetime || '인기 출사지';

  return (
    <View
      key={event.id}
      style={{
        width: fixedWidth,
        flex: fixedWidth ? undefined : 1,
        borderRadius: CARD_RADIUS,
        overflow: 'hidden',
        backgroundColor: CARD,
      }}
    >
      <Pressable
        onPress={onEventPress ? () => onEventPress(String(event.id)) : undefined}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      >
        {/* 헤더 */}
        <View style={{ backgroundColor: '#111111', paddingVertical: normalize(10), paddingHorizontal: normalize(14) }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: normalizeFontSize(10),
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: 0.5,
              marginBottom: normalize(4),
            }}
            numberOfLines={1}
          >
            {dateRange}
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
            {event.name}
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
            {place}
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: normalizeFontSize(12),
              color: TEXT_SUB,
              marginBottom: normalize(10),
            }}
            numberOfLines={1}
          >
            {tipText}
          </Text>

          {/* 상태 뱃지 */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: normalize(30),
              paddingHorizontal: normalize(10),
              borderRadius: normalize(8),
              backgroundColor: '#fff',
              marginBottom: normalize(8),
            }}
          >
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(11), color: TEXT_SUB }}
            >
              행사 상태
            </Text>
            <View style={{ backgroundColor: statusBg, paddingHorizontal: normalize(6), paddingVertical: normalize(2), borderRadius: normalize(4) }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: normalizeFontSize(11),
                  color: statusColor,
                }}
              >
                {statusLabel}
              </Text>
            </View>
          </View>

          {/* 테마 태그 */}
          <View
            style={{
              alignSelf: 'flex-start',
              height: normalize(22),
              paddingHorizontal: normalize(8),
              borderRadius: normalize(11),
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: normalizeFontSize(10),
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
}
