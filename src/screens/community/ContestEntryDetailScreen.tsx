import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, MapPin, MoreHorizontal, Share2, Flag, Trash2, ThumbsUp } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import ConfirmModal from '@/components/common/ConfirmModal';
import ShareSheet from '@/components/common/ShareSheet';
import Toast from '@/components/common/Toast';
import DevStateSwitch from '@/components/common/DevStateSwitch';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import type { RootStackParamList } from '@/navigation';
import { BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING, FONT_LG, FONT_MD, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize, normalizeHeight } from '@/utils/normalize';

/**
 * 콘테스트 출품작 상세 (시안 14a·14b·14d·14e·14f·14g) — 게시글 상세와 골격이 다르다.
 * 아바타·팔로우·댓글·저장·EXIF가 없고, 사진이 화면을 채우고 정보 블록 + 액션 하나로 끝난다.
 * TODO(API): route.params의 entryId 기준 실제 조회로 교체. 지금은 목업과 동일한 단일 mock.
 */

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';
const MAX_VOTES = 3;

// spotId가 있으면 스팟 DB에서 고른 경우, 없으면 자유 입력 — 자유 입력은 스팟 상세로 연결되지 않는다.
const MOCK_ENTRY = {
  author: '@sunset_jk',
  dateLabel: '8월 6일 출품',
  caption: '해가 넘어가기 직전의 광안대교. 바람이 잔잔해서 물 반영도 깨끗하게 담겼습니다.',
  spot: '광안리 해수욕장',
  spotId: 'spot-1' as string | null,
  gradient: ['#1a1530', '#5a3355', '#d4856a'] as [string, string, string],
};

export default function ContestEntryDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList & RootStackParamList>>();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'ContestEntryDetail'>>();
  // 내 작품 여부·종료 여부는 진입 경로가 넘긴다. 아직 넘기는 곳이 없어 __DEV__ 스위처로도 연다.
  const [devVariant, setDevVariant] = useState<'route' | 'mine' | 'ended'>('route');
  const isMine = devVariant === 'mine' || (devVariant === 'route' && (route.params?.isMine ?? false));
  const isEnded = devVariant === 'ended' || (devVariant === 'route' && (route.params?.isEnded ?? false));
  const rank = route.params?.rank ?? 18;
  const totalCount = route.params?.totalCount ?? 214;
  const voteCount = route.params?.voteCount ?? 33;

  const insets = useSafeAreaInsets();
  const [votesLeft, setVotesLeft] = useState(2);
  const [voted, setVoted] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // 투표 취소는 투표 기간 내 자유 — 확인 다이얼로그 없이 토스트만
  const toggleVote = () => {
    if (isEnded || isMine) return;
    if (voted) {
      setVoted(false);
      const remaining = Math.min(MAX_VOTES, votesLeft + 1);
      setVotesLeft(remaining);
      showToast(`투표를 취소했어요 · ${remaining}/${MAX_VOTES}`);
      return;
    }
    if (votesLeft <= 0) return;
    setVoted(true);
    const remaining = votesLeft - 1;
    setVotesLeft(remaining);
    showToast(`투표했어요 · ${remaining}/${MAX_VOTES}`);
  };

  const spent = !voted && votesLeft <= 0 && !isMine && !isEnded;
  const isAward = isEnded && rank <= 3;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* 이 화면만 사진이 상태바 아래까지 꽉 차서 스위처가 흐름 맨 앞에 온다 — 인셋을 안 주면 상태바 글자와 겹친다.
          대신 상단 인셋을 여기서 소비하므로 아래 사진 위 네비는 인셋을 다시 주지 않는다(두 번 밀리면 버튼이 화면 중앙까지 내려온다) */}
      {__DEV__ && (
        <View style={{ paddingTop: insets.top, backgroundColor: '#000' }}>
          <DevStateSwitch
            options={[
              { key: 'route', label: '14a 투표' },
              { key: 'mine', label: '14e 내 작품' },
              { key: 'ended', label: '14f 결과' },
            ]}
            value={devVariant}
            onChange={setDevVariant}
          />
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <View style={{ height: normalizeHeight(600), backgroundColor: MOCK_ENTRY.gradient[0] }}>
          <LinearGradient colors={MOCK_ENTRY.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <LinearGradient colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: normalize(150) }} pointerEvents="none" />
          <View style={{ paddingTop: __DEV__ ? 0 : insets.top }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: normalize(12), height: normalize(52), marginTop: normalize(2) }}>
              <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityRole="button" accessibilityLabel="뒤로" style={{ width: normalize(40), height: normalize(40), alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={normalize(22)} color="#fff" strokeWidth={2} />
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => setActionSheetVisible(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="더보기" style={{ width: normalize(40), height: normalize(40), alignItems: 'center', justifyContent: 'center' }}>
                <MoreHorizontal size={normalize(22)} color="#fff" strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* 아바타·팔로우 버튼 없음 — 콘테스트에서 중요한 건 작품이지 작성자 관계가 아니다 */}
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: normalize(22), paddingHorizontal: normalize(24), paddingBottom: normalize(24) }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: normalize(8) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
              {MOCK_ENTRY.author}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
              {MOCK_ENTRY.dateLabel}
            </Text>
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, lineHeight: FONT_MD * 1.6, letterSpacing: -0.25, color: '#000', marginTop: normalize(10) }}>
            {MOCK_ENTRY.caption}
          </Text>

          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: normalize(18) }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
            <MapPin size={normalize(17)} color="#8e8e93" strokeWidth={1.8} />
            <Text allowFontScaling={false} style={{ flex: 1, minWidth: 0, fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.25, color: '#000' }}>
              {MOCK_ENTRY.spot}
            </Text>
            {MOCK_ENTRY.spotId && (
              <Pressable onPress={() => navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: MOCK_ENTRY.spotId! } })}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: ACCENT }}>
                  스팟 보기
                </Text>
              </Pressable>
            )}
          </View>

          {spent && (
            <View style={{ marginTop: normalize(20), paddingVertical: normalize(11), paddingHorizontal: normalize(14), borderRadius: normalize(12), backgroundColor: SURFACE }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#5c5c60' }}>
                남은 표 0/3 · 투표를 취소하면 다시 쓸 수 있어요
              </Text>
            </View>
          )}
          {voted && votesLeft <= 0 && !isEnded && !isMine && (
            <View style={{ marginTop: normalize(20), paddingVertical: normalize(11), paddingHorizontal: normalize(14), borderRadius: normalize(12), backgroundColor: SURFACE }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#5c5c60' }}>
                남은 표 0/3 · 다시 누르면 취소돼요
              </Text>
            </View>
          )}

          {isEnded ? (
            /* 결과 발표 후 — 누를 수 없다. 1~3위만 핑크로 강조 */
            <View style={{ marginTop: normalize(20), height: normalize(52), borderRadius: normalize(26), backgroundColor: isAward ? 'rgba(227,27,89,0.1)' : SURFACE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: normalize(8) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: isAward ? ACCENT : '#000' }}>
                {isAward ? `8월 ${rank}위` : `${rank}위`}
              </Text>
              {/* 목업 .rank__meta는 --font-base(14px) — 위 .rank__value(15px)와 다른 크기다 */}
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), letterSpacing: -0.2, color: isAward ? ACCENT : '#8e8e93' }}>
                {isAward ? `${voteCount}표` : `${totalCount}명 중 · ${voteCount}표`}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={toggleVote}
              disabled={isMine || spent}
              style={{
                marginTop: normalize(20),
                width: '100%',
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: normalize(8),
                backgroundColor: isMine || spent ? '#e6e6ea' : voted ? 'rgba(227,27,89,0.1)' : ACCENT,
              }}
            >
              {voted ? (
                <Check size={normalize(19)} color={ACCENT} strokeWidth={2.4} />
              ) : (
                <ThumbsUp size={normalize(19)} color={isMine || spent ? '#b8b8be' : '#fff'} strokeWidth={1.9} />
              )}
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: isMine || spent ? '#b8b8be' : voted ? ACCENT : '#fff' }}>
                {isMine ? '내 출품작' : voted ? '투표함' : '투표하기'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <BottomSheet visible={actionSheetVisible} onClose={() => setActionSheetVisible(false)}>
        <View style={{ paddingHorizontal: CONTENT_PADDING }}>
          <Pressable
            onPress={() => {
              setActionSheetVisible(false);
              setShareSheetVisible(true);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), height: normalize(56) }}
          >
            <Share2 size={normalize(19)} color="#000" strokeWidth={1.8} />
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
              공유하기
            </Text>
          </Pressable>

          {isMine ? (
            <Pressable onPress={() => setDeleteModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), height: normalize(56), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' }}>
              <Trash2 size={normalize(19)} color={ACCENT} strokeWidth={1.8} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, letterSpacing: -0.3, color: ACCENT }}>
                출품 삭제
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                setActionSheetVisible(false);
                showToast('신고했어요. 검토 후 처리됩니다');
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), height: normalize(56), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' }}
            >
              <Flag size={normalize(19)} color={ACCENT} strokeWidth={1.8} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, letterSpacing: -0.3, color: ACCENT }}>
                신고하기
              </Text>
            </Pressable>
          )}

          {isMine && (
            <Text allowFontScaling={false} style={{ marginTop: normalize(4), fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, lineHeight: FONT_SM * 1.5, letterSpacing: -0.2, color: '#5c5c60' }}>
              수정은 할 수 없어요. 삭제하면 받은 표도 함께 사라집니다.
            </Text>
          )}

          <Pressable
            onPress={() => setActionSheetVisible(false)}
            style={{ width: '100%', height: BUTTON_HEIGHT, marginTop: normalize(14), borderRadius: BUTTON_RADIUS, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
              닫기
            </Text>
          </Pressable>
        </View>

        {/* BottomSheet 안에 둔다 — iOS는 이미 뜬 Modal 위에 형제 Modal을 올리면 조용히 무시한다(중첩이어야 뜬다) */}
        <ConfirmModal
          visible={deleteModalVisible}
          title="이 작품을 삭제할까요?"
          body="받은 표도 함께 사라지고 되돌릴 수 없어요."
          confirmLabel="삭제"
          onConfirm={() => {
            setDeleteModalVisible(false);
            setActionSheetVisible(false);
            navigation.goBack();
          }}
          cancelLabel="취소"
          onCancel={() => setDeleteModalVisible(false)}
        />
      </BottomSheet>

      <ShareSheet visible={shareSheetVisible} onClose={() => setShareSheetVisible(false)} onShared={(message) => showToast(message)} />

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}
