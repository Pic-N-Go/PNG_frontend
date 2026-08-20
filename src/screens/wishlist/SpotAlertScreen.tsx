import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_SM, BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING, CARD_RADIUS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { IconChevronLeft, IconBell, IconChevronRight, IconMapPin, IconCircleCheck, IconCheck, IconChevronDown } from '@tabler/icons-react-native';

import { useSpotAlert } from '@/hooks/useSpotAlert';
import { mapWishlistToUI } from '@/utils/wishlistMapper';
import { BRAND, BRAND_STRONG, BRAND_TINT, BRAND_TINT_ACTIVE, TEXT_SUB } from '@/constants/colors';
import { SHADOW_OVERLAY } from '@/constants/shadow';

export default function SpotAlertScreen({ navigation, route }: any) {
  const { useSpotAlertsQuery } = useSpotAlert();
  const { data: apiWishlists, isLoading } = useSpotAlertsQuery();
  
  const wishlists = apiWishlists ? apiWishlists.map(mapWishlistToUI) : [];

  const [sortType, setSortType] = useState('최신순');
  const [sortModalVisible, setSortModalVisible] = useState(false);

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
      <View className="flex-row items-center justify-between border-b-[0.5px] border-hairline bg-white z-20" style={{ height: normalize(54), paddingHorizontal: normalize(12) }}>
        <TouchableOpacity onPress={handleBack} className="items-center justify-center rounded-full" style={{ width: normalize(36), height: normalize(36) }}>
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.5)" />
        </TouchableOpacity>
        <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(18) }}>출사 알림</Text>
        <TouchableOpacity onPress={handleAdd} className="flex-row items-center justify-center bg-brand rounded-full" style={{ height: normalize(32), paddingHorizontal: normalize(14) }}>
          <Text className="font-medium text-white" style={{ fontSize: FONT_SM }}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: normalize(40) }} showsVerticalScrollIndicator={false}>
        <View style={{ height: normalize(16) }} />

        {/* Info Banner */}
        <View className="flex-row items-start rounded-2xl border border-brand/10 bg-brand/5" style={{ marginHorizontal: CONTENT_PADDING, padding: normalize(14), marginBottom: normalize(20) }}>
          <IconBell size={normalize(20)} color={BRAND} />
          <View className="flex-1 ml-2.5">
            <Text className="font-medium text-brand mb-1" style={{ fontSize: FONT_SM }}>조건 충족 시 알림을 드려요</Text>
            <Text className="text-sub leading-snug" style={{ fontSize: normalizeFontSize(12) }}>
              날씨·시간대·미세먼지 조건이 맞으면 하루 전에 알려드려요. 스팟별로 다른 조건을 설정할 수 있어요.
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center" style={{ marginTop: normalize(40) }}>
            <Text className="text-sub" style={{ fontSize: FONT_SM }}>목록을 불러오는 중입니다...</Text>
          </View>
        ) : wishlists.length === 0 ? (
          /* Empty State */
          <View className="items-center justify-center" style={{ paddingVertical: normalize(64), paddingHorizontal: normalize(40) }}>
            <View className="items-center justify-center rounded-2xl bg-card mb-2" style={{ width: normalize(64), height: normalize(64) }}>
              <IconBell size={normalize(28)} color="rgba(0,0,0,0.2)" />
            </View>
            <Text className="font-semibold text-black tracking-tight mb-2" style={{ fontSize: normalizeFontSize(18) }}>설정한 출사 조건이 없어요</Text>
            <Text className="text-sub text-center leading-relaxed mb-4" style={{ fontSize: normalizeFontSize(14) }}>
              스팟마다 날씨·골든아워·미세먼지 조건을{'\n'}설정하면 딱 맞는 날 알림을 받을 수 있어요.
            </Text>
            <TouchableOpacity onPress={handleAdd} className="bg-brand items-center justify-center" style={{ height: BUTTON_HEIGHT, paddingHorizontal: CONTENT_PADDING, borderRadius: BUTTON_RADIUS }}>
              <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(16) }}>스팟에서 조건 설정하기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* List */
          <View>
            <View className="flex-row items-center justify-between" style={{ paddingHorizontal: CONTENT_PADDING, paddingVertical: normalize(10) }}>
              <Text className="font-semibold text-black/30 tracking-wide" style={{ fontSize: FONT_SM }}>
                내 출사 알림 <Text className="font-normal">({wishlists.length}개)</Text>
              </Text>
              <TouchableOpacity onPress={() => setSortModalVisible(true)} className="flex-row items-center py-1">
                <Text className="text-sub" style={{ fontSize: normalizeFontSize(12), letterSpacing: -0.1 }}>{sortType}</Text>
                <IconChevronDown size={normalize(14)} color={TEXT_SUB} style={{ transform: [{ rotate: sortModalVisible ? '180deg' : '0deg' }], marginLeft: 2 }} />
              </TouchableOpacity>
            </View>

            {sortedWishlists.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('WishlistSetting', { id: item.id, wishlist: item })}
                className="bg-card overflow-hidden"
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
                      backgroundColor: item.status === 'hit' ? 'rgba(52,199,89,0.9)' : item.status === 'soon' ? BRAND_STRONG : 'rgba(0,0,0,0.35)'
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
                    <Text className="text-sub ml-1" style={{ fontSize: normalizeFontSize(12) }}>{item.loc}</Text>
                  </View>

                  {/* Conditions */}
                  <View className="flex-row flex-wrap gap-1 mb-2.5">
                    {item.conditions.map((cond, i) => (
                      <View key={i} className="flex-row items-center rounded-full" style={{ height: normalize(22), paddingHorizontal: normalize(9), backgroundColor: cond.active ? BRAND_TINT_ACTIVE : 'rgba(255,255,255,1)' }}>
                        <Text className="font-medium" style={{ fontSize: normalizeFontSize(11), color: cond.active ? BRAND : 'rgba(0,0,0,0.45)' }}>{cond.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Forecast */}
                  <View className="flex-row border-t-[0.5px] border-hairline" style={{ paddingTop: normalize(10), gap: normalize(4) }}>
                    {item.forecast.map((f, i) => (
                      <View key={i} className="flex-1 items-center gap-1">
                        <Text style={{ fontSize: normalizeFontSize(9), color: 'rgba(0,0,0,0.28)' }}>{f.day}</Text>
                        <View className="items-center justify-center rounded-full bg-white border border-black/5" style={{ width: normalize(28), height: normalize(28), borderColor: f.hit ? BRAND : 'rgba(0,0,0,0.08)', backgroundColor: f.hit ? BRAND_TINT : '#fff' }}>
                          <IconCircleCheck size={normalize(16)} color={f.hit ? BRAND : 'rgba(0,0,0,0.15)'} />
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Notif */}
                {item.notifText && (
                  <View className="flex-row items-center border-t-[0.5px] mt-3" style={{ paddingVertical: normalize(10), paddingHorizontal: normalize(14), backgroundColor: item.status === 'hit' ? BRAND_TINT : 'rgba(52,199,89,0.05)', borderColor: item.status === 'hit' ? BRAND_TINT : 'rgba(52,199,89,0.12)' }}>
                    <View className="rounded-full mr-2" style={{ width: normalize(6), height: normalize(6), backgroundColor: item.status === 'hit' ? BRAND : '#34C759' }} />
                    <Text className="font-medium" style={{ fontSize: normalizeFontSize(12), color: item.status === 'hit' ? BRAND : '#34C759' }}>{item.notifText}</Text>
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
            className="absolute bg-white rounded-xl" 
            style={{ 
              top: normalize(200),
              right: CONTENT_PADDING, 
              width: normalize(120),
              paddingVertical: normalize(6),
              ...SHADOW_OVERLAY,
            }}
          >
            {['최신순', '조건 충족순', '이름순'].map((opt) => (
              <TouchableOpacity 
                key={opt} 
                onPress={() => { setSortType(opt); setSortModalVisible(false); }}
                className="flex-row items-center justify-between"
                style={{ paddingVertical: normalize(10), paddingHorizontal: normalize(12) }}
              >
                <Text className={sortType === opt ? 'font-medium text-brand' : 'text-black/70'} style={{ fontSize: normalizeFontSize(14) }}>
                  {opt}
                </Text>
                {sortType === opt && <IconCheck size={normalize(16)} color={BRAND} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
