import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconBellFilled, IconBellOff } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { CARD_RADIUS, EMPTY_CARD_HEIGHT, FONT_MD, FONT_SM, FONT_TITLE, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { useSpotAlert } from '@/hooks/useSpotAlert';
import { mapSpotAlertToUI } from '@/utils/spotAlertMapper';
import { BRAND, BRAND_STRONG, CARD, TEXT_SUB } from '@/constants/colors';

export default function SpotAlertPreview() {
  const navigation = useNavigation<any>();
  const { useSpotAlertsQuery, useToggleSpotAlertActiveMutation } = useSpotAlert();
  const { data: spotAlerts, isLoading, isError, refetch } = useSpotAlertsQuery();
  const toggleMutation = useToggleSpotAlertActiveMutation();

  const toggleAlarm = (item: any) => {
    const spotId = item.id || item.spotId || item.rawData?.spotId;
    toggleMutation.mutate({
      spotId,
      isAlertEnabled: !item.isAlertEnabled,
    });
  };

  const uiItems = (spotAlerts || []).map(mapSpotAlertToUI);
  // 조회 실패를 빈 상태로 그리면 걸어 둔 알림이 있는데도 "없어요"가 된다. isError를 빼야 한다.
  // 빈 상태에서는 헤더 '설정'을 감춘다 — 빈 카드의 링크가 같은 곳으로 가는 CTA라 둘이 겹친다.
  const isEmpty = !isLoading && !isError && uiItems.length === 0;

  return (
    <View className="mb-10">
      <View
        className="mb-3 flex-row items-center justify-between"
        style={{ paddingHorizontal: GRID_PADDING }}
      >
        <View className="flex-1">
          <Text className="font-semibold tracking-tight text-black" style={{ fontSize: FONT_TITLE }}>
            출사 알림 스팟
          </Text>
        </View>
        {!isEmpty && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Wishlist')}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          >
            <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: BRAND }}>
              설정
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 로딩과 빈 상태의 높이를 카드 높이로 묶는다 — 다르면 로딩이 끝날 때 카드가 커지며 아래가 밀린다. */}
      {isLoading ? (
        <View
          className="bg-card items-center justify-center"
          style={{ marginHorizontal: GRID_PADDING, height: EMPTY_CARD_HEIGHT, borderRadius: CARD_RADIUS }}
        >
          <ActivityIndicator color={BRAND} size="small" />
        </View>
      ) : isError ? (
        <View
          className="bg-card items-center justify-center"
          style={{ marginHorizontal: GRID_PADDING, height: EMPTY_CARD_HEIGHT, borderRadius: CARD_RADIUS, gap: normalize(12) }}
        >
          <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: TEXT_SUB }}>
            출사 알림을 불러오지 못했어요
          </Text>
          <TouchableOpacity onPress={() => refetch()} hitSlop={12}>
            <Text
              className="font-semibold tracking-tight"
              style={{ fontSize: FONT_SM, color: BRAND, textDecorationLine: 'underline', textDecorationColor: BRAND }}
            >
              다시 시도
            </Text>
          </TouchableOpacity>
        </View>
      ) : isEmpty ? (
        <View
          className="bg-card items-center justify-center"
          style={{ marginHorizontal: GRID_PADDING, height: EMPTY_CARD_HEIGHT, borderRadius: CARD_RADIUS, gap: normalize(12) }}
        >
          <Text
            className="tracking-tight font-normal text-center"
            style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.3)', lineHeight: FONT_SM * 1.5 }}
          >
            {'원하는 날씨·시간 조건을 걸어 두면\n조건이 맞는 날 알려드려요'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Wishlist')} hitSlop={12}>
            <Text
              className="font-semibold tracking-tight"
              style={{ fontSize: FONT_SM, color: BRAND, textDecorationLine: 'underline', textDecorationColor: BRAND }}
            >
              출사 알림 설정하기
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: GRID_PADDING }}
          contentContainerStyle={{ gap: normalize(10) }}
        >
          {uiItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('WishlistSetting', { id: item.id })}
              style={{
                width: normalize(200),
                borderRadius: CARD_RADIUS,
                backgroundColor: CARD,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: normalize(100),
                  backgroundColor: '#2b2a29',
                  position: 'relative',
                  padding: normalize(12),
                  justifyContent: 'space-between'
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="bg-white/10 rounded-full px-2 py-0.5 self-start">
                    <Text className="text-white/80 font-semibold" style={{ fontSize: normalizeFontSize(10) }}>
                      {item.statusText}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => toggleAlarm(item)}
                    hitSlop={8}
                    style={{
                      width: normalize(28),
                      height: normalize(28),
                      borderRadius: normalize(14), // 원형 = height / 2. 카드 radius 아님
                      backgroundColor: item.isAlertEnabled ? BRAND_STRONG : 'rgba(0,0,0,0.3)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.isAlertEnabled ? (
                      <IconBellFilled size={normalize(16)} color="#fff" />
                    ) : (
                      <IconBellOff size={normalize(16)} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ padding: normalize(10), paddingBottom: normalize(12) }}>
                <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_MD, marginBottom: normalize(2) }}>
                  {item.title}
                </Text>
                <Text className="tracking-tight font-normal" style={{ fontSize: normalizeFontSize(12), color: TEXT_SUB, marginBottom: normalize(6) }}>
                  {item.loc}
                </Text>
                <Text className="font-medium tracking-tight" style={{ fontSize: FONT_XS, color: BRAND }}>
                  {item.notifText || '조건 맞춤 알림'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
