import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Info } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import ConfirmModal from '@/components/common/ConfirmModal';
import ContestPhoto from '@/components/community/ContestPhoto';
import { ContestEntry, ContestInfo, ContestPhase } from '@/types/community';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_LG, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';

/**
 * 내 출품작 시트 (시안 8d 출품 기간 · 8f 투표 기간) — 진행중 탭의 "내 출품작 N/3" pill에서 연다.
 * 사진·캡션은 수정 불가(삭제 후 재출품)이므로 이 시트가 하는 일은 목록 확인과 삭제뿐이다.
 */

const ACCENT = BRAND;
const SURFACE = CARD;

interface Props {
  visible: boolean;
  onClose: () => void;
  phase: ContestPhase;
  /** 진행 중 회차가 없으면 null */
  contest: ContestInfo | null;
  maxEntries: number;
  entries: ContestEntry[];
  onDelete: (id: string) => void;
  onOpenSubmit: () => void;
}

export default function MyEntriesSheet({ visible, onClose, phase, contest, maxEntries, entries, onDelete, onOpenSubmit }: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const voting = phase === 'VOTING';

  const confirmDelete = () => {
    if (pendingDeleteId) onDelete(pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose}>
        <View style={{ paddingHorizontal: GRID_PADDING }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: normalize(6) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
              내 출품작
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#c7c7cc' }}>
              {`${entries.length}/${maxEntries}`}
            </Text>
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: TEXT_SUB, marginTop: normalize(4) }}>
            {contest ? `${contest.theme} · ${contest.monthLabel} 콘테스트 · 사진 ${maxEntries}장까지` : `사진 ${maxEntries}장까지`}
          </Text>

          <View style={{ marginTop: normalize(16), padding: normalize(12), paddingHorizontal: normalize(14), borderRadius: normalize(12), backgroundColor: SURFACE, flexDirection: 'row', alignItems: 'flex-start', gap: normalize(8) }}>
            <Info size={normalize(15)} color="#8e8e93" strokeWidth={1.8} style={{ marginTop: normalize(2) }} />
            <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, lineHeight: FONT_SM * 1.5, letterSpacing: -0.2, color: '#5c5c60' }}>
              {voting
                ? '투표가 시작돼서 추가 출품은 할 수 없어요.\n삭제는 가능하지만 받은 표도 함께 사라집니다.'
                : '출품한 사진과 설명은 수정할 수 없어요. 바꾸려면 삭제하고 다시 출품해주세요.'}
            </Text>
          </View>

          <View style={{ marginTop: normalize(18), gap: normalize(16) }}>
            {entries.map((entry) => (
              <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
                <ContestPhoto
                  gradient={entry.gradient}
                  photoUrl={entry.photoUrl}
                  radius={normalize(12)}
                  style={{ width: normalize(52), height: normalize(52), flexShrink: 0 }}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
                    {entry.caption}
                  </Text>
                  <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#8e8e93', marginTop: normalize(2) }}>
                    {`${entry.spot} · ${entry.createdAgoLabel}`}
                  </Text>
                </View>
                <Pressable onPress={() => setPendingDeleteId(entry.id)} style={{ height: normalize(32), paddingHorizontal: normalize(14), borderRadius: normalize(16), backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
                    삭제
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {!voting && (
            <Pressable
              onPress={() => {
                onClose();
                onOpenSubmit();
              }}
              disabled={entries.length >= maxEntries}
              style={{ width: '100%', height: BUTTON_HEIGHT, marginTop: normalize(22), borderRadius: BUTTON_RADIUS, backgroundColor: entries.length >= maxEntries ? SURFACE : ACCENT, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: entries.length >= maxEntries ? 'rgba(0,0,0,0.3)' : '#fff' }}>
                {`${maxEntries - entries.length}개 더 출품하기`}
              </Text>
            </Pressable>
          )}

          {voting && (
            <Text allowFontScaling={false} style={{ marginTop: normalize(20), textAlign: 'center', fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#c7c7cc' }}>
              {contest ? `삭제해도 다시 출품할 수 없어요 · ${contest.resultAnnounceLabel} 결과 발표` : '삭제해도 다시 출품할 수 없어요'}
            </Text>
          )}
        </View>

        {/* BottomSheet 안에 둔다 — iOS는 이미 뜬 Modal 위에 형제 Modal을 올리면 조용히 무시한다(중첩이어야 뜬다) */}
        <ConfirmModal
          visible={pendingDeleteId != null}
          title="이 작품을 삭제할까요?"
          body={
            voting
              ? '받은 표도 함께 사라지고 되돌릴 수 없어요.\n삭제해도 다시 출품할 수 없어요.'
              : '받은 표도 함께 사라지고 되돌릴 수 없어요.\n출품 마감 전이라면 다시 출품할 수 있어요.'
          }
          confirmLabel="삭제"
          onConfirm={confirmDelete}
          cancelLabel="취소"
          onCancel={() => setPendingDeleteId(null)}
        />
      </BottomSheet>
    </>
  );
}
