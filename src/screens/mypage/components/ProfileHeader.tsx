import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSettings } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { FONT_TITLE, FONT_XS, GRID_PADDING, HAIRLINE_WIDTH } from '@/constants/layout';
import Avatar from '@/components/common/Avatar';
import { useMyProfile, useMyStats } from '@/hooks/useUser';
import { categoryLabel } from '@/constants/spotCategories';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileHeader() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const authUser = useAuthStore((s) => s.user);

  const { data: profile } = useMyProfile();
  const { data: stats, isLoading: isStatsLoading } = useMyStats();
  const nickname = profile?.nickname || authUser?.nickname || '사용자';
  const profileImageUrl = profile?.profileImageUrl || authUser?.profileImageUrl;
  const categories = profile?.spotCategories || authUser?.spotCategories || [];
  const bio = profile?.bio || authUser?.bio;

  const followerCount = stats?.followerCount ?? 0;
  const followingCount = stats?.followingCount ?? 0;
  const reviewCount = stats?.reviewCount ?? 0;
  const postCount = stats?.postCount ?? 0;

  return (
    <LinearGradient
      colors={['#000000', '#1d1d1f']}
      style={{
        paddingTop: insets.top + normalize(32),
        paddingHorizontal: GRID_PADDING,
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
          <Text className="font-semibold text-white tracking-tight" style={{ fontSize: FONT_TITLE, marginBottom: normalize(2) }}>
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
          {/* CLAUDE.md는 12px을 금지하고 11 또는 13을 쓰라고 명시한다 — 자기소개는 보조 정보라 11 */}
          {bio ? (
            <Text className="leading-relaxed tracking-tight font-normal" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.5)' }}>
              {bio}
            </Text>
          ) : (
            // 플레이스홀더일 때만 탭을 받는다 — 작성된 소개글은 눌러도 할 일이 없다.
            <TouchableOpacity
              onPress={() => navigation.navigate('ProfileEdit')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text className="leading-relaxed tracking-tight font-normal" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.5)' }}>
                자기소개를 입력해 보세요
              </Text>
            </TouchableOpacity>
          )}
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

      {/* 카드 4장 대신 한 줄 4분할. 세로 높이가 절반으로 줄고 네 값을 한눈에 비교할 수 있다. */}
      <View
        className="flex-row"
        style={{
          borderRadius: normalize(12),
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderWidth: 0.5,
          borderColor: 'rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
        }}
      >
        <StatTile
          value={followerCount}
          label="팔로워"
          loading={isStatsLoading}
          onPress={() => navigation.navigate('Follow', { initialTab: 'followers', userId: profile?.id || authUser?.id })}
        />
        <StatDivider />
        <StatTile
          value={followingCount}
          label="팔로잉"
          loading={isStatsLoading}
          onPress={() => navigation.navigate('Follow', { initialTab: 'following', userId: profile?.id || authUser?.id })}
        />
        <StatDivider />
        <StatTile
          value={postCount}
          label="글"
          loading={isStatsLoading}
          onPress={() => navigation.navigate('MyPosts')}
        />
        <StatDivider />
        <StatTile
          value={reviewCount}
          label="리뷰"
          loading={isStatsLoading}
          onPress={() => navigation.navigate('MyReviews')}
        />
      </View>
    </LinearGradient>
  );
}

/** 통계 타일 하나. 4개가 값·라벨·이동만 다르고 나머지는 같다. */
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
      // 배경·테두리는 바깥 컨테이너가 갖는다. 최소 터치 높이 44는 여기서 지킨다.
      style={{ minHeight: normalize(44), paddingVertical: normalize(10) }}
      onPress={onPress}
    >
      <Text className="font-semibold text-white tracking-tight" style={{ fontSize: FONT_TITLE, marginBottom: normalize(2) }}>
        {loading ? '-' : value.toLocaleString()}
      </Text>
      <Text className="tracking-tight font-normal" style={{ fontSize: FONT_XS, color: 'rgba(255, 255, 255, 0.35)' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/** 4분할 사이 세로 구분선. */
function StatDivider() {
  return <View style={{ width: HAIRLINE_WIDTH, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginVertical: normalize(10) }} />;
}
