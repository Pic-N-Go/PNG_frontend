import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSettings } from '@tabler/icons-react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_XS } from '@/constants/layout';
import Avatar from '@/components/common/Avatar';
import { useMyProfile, useMyStats, useMyAlbums } from '@/hooks/useUser';
import { categoryLabel } from '@/constants/spotCategories';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const authUser = useAuthStore((s) => s.user);

  const { data: profile } = useMyProfile();
  const { data: stats, isLoading: isStatsLoading } = useMyStats();
  const { data: albums = [] } = useMyAlbums();

  const totalAlbumPhotos = useMemo(() => {
    return albums.reduce((sum, a) => sum + (a.photoCount || 0), 0);
  }, [albums]);

  const nickname = profile?.nickname || authUser?.nickname || '사용자';
  const profileImageUrl = profile?.profileImageUrl || authUser?.profileImageUrl;
  const categories = profile?.spotCategories || authUser?.spotCategories || [];
  const bio = profile?.bio || authUser?.bio;

  const followerCount = stats?.followerCount ?? 0;
  const followingCount = stats?.followingCount ?? 0;
  const visitedSpotCount = stats?.visitedSpotCount ?? 0;
  const reviewCount = stats?.reviewCount ?? 0;
  const postCount = stats?.postCount ?? 0;
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
        <Avatar userId={profile?.id ?? authUser?.id} nickname={nickname} imageUrl={profileImageUrl} size={72} />

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
                    {categoryLabel(cat)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <Text className="leading-relaxed tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(255, 255, 255, 0.5)' }}>
            {bio || '자기소개를 입력해 보세요'}
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

      {/* 3개씩 두 줄. 타일 5개가 똑같은 스타일로 복붙돼 있어 StatTile로 뺐다 — 한 곳만 고치면 된다. */}
      <View style={{ gap: normalize(8) }}>
        <View className="flex-row" style={{ gap: normalize(8) }}>
          <StatTile
            value={followerCount}
            label="팔로워"
            loading={isStatsLoading}
            onPress={() => navigation.navigate('Follow', { initialTab: 'followers', userId: profile?.id || authUser?.id })}
          />
          <StatTile
            value={followingCount}
            label="팔로잉"
            loading={isStatsLoading}
            onPress={() => navigation.navigate('Follow', { initialTab: 'following', userId: profile?.id || authUser?.id })}
          />
          <StatTile
            value={visitedSpotCount}
            label="방문 스팟"
            loading={isStatsLoading}
            onPress={() => navigation.navigate('PhotoMap')}
          />
        </View>

        <View className="flex-row" style={{ gap: normalize(8) }}>
          <StatTile
            value={photoCount}
            label="사진"
            loading={isStatsLoading}
            onPress={() => navigation.navigate('MyPhotos')}
          />
          <StatTile
            value={postCount}
            label="글"
            loading={isStatsLoading}
            onPress={() => navigation.navigate('MyPosts')}
          />
          <StatTile
            value={reviewCount}
            label="리뷰"
            loading={isStatsLoading}
            onPress={() => navigation.navigate('MyReviews')}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

/** 통계 타일 하나. 6개가 값·라벨·이동만 다르고 나머지는 같다. */
function StatTile({
  value,
  label,
  loading,
  onPress,
}: {
  value: number;
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-1 items-center justify-center"
      style={{
        paddingVertical: normalize(12),
        borderRadius: normalize(12),
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.06)',
      }}
      onPress={onPress}
    >
      <Text className="font-semibold text-white tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(2) }}>
        {loading ? '-' : value.toLocaleString()}
      </Text>
      <Text className="tracking-tight" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.35)' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
