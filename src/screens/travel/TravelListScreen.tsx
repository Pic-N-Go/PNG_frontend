import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_SM, FONT_2XL, BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING, CARD_RADIUS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { IconPlus, IconChevronRight, IconCalendarEvent, IconMapPin, IconClock, IconRoute, IconZoomPan } from '@tabler/icons-react-native';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { coursesApi, Course } from '@/api/courses';

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

  const { data: courses = [], refetch } = useQuery({
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
        stickyHeaderIndices={[1]}
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
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_2XL }}>출사 계획</Text>
          <TouchableOpacity onPress={handleNewPlan} className="items-center justify-center" style={{ width: normalize(32), height: normalize(32) }}>
            <IconPlus size={22} color="#E31B59" />
          </TouchableOpacity>
        </Animated.View>

        {/* 탭 메뉴 (Sticky) */}
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

        {/* 리스트 콘텐츠 영역 */}
        <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(20), paddingBottom: normalize(40) }}>
        {/* 리스트가 비어있을 때 (Empty State) */}
        {filteredPlans.length === 0 ? (
          <View className="items-center" style={{ marginTop: normalize(40) }}>
            <View className="rounded-3xl bg-[#f5f5f7] items-center justify-center mb-5" style={{ width: normalize(80), height: normalize(80) }}>
              <IconZoomPan size={normalize(36)} color="rgba(0,0,0,0.18)" />
            </View>
            <Text className="font-semibold text-black tracking-tight mb-2" style={{ fontSize: normalizeFontSize(18) }}>
              첫 출사 계획을 세워볼까요?
            </Text>
            <Text className="text-black/40 text-center leading-relaxed mb-7" style={{ fontSize: FONT_SM }}>
              가고 싶은 스팟을 모아 날짜와 일정을{'\n'}한 번에 계획할 수 있어요.
            </Text>
            <TouchableOpacity
              onPress={handleNewPlan}
              className="bg-[#E31B59] flex-row items-center"
              style={{ height: BUTTON_HEIGHT, paddingHorizontal: CONTENT_PADDING, borderRadius: BUTTON_RADIUS }}
            >
              <IconPlus size={normalize(20)} color="#fff" />
              <Text className="font-semibold text-white ml-1.5" style={{ fontSize: normalizeFontSize(16) }}>새 출사 계획 만들기</Text>
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
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
