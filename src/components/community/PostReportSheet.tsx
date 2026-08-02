import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { ReportReasonId } from '@/types/community';
import { FONT_LG, FONT_MD, FONT_XS, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const REPORT_REASONS: { id: ReportReasonId; label: string }[] = [
  { id: 'spam', label: '스팸' },
  { id: 'abuse', label: '욕설/혐오' },
  { id: 'copyright', label: '저작권 침해' },
  { id: 'inappropriate', label: '부적절한 콘텐츠' },
  { id: 'etc', label: '기타' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 사유 선택 즉시 접수되는 흐름 — 별도 확인 단계 없음 */
  onSelectReason: (id: ReportReasonId) => void;
}

export default function PostReportSheet({ visible, onClose, onSelectReason }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING + normalize(8) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, letterSpacing: -0.4, color: '#000', marginBottom: normalize(3) }}>
          신고 사유 선택
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, letterSpacing: -0.1, color: 'rgba(0,0,0,0.4)', marginBottom: normalize(8) }}>
          선택 즉시 접수됩니다 · 검토 결과는 알림으로 안내
        </Text>

        {REPORT_REASONS.map((reason, index) => (
          <React.Fragment key={reason.id}>
            <Pressable
              onPress={() => onSelectReason(reason.id)}
              className="flex-row items-center justify-between"
              style={{ width: '100%', paddingVertical: normalize(14) }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.2, color: '#000' }}>
                {reason.label}
              </Text>
              <ChevronRight size={normalize(14)} color="rgba(0,0,0,0.25)" strokeWidth={2} />
            </Pressable>
            {index < REPORT_REASONS.length - 1 && (
              <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)' }} />
            )}
          </React.Fragment>
        ))}
      </View>
    </BottomSheet>
  );
}
