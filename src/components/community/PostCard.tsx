import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { MapPin, Heart, MessageSquare, Archive, Clock, Camera, Sun, Moon, Cloud } from 'lucide-react-native';
import { Post, PostShotMeta } from '@/types/community';
import { FONT_2XS, FONT_XS, FONT_SM, FONT_MD } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const ACCENT = '#E31B59';

const WEATHER_ICONS: Record<PostShotMeta['weatherIcon'], typeof Sun> = {
  'clear-day': Sun,
  'clear-night': Moon,
  cloudy: Cloud,
};

// 목업의 저장(아카이브) 활성 아이콘 — solid pink box + white handle line.
// lucide Archive에 fill을 주면 손잡이 line까지 같은 색으로 덮여 뭉개지므로 직접 그림.
function SavedArchiveIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2} y={4} width={20} height={5} rx={2} fill={ACCENT} />
      <Path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" fill={ACCENT} />
      <Path d="M10 13h4" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

interface Props {
  post: Post;
  onPress: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onToggleFollow: () => void;
  onPressUsername: () => void;
}

export default function PostCard({ post, onPress, onToggleLike, onToggleSave, onToggleFollow, onPressUsername }: Props) {
  const mainPhoto = post.imageUrls?.[0];
  return (
    <Pressable onPress={onPress} className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#f5f5f7', borderRadius: normalize(20) }}>
      <View style={{ height: normalize(230), position: 'relative' }}>
        {/* 사진이 로드되기 전/실패했을 때도 카드 높이가 유지되도록 대체 색을 배경으로 깔아둔다 */}
        <View style={{ flex: 1, backgroundColor: post.photoGradient[0] }}>
          {mainPhoto && <Image source={{ uri: mainPhoto }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />}
        </View>
        {/* 위치는 사진 위에 겹치지 않고 아래 액션 행 왼쪽에서 보여준다 */}
        <Pressable
          onPress={onToggleLike}
          className="flex-row items-center absolute"
          style={{ right: normalize(12), bottom: normalize(12), gap: normalize(4), height: normalize(28), paddingHorizontal: normalize(11), borderRadius: normalize(14), backgroundColor: 'rgba(0,0,0,0.35)' }}
        >
          <Heart size={normalize(13)} color={post.isLiked ? '#ff453a' : '#fff'} fill={post.isLiked ? '#ff453a' : 'none'} strokeWidth={1.8} />
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', letterSpacing: -0.1 }}>
            {post.likeCount}
          </Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: normalize(16), paddingTop: normalize(14), paddingBottom: normalize(4) }}>
        <View className="flex-row items-center" style={{ gap: normalize(10), marginBottom: normalize(12) }}>
          {/* 아바타도 프로필로 들어가야 한다 — Pressable이 없으면 카드 전체 탭으로 흘러가 게시글 상세가 열린다 */}
          <Pressable
            onPress={onPressUsername}
            className="items-center justify-center overflow-hidden"
            style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: post.author.avatarGradient[0] }}
          >
            {post.author.profileImageUrl ? (
              <Image source={{ uri: post.author.profileImageUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1 }}>
                {post.author.initials}
              </Text>
            )}
          </Pressable>
          <View style={{ flex: 1 }}>
            <Pressable onPress={onPressUsername}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
                {post.author.handle}
              </Text>
            </Pressable>
            {/* 위치는 아래 액션 행에서 아이콘과 함께 보여주므로 여기서는 작성 시각만 둔다 */}
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.1, marginTop: normalize(1) }}>
              {post.createdAtLabel}
            </Text>
          </View>
          {!post.isMine && (
            <Pressable
              onPress={onToggleFollow}
              style={{
                height: normalize(30),
                paddingHorizontal: normalize(12),
                borderRadius: normalize(15),
                backgroundColor: post.isFollowingAuthor ? '#f5f5f7' : 'rgba(227,27,89,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: post.isFollowingAuthor ? 'rgba(0,0,0,0.55)' : ACCENT, letterSpacing: -0.1 }}>
                {post.isFollowingAuthor ? '팔로잉' : '팔로우'}
              </Text>
            </Pressable>
          )}
        </View>

        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2, lineHeight: FONT_MD * 1.5, marginBottom: normalize(12) }}>
          {post.caption}
        </Text>

        {/* 촬영 정보는 전부 선택 입력이라 항목별로 있는 것만 그린다 — 없는 항목의 아이콘·구분점이 남으면 빈칸처럼 보인다 */}
        {post.shotMeta && (
          <View className="flex-row items-center" style={{ gap: normalize(6), paddingVertical: normalize(10), paddingHorizontal: normalize(12), backgroundColor: '#fff', borderRadius: normalize(12), marginBottom: normalize(12) }}>
            {!!post.shotMeta.time && (
              <>
                <Clock size={normalize(13)} color="rgba(0,0,0,0.3)" strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.6)', letterSpacing: -0.15 }}>
                  {post.shotMeta.time}
                </Text>
              </>
            )}
            {!!post.shotMeta.weather && (
              <>
                {!!post.shotMeta.time && <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />}
                {(() => {
                  const WeatherIcon = WEATHER_ICONS[post.shotMeta!.weatherIcon] ?? Cloud;
                  return <WeatherIcon size={normalize(13)} color="rgba(0,0,0,0.3)" strokeWidth={1.8} />;
                })()}
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.6)', letterSpacing: -0.15 }}>
                  {post.shotMeta.weather}
                </Text>
              </>
            )}
            {!!post.shotMeta.gear && (
              <>
                {(!!post.shotMeta.time || !!post.shotMeta.weather) && <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />}
                <Camera size={normalize(13)} color="rgba(0,0,0,0.3)" strokeWidth={1.8} />
                <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.6)', letterSpacing: -0.15 }}>
                  {post.shotMeta.gear}
                </Text>
              </>
            )}
          </View>
        )}
      </View>

      {/* 공유는 목록에서 빼고 게시글 상세에만 둔다 — 카드에서 바로 공유할 일이 드물다.
          포토제닉 점수도 서버에 없어 자리만 비워두던 것이라 함께 정리했다. */}
      <View className="flex-row items-center" style={{ paddingHorizontal: normalize(16), paddingTop: normalize(8), paddingBottom: normalize(14), gap: normalize(16) }}>
        {!!post.location && (
          <View className="flex-row items-center" style={{ gap: normalize(4), flex: 1, minWidth: 0 }}>
            <MapPin size={normalize(14)} color="rgba(0,0,0,0.45)" strokeWidth={1.8} />
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}
            >
              {post.location}
            </Text>
          </View>
        )}
        <View className="flex-row items-center" style={{ gap: normalize(4), marginLeft: 'auto' }}>
          <MessageSquare size={normalize(15)} color="rgba(0,0,0,0.55)" strokeWidth={1.8} />
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
            {post.commentCount}
          </Text>
        </View>
        <Pressable onPress={onToggleSave}>
          {post.isSaved ? (
            <SavedArchiveIcon size={normalize(15)} />
          ) : (
            <Archive size={normalize(15)} color="rgba(0,0,0,0.55)" strokeWidth={1.8} />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}
