import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bookmark, Camera, ChevronLeft, Clock, Heart, Maximize, MessageSquare, MoreHorizontal, Send, Share2, Sun, X } from 'lucide-react-native';
import CommentThread from '@/components/community/CommentThread';
import PostActionSheet from '@/components/community/PostActionSheet';
import PostReportSheet from '@/components/community/PostReportSheet';
import PhotoLightbox from '@/components/community/PhotoLightbox';
import ConfirmModal from '@/components/common/ConfirmModal';
import ShareSheet from '@/components/common/ShareSheet';
import Toast from '@/components/common/Toast';
import { useKeyboardOverlap } from '@/hooks/useKeyboardHeight';
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useDeletePost,
  usePost,
  useToggleBookmark,
  useToggleCommentLike,
  useToggleFollow,
  useToggleLike,
} from '@/hooks/useCommunity';
import { toErrorMessage } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { initialsOf } from '@/utils/communityMappers';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { Comment, ReportReasonId } from '@/types/community';
import { HEADER_HEIGHT, CONTENT_PADDING, FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeHeight } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

export default function PostDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList>>();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'PostDetail'>>();
  const postId = route.params?.postId;

  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
  const me = useAuthStore((s) => s.user);

  const { data: post, isLoading, isError, refetch } = usePost(postId);
  const { data: commentData, hasNextPage, fetchNextPage, isFetchingNextPage } = useComments(postId);
  const comments = commentData?.comments ?? [];

  // 목록에서 넘어온 isMyPost는 상세 응답이 오기 전 액션시트 분기용 초기값일 뿐,
  // 응답이 오면 서버가 내려준 작성자 정보(isMine)가 우선이다.
  const isMyPost = post?.isMine ?? route.params?.isMyPost ?? false;

  const toggleLikeM = useToggleLike();
  const toggleBookmarkM = useToggleBookmark();
  const toggleFollowM = useToggleFollow();
  const createComment = useCreateComment(postId ?? '');
  const deleteCommentM = useDeleteComment(postId ?? '');
  const deletePostM = useDeletePost();
  const toggleCommentLikeM = useToggleCommentLike(postId ?? '');

  const [commentText, setCommentText] = useState('');
  /** 답글 대상. null이면 최상위 댓글로 등록된다. */
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);

  // 라이트박스를 닫으면 EXIF도 함께 닫혀야 한다 — exifOpen은 독립 state로 두고
  // 렌더 조건을 lightboxOpen && exifOpen으로 걸어 "EXIF만 닫아도 라이트박스는 유지" 규칙을 자연히 만족시킨다.
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [exifOpen, setExifOpen] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  // 삭제 완료 토스트는 노출이 끝난 뒤에 goBack해야 하므로, 토스트가 사라질 때 실행할 후속 동작을 들고 있는다.
  const pendingAfterToastRef = useRef<(() => void) | null>(null);
  /** "답글 달기"를 누르면 입력창으로 포커스를 옮긴다 */
  const commentInputRef = useRef<TextInput>(null);

  function showToast(message: string, after?: () => void) {
    pendingAfterToastRef.current = after ?? null;
    setToastMessage(message);
    setToastVisible(true);
  }

  function handleToastHide() {
    setToastVisible(false);
    const after = pendingAfterToastRef.current;
    pendingAfterToastRef.current = null;
    after?.();
  }

  function handleCloseLightbox() {
    setLightboxOpen(false);
    setExifOpen(false);
  }

  /**
   * 라이트박스에서 작성자 프로필로 이동. Modal이 떠 있는 채로 push하면 새 화면이 Modal 아래에
   * 깔려 보이지 않으므로, 먼저 닫고 fade 애니메이션이 끝난 뒤에 이동한다
   * (액션시트에서 쓰는 openAfterActionSheet와 같은 이유).
   */
  function handlePressLightboxAuthor() {
    if (!post) return;
    const authorId = post.author.id;
    handleCloseLightbox();
    setTimeout(() => navigation.navigate('UserProfile', { userId: authorId }), 320);
  }

  /**
   * 액션시트(BottomSheet)도 RN Modal이라, 그 위에 확인 모달·신고 시트를 겹쳐 띄우면
   * iOS에서 두 번째가 표시되지 않는다 (PhotoLightbox가 EXIF를 별도 Modal로 안 뺀 것과 같은 제약).
   * 액션시트를 먼저 닫고 닫힘 애니메이션(300ms)이 끝난 뒤에 다음 시트를 연다.
   */
  function openAfterActionSheet(open: () => void) {
    setActionSheetOpen(false);
    setTimeout(open, 320);
  }

  function toggleLike() {
    if (!post) return;
    toggleLikeM.mutate({ postId: post.id, next: !post.isLiked });
  }
  function toggleBookmark() {
    if (!post) return;
    toggleBookmarkM.mutate({ postId: post.id, next: !post.isBookmarked });
  }
  function toggleFollow() {
    if (!post) return;
    toggleFollowM.mutate({ userId: post.author.id, next: !post.isFollowingAuthor });
  }

  function handleConfirmDelete() {
    if (!postId) return;
    setDeleteModalOpen(false);
    setActionSheetOpen(false);
    deletePostM.mutate(postId, {
      onSuccess: () => showToast('게시글이 삭제되었어요', () => navigation.goBack()),
      onError: (err) => showToast(toErrorMessage(err, '게시글을 삭제하지 못했어요')),
    });
  }

  // ponytail: 신고 API가 백엔드에 없다 — 사유를 받아 토스트만 띄우고 서버로 보내지 않는다.
  // 신고 엔드포인트가 생기면 이 함수 본문만 교체하면 된다.
  function handleSelectReportReason(_reasonId: ReportReasonId) {
    setReportSheetOpen(false);
    setActionSheetOpen(false);
    showToast('신고가 접수되었어요');
  }

  function handleSendComment() {
    const text = commentText.trim();
    if (!text || createComment.isPending) return;
    createComment.mutate(
      { content: text, parentId: replyTo?.id },
      {
        // 입력창은 성공했을 때만 비운다 — 실패했는데 지워지면 쓴 글이 사라진다.
        onSuccess: () => {
          setCommentText('');
          setReplyTo(null);
        },
        onError: (err) => showToast(toErrorMessage(err, '댓글을 등록하지 못했어요')),
      },
    );
  }

  function handleToggleCommentLike(comment: Comment) {
    toggleCommentLikeM.mutate(
      { commentId: comment.id, next: !comment.isLiked, likeCount: comment.likeCount ?? 0 },
      // 알리지 않으면 낙관적으로 채워진 하트가 소리 없이 되돌아간다(비로그인·네트워크 실패).
      { onError: (err) => showToast(toErrorMessage(err, '좋아요를 반영하지 못했어요')) },
    );
  }

  function handlePressReply(comment: Comment) {
    setReplyTo(comment);
    commentInputRef.current?.focus();
  }

  function handleDeleteComment(commentId: string) {
    deleteCommentM.mutate(commentId, {
      onError: (err) => showToast(toErrorMessage(err, '댓글을 삭제하지 못했어요')),
    });
  }

  // 목업의 "댓글 29개 더보기" — 전체 개수에서 이미 불러온 만큼을 뺀다.
  const remainingComments = Math.max((commentData?.totalElements ?? 0) - comments.length, 0);
  const canSendComment = commentText.trim().length > 0 && !createComment.isPending;
  const mainPhoto = post?.imageUrls?.[0];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View
          className="flex-row items-center"
          style={{ height: HEADER_HEIGHT, paddingHorizontal: normalize(20), gap: normalize(8), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            className="items-center justify-center"
            style={{ width: normalize(32), height: normalize(32) }}
            accessibilityLabel="뒤로가기"
          >
            <ChevronLeft size={normalize(24)} color="#000" strokeWidth={1.8} />
          </Pressable>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#000', letterSpacing: -0.4 }}>
            게시글
          </Text>
          <Pressable
            onPress={() => setActionSheetOpen(true)}
            hitSlop={8}
            className="items-center justify-center"
            style={{ width: normalize(32), height: normalize(32), marginLeft: 'auto' }}
            accessibilityLabel="더보기"
          >
            <MoreHorizontal size={normalize(24)} color="#000" strokeWidth={1.8} />
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1, paddingBottom: keyboardOverlap }}>
        {!post ? (
          <View className="items-center justify-center" style={{ flex: 1, gap: normalize(12) }}>
            {isLoading ? (
              <ActivityIndicator color={ACCENT} />
            ) : (
              <>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
                  {isError ? '게시글을 불러오지 못했어요' : '게시글을 찾을 수 없어요'}
                </Text>
                {isError && (
                  <Pressable onPress={() => refetch()} className="items-center justify-center" style={{ height: normalize(34), paddingHorizontal: normalize(16), borderRadius: normalize(17), backgroundColor: SURFACE }}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: 'rgba(0,0,0,0.6)', letterSpacing: -0.2 }}>
                      다시 시도
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        ) : (
          <>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: normalize(24) }}>
          {/* 히어로 사진 */}
          <Pressable onPress={() => setLightboxOpen(true)} style={{ height: normalizeHeight(320), backgroundColor: post.photoGradient[0], position: 'relative' }}>
            {!!mainPhoto && <Image source={{ uri: mainPhoto }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />}
            {/* 위치는 사진 위에 겹치지 않고 아래 작성자 줄에서 보여준다 */}
            <Pressable
              onPress={toggleLike}
              className="flex-row items-center absolute"
              style={{ right: normalize(14), bottom: normalize(14), gap: normalize(5), height: normalize(30), paddingHorizontal: normalize(12), borderRadius: normalize(15), backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              <Heart size={normalize(13)} color={post.isLiked ? '#ff453a' : '#fff'} fill={post.isLiked ? '#ff453a' : 'none'} strokeWidth={1.8} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', letterSpacing: -0.1 }}>
                {post.likeCount}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLightboxOpen(true)}
              className="items-center justify-center absolute"
              style={{ top: normalize(12), right: normalize(12), width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: 'rgba(0,0,0,0.35)' }}
              accessibilityLabel="확대"
            >
              <Maximize size={normalize(15)} color="#fff" strokeWidth={1.8} />
            </Pressable>
          </Pressable>

          {/* 본문 */}
          <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(16) }}>
            {/* 유저 행 */}
            <View className="flex-row items-center" style={{ gap: normalize(11), marginBottom: normalize(14) }}>
              {/* 닉네임뿐 아니라 아바타로도 프로필에 들어갈 수 있어야 한다 */}
              <Pressable
                onPress={() => navigation.navigate('UserProfile', { userId: post.author.id })}
                className="items-center justify-center overflow-hidden"
                style={{ width: normalize(38), height: normalize(38), borderRadius: normalize(19), backgroundColor: post.author.avatarGradient[0] }}
              >
                {post.author.profileImageUrl ? (
                  <Image source={{ uri: post.author.profileImageUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                ) : (
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1 }}>
                    {post.author.initials}
                  </Text>
                )}
              </Pressable>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Pressable onPress={() => navigation.navigate('UserProfile', { userId: post.author.id })}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
                    {post.author.handle}
                  </Text>
                </Pressable>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1, marginTop: normalize(1) }}>
                  {[post.createdAtLabel, post.location].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {!isMyPost && (
                <Pressable
                  onPress={toggleFollow}
                  className="items-center justify-center"
                  style={{
                    height: normalize(32),
                    paddingHorizontal: normalize(14),
                    borderRadius: normalize(16),
                    backgroundColor: post.isFollowingAuthor ? SURFACE : ACCENT,
                  }}
                >
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: post.isFollowingAuthor ? 'rgba(0,0,0,0.55)' : '#fff' }}>
                    {post.isFollowingAuthor ? '팔로잉' : '팔로우'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* 캡션 */}
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2, lineHeight: FONT_MD * 1.55, marginBottom: normalize(14) }}
            >
              {post.caption}
            </Text>

            {/* 촬영 정보 */}
            {/* 촬영 정보는 항목별 선택 입력이라, 있는 것만 그린다(PostCard와 같은 규칙) */}
            {post.shotMeta && (
              <View
                className="flex-row items-center"
                style={{ gap: normalize(8), paddingVertical: normalize(11), paddingHorizontal: normalize(14), backgroundColor: SURFACE, borderRadius: normalize(13), marginBottom: normalize(14) }}
              >
                {!!post.shotMeta.time && (
                  <>
                    <Clock size={normalize(13)} color="rgba(0,0,0,0.35)" strokeWidth={1.8} />
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.65)', letterSpacing: -0.15 }}>
                      {post.shotMeta.time}
                    </Text>
                  </>
                )}
                {!!post.shotMeta.weather && (
                  <>
                    {!!post.shotMeta.time && <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />}
                    <Sun size={normalize(15)} color="rgba(0,0,0,0.5)" strokeWidth={1.8} />
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.65)', letterSpacing: -0.15 }}>
                      {post.shotMeta.weather}
                    </Text>
                  </>
                )}
                {!!post.shotMeta.gear && (
                  <>
                    {(!!post.shotMeta.time || !!post.shotMeta.weather) && <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />}
                    <Camera size={normalize(13)} color="rgba(0,0,0,0.35)" strokeWidth={1.8} />
                    <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.65)', letterSpacing: -0.15 }}>
                      {post.shotMeta.gear}
                    </Text>
                  </>
                )}
              </View>
            )}

            {/* 액션 바 */}
            <View
              className="flex-row items-center"
              style={{ gap: normalize(16), paddingVertical: normalize(4), paddingBottom: normalize(16), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
            >
              {/* 포토제닉 점수 제거 — 게시글 단위 점수가 서버에 없다(스팟 단위만 존재).
                  백엔드가 생기면 목업(community-post.html)의 핑크 칩을 되살리면 된다. */}
              <View className="flex-row items-center" style={{ gap: normalize(4), marginLeft: 'auto' }}>
                <MessageSquare size={normalize(16)} color="rgba(0,0,0,0.6)" strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.6)' }}>
                  {post.commentCount}
                </Text>
              </View>
              {/* 저장 수는 목록 카드(PostCard)와 같은 규칙 — 탭이 먹었는지 숫자로 바로 보인다 */}
              <Pressable onPress={toggleBookmark} hitSlop={8} accessibilityLabel="저장" className="flex-row items-center" style={{ gap: normalize(4) }}>
                <Bookmark size={normalize(16)} color={post.isBookmarked ? ACCENT : 'rgba(0,0,0,0.6)'} fill={post.isBookmarked ? ACCENT : 'none'} strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: post.isBookmarked ? ACCENT : 'rgba(0,0,0,0.6)' }}>
                  {post.bookmarkCount}
                </Text>
              </Pressable>
              <Pressable onPress={() => setShareSheetVisible(true)} hitSlop={8} accessibilityLabel="공유">
                <Share2 size={normalize(16)} color="rgba(0,0,0,0.6)" strokeWidth={1.8} />
              </Pressable>
            </View>

            {/* 댓글 */}
            <View style={{ paddingTop: normalize(16) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.2, marginBottom: normalize(14) }}>
                댓글 {post.commentCount}
              </Text>

              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  postId={postId ?? ''}
                  comment={comment}
                  onToggleLike={handleToggleCommentLike}
                  onPressReply={handlePressReply}
                  onDelete={handleDeleteComment}
                />
              ))}

              {hasNextPage && (
                <Pressable onPress={() => fetchNextPage()} disabled={isFetchingNextPage} style={{ paddingBottom: normalize(24) }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.15 }}>
                    {isFetchingNextPage ? '불러오는 중...' : `댓글 ${remainingComments}개 더보기`}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>

        {/* 답글 대상 표시 — 지금 쓰는 글이 어디에 붙는지 보이지 않으면 최상위 댓글로 착각한다 */}
        {!!replyTo && (
          <View
            className="flex-row items-center"
            style={{
              gap: normalize(8),
              paddingHorizontal: CONTENT_PADDING,
              paddingVertical: normalize(8),
              backgroundColor: SURFACE,
            }}
          >
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.1 }}
            >
              {replyTo.author.handle}님에게 답글 다는 중
            </Text>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={8} accessibilityLabel="답글 취소">
              <X size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
            </Pressable>
          </View>
        )}

        {/* 댓글 입력 */}
        <View
          className="flex-row items-center"
          style={{
            gap: normalize(8),
            paddingHorizontal: CONTENT_PADDING,
            paddingTop: normalize(10),
            paddingBottom: keyboardOverlap > 0 ? normalize(10) : insets.bottom + normalize(10),
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(0,0,0,0.06)',
          }}
        >
          <View className="items-center justify-center overflow-hidden" style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: SURFACE }}>
            {me?.profileImageUrl ? (
              <Image source={{ uri: me.profileImageUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.35)' }}>
                {me ? initialsOf(me.nickname) : 'ME'}
              </Text>
            )}
          </View>
          <View style={{ flex: 1, height: normalize(40), backgroundColor: SURFACE, borderRadius: normalize(20), paddingHorizontal: normalize(16), justifyContent: 'center' }}>
            <TextInput
              ref={commentInputRef}
              value={commentText}
              onChangeText={setCommentText}
              placeholder={replyTo ? `${replyTo.author.handle}님에게 답글...` : '댓글 달기...'}
              placeholderTextColor="rgba(0,0,0,0.3)"
              onSubmitEditing={handleSendComment}
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#000', letterSpacing: -0.15 }}
            />
          </View>
          <Pressable
            onPress={handleSendComment}
            disabled={!canSendComment}
            className="items-center justify-center"
            style={{ width: normalize(38), height: normalize(38), borderRadius: normalize(19), backgroundColor: ACCENT, opacity: canSendComment ? 1 : 0.35 }}
            accessibilityLabel="전송"
          >
            <Send size={normalize(16)} color="#fff" strokeWidth={2} />
          </Pressable>
        </View>
          </>
        )}
      </View>

      <PostActionSheet
        visible={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        isMyPost={isMyPost}
        onShare={() => openAfterActionSheet(() => setShareSheetVisible(true))}
        // 작성 화면을 수정 모드로 재사용한다(항목이 동일). postId가 있으면 CommunityWriteScreen이 폼을 채운다.
        onEdit={() => openAfterActionSheet(() => navigation.navigate('CommunityWrite', { postId }))}
        onRequestDelete={() => openAfterActionSheet(() => setDeleteModalOpen(true))}
        onRequestReport={() => openAfterActionSheet(() => setReportSheetOpen(true))}
      />

      <ConfirmModal
        visible={deleteModalOpen}
        title="게시글을 삭제할까요?"
        body="삭제한 게시글은 복구할 수 없어요."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalOpen(false)}
      />

      <PostReportSheet
        visible={reportSheetOpen}
        onClose={() => setReportSheetOpen(false)}
        onSelectReason={handleSelectReportReason}
      />

      {post && (
        <PhotoLightbox
          visible={lightboxOpen}
          onClose={handleCloseLightbox}
          exifOpen={exifOpen}
          onOpenExif={() => setExifOpen(true)}
          onCloseExif={() => setExifOpen(false)}
          onPressAuthor={handlePressLightboxAuthor}
          post={post}
        />
      )}

      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        onShared={(message) => showToast(message)}
      />

      <Toast message={toastMessage} visible={toastVisible} onHide={handleToastHide} />
    </View>
  );
}
