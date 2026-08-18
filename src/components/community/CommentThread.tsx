import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import CommentRow from '@/components/community/CommentRow';
import { useReplies } from '@/hooks/useCommunity';
import { Comment } from '@/types/community';
import { FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

interface Props {
  postId: string;
  comment: Comment;
  onToggleLike: (comment: Comment) => void;
  onPressReply: (comment: Comment) => void;
  onPressEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
}

/**
 * 최상위 댓글 + 펼쳤을 때의 답글 목록.
 *
 * 답글은 열기 전까지 요청하지 않는다(useReplies의 enabled). 댓글마다 미리 받아오면
 * 화면 진입 한 번에 요청이 댓글 수만큼 나간다.
 */
export default function CommentThread({ postId, comment, onToggleLike, onPressReply, onPressEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, isError } = useReplies(postId, comment.id, open);
  const replies = data?.replies ?? [];

  // 낙관적으로 답글을 단 직후에는 replyCount가 아직 0일 수 있어, 실제로 받아온 개수도 함께 본다.
  const replyCount = Math.max(comment.replyCount, replies.length);

  return (
    <View>
      <CommentRow
        comment={comment}
        onToggleLike={() => onToggleLike(comment)}
        onPressReply={() => onPressReply(comment)}
        onPressEdit={() => onPressEdit(comment)}
        onDelete={() => onDelete(comment.id)}
      />

      {replyCount > 0 && (
        <Pressable
          onPress={() => setOpen((prev) => !prev)}
          hitSlop={6}
          style={{ paddingLeft: normalize(38), marginTop: normalize(-6), marginBottom: normalize(14) }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1 }}>
            {open ? '답글 숨기기' : `답글 ${replyCount}개 보기`}
          </Text>
        </Pressable>
      )}

      {open && (
        <>
          {/* 실패를 알리지 않으면 펼친 자리가 빈 채로 남고 토글만 "답글 숨기기"로 바뀐다 */}
          {isError && !isLoading && (
            <Text
              allowFontScaling={false}
              style={{ paddingLeft: normalize(38), marginBottom: normalize(14), fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}
            >
              답글을 불러오지 못했어요
            </Text>
          )}
          {isLoading && (
            <Text
              allowFontScaling={false}
              style={{ paddingLeft: normalize(38), marginBottom: normalize(14), fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}
            >
              불러오는 중...
            </Text>
          )}
          {replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              isReply
              onToggleLike={() => onToggleLike(reply)}
              // 답글에 답글을 달아도 서버가 같은 부모로 붙이므로, 원 댓글을 대상으로 넘긴다.
              onPressReply={() => onPressReply(comment)}
              onPressEdit={() => onPressEdit(reply)}
              onDelete={() => onDelete(reply.id)}
            />
          ))}
          {hasNextPage && (
            <Pressable
              onPress={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              style={{ paddingLeft: normalize(38), marginBottom: normalize(14) }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1 }}>
                {isFetchingNextPage ? '불러오는 중...' : '답글 더보기'}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
