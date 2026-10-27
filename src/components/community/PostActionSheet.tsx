import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Share as ShareIcon, Pencil, Trash2, Flag, Ban } from 'lucide-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { FONT_MD, GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND } from '@/constants/colors';

const ACCENT = BRAND;

interface RowProps {
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  onPress: () => void;
}

function ActionRow({ icon, label, labelColor, onPress }: RowProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center" style={{ gap: normalize(12), height: normalize(52) }}>
      {icon}
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.2, color: labelColor ?? '#000' }}>
        {label}
      </Text>
    </Pressable>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  isMyPost: boolean;
  onShare: () => void;
  onEdit: () => void;
  /** 삭제 확인 모달을 띄우기만 하고, 액션시트 자체는 그대로 열어둔다 (취소 시 액션시트로 복귀) */
  onRequestDelete: () => void;
  /** 신고 사유 시트를 띄우기만 하고, 액션시트 자체는 그대로 열어둔다 (취소 시 액션시트로 복귀) */
  onRequestReport: () => void;
  /**
   * 차단 확인 모달을 띄우기만 한다 (신고와 같은 이유로 액션시트는 열어둔다).
   * 내 글만 모아 보는 화면(MyPostsScreen)처럼 남의 글이 올 수 없는 곳에서는 넘기지 않는다.
   */
  onRequestBlock?: () => void;
}

export default function PostActionSheet({ visible, onClose, isMyPost, onShare, onEdit, onRequestDelete, onRequestReport, onRequestBlock }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: GRID_PADDING + normalize(8) }}>
        <ActionRow
          icon={<ShareIcon size={normalize(18)} color="#000" strokeWidth={1.8} />}
          label="공유하기"
          onPress={() => {
            onClose();
            onShare();
          }}
        />
        {isMyPost && (
          <ActionRow
            icon={<Pencil size={normalize(18)} color="#000" strokeWidth={1.8} />}
            label="수정하기"
            onPress={() => {
              onClose();
              onEdit();
            }}
          />
        )}
        {isMyPost && (
          <ActionRow
            icon={<Trash2 size={normalize(18)} color={ACCENT} strokeWidth={1.8} />}
            label="삭제하기"
            labelColor={ACCENT}
            onPress={onRequestDelete}
          />
        )}
        {!isMyPost && (
          <ActionRow
            icon={<Flag size={normalize(18)} color={ACCENT} strokeWidth={1.8} />}
            label="신고하기"
            labelColor={ACCENT}
            onPress={onRequestReport}
          />
        )}
        {/* 가이드라인 1.2는 신고와 별개로 "악성 사용자를 차단하는 수단"을 따로 요구한다. */}
        {!isMyPost && !!onRequestBlock && (
          <ActionRow
            icon={<Ban size={normalize(18)} color={ACCENT} strokeWidth={1.8} />}
            label="이 사용자 차단하기"
            labelColor={ACCENT}
            onPress={onRequestBlock}
          />
        )}
      </View>
    </BottomSheet>
  );
}
