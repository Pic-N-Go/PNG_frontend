import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Comment } from '@/types/community';
import { FONT_2XS, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const SURFACE = '#f5f5f7';

interface Props {
  comment: Comment;
  /** 답글이면 왼쪽을 들여쓰고 아바타를 줄인다 */
  isReply?: boolean;
  onToggleLike: () => void;
  onPressReply?: () => void;
  onPressEdit: () => void;
  onDelete: () => void;
}

/**
 * 댓글 한 줄. 최상위 댓글과 답글이 아바타 크기·들여쓰기만 다르고 나머지는 같아
 * 한 컴포넌트로 쓴다(두 벌로 두면 한쪽만 고쳐지는 일이 생긴다).
 */
export default function CommentRow({ comment, isReply, onToggleLike, onPressReply, onPressEdit, onDelete }: Props) {
  const avatar = normalize(isReply ? 22 : 28);
  return (
    <View
      className="flex-row"
      style={{ gap: normalize(10), marginBottom: normalize(14), paddingLeft: isReply ? normalize(38) : 0 }}
    >
      <View
        className="items-center justify-center overflow-hidden"
        style={{ width: avatar, height: avatar, borderRadius: avatar / 2, backgroundColor: SURFACE, marginTop: normalize(1) }}
      >
        {comment.author.profileImageUrl ? (
          <Image source={{ uri: comment.author.profileImageUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.35)' }}>
            {comment.author.initials}
          </Text>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.15, lineHeight: FONT_SM * 1.5, color: '#000' }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold' }}>
            {comment.author.handle}
          </Text>
          {'  '}
          {comment.text}
        </Text>

        <View className="flex-row items-center" style={{ gap: normalize(10), marginTop: normalize(4) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.1 }}>
            {comment.createdAtLabel}
          </Text>
          {/* 0일 때는 숨긴다 — "좋아요 0"은 정보가 아니라 잡음이다 */}
          {!!comment.likeCount && (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.1 }}>
              좋아요 {comment.likeCount}
            </Text>
          )}
          {!!onPressReply && (
            <Pressable hitSlop={8} onPress={onPressReply}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.1 }}>
                답글 달기
              </Text>
            </Pressable>
          )}
          {comment.isMine && (
            <Pressable hitSlop={8} onPress={onPressEdit}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.1 }}>
                수정
              </Text>
            </Pressable>
          )}
          {comment.isMine && (
            <Pressable hitSlop={8} onPress={onDelete}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.1 }}>
                삭제
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable hitSlop={8} onPress={onToggleLike} style={{ padding: normalize(4) }} accessibilityLabel="좋아요">
        <Heart
          size={normalize(14)}
          color={comment.isLiked ? '#ff453a' : 'rgba(0,0,0,0.3)'}
          fill={comment.isLiked ? '#ff453a' : 'none'}
          strokeWidth={1.8}
        />
      </Pressable>
    </View>
  );
}
