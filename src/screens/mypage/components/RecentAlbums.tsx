import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM } from '@/constants/layout';
import { useMyAlbums } from '@/hooks/useUser';
import { categoryLabel } from '@/constants/spotCategories';
import { BRAND, CARD } from '@/constants/colors';

const GRADIENT_PALETTES: [string, string, ...string[]][] = [
  ['#0f2027', '#203a43', '#e8a87c'],
  ['#8b4a6b', '#f0c89a'],
  ['#0a1a0f', '#4a8060'],
  ['#1a1530', '#b44a3a'],
  ['#3a2a1a', '#c8804a'],
  ['#020010', '#1a1545'],
];

export default function RecentAlbums() {
  const navigation = useNavigation();
  const { data: albums = [], isLoading } = useMyAlbums();

  if (!isLoading && albums.length === 0) {
    return (
      <View className="mb-10" style={{ paddingHorizontal: normalize(20) }}>
        <Text className="font-semibold tracking-tight text-black mb-3" style={{ fontSize: normalizeFontSize(20) }}>
          지난 촬영
        </Text>
        <View
          style={{
            height: normalize(120),
            backgroundColor: CARD,
            borderRadius: normalize(14),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.3)', fontFamily: 'Pretendard-Regular' }}>
            등록된 앨범이 없어요
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-10">
      <View className="flex-row justify-between items-baseline mb-3" style={{ paddingHorizontal: normalize(20) }}>
        <Text className="font-semibold tracking-tight text-black" style={{ fontSize: normalizeFontSize(20) }}>
          지난 촬영
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyPhotos' as never)}>
          <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: BRAND }}>
            전체보기
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: normalize(20) }}
        contentContainerStyle={{ gap: normalize(10) }}
      >
        {albums.map((album, index) => {
          const colors = GRADIENT_PALETTES[index % GRADIENT_PALETTES.length];
          return (
            <LinearGradient
              key={album.id}
              colors={colors}
              style={{
                width: normalize(160),
                height: normalize(200),
                borderRadius: normalize(14),
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.65)']}
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
                <Text className="tracking-tight font-normal" style={{ fontSize: normalizeFontSize(12), color: 'rgba(255,255,255,0.7)' }}>
                  {categoryLabel(album.category)} · {album.photoCount}장
                </Text>
              </LinearGradient>
            </LinearGradient>
          );
        })}
      </ScrollView>
    </View>
  );
}
