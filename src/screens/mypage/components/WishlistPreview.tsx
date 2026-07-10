import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { IconBellFilled, IconBellOff } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD, FONT_XS } from '@/constants/layout';

const WISHLIST_DATA = [
  { id: '1', name: '부산 해운대 일출', cond: '맑음 · 일출 전 30분', date: '최적 2026.05.20', isAlarmOn: true },
  { id: '2', name: '경주 동궁과 월지', cond: '맑음 · 야경', date: '최적 2026.05.22', isAlarmOn: false },
  { id: '3', name: '제주 백약이오름', cond: '구름조금 · 일몰', date: '최적 2026.06.05', isAlarmOn: true },
];

export default function WishlistPreview() {
  const [alarms, setAlarms] = useState<Record<string, boolean>>(
    WISHLIST_DATA.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.isAlarmOn }), {})
  );

  const toggleAlarm = (id: string) => {
    setAlarms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View className="mb-7">
      <View className="px-5">
        <View className="flex-row justify-between items-baseline mb-3">
          <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
            촬영 위시리스트
          </Text>
          <TouchableOpacity onPress={() => console.log('전체보기: wishlist')}>
            <Text className="tracking-tight" style={{ fontSize: FONT_SM, color: '#e31b59' }}>
              전체보기
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="tracking-tight" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', marginTop: -normalize(8), marginBottom: normalize(12) }}>
          조건이 충족되면 알려드려요
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: normalize(20), gap: normalize(10) }}
      >
        {WISHLIST_DATA.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => console.log('Wishlist Detail:', item.id)}
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
                height: normalize(130),
                backgroundColor: 'rgba(0,0,0,0.1)',
                position: 'relative',
              }}
            >
              {/* 이미지 위치 홀더. 실제 앱에서는 ImageBackground에 source 사용 */}
              <TouchableOpacity
                onPress={() => toggleAlarm(item.id)}
                style={{
                  position: 'absolute',
                  top: normalize(10),
                  right: normalize(10),
                  width: normalize(28),
                  height: normalize(28),
                  borderRadius: normalize(14),
                  backgroundColor: alarms[item.id] ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {alarms[item.id] ? (
                  <IconBellFilled size={normalize(16)} color="#fff" />
                ) : (
                  <IconBellOff size={normalize(16)} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            <View style={{ padding: normalize(10), paddingBottom: normalize(12) }}>
              <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_MD, marginBottom: normalize(2) }}>
                {item.name}
              </Text>
              <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginBottom: normalize(6) }}>
                {item.cond}
              </Text>
              <Text className="font-medium tracking-tight" style={{ fontSize: FONT_XS, color: '#e31b59' }}>
                {item.date}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
