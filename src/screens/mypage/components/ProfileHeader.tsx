import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconUser, IconSettings } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_XS } from '@/constants/layout';
import { useMyProfile, useMyStats, useMyAlbums } from '@/hooks/useUser';
import { getCategoryKoreanName } from '@/types/user';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const authUser = useAuthStore((s) => s.user);
  const bio = useAuthStore((s) => s.bio);

  const { data: profile } = useMyProfile();
  const { data: stats, isLoading: isStatsLoading } = useMyStats();
  const { data: albums = [] } = useMyAlbums();

  const totalAlbumPhotos = useMemo(() => {
    return albums.reduce((sum, a) => sum + (a.photoCount || 0), 0);
  }, [albums]);

  const nickname = profile?.nickname || authUser?.nickname || '사용자';
  const profileImageUrl = profile?.profileImageUrl || authUser?.profileImageUrl;
  const categories = profile?.spotCategories || authUser?.spotCategories || [];

  const followerCount = stats?.followerCount ?? 0;
  const followingCount = stats?.followingCount ?? 0;
  const visitedSpotCount = stats?.visitedSpotCount ?? 0;
  const reviewCount = stats?.reviewCount ?? 0;
  const photoCount = totalAlbumPhotos > 0 ? totalAlbumPhotos : reviewCount;

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
            overflow: 'hidden',
          }}
        >
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <IconUser size={normalize(34)} color="rgba(255,255,255,0.75)" strokeWidth={1.5} />
          )}
        </View>

        <View className="flex-1">
          <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
            {nickname}
          </Text>
          {categories.length > 0 && (
            <View className="flex-row flex-wrap mt-1 mb-1.5" style={{ gap: normalize(5) }}>
              {categories.map((cat) => (
                <View
                  key={cat}
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
                    {getCategoryKoreanName(cat)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text className="leading-relaxed tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(255, 255, 255, 0.5)' }}>
            {bio || '안녕하세요! 사진과 일상을 기록하는 것을 좋아합니다!'}
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
            onPress={() => navigation.navigate('Follow', { initialTab: 'followers', userId: profile?.id || authUser?.id } as never)}
          >
            <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
              {isStatsLoading ? '-' : followerCount.toLocaleString()}
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
            onPress={() => navigation.navigate('Follow', { initialTab: 'following', userId: profile?.id || authUser?.id } as never)}
          >
            <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
              {isStatsLoading ? '-' : followingCount.toLocaleString()}
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
            onPress={() => navigation.navigate('PhotoMap' as never)}
          >
            <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
              {isStatsLoading ? '-' : visitedSpotCount.toLocaleString()}
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
              {isStatsLoading ? '-' : photoCount.toLocaleString()}
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
              {isStatsLoading ? '-' : reviewCount.toLocaleString()}
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
