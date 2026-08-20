import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconChevronLeft } from '@tabler/icons-react-native';
import PostCard from '@/components/community/PostCard';
import PostActionSheet from '@/components/community/PostActionSheet';
import ConfirmModal from '@/components/common/ConfirmModal';
import Toast from '@/components/common/Toast';
import { toErrorMessage } from '@/api/auth';
import { useCommunityFeed, useDeletePost, useToggleBookmark, useToggleFollow, useToggleLike } from '@/hooks/useCommunity';
import { shareContent } from '@/utils/share';
import { CONTENT_PADDING, FONT_LG, FONT_SM, GRID_PADDING, HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import type { Post } from '@/types/community';
import { BRAND, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

const ACCENT = BRAND;

/**
 * 마이페이지 '글' 타일에서 들어오는 내가 쓴 글 목록.
 *
 * 커뮤니티 피드의 `sort=MY_POSTS`와 같은 쿼리를 쓴다 — 캐시를 공유하므로 두 화면을
 * 오가도 재요청이 없고, 카드 렌더도 PostCard를 그대로 쓴다.
 */
export default function MyPostsScreen() {
  const navigation = useNavigation<any>();

  const { data, isLoading, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    useCommunityFeed('MY_POSTS');
  /**
   * 날짜별 묶음. 서버가 작성 시각 내림차순으로 주므로 연속된 같은 날짜를 이어 담기만 하면 된다
   * (다시 정렬하면 페이지를 넘길 때 순서가 흔들린다 — 피드 정렬과 같은 이유).
   *
   * data.posts를 직접 의존성으로 쓴다 — `?? []`를 거치면 매 렌더 새 배열이 되어 useMemo가 무의미해진다.
   */
  const groups = React.useMemo(() => {
    const result: { date: string; posts: Post[] }[] = [];
    for (const post of data?.posts ?? []) {
      const last = result[result.length - 1];
      if (last && last.date === post.createdAtDate) last.posts.push(post);
      else result.push({ date: post.createdAtDate, posts: [post] });
    }
    return result;
  }, [data?.posts]);

  const isEmpty = groups.length === 0;

  const toggleLike = useToggleLike();
  const toggleBookmark = useToggleBookmark();
  const toggleFollow = useToggleFollow();
  const deletePost = useDeletePost();

  /** 더보기를 누른 글. 액션시트·삭제 확인이 이 값을 대상으로 동작한다. */
  const [target, setTarget] = React.useState<Post | null>(null);
  const [deleteAsking, setDeleteAsking] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const [toastVisible, setToastVisible] = React.useState(false);

  const showToast = (message: string) => {
    setToast(message);
    setToastVisible(true);
  };

  // 커뮤니티 스택은 MyPageStack의 형제라 상위 네비게이터로 전파된다(CommunityFeedScreen과 같은 방식).
  const goToPost = (postId: string, isMine: boolean) =>
    navigation.navigate('CommunityDetailStack', { screen: 'PostDetail', params: { postId, isMyPost: isMine } });

  const handleEdit = () => {
    const postId = target?.id;
    setTarget(null);
    if (postId) navigation.navigate('CommunityDetailStack', { screen: 'CommunityWrite', params: { postId } });
  };

  const handleShare = async () => {
    const post = target;
    setTarget(null);
    if (!post) return;
    const ok = await shareContent({
      title: `${post.author.handle}님의 사진`,
      message: [post.caption, post.location].filter(Boolean).join('\n'),
    });
    if (!ok) showToast('공유 화면을 열지 못했어요');
  };

  const handleConfirmDelete = () => {
    const postId = target?.id;
    setDeleteAsking(false);
    setTarget(null);
    if (!postId) return;
    // 목록 무효화는 useDeletePost가 한다 — 지운 글이 화면에서 바로 사라진다.
    deletePost.mutate(postId, {
      onSuccess: () => showToast('게시글이 삭제되었어요'),
      onError: (err) => showToast(toErrorMessage(err, '게시글을 삭제하지 못했어요')),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <View
        className="flex-row items-center"
        style={{ height: normalize(54), paddingHorizontal: normalize(12), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          className="items-center justify-center"
          style={{ width: normalize(40), height: normalize(40) }}
        >
          <IconChevronLeft size={normalize(24)} color="#111111" strokeWidth={2} />
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG, marginRight: normalize(40) }}>
          내가 쓴 글
        </Text>
      </View>

      {isLoading ? (
        <View className="items-center justify-center" style={{ flex: 1 }}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : isError ? (
        <View className="items-center justify-center" style={{ flex: 1, gap: normalize(12) }}>
          <Text style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: TEXT_SUB }}>
            글을 불러오지 못했어요
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="items-center justify-center"
            style={{ height: normalize(34), paddingHorizontal: normalize(16), borderRadius: normalize(17), backgroundColor: CARD }}
          >
            <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#000' }}>다시 시도</Text>
          </Pressable>
        </View>
      ) : isEmpty ? (
        <View className="items-center justify-center" style={{ flex: 1, paddingHorizontal: CONTENT_PADDING }}>
          <Text
            className="text-center"
            style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: TEXT_SUB, lineHeight: FONT_SM * 1.6 }}
          >
            아직 쓴 글이 없어요.{'\n'}커뮤니티에서 첫 글을 남겨보세요
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: normalize(20), paddingHorizontal: GRID_PADDING }}>
          {groups.map((group, index) => (
            <View key={group.date}>
              {/* 날짜가 바뀌는 지점만 구분선으로 끊는다. 첫 묶음 위에는 두지 않는다(헤더 바로 위가 화면 끝) */}
              {index > 0 && (
                <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginTop: normalize(24), marginBottom: normalize(4) }} />
              )}
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: FONT_SM,
                  color: 'rgba(0,0,0,0.45)',
                  letterSpacing: -0.2,
                  paddingTop: normalize(20),
                  paddingBottom: normalize(12),
                }}
              >
                {group.date}
              </Text>
              <View style={{ gap: normalize(20) }}>
                {group.posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onPress={() => goToPost(post.id, post.isMine)}
                    onToggleLike={() => toggleLike.mutate({ postId: post.id, next: !post.isLiked })}
                    onToggleBookmark={() => toggleBookmark.mutate({ postId: post.id, next: !post.isBookmarked })}
                    onToggleFollow={() => toggleFollow.mutate({ userId: post.author.id, next: !post.isFollowingAuthor })}
                    // 내 글만 있는 화면이라 작성자는 항상 나다 — 내 프로필로 보낼 이유가 없어 상세로 보낸다.
                    onPressUsername={() => goToPost(post.id, post.isMine)}
                    // 상세로 들어가지 않고 목록에서 바로 수정·삭제할 수 있게 한다
                    onPressMore={() => setTarget(post)}
                  />
                ))}
              </View>
            </View>
          ))}
          {/* 화면이 단일 ScrollView라 무한스크롤 대신 명시적 더보기를 둔다(프로필 게시글 탭과 같은 방식) */}
          {hasNextPage && (
            <Pressable onPress={() => fetchNextPage()} disabled={isFetchingNextPage} style={{ paddingTop: normalize(20) }}>
              <Text
                className="text-center"
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: TEXT_SUB }}
              >
                {isFetchingNextPage ? '불러오는 중...' : '더보기'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* 액션시트는 열어둔 채 확인 모달을 겹친다 — 취소하면 액션시트로 돌아온다(게시글 상세와 같은 방식) */}
      <PostActionSheet
        visible={!!target && !deleteAsking}
        onClose={() => setTarget(null)}
        isMyPost
        onShare={handleShare}
        onEdit={handleEdit}
        onRequestDelete={() => setDeleteAsking(true)}
        // 내 글이므로 신고 항목은 렌더되지 않는다(isMyPost가 true라 시트가 감춘다)
        onRequestReport={() => undefined}
      />

      <ConfirmModal
        visible={deleteAsking}
        title="게시글을 삭제할까요?"
        body="삭제한 게시글은 복구할 수 없어요."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteAsking(false)}
      />

      <Toast message={toast} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}
