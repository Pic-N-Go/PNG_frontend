import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import Avatar from '@/components/common/Avatar';
import { Comment } from '@/types/community';
import { FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

/** 액션들이 gap 10으로 붙어 있어 가로는 좁게, 세로는 넉넉히 준다. */
const ACTION_HIT_SLOP = { top: 8, bottom: 8, left: 4, right: 4 };

interface Props {
  comment: Comment;
  /** 답글이면 왼쪽을 들여쓰고 아바타를 줄인다 */
  isReply?: boolean;
  onToggleLike: () => void;
  onPressReply?: () => void;
  /** 작성자 아바타·닉네임 탭. author.id가 없는 댓글에서는 넘기지 않는다. */
  onPressAuthor?: () => void;
  onPressEdit: () => void;
  onDelete: () => void;
}

/**
 * 댓글 한 줄. 최상위 댓글과 답글이 아바타 크기·들여쓰기만 다르고 나머지는 같아
 * 한 컴포넌트로 쓴다(두 벌로 두면 한쪽만 고쳐지는 일이 생긴다).
 */
export default function CommentRow({ comment, isReply, onToggleLike, onPressReply, onPressAuthor, onPressEdit, onDelete }: Props) {
  const avatarSize = isReply ? 22 : 28;
  return (
    <View
      className="flex-row"
      style={{ gap: normalize(10), marginBottom: normalize(14), paddingLeft: isReply ? normalize(38) : 0 }}
    >
      {/* 아바타도 닉네임도 프로필로 들어가야 한다 — 게시글 작성자·라이트박스와 같은 규칙 */}
      <Pressable
        onPress={onPressAuthor}
        disabled={!onPressAuthor}
        accessibilityRole={onPressAuthor ? 'button' : undefined}
        accessibilityLabel={onPressAuthor ? `${comment.author.handle} 프로필 보기` : undefined}
        style={{ marginTop: normalize(1) }}
      >
        <Avatar
          userId={comment.author.id}
          nickname={comment.author.handle}
          imageUrl={comment.author.profileImageUrl}
          size={avatarSize}
        />
      </Pressable>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.15, lineHeight: FONT_SM * 1.5, color: '#000' }}>
          {/* 닉네임만 눌러야 하므로 본문과 같은 Text 안에서 onPress를 준다 */}
          <Text allowFontScaling={false} onPress={onPressAuthor} style={{ fontFamily: 'Pretendard-SemiBold' }}>
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
            <Pressable hitSlop={ACTION_HIT_SLOP} onPress={onPressReply}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.1 }}>
                답글 달기
              </Text>
            </Pressable>
          )}
          {/* 가로 hitSlop을 gap(10)의 절반 미만으로 둔다. 8이면 수정·삭제 영역이 6px 겹쳐
              나중에 그려진 삭제가 이기고, 댓글 삭제는 되돌릴 수 없다. */}
          {comment.isMine && (
            <Pressable hitSlop={ACTION_HIT_SLOP} onPress={onPressEdit}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.1 }}>
                수정
              </Text>
            </Pressable>
          )}
          {comment.isMine && (
            <Pressable hitSlop={ACTION_HIT_SLOP} onPress={onDelete}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.1 }}>
                삭제
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        hitSlop={8}
        onPress={onToggleLike}
        style={{ padding: normalize(4) }}
        accessibilityRole="button"
        accessibilityLabel="좋아요"
        accessibilityState={{ selected: !!comment.isLiked }}
      >
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
