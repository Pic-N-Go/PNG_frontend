import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Archive, Camera, ChevronLeft, Clock, Heart, MapPin, Maximize, MessageSquare, MoreHorizontal, Send, Share2, Sun } from 'lucide-react-native';
import PostActionSheet from '@/components/community/PostActionSheet';
import PostReportSheet from '@/components/community/PostReportSheet';
import PhotoLightbox from '@/components/community/PhotoLightbox';
import ConfirmModal from '@/components/common/ConfirmModal';
import ShareSheet from '@/components/common/ShareSheet';
import Toast from '@/components/auth/Toast';
import { useKeyboardOverlap } from '@/hooks/useKeyboardHeight';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import { Comment, PostDetail, ReportReasonId } from '@/types/community';
import { FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

// TODO(API): 게시글 상세 API 연동 시 route.params의 postId 기준으로 조회하도록 교체.
// 지금은 커뮤니티 피드 목업(post id '1' · sunset_jk)과 동일한 내용으로 목데이터를 구성.
const MOCK_POST_DETAIL: PostDetail = {
  id: '1',
  author: { id: 'u1', handle: 'sunset_jk', initials: 'JK', avatarGradient: ['#2c5364', '#4a7c8a'] },
  isMine: false,
  photoGradient: ['#0f2027', '#203a43', '#4a7c8a'],
  caption:
    '새벽 5시에 일어난 보람이 있는 일출. 광안대교 위로 해가 떠오르는 순간을 기다렸어요. 바람이 잔잔해서 물 반영도 깨끗하게 담겼습니다.',
  location: '광안리 해수욕장',
  createdAtLabel: '2시간 전',
  likeCount: 248,
  isLiked: true,
  commentCount: 32,
  shareCount: 0,
  isSaved: false,
  isFollowingAuthor: false,
  photogenicScore: 87,
  shotMeta: { time: '05:30', weather: '맑음', weatherIcon: 'clear-day', gear: 'Sony A7IV · 24mm f/2.8' },
  exif: {
    shotAtLabel: '05:30 촬영',
    camera: 'Sony ILCE-7M4',
    lens: 'Sony FE 24-70mm F2.8 GM',
    iso: 100,
    aperture: 'f/2.8',
    shutter: '1/500',
    focalLength: '24',
    exposureMode: '수동',
    metering: '다분할측광',
    whiteBalance: '자동',
    flash: '사용 안 함',
    focalLength35mm: '24mm',
    software: 'Adobe Lightroom Classic 12.3',
    gpsLat: 35.153386,
    gpsLng: 129.118785,
    filename: 'DSC03421.JPG',
    fileSize: '8.4 MB · 7008×4672',
    format: 'JPEG · sRGB',
    modifiedAtLabel: '2026.05.10 05:31',
  },
};

const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', author: { handle: 'sora.lens', initials: 'SR' }, text: '골든아워 타이밍 딱 맞춘 거 대박이에요', createdAtLabel: '2시간 전', likeCount: 8, isLiked: false },
  { id: 'c2', author: { handle: 'jwphoto', initials: 'JW' }, text: '어떤 필터 쓰셨어요? 색감이 진짜 예쁘네요', createdAtLabel: '1시간 전', likeCount: 4, isLiked: false },
  { id: 'c3', author: { handle: 'hana__film', initials: 'HN' }, text: '저도 지난주에 갔는데 이렇게 못 찍었어요. 렌즈 뭐 쓰세요?', createdAtLabel: '45분 전', likeCount: 2, isLiked: false },
];

export default function PostDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList>>();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'PostDetail'>>();
  const isMyPost = route.params?.isMyPost ?? false;

  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();

  const [post, setPost] = useState<PostDetail>(MOCK_POST_DETAIL);
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [commentText, setCommentText] = useState('');

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

  function toggleLike() {
    setPost((prev) => ({ ...prev, isLiked: !prev.isLiked, likeCount: prev.likeCount + (prev.isLiked ? -1 : 1) }));
  }
  function toggleSave() {
    setPost((prev) => ({ ...prev, isSaved: !prev.isSaved }));
  }
  function toggleFollow() {
    setPost((prev) => ({ ...prev, isFollowingAuthor: !prev.isFollowingAuthor }));
  }
  function toggleCommentLike(commentId: string) {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, isLiked: !c.isLiked, likeCount: c.likeCount + (c.isLiked ? -1 : 1) } : c)),
    );
  }

  function handleConfirmDelete() {
    setDeleteModalOpen(false);
    setActionSheetOpen(false);
    showToast('게시글이 삭제되었어요', () => navigation.goBack());
  }

  function handleSelectReportReason(_reasonId: ReportReasonId) {
    setReportSheetOpen(false);
    setActionSheetOpen(false);
    showToast('신고가 접수되었어요');
  }

  function handleSendComment() {
    const text = commentText.trim();
    if (!text) return;
    const newComment: Comment = {
      id: `me-${comments.length}-${Date.now()}`,
      author: { handle: 'my_username', initials: 'ME' },
      text,
      createdAtLabel: '방금',
      likeCount: 0,
      isLiked: false,
    };
    setComments((prev) => [newComment, ...prev]);
    setPost((prev) => ({ ...prev, commentCount: prev.commentCount + 1 }));
    setCommentText('');
  }

  const moreCommentsCount = Math.max(post.commentCount - comments.length, 0);
  const canSendComment = commentText.trim().length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View
          className="flex-row items-center"
          style={{ height: normalize(52), paddingHorizontal: normalize(20), gap: normalize(8), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: normalize(24) }}>
          {/* 히어로 사진 */}
          <Pressable onPress={() => setLightboxOpen(true)} style={{ height: normalize(320), backgroundColor: post.photoGradient[0], position: 'relative' }}>
            <View
              className="flex-row items-center absolute"
              style={{ left: normalize(14), bottom: normalize(14), gap: normalize(5), height: normalize(30), paddingHorizontal: normalize(12), borderRadius: normalize(15), backgroundColor: 'rgba(0,0,0,0.4)' }}
            >
              <MapPin size={normalize(12)} color="#fff" strokeWidth={2} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', letterSpacing: -0.1 }}>
                {post.location}
              </Text>
            </View>
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
          <View style={{ paddingHorizontal: normalize(28), paddingTop: normalize(16) }}>
            {/* 유저 행 */}
            <View className="flex-row items-center" style={{ gap: normalize(11), marginBottom: normalize(14) }}>
              <View
                className="items-center justify-center"
                style={{ width: normalize(38), height: normalize(38), borderRadius: normalize(19), backgroundColor: post.author.avatarGradient[0] }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1 }}>
                  {post.author.initials}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Pressable onPress={() => navigation.navigate('UserProfile')}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
                    {post.author.handle}
                  </Text>
                </Pressable>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1, marginTop: normalize(1) }}>
                  {post.createdAtLabel} · {post.location}
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
            {post.shotMeta && (
              <View
                className="flex-row items-center"
                style={{ gap: normalize(8), paddingVertical: normalize(11), paddingHorizontal: normalize(14), backgroundColor: SURFACE, borderRadius: normalize(13), marginBottom: normalize(14) }}
              >
                <Clock size={normalize(13)} color="rgba(0,0,0,0.35)" strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.65)', letterSpacing: -0.15 }}>
                  {post.shotMeta.time}
                </Text>
                <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />
                <Sun size={normalize(15)} color="rgba(0,0,0,0.5)" strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.65)', letterSpacing: -0.15 }}>
                  {post.shotMeta.weather}
                </Text>
                <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />
                <Camera size={normalize(13)} color="rgba(0,0,0,0.35)" strokeWidth={1.8} />
                <Text allowFontScaling={false} numberOfLines={1} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.65)', letterSpacing: -0.15 }}>
                  {post.shotMeta.gear}
                </Text>
              </View>
            )}

            {/* 액션 바 */}
            <View
              className="flex-row items-center"
              style={{ gap: normalize(16), paddingVertical: normalize(4), paddingBottom: normalize(16), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
            >
              {post.photogenicScore != null && (
                <View
                  className="flex-row items-center"
                  style={{ gap: normalize(4), height: normalize(26), paddingHorizontal: normalize(10), borderRadius: normalize(13), backgroundColor: 'rgba(227,27,89,0.08)' }}
                >
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.5)', letterSpacing: 0.5 }}>
                    포토제닉
                  </Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: ACCENT, letterSpacing: -0.2 }}>
                    {post.photogenicScore}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center" style={{ gap: normalize(4), marginLeft: 'auto' }}>
                <MessageSquare size={normalize(16)} color="rgba(0,0,0,0.6)" strokeWidth={1.8} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.6)' }}>
                  {post.commentCount}
                </Text>
              </View>
              <Pressable onPress={toggleSave} hitSlop={8} accessibilityLabel="저장">
                <Archive size={normalize(16)} color={post.isSaved ? ACCENT : 'rgba(0,0,0,0.6)'} fill={post.isSaved ? ACCENT : 'none'} strokeWidth={1.8} />
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
                <View key={comment.id} className="flex-row" style={{ gap: normalize(10), marginBottom: normalize(14) }}>
                  <View
                    className="items-center justify-center"
                    style={{ width: normalize(28), height: normalize(28), borderRadius: normalize(14), backgroundColor: SURFACE, marginTop: normalize(1) }}
                  >
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.35)' }}>
                      {comment.author.initials}
                    </Text>
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
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', letterSpacing: -0.1 }}>
                        좋아요 {comment.likeCount}
                      </Text>
                      <Pressable hitSlop={8}>
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.1 }}>
                          답글
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  <Pressable onPress={() => toggleCommentLike(comment.id)} hitSlop={8} style={{ padding: normalize(4) }} accessibilityLabel="좋아요">
                    <Heart size={normalize(14)} color={comment.isLiked ? '#ff453a' : 'rgba(0,0,0,0.3)'} fill={comment.isLiked ? '#ff453a' : 'none'} strokeWidth={1.8} />
                  </Pressable>
                </View>
              ))}

              {moreCommentsCount > 0 && (
                <Pressable style={{ paddingBottom: normalize(24) }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.15 }}>
                    댓글 {moreCommentsCount}개 더보기
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>

        {/* 댓글 입력 */}
        <View
          className="flex-row items-center"
          style={{
            gap: normalize(8),
            paddingHorizontal: normalize(28),
            paddingTop: normalize(10),
            paddingBottom: keyboardOverlap > 0 ? normalize(10) : insets.bottom + normalize(10),
            backgroundColor: 'rgba(255,255,255,0.96)',
            borderTopWidth: 0.5,
            borderTopColor: 'rgba(0,0,0,0.06)',
          }}
        >
          <View className="items-center justify-center" style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(16), backgroundColor: SURFACE }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(0,0,0,0.35)' }}>
              ME
            </Text>
          </View>
          <View style={{ flex: 1, height: normalize(40), backgroundColor: SURFACE, borderRadius: normalize(20), paddingHorizontal: normalize(16), justifyContent: 'center' }}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="댓글 달기..."
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
      </View>

      <PostActionSheet
        visible={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        isMyPost={isMyPost}
        onShare={() => setShareSheetVisible(true)}
        onEdit={() => {}}
        onRequestDelete={() => setDeleteModalOpen(true)}
        onRequestReport={() => setReportSheetOpen(true)}
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

      <PhotoLightbox
        visible={lightboxOpen}
        onClose={handleCloseLightbox}
        exifOpen={exifOpen}
        onOpenExif={() => setExifOpen(true)}
        onCloseExif={() => setExifOpen(false)}
        post={post}
      />

      <ShareSheet
        visible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        onShared={(message) => showToast(message)}
      />

      <Toast message={toastMessage} visible={toastVisible} onHide={handleToastHide} />
    </View>
  );
}
