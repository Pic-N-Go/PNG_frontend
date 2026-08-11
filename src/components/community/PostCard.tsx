import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { MapPin, Heart, MessageSquare, Archive, Share, Clock, Camera, Sun, Moon, Cloud } from 'lucide-react-native';
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
  return (
    <Pressable onPress={onPress} className="rounded-[20px] overflow-hidden" style={{ backgroundColor: '#f5f5f7', borderRadius: normalize(20) }}>
      <View style={{ height: normalize(230), position: 'relative' }}>
        <View
          style={{
            flex: 1,
            backgroundColor: post.photoGradient[0],
          }}
        />
        <View className="flex-row items-center absolute" style={{ left: normalize(12), bottom: normalize(12), gap: normalize(4), height: normalize(28), paddingHorizontal: normalize(11), borderRadius: normalize(14), backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <MapPin size={normalize(11)} color="#fff" strokeWidth={2} />
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_XS, color: '#fff', letterSpacing: -0.1 }}>
            {post.location}
          </Text>
        </View>
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
          <View
            className="items-center justify-center"
            style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: post.author.avatarGradient[0] }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1 }}>
              {post.author.initials}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Pressable onPress={onPressUsername}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
                {post.author.handle}
              </Text>
            </Pressable>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.1, marginTop: normalize(1) }}>
              {post.createdAtLabel} · {post.location}
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

        {post.shotMeta && (
          <View className="flex-row items-center" style={{ gap: normalize(6), paddingVertical: normalize(10), paddingHorizontal: normalize(12), backgroundColor: '#fff', borderRadius: normalize(12), marginBottom: normalize(12) }}>
            <Clock size={normalize(13)} color="rgba(0,0,0,0.3)" strokeWidth={1.8} />
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.6)', letterSpacing: -0.15 }}>
              {post.shotMeta.time}
            </Text>
            <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />
            {(() => {
              const WeatherIcon = WEATHER_ICONS[post.shotMeta.weatherIcon] ?? Cloud;
              return <WeatherIcon size={normalize(13)} color="rgba(0,0,0,0.3)" strokeWidth={1.8} />;
            })()}
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.6)', letterSpacing: -0.15 }}>
              {post.shotMeta.weather}
            </Text>
            <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />
            <Camera size={normalize(13)} color="rgba(0,0,0,0.3)" strokeWidth={1.8} />
            <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.6)', letterSpacing: -0.15 }}>
              {post.shotMeta.gear}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center" style={{ paddingHorizontal: normalize(16), paddingTop: normalize(8), paddingBottom: normalize(14), gap: normalize(16) }}>
        {post.photogenicScore != null && (
          <View className="flex-row items-center" style={{ gap: normalize(4), height: normalize(26), paddingHorizontal: normalize(10), borderRadius: normalize(13), backgroundColor: 'rgba(227,27,89,0.08)' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.5)', letterSpacing: 0.5 }}>
              포토제닉
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: ACCENT, letterSpacing: -0.2 }}>
              {post.photogenicScore}
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
        <Share size={normalize(15)} color="rgba(0,0,0,0.55)" strokeWidth={1.8} />
      </View>
    </Pressable>
  );
}
