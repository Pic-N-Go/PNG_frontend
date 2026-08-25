import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft, IconMapPin, IconCalendarEvent, IconSparkles } from '@tabler/icons-react-native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/stacks/HomeStack';
import type { RootStackParamList } from '@/navigation';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import Skeleton from '@/components/common/Skeleton';
import Chip from '@/components/common/Chip';
import { useInfiniteFestivals } from '@/hooks/useFestival';
import { regionLabelFrom, toHttps } from '@/utils/spotMappers';
import { SPOT_CATEGORY_MAP } from '@/constants/spotCategories';
import { CARD_RADIUS, FONT_LG, FONT_MD, FONT_SM, GRID_PADDING, HAIRLINE_WIDTH, SPACING_LG } from '@/constants/layout';
import { BRAND, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';
import type { FestivalResponse } from '@/types/festival';

type Props = NativeStackScreenProps<HomeStackParamList, 'FestivalList'>;

type StatusFilter = 'ALL' | 'ONGOING' | 'UPCOMING';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'ALL', label: '전체' },
  { id: 'ONGOING', label: '진행중' },
  { id: 'UPCOMING', label: '개최예정' },
];

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

export default function FestivalListScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const initialStatus = route.params?.status ?? 'ALL';
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(initialStatus);

  const queryParams = useMemo(() => {
    if (selectedStatus === 'ALL') return { size: 20 };
    return { status: selectedStatus as 'ONGOING' | 'UPCOMING', size: 20 };
  }, [selectedStatus]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteFestivals(queryParams);

  const festivals: FestivalResponse[] = useMemo(() => {
    const pages = data?.pages ?? [];
    const items = pages.flatMap((p) => p.content ?? []);
    // 중복 제거
    const seen = new Set<number>();
    return items.filter((f) => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
  }, [data?.pages]);

  const totalCount = data?.pages[0]?.totalElements ?? festivals.length;

  const handleFestivalPress = (id: number) => {
    const rootNavigation = navigation as unknown as NativeStackNavigationProp<RootStackParamList>;
    rootNavigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: String(id) } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 헤더 */}
      <View
        style={{
          paddingTop: insets.top + normalize(12),
          paddingBottom: normalize(12),
          paddingHorizontal: GRID_PADDING,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: HAIRLINE_WIDTH,
          borderBottomColor: HAIRLINE,
          backgroundColor: '#fff',
        }}
      >
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ marginRight: normalize(12) }}>
          <IconChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
        </Pressable>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.3 }}>
          전국 축제 & 행사
        </Text>
      </View>

      {/* 상태 필터 탭 */}
      <View
        style={{
          flexDirection: 'row',
          gap: normalize(8),
          paddingHorizontal: GRID_PADDING,
          paddingVertical: normalize(12),
          backgroundColor: '#fff',
          borderBottomWidth: HAIRLINE_WIDTH,
          borderBottomColor: HAIRLINE,
        }}
      >
        {STATUS_TABS.map((tab) => (
          <Chip
            key={tab.id}
            label={tab.label}
            selected={selectedStatus === tab.id}
            onPress={() => setSelectedStatus(tab.id)}
            variant="brand"
            height={normalize(34)}
          />
        ))}
      </View>

      {/* 목록 헤더 카운트 */}
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14), paddingBottom: normalize(8) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: TEXT_SUB }}>
          축제 · 행사 <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>{totalCount}</Text>건
        </Text>
      </View>

      {/* 리스트 */}
      {isLoading ? (
        <View style={{ paddingHorizontal: GRID_PADDING, gap: normalize(16), paddingTop: normalize(8) }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={normalize(120)} borderRadius={CARD_RADIUS} />
          ))}
        </View>
      ) : isError && festivals.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: GRID_PADDING }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, color: TEXT_SUB, textAlign: 'center' }}>
            축제 목록을 불러오지 못했습니다.
          </Text>
          <Pressable onPress={() => refetch()} hitSlop={8} style={{ marginTop: normalize(8) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: BRAND }}>
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : festivals.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: normalize(12) }}>
          <IconCalendarEvent size={normalize(48)} color="rgba(0,0,0,0.15)" strokeWidth={1.2} />
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: 'rgba(0,0,0,0.5)' }}>
            해당하는 축제 정보가 없습니다.
          </Text>
        </View>
      ) : (
        <FlatList
          data={festivals}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: GRID_PADDING, paddingBottom: SPACING_LG + insets.bottom }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: normalize(16), alignItems: 'center' }}>
                <ActivityIndicator size="small" color={BRAND} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const dateRange = formatDateRange(item.eventStartDate, item.eventEndDate);
            const isOngoing = item.progressStatus === 'ONGOING';
            const statusLabel = isOngoing ? '진행중' : '개최예정';
            const statusColor = isOngoing ? '#34c759' : '#007aff';
            const statusBg = isOngoing ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 122, 255, 0.1)';
            const imageUri = toHttps(item.thumbnailUrl || item.imageUrl);
            const location = regionLabelFrom(item.address) || item.address || '전국';

            return (
              <Pressable
                onPress={() => handleFestivalPress(item.id)}
                android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
                style={{
                  flexDirection: 'row',
                  paddingVertical: normalize(14),
                  borderBottomWidth: HAIRLINE_WIDTH,
                  borderBottomColor: HAIRLINE,
                  gap: normalize(14),
                  alignItems: 'center',
                }}
              >
                {/* 썸네일 */}
                <View
                  style={{
                    width: normalize(96),
                    height: normalize(96),
                    borderRadius: normalize(12),
                    backgroundColor: CARD,
                    overflow: 'hidden',
                  }}
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <IconSparkles size={normalize(24)} color="rgba(0,0,0,0.2)" />
                    </View>
                  )}
                </View>

                {/* 정보 */}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  {/* 상태 뱃지 & 날짜 */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), marginBottom: normalize(4) }}>
                    <View style={{ backgroundColor: statusBg, paddingHorizontal: normalize(6), paddingVertical: normalize(2), borderRadius: normalize(4) }}>
                      <Text
                        allowFontScaling={false}
                        style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(10.5), color: statusColor }}
                      >
                        {statusLabel}
                      </Text>
                    </View>
                    <Text
                      allowFontScaling={false}
                      style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: TEXT_SUB, fontVariant: ['tabular-nums'] }}
                    >
                      {dateRange}
                    </Text>
                  </View>

                  {/* 축제명 */}
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={{
                      fontFamily: 'Pretendard-SemiBold',
                      fontSize: FONT_MD,
                      color: '#000',
                      letterSpacing: -0.2,
                      marginBottom: normalize(4),
                    }}
                  >
                    {item.name}
                  </Text>

                  {/* 장소 */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(3), marginBottom: normalize(4) }}>
                    <IconMapPin size={normalize(12)} color="rgba(0,0,0,0.4)" strokeWidth={1.5} />
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12.5), color: 'rgba(0,0,0,0.5)' }}
                    >
                      {location}
                    </Text>
                  </View>

                  {/* 개요 / 이용시간 */}
                  {item.overview ? (
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(11.5), color: 'rgba(0,0,0,0.35)', marginBottom: normalize(4) }}
                    >
                      {item.overview.replace(/\r?\n/g, ' ')}
                    </Text>
                  ) : null}

                  {/* 카테고리 태그 */}
                  {item.categories && item.categories.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(4) }}>
                      {item.categories.map((c) => {
                        const label = SPOT_CATEGORY_MAP[c]?.label;
                        if (!label) return null;
                        return (
                          <View
                            key={c}
                            style={{
                              paddingHorizontal: normalize(6),
                              paddingVertical: normalize(2),
                              borderRadius: normalize(4),
                              backgroundColor: CARD,
                            }}
                          >
                            <Text
                              allowFontScaling={false}
                              style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(10.5), color: TEXT_SUB }}
                            >
                              {label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
