import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM } from '@/constants/layout';

const ALBUMS = [
  { id: '1', name: '광안리 일출', meta: '2026.03.28 · 12장', colors: ['#0f2027', '#203a43', '#e8a87c'] as const },
  { id: '2', name: '진해 벚꽃', meta: '2026.04.02 · 24장', colors: ['#8b4a6b', '#f0c89a'] as const },
  { id: '3', name: '제주 사려니숲', meta: '2026.04.15 · 18장', colors: ['#0a1a0f', '#4a8060'] as const },
];

export default function RecentAlbums() {
  return (
    <View className="mb-7">
      <View className="flex-row justify-between items-baseline mb-3 px-5">
        <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
          지난 촬영
        </Text>
        <TouchableOpacity onPress={() => console.log('전체보기: my-photos')}>
          <Text className="tracking-tight" style={{ fontSize: FONT_SM, color: '#e31b59' }}>
            전체보기
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: normalize(20), gap: normalize(10) }}
      >
        {ALBUMS.map((album) => (
          <LinearGradient
            key={album.id}
            colors={album.colors}
            style={{
              width: normalize(160),
              height: normalize(200),
              borderRadius: normalize(14),
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.5)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: normalize(10),
                paddingTop: normalize(20),
              }}
            >
              <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(16), marginBottom: normalize(2) }}>
                {album.name}
              </Text>
              <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(255,255,255,0.5)' }}>
                {album.meta}
              </Text>
            </LinearGradient>
          </LinearGradient>
        ))}
      </ScrollView>
    </View>
  );
}
