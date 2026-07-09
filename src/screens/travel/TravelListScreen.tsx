import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_SM, FONT_MD, FONT_2XL, BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { IconPlus, IconChevronRight, IconCalendarEvent, IconMapPin, IconClock, IconRoute, IconZoomPan } from '@tabler/icons-react-native';
const dummyPlans = [
  {
    id: 1,
    title: '부산 1박 2일',
    date: '2026.05.17 ~ 05.18',
    duration: '1박 2일',
    spots: 3,
    estimatedTime: '예상 12시간',
    distance: '142km',
    status: 'active',
    statusText: '진행 중',
    progressText: 'DAY 1 진행 중 · 다음 스팟: 해동용궁사',
    thumbnails: [
      'https://images.unsplash.com/photo-1598514982205-f36b96d1e8dd?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1616850478052-a5e2f7ef3bd9?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598858546197-2b73bc36ed58?q=80&w=200&auto=format&fit=crop',
    ],
  },
  {
    id: 2,
    title: '서울 야경 투어',
    date: '2026.05.28',
    duration: '당일치기',
    spots: 5,
    estimatedTime: '예상 4시간',
    distance: '12km',
    status: 'upcoming',
    statusText: 'D-5',
    progressText: null,
    thumbnails: [
      'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1610311756586-81e8eb9f3152?q=80&w=200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1582236968962-d2f1f58b9cf6?q=80&w=200&auto=format&fit=crop',
    ],
  },
  {
    id: 3,
    title: '제주도 힐링 코스',
    date: '2026.04.10 ~ 04.12',
    duration: '2박 3일',
    spots: 12,
    estimatedTime: '예상 32시간',
    distance: '320km',
    status: 'past',
    statusText: '완료',
    progressText: null,
    thumbnails: [
      'https://images.unsplash.com/photo-1600758208050-a35f99478f68?q=80&w=200&auto=format&fit=crop',
    ],
  },
  {
    id: 4,
    title: '경주 역사 탐방',
    date: '2026.03.01',
    duration: '당일치기',
    spots: 4,
    estimatedTime: '예상 6시간',
    distance: '45km',
    status: 'past',
    statusText: '완료',
    progressText: null,
    thumbnails: [],
  },
];

const TABS = [
  { id: 'all', label: '전체' },
  { id: 'active', label: '진행 중' },
  { id: 'upcoming', label: '예정' },
  { id: 'past', label: '지난 출사' },
];

export default function TravelListScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;

  // 더미 데이터를 탭에 맞게 필터링
  const filteredPlans = dummyPlans.filter((plan) => {
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
      <View className="flex-row items-end bg-white z-50" style={{ height: normalize(44), paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(10) }}>
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
          <TouchableOpacity onPress={handleNewPlan} className="items-end justify-center" style={{ width: normalize(32), height: normalize(32) }}>
            <IconPlus size={24} color="#E31B59" />
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
                    ? dummyPlans.length
                    : dummyPlans.filter((p) => p.status === tab.id).length;

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
          <View className="h-[1px] bg-black/5 w-full" />
        </View>

        {/* 리스트 콘텐츠 영역 */}
        <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(20), paddingBottom: normalize(40) }}>
        {/* 리스트가 비어있을 때 (Empty State) */}
        {filteredPlans.length === 0 ? (
          <View className="items-center" style={{ marginTop: normalize(40) }}>
            <View className="rounded-3xl bg-[#f5f5f7] items-center justify-center mb-5" style={{ width: normalize(80), height: normalize(80) }}>
              <IconZoomPan size={36} color="rgba(0,0,0,0.18)" />
            </View>
            <Text className="text-lg font-semibold text-black tracking-tight mb-2">
              첫 출사 계획을 세워볼까요?
            </Text>
            <Text className="text-sm text-black/40 text-center leading-relaxed mb-7">
              가고 싶은 스팟을 모아 날짜와 일정을{'\n'}한 번에 계획할 수 있어요.
            </Text>
            <TouchableOpacity
              onPress={handleNewPlan}
              className="bg-[#E31B59] flex-row items-center"
              style={{ height: BUTTON_HEIGHT, paddingHorizontal: CONTENT_PADDING, borderRadius: BUTTON_RADIUS }}
            >
              <IconPlus size={20} color="#fff" />
              <Text className="text-base font-semibold text-white ml-1.5">새 출사 계획 만들기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* 리스트가 있을 때 */
          <View>
            {/* 새 계획 만들기 인라인 버튼 */}
            <TouchableOpacity
              onPress={handleNewPlan}
              className="flex-row items-center justify-center rounded-2xl border-2 border-dashed border-black/10 bg-[#f5f5f7] mb-4"
              style={{ height: normalize(72) }}
            >
              <View className="rounded-full bg-[#f5f5f7] items-center justify-center mr-2" style={{ width: normalize(30), height: normalize(30) }}>
                <IconPlus size={18} color="rgba(0,0,0,0.4)" />
              </View>
              <Text className="text-base font-medium text-black/40">새 출사 계획 만들기</Text>
            </TouchableOpacity>

            {/* 카드 목록 */}
            {filteredPlans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                activeOpacity={0.9}
                onPress={() => handlePlanDetail(plan.id)}
                className="bg-white rounded-[20px] overflow-hidden mb-5 border border-black/5 shadow-sm"
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
                      <IconMapPin size={24} color="rgba(0,0,0,0.1)" />
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
                    <IconChevronRight size={18} color="rgba(0,0,0,0.2)" />
                  </View>
                  
                  <View className="flex-row items-center mb-3">
                    <IconCalendarEvent size={12} color="rgba(0,0,0,0.3)" />
                    <Text className="text-black/40 ml-1" style={{ fontSize: normalizeFontSize(12) }}>
                      {plan.date} · {plan.duration}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-x-3">
                    <View className="flex-row items-center">
                      <IconMapPin size={12} color="rgba(0,0,0,0.3)" />
                      <Text className="text-black/40 ml-1" style={{ fontSize: normalizeFontSize(12) }}>포토스팟 {plan.spots}곳</Text>
                    </View>
                    <View className="flex-row items-center">
                      <IconClock size={12} color="rgba(0,0,0,0.3)" />
                      <Text className="text-black/40 ml-1" style={{ fontSize: normalizeFontSize(12) }}>{plan.estimatedTime}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <IconRoute size={12} color="rgba(0,0,0,0.3)" />
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
