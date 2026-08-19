import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bookmark, Camera, ChevronLeft, Clock, Heart, MessageSquare, MoreHorizontal, Send, Share as ShareIcon, Sun, X } from 'lucide-react-native';
import CommentThread from '@/components/community/CommentThread';
import PostActionSheet from '@/components/community/PostActionSheet';
import PostReportSheet from '@/components/community/PostReportSheet';
import PhotoLightbox from '@/components/community/PhotoLightbox';
import ConfirmModal from '@/components/common/ConfirmModal';
import Toast from '@/components/common/Toast';
import { useKeyboardOverlap } from '@/hooks/useKeyboardHeight';
import { shareContent } from '@/utils/share';
import {
  useComments,
  useCreateComment,
  useDeleteComment,
  useDeletePost,
  usePost,
  useToggleBookmark,
  useToggleCommentLike,
  useUpdateComment,
  useToggleFollow,
  useToggleLike,
} from '@/hooks/useCommunity';
import { toErrorMessage } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import Avatar from '@/components/common/Avatar';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { Comment, ReportReasonId } from '@/types/community';
import { HEADER_HEIGHT, CONTENT_PADDING, FONT_LG, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
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
  const updateCommentM = useUpdateComment(postId ?? '');
  const deleteCommentM = useDeleteComment(postId ?? '');
  const deletePostM = useDeletePost();
  const toggleCommentLikeM = useToggleCommentLike(postId ?? '');

  const [commentText, setCommentText] = useState('');
  /** 답글 대상. null이면 최상위 댓글로 등록된다. */
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  /** 수정 중인 댓글. 답글 달기와 동시에 켜지지 않는다(입력창이 하나뿐이다). */
  const [editing, setEditing] = useState<Comment | null>(null);

  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportSheetOpen, setReportSheetOpen] = useState(false);
  /** 삭제 확인 중인 댓글 id. 게시글 삭제와 같이 한 번 확인받는다(되돌릴 수 없다). */
  const [commentPendingDelete, setCommentPendingDelete] = useState<string | null>(null);

  // 라이트박스를 닫으면 EXIF도 함께 닫혀야 한다 — exifOpen은 독립 state로 두고
  // 렌더 조건을 lightboxOpen && exifOpen으로 걸어 "EXIF만 닫아도 라이트박스는 유지" 규칙을 자연히 만족시킨다.
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [exifOpen, setExifOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  // 삭제 완료 토스트는 노출이 끝난 뒤에 goBack해야 하므로, 토스트가 사라질 때 실행할 후속 동작을 들고 있는다.
  const pendingAfterToastRef = useRef<(() => void) | null>(null);
  /** "답글 달기"를 누르면 입력창으로 포커스를 옮긴다 */
  const commentInputRef = useRef<TextInput>(null);
  /** 시트 닫힘 애니메이션을 기다리는 타이머. 언마운트 시 정리하지 않으면 사라진 화면에서 실행된다. */
  const deferredRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (deferredRef.current) clearTimeout(deferredRef.current);
    },
    [],
  );

  /** 시트·모달이 닫히는 300ms 동안 기다렸다가 실행한다(겹쳐 띄우면 iOS에서 두 번째가 안 뜬다). */
  function runAfterSheetClose(fn: () => void) {
    if (deferredRef.current) clearTimeout(deferredRef.current);
    deferredRef.current = setTimeout(fn, 320);
  }

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
    runAfterSheetClose(() => navigation.navigate('UserProfile', { userId: authorId }));
  }

  /**
   * 액션시트(BottomSheet)도 RN Modal이라, 그 위에 확인 모달·신고 시트를 겹쳐 띄우면
   * iOS에서 두 번째가 표시되지 않는다 (PhotoLightbox가 EXIF를 별도 Modal로 안 뺀 것과 같은 제약).
   * 액션시트를 먼저 닫고 닫힘 애니메이션(300ms)이 끝난 뒤에 다음 시트를 연다.
   */
  function openAfterActionSheet(open: () => void) {
    setActionSheetOpen(false);
    runAfterSheetClose(open);
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

  function resetComposer() {
    setCommentText('');
    setReplyTo(null);
    setEditing(null);
  }

  function handleSendComment() {
    const text = commentText.trim();
    if (!text || createComment.isPending || updateCommentM.isPending) return;

    if (editing) {
      updateCommentM.mutate(
        { commentId: editing.id, content: text },
        {
          onSuccess: resetComposer,
          onError: (err) => showToast(toErrorMessage(err, '댓글을 수정하지 못했어요')),
        },
      );
      return;
    }

    createComment.mutate(
      { content: text, parentId: replyTo?.id },
      {
        // 입력창은 성공했을 때만 비운다 — 실패했는데 지워지면 쓴 글이 사라진다.
        onSuccess: resetComposer,
        onError: (err) => showToast(toErrorMessage(err, '댓글을 등록하지 못했어요')),
      },
    );
  }

  function handlePressEdit(comment: Comment) {
    setReplyTo(null);
    setEditing(comment);
    setCommentText(comment.text);
    commentInputRef.current?.focus();
  }

  function handleToggleCommentLike(comment: Comment) {
    toggleCommentLikeM.mutate(
      { commentId: comment.id, next: !comment.isLiked, likeCount: comment.likeCount ?? 0 },
      // 알리지 않으면 낙관적으로 채워진 하트가 소리 없이 되돌아간다(비로그인·네트워크 실패).
      { onError: (err) => showToast(toErrorMessage(err, '좋아요를 반영하지 못했어요')) },
    );
  }

  /**
   * 답글/수정 모드를 끄되 쓰던 내용은 지키다. 수정 모드에서 빠져나올 때만 지운다 —
   * 입력창에 남아 있는 게 "고치던 남의 문장"이라 새 댓글로 이어 쓰면 안 되기 때문이다.
   */
  function clearComposerMode() {
    if (editing) setCommentText('');
    setEditing(null);
    setReplyTo(null);
  }

  function handlePressReply(comment: Comment) {
    if (editing) setCommentText('');
    setEditing(null);
    setReplyTo(comment);
    commentInputRef.current?.focus();
  }

  // 댓글 작성자 프로필. author.id는 mapComment가 채우지만 옵셔널 타입이라 없으면 아무 것도 하지 않는다.
  function handlePressCommentAuthor(comment: Comment) {
    if (!comment.author.id) return;
    navigation.navigate('UserProfile', { userId: comment.author.id });
  }

  // 공유할 웹 URL이 없어 텍스트만 보낸다. 게시글 웹 페이지·딥링크가 생기면 url을 함께 넘긴다.
  async function handleShare() {
    if (!post) return;
    const lines = [post.caption, post.location].filter(Boolean);
    const ok = await shareContent({
      title: `${post.author.handle}님의 사진`,
      message: lines.join('\n'),
    });
    // 성공 토스트는 띄우지 않는다 — Android는 취소해도 성공으로 오므로 거짓이 된다.
    if (!ok) showToast('공유 화면을 열지 못했어요');
  }

  function handleConfirmDeleteComment() {
    const commentId = commentPendingDelete;
    setCommentPendingDelete(null);
    if (!commentId) return;
    // 대상이 사라지면 배너와 입력 내용이 남아 사라진 id로 PATCH를 보내게 된다.
    if (editing?.id === commentId || replyTo?.id === commentId) resetComposer();
    deleteCommentM.mutate(commentId, {
      onError: (err) => showToast(toErrorMessage(err, '댓글을 삭제하지 못했어요')),
    });
  }

  // 목업의 "댓글 29개 더보기" — 전체 개수에서 이미 불러온 만큼을 뺀다.
  const remainingComments = Math.max((commentData?.totalElements ?? 0) - comments.length, 0);
  const canSendComment =
    commentText.trim().length > 0 && !createComment.isPending && !updateCommentM.isPending;
  /**
   * 히어로에 보여줄 사진. 갤러리에서 특정 사진을 눌러 들어왔으면 그 사진부터 보여준다 —
   * 폭포를 눌렀는데 글의 첫 사진이 뜨면 다른 글에 들어온 것처럼 읽힌다.
   * 목록이 아직 안 왔거나 사진이 지워졌을 수 있어 범위를 다시 맞춘다.
   */
  const photoCount = post?.imageUrls?.length ?? 0;
  const heroPhotoIndex = Math.min(Math.max(route.params?.photoIndex ?? 0, 0), Math.max(photoCount - 1, 0));
  const mainPhoto = post?.imageUrls?.[heroPhotoIndex];

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
            {/* 사진이 여러 장이면 몇 번째인지 알린다. 점이 아니라 숫자를 쓰는 이유는 이 히어로가
                좌우로 넘어가지 않기 때문이다 — 점은 넘길 수 있다는 약속으로 읽힌다.
                넘기기는 탭해서 여는 라이트박스가 맡고, 거기에는 점이 있다. */}
            {photoCount > 1 && (
              <View
                className="items-center justify-center absolute"
                style={{ top: normalize(14), right: normalize(14), height: normalize(24), paddingHorizontal: normalize(10), borderRadius: normalize(12), backgroundColor: 'rgba(0,0,0,0.4)' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', letterSpacing: -0.1 }}>
                  {heroPhotoIndex + 1}/{photoCount}
                </Text>
              </View>
            )}
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
          </Pressable>

          {/* 본문 */}
          <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(16) }}>
            {/* 유저 행 */}
            <View className="flex-row items-center" style={{ gap: normalize(11), marginBottom: normalize(14) }}>
              {/* 닉네임뿐 아니라 아바타로도 프로필에 들어갈 수 있어야 한다 */}
              <Pressable onPress={() => navigation.navigate('UserProfile', { userId: post.author.id })}>
                <Avatar userId={post.author.id} nickname={post.author.handle} imageUrl={post.author.profileImageUrl} size={38} />
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
              {/* 탈퇴 계정은 팔로우할 수 없다 — 서버가 요청을 거절하므로 버튼을 아예 두지 않는다 */}
              {!isMyPost && !post.author.isWithdrawn && (
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
              <Pressable onPress={handleShare} hitSlop={8} accessibilityLabel="공유">
                <ShareIcon size={normalize(16)} color="rgba(0,0,0,0.6)" strokeWidth={1.8} />
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
                  onPressAuthor={handlePressCommentAuthor}
                  onPressEdit={handlePressEdit}
                  onDelete={setCommentPendingDelete}
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

        {/* 입력창이 하나뿐이라, 지금 쓰는 글이 새 댓글인지 답글인지 수정인지 보여준다 */}
        {(!!replyTo || !!editing) && (
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
              {editing ? '댓글 수정 중' : `${replyTo!.author.handle}님에게 답글 다는 중`}
            </Text>
            <Pressable onPress={clearComposerMode} hitSlop={8} accessibilityLabel={editing ? '수정 취소' : '답글 취소'}>
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
          <Avatar userId={me?.id} nickname={me?.nickname} imageUrl={me?.profileImageUrl} size={32} />
          <View style={{ flex: 1, height: normalize(40), backgroundColor: SURFACE, borderRadius: normalize(20), paddingHorizontal: normalize(16), justifyContent: 'center' }}>
            <TextInput
              ref={commentInputRef}
              value={commentText}
              onChangeText={setCommentText}
              placeholder={
                editing ? '댓글 수정...' : replyTo ? `${replyTo.author.handle}님에게 답글...` : '댓글 달기...'
              }
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
        onShare={() => openAfterActionSheet(handleShare)}
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

      <ConfirmModal
        visible={!!commentPendingDelete}
        title="댓글을 삭제할까요?"
        body="삭제한 댓글은 복구할 수 없어요. 답글이 있으면 함께 삭제됩니다."
        confirmLabel="삭제"
        cancelLabel="취소"
        onConfirm={handleConfirmDeleteComment}
        onCancel={() => setCommentPendingDelete(null)}
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
          initialIndex={heroPhotoIndex}
          exifOpen={exifOpen}
          onOpenExif={() => setExifOpen(true)}
          onCloseExif={() => setExifOpen(false)}
          onPressAuthor={handlePressLightboxAuthor}
          post={post}
        />
      )}


      <Toast message={toastMessage} visible={toastVisible} onHide={handleToastHide} />
    </View>
  );
}
