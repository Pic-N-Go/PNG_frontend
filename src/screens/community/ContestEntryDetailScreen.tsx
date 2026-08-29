import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronLeft, MapPin, MoreHorizontal, Share as ShareIcon, Flag, Trash2, ThumbsUp } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import ConfirmModal from '@/components/common/ConfirmModal';
import Toast from '@/components/common/Toast';
import ContestPhoto from '@/components/community/ContestPhoto';
import { toErrorMessage } from '@/api/auth';
import {
  useContestById,
  useContestEntryDetail,
  useDeleteContestEntry,
  useReportContestEntry,
  useToggleVote,
} from '@/hooks/useContest';
import { announceLabel, dayLabel, mapContestEntry } from '@/utils/contestMappers';
import { CommunityDetailStackParamList } from '@/navigation/stacks/CommunityDetailStack';
import type { RootStackParamList } from '@/navigation';
import { BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING, FONT_LG, FONT_MD, FONT_SM, FONT_XS, HAIRLINE_WIDTH, HEADER_HEIGHT } from '@/constants/layout';
import { shareContent } from '@/utils/share';
import { normalize, normalizeFontSize, normalizeHeight } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD, HAIRLINE } from '@/constants/colors';

/**
 * 콘테스트 출품작 상세 (시안 14a·14b·14d·14e·14f·14g) — 게시글 상세와 골격이 다르다.
 * 아바타·팔로우·댓글·저장·EXIF가 없고, 사진이 화면을 채우고 정보 블록 + 액션 하나로 끝난다.
 */

const ACCENT = BRAND;
const SURFACE = CARD;

export default function ContestEntryDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<CommunityDetailStackParamList & RootStackParamList>>();
  const route = useRoute<RouteProp<CommunityDetailStackParamList, 'ContestEntryDetail'>>();
  const contestId = route.params.contestId;
  const entryId = route.params.entryId;

  const entryQuery = useContestEntryDetail(contestId, entryId);
  const contestQuery = useContestById(contestId);
  const voteMutation = useToggleVote(contestId);
  const deleteMutation = useDeleteContestEntry(contestId);
  const reportMutation = useReportContestEntry();

  const dto = entryQuery.data ?? null;
  const entry = dto ? mapContestEntry(dto) : null;

  // 내 작품·종료 여부는 서버가 판정한다. 진입 경로가 넘긴 값은 조회 전 첫 페인트에만 쓴다
  const isMine = dto?.mine ?? route.params.isMine ?? false;
  const isEnded = dto ? dto.phase === 'ENDED' : route.params.isEnded ?? false;
  const rank = dto?.rank ?? route.params.rank ?? 0;
  const voteCount = dto?.voteCount ?? route.params.voteCount ?? 0;
  const totalCount = contestQuery.data?.participantCount ?? route.params.totalCount ?? 0;

  const insets = useSafeAreaInsets();
  const maxVotes = dto?.voteLimit ?? 0;
  const votesLeft = dto?.remainingVoteCount ?? 0;
  const voted = dto?.voted ?? false;
  const deferredRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (deferredRef.current) clearTimeout(deferredRef.current);
    },
    [],
  );

  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const handleShare = async () => {
    const ok = await shareContent({
      title: dto?.spotName ? `${dto.spotName} 출품작` : '콘테스트 출품작',
      message: [dto?.caption, dto?.spotName].filter(Boolean).join('\n'),
    });
    // 성공 토스트는 띄우지 않는다 — Android는 취소해도 성공으로 오므로 거짓이 된다.
    if (!ok) showToast('공유 화면을 열지 못했어요');
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  // 투표 취소는 투표 기간 내 자유 — 확인 다이얼로그 없이 토스트만
  const toggleVote = () => {
    if (!dto || isEnded || isMine || voteMutation.isPending) return;
    if (!voted && votesLeft <= 0) return;

    voteMutation.mutate(
      { entryId, voted },
      {
        onSuccess: (data) => {
          // 상세는 별도 캐시라 목록과 함께 뒤집히지 않는다 — 직접 다시 받는다
          entryQuery.refetch();
          showToast(
            voted
              ? `투표를 취소했어요 · ${data.remainingVoteCount}/${data.voteLimit}`
              : `투표했어요 · ${data.remainingVoteCount}/${data.voteLimit}`,
          );
        },
        onError: (err) => showToast(toErrorMessage(err, '투표에 실패했어요')),
      },
    );
  };

  // 투표 CTA와 남은 표 안내는 투표 기간에만. 출품 기간에도 버튼이 떠서 누르면 서버가
  // NOT_VOTING_PERIOD로 거절했다 — 눌러서 에러를 보게 하지 말고 아예 감춘다.
  // 조회 전에는 phase를 모르므로 감춘 상태로 시작한다(잘못된 버튼을 잠깐이라도 보여주지 않는다).
  const isVoting = dto?.phase === 'VOTING';
  const spent = isVoting && !voted && votesLeft <= 0 && !isMine && !isEnded;

  // CTA 대신 보여줄 안내. 날짜는 이 화면이 이미 부르고 있는 회차 조회에서 가져온다.
  // 출품 기간에는 "언제부터", 집계 기간에는 "언제 발표"가 궁금한 값이라 문구를 나눈다.
  const voteNotice = (() => {
    const contest = contestQuery.data;
    if (dto?.phase === 'RESULT') {
      const announce = announceLabel(contest?.resultOpenAt);
      return announce ? `투표가 끝났어요 · ${announce} 결과 발표` : '투표가 끝났어요';
    }
    const opensAt = dayLabel(contest?.voteStartAt);
    return opensAt ? `투표는 ${opensAt}부터 할 수 있어요` : '투표 기간에 투표할 수 있어요';
  })();
  const isAward = isEnded && rank <= 3;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <View style={{ height: normalizeHeight(600) }}>
          <ContestPhoto
            gradient={entry?.gradient ?? ['#1a1530', '#5a3355', '#d4856a']}
            photoUrl={entry?.photoUrl}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <LinearGradient colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: normalize(150) }} pointerEvents="none" />
          <View style={{ paddingTop: insets.top }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: normalize(12), height: HEADER_HEIGHT, marginTop: normalize(2) }}>
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
        <View style={{ borderTopWidth: HAIRLINE_WIDTH, borderTopColor: HAIRLINE, paddingTop: normalize(22), paddingHorizontal: normalize(24), paddingBottom: normalize(24) }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: normalize(8) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
              {entry?.author ?? ''}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93' }}>
              {dto ? `${dayLabel(dto.createdAt)} 출품` : ''}
            </Text>
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, lineHeight: FONT_MD * 1.6, letterSpacing: -0.25, color: '#000', marginTop: normalize(10) }}>
            {dto?.caption ?? ''}
          </Text>

          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: normalize(18) }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
            <MapPin size={normalize(17)} color="#8e8e93" strokeWidth={1.8} />
            <Text allowFontScaling={false} style={{ flex: 1, minWidth: 0, fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.25, color: '#000' }}>
              {dto?.spotName ?? ''}
            </Text>
            {dto?.spotId != null && (
              <Pressable onPress={() => navigation.navigate('SpotStack', { screen: 'SpotDetail', params: { spotId: String(dto.spotId) } })}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: ACCENT }}>
                  스팟 보기
                </Text>
              </Pressable>
            )}
          </View>

          {spent && (
            <View style={{ marginTop: normalize(20), paddingVertical: normalize(11), paddingHorizontal: normalize(14), borderRadius: normalize(12), backgroundColor: SURFACE }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#5c5c60' }}>
                {`남은 표 0/${maxVotes} · 투표를 취소하면 다시 쓸 수 있어요`}
              </Text>
            </View>
          )}
          {isVoting && voted && votesLeft <= 0 && !isEnded && !isMine && (
            <View style={{ marginTop: normalize(20), paddingVertical: normalize(11), paddingHorizontal: normalize(14), borderRadius: normalize(12), backgroundColor: SURFACE }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#5c5c60' }}>
                {`남은 표 0/${maxVotes} · 다시 누르면 취소돼요`}
              </Text>
            </View>
          )}

          {isEnded ? (
            /* 결과 발표 후 — 누를 수 없다. 1~3위만 핑크로 강조 */
            <View style={{ marginTop: normalize(20), height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: isAward ? BRAND_TINT : SURFACE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: normalize(8) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: isAward ? ACCENT : '#000' }}>
                {rank > 0 ? `${rank}위` : ''}
              </Text>
              {/* 목업 .rank__meta는 --font-base(14px) — 위 .rank__value(15px)와 다른 크기다 */}
              {/* 목록에서 들어오면 rank가 없어 첫 페인트에 0위·0표가 스친다 — 조회가 끝날 때까지 비운다 */}
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), letterSpacing: -0.2, color: isAward ? ACCENT : '#8e8e93' }}>
                {rank <= 0 ? '' : isAward ? `${voteCount}표` : `${totalCount}명 중 · ${voteCount}표`}
              </Text>
            </View>
          ) : isVoting ? (
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
                backgroundColor: isMine || spent ? '#e6e6ea' : voted ? BRAND_TINT : ACCENT,
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
          ) : (
            /* 투표 기간이 아닐 때 CTA 자리를 비워두면 화면이 휑하다. 버튼 대신 회색 안내만 둔다 —
               누를 수 없는 것을 버튼처럼 보이게 하지 않으면서 언제 열리는지는 알려준다. */
            <View style={{ marginTop: normalize(20), paddingVertical: normalize(16), alignItems: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: '#8e8e93', textAlign: 'center' }}>
                {voteNotice}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomSheet visible={actionSheetVisible} onClose={() => setActionSheetVisible(false)}>
        <View style={{ paddingHorizontal: CONTENT_PADDING }}>
          <Pressable
            onPress={() => {
              setActionSheetVisible(false);
              // 시트 닫힘 애니메이션(300ms)이 끝난 뒤에 OS 공유 시트를 띄운다 —
              // iOS는 dismiss 중에 다른 모달을 올리면 조용히 무시한다.
              // 대기 중에 화면을 떠나면 타이머를 정리한다(PostDetailScreen의 deferredRef와 같은 처리) —
              // 안 그러면 사라진 화면에서 공유 시트가 뜨고 실패 토스트도 죽은 상태를 건드린다.
              if (deferredRef.current) clearTimeout(deferredRef.current);
              deferredRef.current = setTimeout(handleShare, 320);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), height: normalize(56) }}
          >
            <ShareIcon size={normalize(19)} color="#000" strokeWidth={1.8} />
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000' }}>
              공유하기
            </Text>
          </Pressable>

          {isMine ? (
            <Pressable onPress={() => setDeleteModalVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), height: normalize(56), borderTopWidth: HAIRLINE_WIDTH, borderTopColor: HAIRLINE }}>
              <Trash2 size={normalize(19)} color={ACCENT} strokeWidth={1.8} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, letterSpacing: -0.3, color: ACCENT }}>
                출품 삭제
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                setActionSheetVisible(false);
                if (reportMutation.isPending) return;
                reportMutation.mutate(entryId, {
                  onSuccess: () => showToast('신고했어요. 검토 후 처리됩니다'),
                  // 같은 작품을 두 번 신고하면 409다 — 서버 문구를 그대로 보여준다
                  onError: (err) => showToast(toErrorMessage(err, '신고에 실패했어요')),
                });
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), height: normalize(56), borderTopWidth: HAIRLINE_WIDTH, borderTopColor: HAIRLINE }}
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
            deleteMutation.mutate(entryId, {
              onSuccess: () => navigation.goBack(),
              onError: (err) => showToast(toErrorMessage(err, '삭제에 실패했어요')),
            });
          }}
          cancelLabel="취소"
          onCancel={() => setDeleteModalVisible(false)}
        />
      </BottomSheet>


      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </View>
  );
}
