import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IconBellFilled, IconBellOff, IconBookmark } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD, FONT_XS } from '@/constants/layout';
import { useSpotAlert } from '@/hooks/useSpotAlert';
import { mapSpotAlertToUI } from '@/utils/spotAlertMapper';

export default function SpotAlertPreview() {
  const navigation = useNavigation<any>();
  const { useSpotAlertsQuery, useToggleSpotAlertActiveMutation } = useSpotAlert();
  const { data: spotAlerts, isLoading } = useSpotAlertsQuery();
  const toggleMutation = useToggleSpotAlertActiveMutation();

  const toggleAlarm = (item: any) => {
    const spotId = item.id || item.spotId || item.rawData?.spotId;
    toggleMutation.mutate({
      spotId,
      isAlertEnabled: !item.isAlertEnabled,
    });
  };

  const uiItems = (spotAlerts || []).map(mapSpotAlertToUI);

  return (
    <View className="mb-10">
      <View className="mb-3" style={{ paddingHorizontal: normalize(20) }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: normalize(4) }}>
          <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
            출사 알림 스팟
          </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Wishlist')}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            style={{ paddingVertical: normalize(4), paddingHorizontal: normalize(6) }}
          >
            <Text className="tracking-tight font-medium" style={{ fontSize: FONT_SM, color: '#e31b59' }}>
              설정
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="tracking-tight" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)' }}>
          날씨 알림이 설정된 스팟
        </Text>
      </View>

      {isLoading ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator color="#E31B59" size="small" />
        </View>
      ) : uiItems.length === 0 ? (
        <View className="mx-5 p-5 bg-white rounded-2xl items-center justify-center border border-black/5">
          <IconBookmark size={normalize(24)} color="rgba(0,0,0,0.2)" style={{ marginBottom: normalize(6) }} />
          <Text className="text-black/40 text-xs font-medium">설정한 출사 조건이 없어요.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: normalize(20) }}
          contentContainerStyle={{ gap: normalize(10) }}
        >
          {uiItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('WishlistSetting', { id: item.id })}
              style={{
                width: normalize(200),
                borderRadius: normalize(16),
                backgroundColor: '#fff',
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 2,
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
                      borderRadius: normalize(14),
                      backgroundColor: item.isAlertEnabled ? 'rgba(227,27,89,0.9)' : 'rgba(0,0,0,0.3)',
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
                <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginBottom: normalize(6) }}>
                  {item.loc}
                </Text>
                <Text className="font-medium tracking-tight" style={{ fontSize: FONT_XS, color: '#e31b59' }}>
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
