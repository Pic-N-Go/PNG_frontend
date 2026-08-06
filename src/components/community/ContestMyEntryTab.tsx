import React, { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Camera, Edit3, MapPin, RotateCcw, X } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import ConfirmModal from '@/components/common/ConfirmModal';
import { ContestSubmission } from '@/types/community';
import { FONT_2XS, FONT_LG, FONT_MD, FONT_SM, FONT_XL, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';
const TEXT_SECONDARY = 'rgba(0,0,0,0.4)';
const CAPTION_MAX = 500;

// 컨테스트 메타(주제·마감·참여자 수)는 이 탭의 props로 전달되지 않는다(시그니처 고정 요구사항).
// ContestSegment의 ACTIVE_INFO와 같은 값을 목업 그대로 하드코딩한다.
const THEME_LABEL = '골든아워';
const DDAY_LABEL = 'D-3';
const DDAY_DAYS_LABEL = '3일';
const PARTICIPANT_LABEL = '128명 참여';

interface Props {
  submission: ContestSubmission;
  onUpdateCaption: (caption: string) => void;
  onWithdraw: () => void;
  onOpenSubmitSheet: () => void;
}

export default function ContestMyEntryTab({ submission, onUpdateCaption, onWithdraw, onOpenSubmitSheet }: Props) {
  const entry = submission.hasEntry ? submission.entry : undefined;

  const [captionSheetVisible, setCaptionSheetVisible] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  const openCaptionSheet = () => {
    setCaptionDraft(entry?.caption ?? '');
    setCaptionSheetVisible(true);
  };

  const saveCaption = () => {
    onUpdateCaption(captionDraft.trim());
    setCaptionSheetVisible(false);
  };

  const confirmWithdraw = () => {
    setWithdrawModalVisible(false);
    onWithdraw();
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: normalize(24) }} showsVerticalScrollIndicator={false}>
      {/* 컴팩트 배너 (출품 유무 공통) */}
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(16) }}>
        <View
          style={{
            height: normalize(120),
            borderRadius: normalize(16),
            overflow: 'hidden',
            // 커뮤니티 카드 컨벤션(PostCard)을 따라 실제 그라디언트 대신 대표색 1개의 단색으로 표현한다.
            backgroundColor: '#8b4a6b',
            padding: normalize(16),
            paddingHorizontal: normalize(18),
            justifyContent: 'space-between',
          }}
        >
          <View className="flex-row items-baseline" style={{ gap: normalize(8) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: 1, color: '#fff', opacity: 0.85 }}>
              WEEKLY
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.3, color: '#fff' }}>
              {THEME_LABEL}
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: normalize(6) }}>
            <View className="items-center justify-center" style={{ height: normalize(22), paddingHorizontal: normalize(10), borderRadius: normalize(11), backgroundColor: 'rgba(0,0,0,0.35)' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, letterSpacing: 0.3, color: '#fff' }}>
                {DDAY_LABEL}
              </Text>
            </View>
            <View className="items-center justify-center" style={{ height: normalize(22), paddingHorizontal: normalize(10), borderRadius: normalize(11), backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: '#fff' }}>
                {PARTICIPANT_LABEL}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {entry ? (
        <>
          {/* 출품작 있음 */}
          <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(20) }}>
            <View style={{ borderRadius: normalize(20), backgroundColor: SURFACE, overflow: 'hidden' }}>
              <View style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: entry.photoGradient?.[0] ?? SURFACE }}>
                {entry.photoUri && <Image source={{ uri: entry.photoUri }} resizeMode="cover" className="w-full h-full" />}
                <View style={{ position: 'absolute', bottom: normalize(12), left: normalize(12), right: normalize(12) }}>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={2}
                    style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, lineHeight: FONT_SM * 1.5, letterSpacing: -0.15, color: 'rgba(255,255,255,0.9)' }}
                  >
                    {entry.caption}
                  </Text>
                </View>
              </View>

              <View style={{ paddingTop: normalize(16), paddingHorizontal: normalize(18), paddingBottom: normalize(14) }}>
                <View className="flex-row" style={{ gap: normalize(8), marginBottom: normalize(14) }}>
                  <View className="flex-1" style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(14), backgroundColor: '#fff', borderRadius: normalize(12) }}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: 0.4, color: TEXT_SECONDARY }}>
                      현재 순위
                    </Text>
                    <View className="flex-row items-baseline" style={{ gap: normalize(3), marginTop: normalize(2) }}>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, lineHeight: FONT_XL, letterSpacing: -0.5, color: ACCENT }}>
                        {entry.rank}
                      </Text>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}>
                        {`위 / ${entry.totalParticipants}`}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-1" style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(14), backgroundColor: '#fff', borderRadius: normalize(12) }}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, letterSpacing: 0.4, color: TEXT_SECONDARY }}>
                      받은 표
                    </Text>
                    <View className="flex-row items-baseline" style={{ gap: normalize(3), marginTop: normalize(2) }}>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XL, lineHeight: FONT_XL, letterSpacing: -0.5, color: ACCENT }}>
                        {entry.voteCount}
                      </Text>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}>
                        표
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  className="flex-row items-center"
                  style={{ gap: normalize(8), paddingVertical: normalize(11), paddingHorizontal: normalize(12), backgroundColor: '#fff', borderRadius: normalize(12) }}
                >
                  <MapPin size={normalize(14)} color="rgba(0,0,0,0.35)" strokeWidth={1.8} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.15, color: 'rgba(0,0,0,0.6)' }}>
                    {entry.location}
                  </Text>
                  <View style={{ width: normalize(2), height: normalize(2), borderRadius: normalize(1), backgroundColor: 'rgba(0,0,0,0.15)' }} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.15, color: 'rgba(0,0,0,0.6)' }}>
                    {entry.submittedAgoLabel}
                  </Text>
                  <View
                    className="items-center justify-center"
                    style={{ marginLeft: 'auto', height: normalize(22), paddingHorizontal: normalize(10), borderRadius: normalize(11), backgroundColor: 'rgba(227,27,89,0.1)' }}
                  >
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: ACCENT }}>
                      {`마감 ${DDAY_LABEL}`}
                    </Text>
                  </View>
                </View>

                <View className="flex-row" style={{ gap: normalize(8), marginTop: normalize(14) }}>
                  <Pressable
                    onPress={openCaptionSheet}
                    accessibilityRole="button"
                    accessibilityLabel="캡션 수정"
                    className="flex-1 flex-row items-center justify-center"
                    style={{ height: normalize(44), borderRadius: normalize(22), backgroundColor: '#fff', gap: normalize(5) }}
                  >
                    <Edit3 size={normalize(14)} color="rgba(0,0,0,0.65)" strokeWidth={1.8} />
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: 'rgba(0,0,0,0.65)' }}>
                      캡션 수정
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setWithdrawModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="출품 취소"
                    className="flex-1 flex-row items-center justify-center"
                    style={{ height: normalize(44), borderRadius: normalize(22), backgroundColor: '#fff', gap: normalize(5) }}
                  >
                    <RotateCcw size={normalize(14)} color={ACCENT} strokeWidth={1.8} />
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: ACCENT }}>
                      출품 취소
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(24) }}>
            <View style={{ paddingVertical: normalize(14), paddingHorizontal: normalize(16), backgroundColor: SURFACE, borderRadius: normalize(12) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, lineHeight: FONT_XS * 1.55, letterSpacing: -0.15, color: 'rgba(0,0,0,0.5)' }}>
                <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>{`1위까지 ${entry.votesToNextRank}표 남음.`}</Text>
                {` 마감까지 ${DDAY_DAYS_LABEL}. 팔로워에게 공유하면 표를 더 받을 수 있어요.`}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(24), alignItems: 'center' }}>
          <View
            className="items-center justify-center"
            style={{ width: normalize(88), height: normalize(88), borderRadius: normalize(20), backgroundColor: 'rgba(227,27,89,0.08)', marginBottom: normalize(18) }}
          >
            <Camera size={normalize(40)} color={ACCENT} strokeWidth={1.6} />
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.3, color: '#000', marginBottom: normalize(6) }}>
            아직 출품하지 않았어요
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: FONT_SM,
              lineHeight: FONT_SM * 1.55,
              letterSpacing: -0.15,
              color: 'rgba(0,0,0,0.5)',
              textAlign: 'center',
              maxWidth: normalize(260),
              marginBottom: normalize(22),
            }}
          >
            {`"${THEME_LABEL}" 주제에 어울리는 사진을 골라 이번 주 콘테스트에 참여해보세요.`}
          </Text>
          <Pressable
            onPress={onOpenSubmitSheet}
            accessibilityRole="button"
            accessibilityLabel="출품하기"
            className="items-center justify-center"
            style={{ height: normalize(52), paddingHorizontal: normalize(32), borderRadius: normalize(26), backgroundColor: ACCENT }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.2, color: '#fff' }}>
              출품하기
            </Text>
          </Pressable>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: TEXT_SECONDARY, marginTop: normalize(12) }}>
            {`마감까지 ${DDAY_DAYS_LABEL} · 지금까지 ${PARTICIPANT_LABEL}`}
          </Text>
        </View>
      )}

      {/* 캡션 수정 시트 */}
      <BottomSheet visible={captionSheetVisible} onClose={() => setCaptionSheetVisible(false)}>
        <View className="flex-row items-center justify-between" style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(12) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000' }}>
            캡션 수정
          </Text>
          <Pressable
            onPress={() => setCaptionSheetVisible(false)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            className="items-center justify-center"
            style={{ width: normalize(30), height: normalize(30), borderRadius: normalize(15), backgroundColor: SURFACE }}
          >
            <X size={normalize(13)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
          </Pressable>
        </View>

        <View className="flex-row items-center" style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(14), gap: normalize(12) }}>
          <View style={{ width: normalize(64), height: normalize(64), borderRadius: normalize(12), overflow: 'hidden', backgroundColor: entry?.photoGradient?.[0] ?? SURFACE }}>
            {entry?.photoUri && <Image source={{ uri: entry.photoUri }} resizeMode="cover" className="w-full h-full" />}
          </View>
          <View className="flex-1">
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, letterSpacing: -0.2, color: '#000' }}>
              {`${THEME_LABEL} · ${entry?.rank ?? ''}위`}
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: TEXT_SECONDARY, marginTop: normalize(2) }}>
              {`${entry?.location ?? ''} · ${entry?.submittedAgoLabel ?? ''}`}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(6) }}>
          <View style={{ backgroundColor: SURFACE, borderRadius: normalize(14), paddingVertical: normalize(14), paddingHorizontal: normalize(16), borderWidth: normalize(1.5), borderColor: ACCENT }}>
            <TextInput
              value={captionDraft}
              onChangeText={setCaptionDraft}
              maxLength={CAPTION_MAX}
              multiline
              textAlignVertical="top"
              style={{
                minHeight: normalize(100),
                fontFamily: 'Pretendard-Regular',
                fontSize: normalizeFontSize(14),
                lineHeight: normalizeFontSize(14) * 1.6,
                letterSpacing: -0.2,
                color: '#000',
              }}
            />
            <Text allowFontScaling={false} style={{ textAlign: 'right', fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.3)', marginTop: normalize(6) }}>
              {`${captionDraft.length}/${CAPTION_MAX}`}
            </Text>
          </View>
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.15, lineHeight: FONT_XS * 1.5, color: TEXT_SECONDARY, marginTop: normalize(10) }}
          >
            사진·위치·촬영정보는 출품 시점에 고정되어 수정할 수 없어요.
          </Text>
        </View>

        <View className="flex-row" style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), gap: normalize(8) }}>
          <Pressable
            onPress={() => setCaptionSheetVisible(false)}
            accessibilityRole="button"
            className="flex-1 items-center justify-center"
            style={{ height: normalize(52), borderRadius: normalize(26), backgroundColor: SURFACE }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.2, color: 'rgba(0,0,0,0.6)' }}>
              취소
            </Text>
          </Pressable>
          <Pressable
            onPress={saveCaption}
            accessibilityRole="button"
            style={{ flex: 2, height: normalize(52), borderRadius: normalize(26), backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, letterSpacing: -0.2, color: '#fff' }}>
              저장
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* 출품 취소 확인 모달 */}
      <ConfirmModal
        visible={withdrawModalVisible}
        title="출품을 취소할까요?"
        body={
          <Text>
            {'지금까지 받은 '}
            <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>{`${entry?.voteCount ?? 0}표`}</Text>
            {'가 모두 사라지고 순위에서 제외됩니다.\n\n'}
            {`마감 전(${DDAY_LABEL})까지는 `}
            <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>다른 사진으로 재출품</Text>
            {'이 가능하지만, 취소한 사진의 표는 복구되지 않아요.'}
          </Text>
        }
        confirmLabel="출품 취소"
        onConfirm={confirmWithdraw}
        cancelLabel="닫기"
        onCancel={() => setWithdrawModalVisible(false)}
      />
    </ScrollView>
  );
}
