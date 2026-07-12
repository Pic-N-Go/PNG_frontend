import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconUser, IconSettings } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_XS } from '@/constants/layout';

// 임시 모의 데이터
const MOCK_PROFILE = {
  name: '사진가_준혁',
  handle: '@junhyeok_pic',
  themes: ['야경', '바다'],
  bio: '야경과 바다를 좋아하는 사진가입니다.',
  followerCount: 1247,
  followingCount: 356,
  activity: {
    visitedSpots: 28,
    photos: 142,
    reviews: 12,
  },
};

export default function ProfileHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <LinearGradient
      colors={['#000000', '#1d1d1f']}
      style={{
        paddingTop: insets.top + normalize(32),
        paddingHorizontal: normalize(20),
        paddingBottom: normalize(20),
        borderBottomLeftRadius: normalize(20),
        borderBottomRightRadius: normalize(20),
        position: 'relative',
        zIndex: 10,
      }}
    >
      <View className="flex-row items-center mb-5 mt-2" style={{ gap: normalize(16) }}>
        <View
          style={{
            width: normalize(72),
            height: normalize(72),
            borderRadius: normalize(36),
            backgroundColor: '#4a7c8a',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <IconUser size={normalize(34)} color="rgba(255,255,255,0.75)" strokeWidth={1.5} />
          {/* Level Badge (Mock) */}
          <View
            style={{
              position: 'absolute',
              bottom: -normalize(2),
              right: -normalize(2),
              width: normalize(22),
              height: normalize(22),
              borderRadius: normalize(11),
              backgroundColor: '#e31b59',
              borderColor: '#1d1d1f',
              borderWidth: 2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: normalizeFontSize(10), color: '#fff', fontWeight: 'bold' }}>
              4
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
            {MOCK_PROFILE.name}
          </Text>
          <View className="flex-row flex-wrap mt-1 mb-1.5" style={{ gap: normalize(5) }}>
            {MOCK_PROFILE.themes.map((theme) => (
              <View
                key={theme}
                style={{
                  height: normalize(20),
                  paddingHorizontal: normalize(9),
                  borderRadius: normalize(10),
                  backgroundColor: 'rgba(255, 255, 255, 0.13)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="font-medium tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.75)' }}>
                  {theme}
                </Text>
              </View>
            ))}
          </View>
          <Text className="leading-relaxed tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(255, 255, 255, 0.5)' }}>
            {MOCK_PROFILE.bio}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Setting')}
          style={{
            width: normalize(34),
            height: normalize(34),
            borderRadius: normalize(17),
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'flex-start',
          }}
        >
          <IconSettings size={normalize(20)} color="#ffffff" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <View style={{ gap: normalize(8) }}>
        <View className="flex-row" style={{ gap: normalize(8) }}>
          <TouchableOpacity
            className="flex-1 items-center justify-center"
            style={{
              paddingVertical: normalize(12),
              borderRadius: normalize(12),
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
            onPress={() => navigation.navigate('Follow', { initialTab: 'followers' } as never)}
          >
            <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
              {MOCK_PROFILE.followerCount.toLocaleString()}
            </Text>
            <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.35)' }}>
              팔로워
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center justify-center"
            style={{
              paddingVertical: normalize(12),
              borderRadius: normalize(12),
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
            onPress={() => navigation.navigate('Follow', { initialTab: 'following' } as never)}
          >
            <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
              {MOCK_PROFILE.followingCount.toLocaleString()}
            </Text>
            <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.35)' }}>
              팔로잉
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row" style={{ gap: normalize(8) }}>
          <TouchableOpacity
            className="flex-1 items-center justify-center"
            style={{
              paddingVertical: normalize(12),
              borderRadius: normalize(12),
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
            onPress={() => console.log('방문 스팟')}
          >
            <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
              {MOCK_PROFILE.activity.visitedSpots}
            </Text>
            <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.35)' }}>
              방문 스팟
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center justify-center"
            style={{
              paddingVertical: normalize(12),
              borderRadius: normalize(12),
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
            onPress={() => navigation.navigate('MyPhotos' as never)}
          >
            <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
              {MOCK_PROFILE.activity.photos}
            </Text>
            <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.35)' }}>
              사진
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 items-center justify-center"
            style={{
              paddingVertical: normalize(12),
              borderRadius: normalize(12),
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
            onPress={() => navigation.navigate('MyReviews' as never)}
          >
            <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
              {MOCK_PROFILE.activity.reviews}
            </Text>
            <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.35)' }}>
              리뷰
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
