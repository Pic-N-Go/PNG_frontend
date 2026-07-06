import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { IconClock } from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { BUTTON_RADIUS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { NaviAppId } from '@/types/spot';

const NAVI_APPS: { id: NaviAppId; label: string; bg: string }[] = [
  { id: 'kakao', label: '카카오맵', bg: '#FEE500' },
  { id: 'naver', label: '네이버 지도', bg: '#03C75A' },
  { id: 'apple', label: 'Apple 지도', bg: '#E8E8ED' },
];

function NaviAppIcon({ id }: { id: NaviAppId }) {
  if (id === 'kakao') {
    return (
      <Svg width={normalize(30)} height={normalize(20)} viewBox="0 0 30 20">
        <Path d="M15 1.5C8.6 1.5 3.5 5.6 3.5 10.7C3.5 14 5.5 16.9 8.5 18.7L7 24L13.5 19.8C14 19.9 14.5 20 15 20C21.4 20 26.5 15.9 26.5 10.7C26.5 5.6 21.4 1.5 15 1.5Z" fill="#3C1E1E" />
      </Svg>
    );
  }
  if (id === 'naver') {
    return (
      <Svg width={normalize(26)} height={normalize(26)} viewBox="0 0 26 26">
        <Path d="M7 7H11L14.5 13V7H18V19H14L10.5 13V19H7V7Z" fill="#fff" />
      </Svg>
    );
  }
  return (
    <Svg width={normalize(24)} height={normalize(24)} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8} stroke="rgba(0,0,0,0.18)" strokeWidth={0.8} fill="none" />
      <Line x1={12} y1={4} x2={12} y2={6} stroke="#0071E3" strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx={12} cy={12.5} r={2.2} fill="#FF453A" />
    </Svg>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  spotName: string;
  address: string;
  onLaunched: (message: string) => void;
}

export default function NaviSheet({ visible, onClose, spotName, address, onLaunched }: Props) {
  const [selectedApp, setSelectedApp] = useState<NaviAppId | null>(null);

  function handleClose() {
    setSelectedApp(null);
    onClose();
  }

  function handleLaunch() {
    const app = NAVI_APPS.find((a) => a.id === selectedApp);
    if (!app) return;
    onLaunched(`${app.label}으로 안내를 시작합니다`);
    setSelectedApp(null);
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
          바로 출발
        </Text>
      </View>

      <View style={{ paddingHorizontal: GRID_PADDING }}>
        <View style={{ borderRadius: normalize(14), backgroundColor: '#F5F5F7', padding: normalize(16), marginBottom: normalize(12) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
            <View style={{ width: normalize(10), height: normalize(10), borderRadius: normalize(5), backgroundColor: '#34C759' }} />
            <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)' }}>현재 위치</Text>
          </View>
          <View style={{ marginLeft: normalize(4), width: 1, height: normalize(18), backgroundColor: 'rgba(0,0,0,0.12)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: normalize(10) }}>
            <View style={{ width: normalize(10), height: normalize(10), borderRadius: normalize(5), backgroundColor: '#E31B59', marginTop: normalize(3) }} />
            <View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: '#000' }}>{spotName}</Text>
              <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginTop: normalize(2) }}>{address}</Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), borderRadius: normalize(14), backgroundColor: '#F5F5F7', padding: normalize(16), marginBottom: normalize(16) }}>
          <IconClock size={normalize(20)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
          <View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: '#000' }}>현재 위치에서 차로 18분</Text>
            <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginTop: normalize(2) }}>약 12.4km · 실시간 교통 기준</Text>
          </View>
        </View>

        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.45)', marginBottom: normalize(10) }}>
          길 안내 앱 선택
        </Text>
        <View style={{ flexDirection: 'row', gap: normalize(10), marginBottom: normalize(16) }}>
          {NAVI_APPS.map((app) => (
            <Pressable
              key={app.id}
              onPress={() => setSelectedApp(app.id)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: normalize(8),
                paddingVertical: normalize(14),
                borderRadius: normalize(14),
                borderWidth: 1.5,
                borderColor: selectedApp === app.id ? '#E31B59' : 'transparent',
                backgroundColor: '#F5F5F7',
              }}
            >
              <View style={{ width: normalize(48), height: normalize(48), borderRadius: normalize(24), backgroundColor: app.bg, alignItems: 'center', justifyContent: 'center' }}>
                <NaviAppIcon id={app.id} />
              </View>
              <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(12), color: '#000', letterSpacing: -0.1 }}>{app.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(12) }}>
        <Pressable
          onPress={handleLaunch}
          disabled={!selectedApp}
          style={{
            width: '100%',
            height: normalize(52),
            borderRadius: BUTTON_RADIUS,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selectedApp ? '#E31B59' : 'rgba(0,0,0,0.08)',
          }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: selectedApp ? '#fff' : 'rgba(0,0,0,0.25)' }}>
            바로 출발
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
