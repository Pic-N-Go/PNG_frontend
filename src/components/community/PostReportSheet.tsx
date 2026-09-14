import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, FadeOutLeft, FadeOutRight } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import type { ReportReasonId } from '@/types/report';
import { BORDER_CONTROL, BUTTON_HEIGHT, BUTTON_RADIUS, FONT_MD, FONT_SM, FONT_TITLE, FONT_XS, GRID_PADDING, HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

const MAX_DETAIL_LENGTH = 500;

const REPORT_REASONS: { id: ReportReasonId; label: string; description?: string }[] = [
  { id: 'spam', label: '스팸', description: '광고, 반복 게시물 또는 도배성 콘텐츠' },
  { id: 'abuse', label: '욕설/혐오', description: '욕설, 괴롭힘 또는 혐오 표현' },
  { id: 'copyright', label: '저작권 침해', description: '타인의 사진이나 창작물을 무단 사용' },
  { id: 'inappropriate', label: '부적절한 콘텐츠', description: '선정적이거나 불쾌감을 줄 수 있는 콘텐츠' },
  { id: 'etc', label: '기타' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (id: ReportReasonId, detail: string) => void;
  isSubmitting?: boolean;
}

export default function PostReportSheet({ visible, onClose, onSubmit, isSubmitting = false }: Props) {
  const [selectedReason, setSelectedReason] = useState<ReportReasonId | null>(null);
  const [detail, setDetail] = useState('');
  const selected = REPORT_REASONS.find((reason) => reason.id === selectedReason);

  useEffect(() => {
    if (!visible) {
      setSelectedReason(null);
      setDetail('');
    }
  }, [visible]);

  function handleClose() {
    if (!isSubmitting) onClose();
  }

  function handleBack() {
    if (!isSubmitting) setSelectedReason(null);
  }

  function handleSubmit() {
    if (selectedReason && !isSubmitting) onSubmit(selectedReason, detail.trim());
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <Animated.View
        style={{
          height: normalize(333),
          paddingHorizontal: GRID_PADDING + normalize(8),
          paddingBottom: normalize(8),
          overflow: 'hidden',
        }}
      >
        {selectedReason === null ? (
          <Animated.View key="reason-list" entering={FadeInLeft.duration(220)} exiting={FadeOutLeft.duration(150)} style={{ height: '100%' }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, letterSpacing: -0.4, color: '#000', marginBottom: normalize(3) }}>
              신고 사유를 선택해 주세요
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: TEXT_SUB, marginBottom: normalize(16) }}>
              신고 내용은 운영팀이 확인하며 상대방에게 공개되지 않아요
            </Text>

            {REPORT_REASONS.map((reason, index) => (
                <React.Fragment key={reason.id}>
                <TouchableOpacity
                  onPress={() => setSelectedReason(reason.id)}
                  activeOpacity={0.55}
                  accessibilityRole="button"
                  accessibilityLabel={`${reason.label} 신고 사유 선택`}
                  style={{
                    width: '100%',
                    minHeight: normalize(44),
                    justifyContent: 'center',
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View style={{ flex: 1, paddingRight: normalize(12) }}>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_MD, letterSpacing: -0.2, color: '#111' }}>
                        {reason.label}
                      </Text>
                      {reason.description && (
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB, marginTop: normalize(3) }}>
                          {reason.description}
                        </Text>
                      )}
                    </View>
                    <ChevronRight size={normalize(16)} color={TEXT_SUB} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
                {index < REPORT_REASONS.length - 1 && (
                  <View
                    style={{
                      height: normalize(15),
                      borderTopWidth: HAIRLINE_WIDTH,
                      borderTopColor: HAIRLINE,
                    }}
                  />
                )}
                </React.Fragment>
            ))}
          </Animated.View>
        ) : (
          <Animated.View key="report-detail" entering={FadeInRight.duration(240)} exiting={FadeOutRight.duration(150)}>
            <View className="flex-row items-center" style={{ marginBottom: normalize(14) }}>
              <TouchableOpacity
                onPress={handleBack}
                activeOpacity={0.45}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="신고 사유 선택으로 돌아가기"
                style={{ width: normalize(32), height: normalize(32), alignItems: 'center', justifyContent: 'center', marginLeft: -normalize(8) }}
              >
                <ChevronLeft size={normalize(24)} color="#000" strokeWidth={1.8} />
              </TouchableOpacity>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, letterSpacing: -0.4, color: '#000' }}>
                상세 내용 작성
              </Text>
            </View>

            <View className="flex-row items-center" style={{ paddingHorizontal: normalize(12), paddingVertical: normalize(10), borderRadius: normalize(10), backgroundColor: BRAND_TINT, marginBottom: normalize(12) }}>
              <ShieldAlert size={normalize(18)} color={BRAND} strokeWidth={2} />
              <View style={{ flex: 1, marginLeft: normalize(9) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: BRAND }}>
                  {selected?.label}
                </Text>
                {selected?.description && (
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB, marginTop: normalize(2) }}>
                    {selected.description}
                  </Text>
                )}
              </View>
            </View>

            <TextInput
              value={detail}
              onChangeText={setDetail}
              placeholder="운영팀이 상황을 이해할 수 있도록 자세히 알려주세요. (선택)"
              placeholderTextColor={TEXT_SUB}
              multiline
              maxLength={MAX_DETAIL_LENGTH}
              textAlignVertical="top"
              editable={!isSubmitting}
              accessibilityLabel="상세 신고 내용"
              style={{ minHeight: normalize(156), borderWidth: BORDER_CONTROL, borderColor: HAIRLINE, borderRadius: normalize(12), paddingHorizontal: normalize(13), paddingTop: normalize(12), paddingBottom: normalize(28), fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, lineHeight: normalize(20), color: '#000', backgroundColor: CARD }}
            />
            <Text allowFontScaling={false} style={{ alignSelf: 'flex-end', fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB, marginTop: -normalize(23), marginRight: normalize(10), marginBottom: normalize(18) }}>
              {detail.length}/{MAX_DETAIL_LENGTH}
            </Text>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityLabel="신고 접수하기"
              style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND, opacity: isSubmitting ? 0.45 : 1 }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#FFF' }}>
                {isSubmitting ? '접수 중...' : '신고 접수하기'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    </BottomSheet>
  );
}
