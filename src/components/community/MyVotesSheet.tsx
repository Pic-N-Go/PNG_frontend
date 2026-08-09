import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ThumbsUp } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { MyVoteEntry } from '@/types/community';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_LG, FONT_MD, FONT_SM, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

/**
 * 내가 투표한 작품 시트 (시안 6a·6b) — 진행중 탭·전체 출품작 목록의 "남은 표" pill,
 * 둘 다 이 시트 하나로 연다. 취소는 다이얼로그 없이 즉시 반영, 토스트는 호출부 책임.
 */

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';
const SUB = 'rgba(0,0,0,0.4)';

interface Props {
  visible: boolean;
  onClose: () => void;
  entries: MyVoteEntry[];
  votesLeft: number;
  maxVotes: number;
  onCancelVote: (id: string) => void;
  onOpenEntry: (id: string) => void;
}

export default function MyVotesSheet({ visible, onClose, entries, votesLeft, maxVotes, onCancelVote, onOpenEntry }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: normalize(6) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
            내가 투표한 작품
          </Text>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#c7c7cc' }}>
            {entries.length}
          </Text>
        </View>

        {entries.length === 0 ? (
          <>
            <View style={{ paddingVertical: normalize(36), alignItems: 'center', gap: normalize(8) }}>
              <ThumbsUp size={normalize(26)} color="#c7c7cc" strokeWidth={1.6} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#000', marginTop: normalize(4) }}>
                아직 투표한 작품이 없어요
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: SUB }}>
                {`이번 콘테스트에 ${maxVotes}표를 쓸 수 있어요`}
              </Text>
            </View>
            <Pressable onPress={onClose} style={{ width: '100%', height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.3, color: '#fff' }}>
                출품작 보러 가기
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={{ marginTop: normalize(18), gap: normalize(16) }}>
            {entries.map((entry) => (
              <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12) }}>
                <Pressable onPress={() => onOpenEntry(entry.id)} style={{ width: normalize(44), height: normalize(44), borderRadius: normalize(11), backgroundColor: entry.gradient[0], flexShrink: 0 }} />
                <Pressable onPress={() => onOpenEntry(entry.id)} style={{ flex: 1, minWidth: 0 }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
                    {entry.author}
                  </Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: 'rgba(0,0,0,0.45)', marginTop: normalize(2) }}>
                    {`${entry.votedAtLabel} · ${entry.spotLabel}`}
                  </Text>
                </Pressable>
                <Pressable onPress={() => onCancelVote(entry.id)} style={{ height: normalize(32), paddingHorizontal: normalize(14), borderRadius: normalize(16), backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
                    취소
                  </Text>
                </Pressable>
              </View>
            ))}

            <View style={{ marginTop: normalize(6), paddingTop: normalize(16), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)', flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, letterSpacing: -0.2, color: 'rgba(0,0,0,0.4)' }}>
                남은 표
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
                {Array.from({ length: maxVotes }).map((_, i) => (
                  <View key={i} style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: i < votesLeft ? ACCENT : '#e6e6ea' }} />
                ))}
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
                {`${votesLeft}/${maxVotes}`}
              </Text>
              <View style={{ flex: 1 }} />
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: '#c7c7cc' }}>
                투표 마감 전까지 언제든 바꿀 수 있어요
              </Text>
            </View>
          </View>
        )}
      </View>
    </BottomSheet>
  );
}
