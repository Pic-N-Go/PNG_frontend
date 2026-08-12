import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_SM, FONT_MD, FONT_LG, FONT_2XL, BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING, CARD_RADIUS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { IconPlus, IconChevronRight, IconCalendarEvent, IconMapPin, IconClock, IconRoute, IconMap, IconAlertCircle } from '@tabler/icons-react-native';
import Skeleton from '@/components/common/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { coursesApi } from '@/api/courses';

const TABS = [
  { id: 'all', label: '전체' },
  { id: 'active', label: '진행 중' },
  { id: 'upcoming', label: '예정' },
  { id: 'past', label: '지난 출사' },
];

function getCourseStatus(startDate: string, endDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  if (today > end) {
    return { status: 'past', statusText: '완료' };
  } else if (today >= start && today <= end) {
    return { status: 'active', statusText: '진행 중' };
  } else {
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { status: 'upcoming', statusText: `D-${diffDays}` };
  }
}

function getCourseDuration(startDate: string, endDate: string) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '당일치기';
  return `${diffDays}박 ${diffDays + 1}일`;
}

export default function TravelListScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  // isError 대신 isLoadingError를 쓴다. TanStack Query는 캐시된 데이터가 있어도 백그라운드
  // 요청이 실패하면 status를 'error'로 올리는데, isError로 분기하면 화면에 이미 있는 목록이
  // 에러 화면으로 덮인다. isLoadingError는 "보여줄 데이터가 없는 실패"만 true다.
  const { data: courses = [], refetch, isLoading, isLoadingError, isFetching } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getCourses,
  });

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const plans = courses.map((course) => {
    const { status, statusText } = getCourseStatus(course.startDate, course.endDate);
    const dateFormatted = `${course.startDate.replace(/-/g, '.')} ~ ${course.endDate.substring(5).replace(/-/g, '.')}`;
    const durationFormatted = getCourseDuration(course.startDate, course.endDate);
    
    return {
      id: course.id,
      title: course.title,
      date: dateFormatted,
      duration: durationFormatted,
      spots: course.spots?.length ?? 0,
      estimatedTime: '-',
      distance: '-',
      status,
      statusText,
      progressText: null,
      thumbnails: [] as string[],
    };
  });

  // API 데이터를 탭에 맞게 필터링
  const filteredPlans = plans.filter((plan) => {
    if (activeTab === 'all') return true;
    return plan.status === activeTab;
  });

  // 두 가지를 구분한다.
  // hasNoPlans: 필터 칩·헤더 + 를 감출지. 로딩·에러 중에도 계획이 0개면 감춘다.
  //   (로딩 중에 "전체 0 · 진행 중 0 …" 칩이 스켈레톤 위에 떴다가 사라지며 레이아웃이 튀는 것을 막는다)
  // showEmptyState: 빈 상태 블록을 그릴지. 결과가 확정된 뒤에만.
  const hasNoPlans = plans.length === 0;
  const isRefetchingEmpty = isFetching && plans.length === 0;
  const showEmptyState = !isLoading && !isRefetchingEmpty && !isLoadingError && plans.length === 0;

  // 계획이 0개가 되면 선택된 탭도 초기화한다. 남겨두면 '지난 출사'에서 마지막 계획을 지운 뒤
  // 새 계획을 만들었을 때 칩이 '지난 출사' 활성으로 돌아와 방금 만든 계획이 안 보인다.
  React.useEffect(() => {
    if (plans.length === 0 && activeTab !== 'all') setActiveTab('all');
  }, [plans.length, activeTab]);

  // 탭 클릭 핸들러
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
  };

  // 새 출사 계획 화면으로 이동
  const handleNewPlan = () => {
    navigation.navigate('TravelNew');
  };

  // 상세 화면으로 이동
  const handlePlanDetail = (id: number) => {
    navigation.navigate('TravelPlan', { planId: String(id) });
  };

  const compactTitleOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const largeHeaderOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* 고정 헤더: 컴팩트 타이틀 영역 (스크롤 시 나타남) */}
      <View className="flex-row items-center bg-white z-50" style={{ height: normalize(36), paddingHorizontal: CONTENT_PADDING }}>
        <Animated.Text
          style={{ opacity: compactTitleOpacity }}
          className="font-semibold text-black tracking-tight"
        >
          <Text style={{ fontSize: normalizeFontSize(18) }}>출사 계획</Text>
        </Animated.Text>
      </View>

      <Animated.ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        // 칩 줄을 렌더하지 않을 때는 sticky 대상도 없다. 인덱스를 그대로 두면
        // React.Children.toArray가 false를 걸러내 콘텐츠 블록이 sticky가 된다.
        stickyHeaderIndices={hasNoPlans ? [] : [1]}
        // 빈 상태 블록이 flex:1로 남은 영역을 채우려면 콘텐츠가 화면 높이까지 늘어나야 한다
        contentContainerStyle={{ flexGrow: 1 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* 0번 인덱스: 상단 타이틀 영역 (스크롤 시 사라짐) */}
        <Animated.View 
          className="flex-row items-center justify-between bg-white z-40" 
          style={{ 
            opacity: largeHeaderOpacity,
            paddingHorizontal: CONTENT_PADDING, 
            paddingTop: normalize(10), 
            paddingBottom: normalize(16) 
          }}
        >
          <Text allowFontScaling={false} className="text-black tracking-tight" style={{ fontSize: FONT_2XL, fontFamily: 'Pretendard-SemiBold' }}>출사 계획</Text>
          {!hasNoPlans && (
            <TouchableOpacity
              onPress={handleNewPlan}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="새 출사 계획 만들기"
              className="items-center justify-center"
              style={{ width: normalize(32), height: normalize(32) }}
            >
              <IconPlus size={normalize(22)} color="#E31B59" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* 탭 메뉴 (Sticky) — 계획이 0개면 렌더하지 않는다 */}
        {!hasNoPlans && (
        <View className="bg-white z-40">
          <View className="flex-row" style={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(16) }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const count =
                  tab.id === 'all'
                    ? plans.length
                    : plans.filter((p) => p.status === tab.id).length;

                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => handleTabPress(tab.id)}
                    className={`flex-row items-center rounded-full ${
                      isActive ? 'bg-[#E31B59]' : 'bg-[#f5f5f7]'
                    }`}
                    style={{ height: normalize(32), paddingHorizontal: normalize(14) }}
                  >
                    <Text className={`font-medium ${isActive ? 'text-white' : 'text-black/40'}`} style={{ fontSize: FONT_SM }}>
                      {tab.label}
                    </Text>
                    <Text className={`font-semibold ml-1 ${isActive ? 'text-white' : 'text-black/40'}`} style={{ fontSize: normalizeFontSize(12) }}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)' }} />
        </View>
        )}

        {/* 로딩 — 빈 상태 대신 카드 스켈레톤. 필터 칩은 감춘 채로 둔다.
            isRefetchingEmpty까지 포함해야, 첫 계획을 만들고 돌아온 직후 캐시가 아직 []인 동안
            "첫 출사 계획을 세워볼까요"가 잠깐 스치는 것을 막는다. */}
        {isLoading || isRefetchingEmpty ? (
          <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(20), paddingBottom: normalize(20) }}>
            {[0, 1, 2].map((i, index) => (
              <Skeleton
                key={i}
                width="100%"
                height={normalize(220)}
                borderRadius={CARD_RADIUS}
                style={index < 2 ? { marginBottom: normalize(20) } : undefined}
              />
            ))}
          </View>
        ) : isLoadingError || showEmptyState ? (
          /* 에러 / 계획 0개 — 아이콘·문구·버튼만 바뀌고 레이아웃은 같다 */
          <View
            className="flex-1 items-center justify-center"
            style={{ paddingHorizontal: normalize(40), paddingBottom: normalize(100) }}
          >
            <View
              className="items-center justify-center"
              style={{
                width: normalize(72),
                height: normalize(72),
                borderRadius: normalize(20),
                backgroundColor: 'rgba(227,27,89,0.07)',
              }}
            >
              {isLoadingError
                ? <IconAlertCircle size={normalize(34)} color="#E31B59" strokeWidth={1.5} />
                : <IconMap size={normalize(34)} color="#E31B59" strokeWidth={1.5} />}
            </View>

            <Text
              allowFontScaling={false}
              style={{ marginTop: normalize(20), fontSize: FONT_LG, fontFamily: 'Pretendard-SemiBold', color: '#000', letterSpacing: -0.3 }}
            >
              {isLoadingError ? '목록을 불러오지 못했어요' : '첫 출사 계획을 세워볼까요'}
            </Text>

            {!isLoadingError && (
              <Text
                allowFontScaling={false}
                style={{
                  marginTop: normalize(8),
                  fontSize: FONT_MD,
                  fontFamily: 'Pretendard-Regular',
                  color: 'rgba(0,0,0,0.5)',
                  lineHeight: normalize(23),
                  textAlign: 'center',
                  letterSpacing: -0.2,
                }}
              >
                가고 싶은 스팟을 모아 날짜와 일정을{'\n'}한 번에 계획할 수 있어요.
              </Text>
            )}

            <TouchableOpacity
              onPress={isLoadingError ? () => refetch() : handleNewPlan}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={isLoadingError ? '다시 시도' : '새 출사 계획 만들기'}
              className="flex-row items-center justify-center"
              style={{
                alignSelf: 'stretch',
                marginTop: normalize(24),
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                backgroundColor: '#E31B59',
                gap: normalize(6),
              }}
            >
              {!isLoadingError && <IconPlus size={normalize(18)} color="#fff" strokeWidth={2} />}
              <Text
                allowFontScaling={false}
                style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold', color: '#fff', letterSpacing: -0.2 }}
              >
                {isLoadingError ? '다시 시도' : '새 출사 계획 만들기'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
        // flexGrow: 탭 필터 결과가 비었을 때 안내를 중앙에 두기 위해 남은 높이를 차지한다.
        // 카드가 있을 때는 카드가 위에서부터 쌓이므로 시각적 변화가 없다.
        <View style={{ flexGrow: 1, paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(20), paddingBottom: normalize(40) }}>
        {/* 계획은 있지만 이 탭에 없을 때 — 칩은 그대로 두고 탭을 바꿀 수 있게 안내만 한다 */}
        {filteredPlans.length === 0 ? (
          <View className="flex-1 items-center justify-center" style={{ paddingBottom: normalize(100) }}>
            <Text
              allowFontScaling={false}
              style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.5)', letterSpacing: -0.2 }}
            >
              이 조건에 맞는 출사 계획이 없어요
            </Text>
            <TouchableOpacity
              onPress={() => setActiveTab('all')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="전체 보기"
              style={{ marginTop: normalize(4), paddingVertical: normalize(10), paddingHorizontal: normalize(12) }}
            >
              <Text
                allowFontScaling={false}
                style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold', color: '#E31B59', letterSpacing: -0.2 }}
              >
                전체 보기
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 리스트가 있을 때 */
          <View>
            {/* 카드 목록 */}
            {filteredPlans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.9}
                onPress={() => handlePlanDetail(plan.id)}
                className="bg-[#f5f5f7] overflow-hidden mb-5"
                style={{ borderRadius: CARD_RADIUS }}
              >
                {/* 썸네일 영역 */}
                <View className="flex-row bg-gray-100" style={{ height: normalize(120) }}>
                  {plan.thumbnails.length > 0 ? (
                    plan.thumbnails.map((url, index) => (
                      <View
                        key={index}
                        style={{ flex: index === 0 ? 2 : 1 }}
                        className="h-full border-r border-white/20"
                      >
                        <Image source={{ uri: url }} className="w-full h-full" resizeMode="cover" />
                      </View>
                    ))
                  ) : (
                    <View className="flex-1 items-center justify-center bg-[#f5f5f7]">
                      <IconMapPin size={normalize(24)} color="rgba(0,0,0,0.1)" />
                    </View>
                  )}

                  {/* 뱃지 */}
                  <View
                    className={`absolute top-3 left-3 rounded-full flex-row items-center justify-center ${
                      plan.status === 'active'
                        ? 'bg-[#34C759]'
                        : plan.status === 'upcoming'
                        ? 'bg-[#E31B59]'
                        : 'bg-black/30'
                    }`}
                    style={{ height: normalize(22), paddingHorizontal: normalize(10) }}
                  >
                    {plan.status === 'active' && (
                      <View className="rounded-full bg-white mr-1.5" style={{ width: normalize(6), height: normalize(6) }} />
                    )}
                    <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(10) }}>
                      {plan.statusText}
                    </Text>
                  </View>
                </View>

                {/* 카드 본문 */}
                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="font-semibold text-black tracking-tight" numberOfLines={1} style={{ fontSize: normalizeFontSize(18) }}>
                      {plan.title}
                    </Text>
                    <IconChevronRight size={normalize(18)} color="rgba(0,0,0,0.2)" />
                  </View>
                  
                  <View className="flex-row items-center mb-3">
                    <IconCalendarEvent size={normalize(12)} color="rgba(0,0,0,0.3)" />
                    <Text className="text-black/40 ml-1" style={{ fontSize: normalizeFontSize(12) }}>
                      {plan.date} · {plan.duration}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-x-3">
                    <View className="flex-row items-center">
                      <IconMapPin size={normalize(12)} color="rgba(0,0,0,0.3)" />
                      <Text className="text-black/40 ml-1" style={{ fontSize: normalizeFontSize(12) }}>포토스팟 {plan.spots}곳</Text>
                    </View>
                    <View className="flex-row items-center">
                      <IconClock size={normalize(12)} color="rgba(0,0,0,0.3)" />
                      <Text className="text-black/40 ml-1" style={{ fontSize: normalizeFontSize(12) }}>{plan.estimatedTime}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <IconRoute size={normalize(12)} color="rgba(0,0,0,0.3)" />
                      <Text className="text-black/40 ml-1" style={{ fontSize: normalizeFontSize(12) }}>{plan.distance}</Text>
                    </View>
                  </View>
                </View>

                {/* 진행 중 상태일 때 하단 프로그레스 바 */}
                {plan.status === 'active' && plan.progressText && (
                  <View className="flex-row items-center px-4 py-2.5 bg-[#34C759]/5 border-t border-[#34C759]/10">
                    <View className="rounded-full bg-[#34C759] mr-1.5" style={{ width: normalize(6), height: normalize(6) }} />
                    <Text className="font-medium text-[#34C759]" style={{ fontSize: normalizeFontSize(12) }}>
                      {plan.progressText}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
