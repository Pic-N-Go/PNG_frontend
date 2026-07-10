import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_SM, BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING, CARD_RADIUS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { IconChevronLeft, IconBell, IconChevronRight, IconMapPin, IconCircleCheck, IconCheck, IconChevronDown } from '@tabler/icons-react-native';

const dummyWishlists = [
  {
    id: 1,
    title: '경복궁 야간개장',
    loc: '서울 종로구 · 포토제닉 91점',
    status: 'soon',
    statusText: '내일 충족 예상',
    conditions: [
      { type: 'weather', text: '맑음', active: true },
      { type: 'weather', text: '뇌우', active: false },
      { type: 'time', text: '야간', active: true },
      { type: 'dust', text: '미세먼지 좋음', active: false },
    ],
    forecast: [
      { day: '오늘', status: 'overcast', hit: false },
      { day: '내일', status: 'clear', hit: true },
      { day: '+2', status: 'partly-cloudy', hit: false },
      { day: '+3', status: 'clear', hit: true },
      { day: '+4', status: 'rain', hit: false },
      { day: '+5', status: 'partly-cloudy', hit: false },
      { day: '+6', status: 'clear', hit: false },
    ],
    notifText: '내일(5/19) 조건 충족 예상 · 알림 설정됨',
    thumbnails: ['#1a1530', '#232526', '#2a2020'],
  },
  {
    id: 2,
    title: '광안리 해수욕장',
    loc: '부산 수영구 · 포토제닉 87점',
    status: 'wait',
    statusText: '대기 중',
    conditions: [
      { type: 'weather', text: '맑음', active: false },
      { type: 'time', text: '일출', active: false },
      { type: 'dust', text: '미세먼지 좋음', active: false },
    ],
    forecast: [
      { day: '오늘', status: 'overcast', hit: false },
      { day: '내일', status: 'partly-cloudy', hit: false },
      { day: '+2', status: 'rain', hit: false },
      { day: '+3', status: 'rain', hit: false },
      { day: '+4', status: 'partly-cloudy', hit: false },
      { day: '+5', status: 'overcast', hit: false },
      { day: '+6', status: 'clear', hit: false },
    ],
    notifText: null,
    thumbnails: ['#0f2027', '#2c5364', '#1a3a4a'],
  },
  {
    id: 3,
    title: '에버랜드 장미원',
    loc: '경기 용인시 · 포토제닉 92점',
    status: 'hit',
    statusText: '오늘 충족',
    conditions: [
      { type: 'weather', text: '맑음', active: true },
      { type: 'other', text: '개화율 90%+', active: true },
      { type: 'dust', text: '미세먼지 좋음', active: true },
    ],
    forecast: [
      { day: '오늘', status: 'clear', hit: true },
      { day: '내일', status: 'clear', hit: false },
      { day: '+2', status: 'partly-cloudy', hit: false },
      { day: '+3', status: 'rain', hit: false },
      { day: '+4', status: 'rain', hit: false },
      { day: '+5', status: 'partly-cloudy', hit: false },
      { day: '+6', status: 'clear', hit: false },
    ],
    notifText: '오늘 바로 출발하기 좋아요 · 포토제닉 92점',
    thumbnails: ['#3a0a1a', '#4a0a2a', '#2a0010'],
  }
];

export default function WishlistScreen({ navigation, route }: any) {
  const [wishlists, setWishlists] = useState(dummyWishlists);
  const [sortType, setSortType] = useState('최신순');
  const [sortModalVisible, setSortModalVisible] = useState(false);

  useEffect(() => {
    if (route.params?.newWishlist) {
      setWishlists(prev => {
        const exists = prev.find(w => w.id === route.params.newWishlist.id);
        if (exists) {
          return prev.map(w => w.id === route.params.newWishlist.id ? route.params.newWishlist : w);
        }
        return [route.params.newWishlist, ...prev];
      });
      navigation.setParams({ newWishlist: undefined });
    }
    if (route.params?.deletedId) {
      setWishlists(prev => prev.filter(w => w.id !== route.params.deletedId));
      navigation.setParams({ deletedId: undefined });
    }
  }, [route.params?.newWishlist, route.params?.deletedId, navigation]);

  const sortedWishlists = [...wishlists].sort((a, b) => {
    if (sortType === '이름순') return a.title.localeCompare(b.title);
    if (sortType === '조건 충족순') {
      const order = { 'hit': 0, 'soon': 1, 'wait': 2 };
      const aOrder = order[a.status as keyof typeof order] ?? 99;
      const bOrder = order[b.status as keyof typeof order] ?? 99;
      return aOrder - bOrder;
    }
    return b.id - a.id;
  });

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  const handleAdd = () => {
    navigation.navigate('WishlistSetting');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Navigation */}
      <View className="flex-row items-center justify-between border-b border-black/5 bg-white z-20" style={{ height: normalize(54), paddingHorizontal: normalize(12) }}>
        <TouchableOpacity onPress={handleBack} className="items-center justify-center rounded-full" style={{ width: normalize(36), height: normalize(36) }}>
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.5)" />
        </TouchableOpacity>
        <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(18) }}>위시리스트</Text>
        <TouchableOpacity onPress={handleAdd} className="flex-row items-center justify-center bg-[#E31B59] rounded-full" style={{ height: normalize(32), paddingHorizontal: normalize(14) }}>
          <Text className="font-medium text-white" style={{ fontSize: FONT_SM }}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: normalize(40) }} showsVerticalScrollIndicator={false}>
        <View style={{ height: normalize(16) }} />

        {/* Info Banner */}
        <View className="flex-row items-start rounded-2xl border border-[#E31B59]/10 bg-[#E31B59]/5" style={{ marginHorizontal: CONTENT_PADDING, padding: normalize(14), marginBottom: normalize(20) }}>
          <IconBell size={normalize(20)} color="#E31B59" />
          <View className="flex-1 ml-2.5">
            <Text className="font-medium text-[#E31B59] mb-1" style={{ fontSize: FONT_SM }}>조건 충족 시 알림을 드려요</Text>
            <Text className="text-black/40 leading-snug" style={{ fontSize: normalizeFontSize(12) }}>
              날씨·시간대·미세먼지 조건이 맞으면 하루 전에 알려드려요. 스팟별로 다른 조건을 설정할 수 있어요.
            </Text>
          </View>
        </View>

        {wishlists.length === 0 ? (
          /* Empty State */
          <View className="items-center justify-center" style={{ paddingVertical: normalize(64), paddingHorizontal: normalize(40) }}>
            <View className="items-center justify-center rounded-2xl bg-[#f5f5f7] mb-2" style={{ width: normalize(64), height: normalize(64) }}>
              <IconBell size={normalize(28)} color="rgba(0,0,0,0.2)" />
            </View>
            <Text className="font-semibold text-black tracking-tight mb-2" style={{ fontSize: normalizeFontSize(18) }}>설정한 촬영 조건이 없어요</Text>
            <Text className="text-black/40 text-center leading-relaxed mb-4" style={{ fontSize: normalizeFontSize(14) }}>
              스팟마다 날씨·골든아워·미세먼지 조건을{'\n'}설정하면 딱 맞는 날 알림을 받을 수 있어요.
            </Text>
            <TouchableOpacity onPress={handleAdd} className="bg-[#E31B59] items-center justify-center" style={{ height: BUTTON_HEIGHT, paddingHorizontal: CONTENT_PADDING, borderRadius: BUTTON_RADIUS }}>
              <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(16) }}>스팟에서 조건 설정하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* List */
          <View>
            <View className="flex-row items-center justify-between" style={{ paddingHorizontal: CONTENT_PADDING, paddingVertical: normalize(10) }}>
              <Text className="font-semibold text-black/30 tracking-wide" style={{ fontSize: FONT_SM }}>
                내 위시리스트 <Text className="font-normal">({wishlists.length}개)</Text>
              </Text>
              <TouchableOpacity onPress={() => setSortModalVisible(true)} className="flex-row items-center py-1">
                <Text className="text-black/40" style={{ fontSize: normalizeFontSize(12), letterSpacing: -0.1 }}>{sortType}</Text>
                <IconChevronDown size={normalize(14)} color="rgba(0,0,0,0.4)" style={{ transform: [{ rotate: sortModalVisible ? '180deg' : '0deg' }], marginLeft: 2 }} />
              </TouchableOpacity>
            </View>

            {sortedWishlists.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('WishlistSetting', { id: item.id, wishlist: item })}
                className="bg-[#f5f5f7] overflow-hidden"
                style={{ marginHorizontal: CONTENT_PADDING, marginBottom: normalize(12), borderRadius: CARD_RADIUS }}
              >
                {/* Thumbnails */}
                <View className="flex-row relative" style={{ height: normalize(100) }}>
                  {item.thumbnails.map((c, i) => (
                    <View key={i} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                  {/* Status Badge */}
                  <View 
                    className="absolute flex-row items-center justify-center rounded-full"
                    style={{ 
                      top: normalize(10), left: normalize(10), 
                      height: normalize(22), paddingHorizontal: normalize(10),
                      backgroundColor: item.status === 'hit' ? 'rgba(52,199,89,0.9)' : item.status === 'soon' ? 'rgba(227,27,89,0.85)' : 'rgba(0,0,0,0.35)'
                    }}
                  >
                    {(item.status === 'soon' || item.status === 'hit') && (
                      <View className="bg-white rounded-full mr-1" style={{ width: normalize(6), height: normalize(6) }} />
                    )}
                    <Text className="font-semibold text-white" style={{ fontSize: normalizeFontSize(10) }}>{item.statusText}</Text>
                  </View>
                </View>

                {/* Body */}
                <View style={{ padding: normalize(14), paddingBottom: item.notifText ? 0 : normalize(14) }}>
                  <View className="flex-row items-start justify-between mb-1">
                    <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(16) }}>{item.title}</Text>
                    <IconChevronRight size={normalize(16)} color="rgba(0,0,0,0.18)" style={{ marginTop: 2 }} />
                  </View>
                  <View className="flex-row items-center mb-2.5">
                    <IconMapPin size={normalize(12)} color="rgba(0,0,0,0.3)" />
                    <Text className="text-black/40 ml-1" style={{ fontSize: normalizeFontSize(12) }}>{item.loc}</Text>
                  </View>

                  {/* Conditions */}
                  <View className="flex-row flex-wrap gap-1 mb-2.5">
                    {item.conditions.map((cond, i) => (
                      <View key={i} className="flex-row items-center rounded-full" style={{ height: normalize(22), paddingHorizontal: normalize(9), backgroundColor: cond.active ? 'rgba(227,27,89,0.08)' : 'rgba(255,255,255,1)' }}>
                        <Text className="font-medium" style={{ fontSize: normalizeFontSize(11), color: cond.active ? '#E31B59' : 'rgba(0,0,0,0.45)' }}>{cond.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Forecast */}
                  <View className="flex-row border-t border-black/5" style={{ paddingTop: normalize(10), gap: normalize(4) }}>
                    {item.forecast.map((f, i) => (
                      <View key={i} className="flex-1 items-center gap-1">
                        <Text style={{ fontSize: normalizeFontSize(9), color: 'rgba(0,0,0,0.28)' }}>{f.day}</Text>
                        <View className="items-center justify-center rounded-full bg-white border border-black/5" style={{ width: normalize(28), height: normalize(28), borderColor: f.hit ? '#E31B59' : 'rgba(0,0,0,0.08)', backgroundColor: f.hit ? 'rgba(227,27,89,0.06)' : '#fff' }}>
                          <IconCircleCheck size={normalize(16)} color={f.hit ? '#E31B59' : 'rgba(0,0,0,0.15)'} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Notif */}
                {item.notifText && (
                  <View className="flex-row items-center border-t mt-3" style={{ paddingVertical: normalize(10), paddingHorizontal: normalize(14), backgroundColor: item.status === 'hit' ? 'rgba(227,27,89,0.04)' : 'rgba(52,199,89,0.05)', borderColor: item.status === 'hit' ? 'rgba(227,27,89,0.1)' : 'rgba(52,199,89,0.12)' }}>
                    <View className="rounded-full mr-2" style={{ width: normalize(6), height: normalize(6), backgroundColor: item.status === 'hit' ? '#E31B59' : '#34C759' }} />
                    <Text className="font-medium" style={{ fontSize: normalizeFontSize(12), color: item.status === 'hit' ? '#E31B59' : '#34C759' }}>{item.notifText}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      {/* Sort Dropdown Modal */}
      <Modal visible={sortModalVisible} transparent animationType="fade">
        <Pressable className="flex-1 bg-transparent" onPress={() => setSortModalVisible(false)}>
          <View 
            className="absolute bg-white rounded-xl shadow-lg" 
            style={{ 
              top: normalize(200),
              right: CONTENT_PADDING, 
              width: normalize(120),
              paddingVertical: normalize(6),
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 8
            }}
          >
            {['최신순', '조건 충족순', '이름순'].map((opt) => (
              <TouchableOpacity 
                key={opt} 
                onPress={() => { setSortType(opt); setSortModalVisible(false); }}
                className="flex-row items-center justify-between"
                style={{ paddingVertical: normalize(10), paddingHorizontal: normalize(12) }}
              >
                <Text className={sortType === opt ? 'font-medium text-[#E31B59]' : 'text-black/70'} style={{ fontSize: normalizeFontSize(14) }}>
                  {opt}
                </Text>
                {sortType === opt && <IconCheck size={normalize(16)} color="#E31B59" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
