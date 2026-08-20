import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Camera, ChevronDown, ChevronRight, MapPin } from 'lucide-react-native';
import { ProfileSpotItem } from '@/types/community';
import { GRID_PADDING, FONT_2XS, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { CARD, TEXT_SUB } from '@/constants/colors';

const SURFACE = CARD;

const REGIONS = ['전체', '부산', '서울'];

interface Props {
  items: ProfileSpotItem[];
  totalCount: number;
  onSelectSpot: (item: ProfileSpotItem) => void;
}

export default function ProfileSpotsTab({ items, totalCount, onSelectSpot }: Props) {
  const [activeRegion, setActiveRegion] = useState(REGIONS[0]);

  return (
    <View>
      <View className="flex-row items-center" style={{ paddingHorizontal: GRID_PADDING, paddingVertical: normalize(12), gap: normalize(8) }}>
        <View className="flex-row items-center" style={{ gap: normalize(3) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.2 }}>
            자주 간 순
          </Text>
          <ChevronDown size={normalize(11)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
        </View>
        <View className="flex-row" style={{ marginLeft: 'auto', gap: normalize(6) }}>
          {REGIONS.map((region) => {
            const isActive = region === activeRegion;
            return (
              <Pressable
                key={region}
                onPress={() => setActiveRegion(region)}
                className="items-center justify-center"
                style={{ height: normalize(26), paddingHorizontal: normalize(10), borderRadius: normalize(13), backgroundColor: isActive ? '#000' : SURFACE }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: isActive ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_XS, color: isActive ? '#fff' : 'rgba(0,0,0,0.5)', letterSpacing: -0.1 }}>
                  {region}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(12), gap: normalize(8) }}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onSelectSpot(item)}
            className="flex-row"
            style={{ gap: normalize(12), padding: normalize(12), backgroundColor: SURFACE, borderRadius: normalize(14) }}
          >
            <View style={{ width: normalize(76), height: normalize(76), borderRadius: normalize(12), backgroundColor: item.gradient[0], position: 'relative' }}>
              <View
                className="absolute flex-row items-center"
                style={{ bottom: normalize(5), right: normalize(5), gap: normalize(3), height: normalize(18), paddingHorizontal: normalize(6), borderRadius: normalize(9), backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <Camera size={normalize(8)} color="#fff" strokeWidth={2} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff' }}>
                  {item.photoCount}
                </Text>
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingVertical: normalize(2) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
                {item.name}
              </Text>
              <View className="flex-row items-center" style={{ gap: normalize(5), marginTop: normalize(3) }}>
                <MapPin size={normalize(10)} color={TEXT_SUB} strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB, letterSpacing: -0.1 }}>
                  {item.address}
                </Text>
              </View>
              <View className="flex-row items-center" style={{ gap: normalize(5), marginTop: normalize(6) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB, letterSpacing: -0.1 }}>
                  {item.lastVisitLabel}
                </Text>
                <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB, letterSpacing: -0.1 }}>
                  총 {item.visitCount}회 방문
                </Text>
              </View>
            </View>
            <ChevronRight size={normalize(14)} color="rgba(0,0,0,0.2)" strokeWidth={2} style={{ alignSelf: 'center' }} />
          </Pressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(24) }}>
        <Pressable
          className="items-center justify-center"
          style={{ width: '100%', height: normalize(44), borderRadius: normalize(22), backgroundColor: SURFACE }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2 }}>
            전체 {totalCount}곳 보기
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
