import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { MapPin, Heart, MessageSquare, Bookmark, Clock, Camera, Sun, Moon, Cloud, MoreHorizontal } from 'lucide-react-native';
import Avatar from '@/components/common/Avatar';
import { Post, PostShotMeta } from '@/types/community';
import { FONT_XS, FONT_SM, FONT_MD } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD } from '@/constants/colors';

const ACCENT = BRAND;

const WEATHER_ICONS: Record<PostShotMeta['weatherIcon'], typeof Sun> = {
  'clear-day': Sun,
  'clear-night': Moon,
  cloudy: Cloud,
};

interface Props {
  post: Post;
  onPress: () => void;
  onToggleLike: () => void;
  onToggleBookmark: () => void;
  onToggleFollow: () => void;
  onPressUsername: () => void;
  /** 넘기면 작성자 행 오른쪽에 더보기(⋯)가 뜬다. 내 글 목록에서 수정·삭제를 열 때 쓴다. */
  onPressMore?: () => void;
}

export default function PostCard({ post, onPress, onToggleLike, onToggleBookmark, onToggleFollow, onPressUsername, onPressMore }: Props) {
  const mainPhoto = post.imageUrls?.[0];
  return (
    <Pressable onPress={onPress} className="rounded-[20px] overflow-hidden" style={{ backgroundColor: CARD, borderRadius: normalize(20) }}>
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
          <Pressable onPress={onPressUsername}>
            <Avatar userId={post.author.id} nickname={post.author.handle} imageUrl={post.author.profileImageUrl} size={32} />
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
          {/* 내 글에는 팔로우 버튼이 없어 그 자리가 비어 있다 — 더보기를 여기 둔다 */}
          {!!onPressMore && (
            <Pressable
              onPress={onPressMore}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="더보기"
              className="items-center justify-center"
              style={{ width: normalize(30), height: normalize(30) }}
            >
              <MoreHorizontal size={normalize(18)} color="rgba(0,0,0,0.45)" strokeWidth={2} />
            </Pressable>
          )}
          {/* 탈퇴 계정은 팔로우할 수 없다 — 서버가 요청을 거절하므로 버튼을 아예 두지 않는다 */}
          {!post.isMine && !post.author.isWithdrawn && (
            <Pressable
              onPress={onToggleFollow}
              style={{
                height: normalize(30),
                paddingHorizontal: normalize(12),
                borderRadius: normalize(15),
                backgroundColor: post.isFollowingAuthor ? CARD : BRAND_TINT,
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
        {/* 저장 수를 옆에 둬야 탭이 먹었는지 바로 보인다 — 아이콘 채움만으로는 변화가 작다.
            숫자는 낙관적 갱신(useReactionMutation)으로 즉시 ±1 되고 응답 값으로 정정된다. */}
        <Pressable
          onPress={onToggleBookmark}
          hitSlop={8}
          className="flex-row items-center"
          style={{ gap: normalize(4) }}
          accessibilityRole="button"
          accessibilityLabel="저장"
          accessibilityState={{ selected: !!post.isBookmarked }}
        >
          <Bookmark
            size={normalize(15)}
            color={post.isBookmarked ? ACCENT : 'rgba(0,0,0,0.55)'}
            fill={post.isBookmarked ? ACCENT : 'none'}
            strokeWidth={1.8}
          />
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: post.isBookmarked ? ACCENT : 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}
          >
            {post.bookmarkCount}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
