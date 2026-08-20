import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { FONT_MD, FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, CARD, SCRIM } from '@/constants/colors';

interface BaseProps {
  visible: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
}

// 취소 라벨만 있고 핸들러가 없으면 아무 동작 없는 버튼이 된다 — 짝으로만 받는다.
// 둘 다 생략하면 확인 버튼 1개만 노출 (vote-limit-modal 같은 안내형).
type Props = BaseProps &
  ({ cancelLabel: string; onCancel: () => void } | { cancelLabel?: never; onCancel?: never });

export default function ConfirmModal({ visible, title, body, confirmLabel, onConfirm, cancelLabel, onCancel }: Props) {
  // 취소가 없는 모달(안내형)에서 배경 탭·뒤로가기가 onConfirm으로 떨어지면 삭제 같은 확정 동작이
  // 명시적 확인 없이 실행된다. 취소가 없으면 닫히지 않게 두고 확인 버튼만 유일한 출구로 남긴다.
  const handleDismiss = onCancel ?? (() => {});

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={handleDismiss}>
      <Pressable
        style={{ flex: 1, backgroundColor: SCRIM, alignItems: 'center', justifyContent: 'center', paddingHorizontal: normalize(40) }}
        onPress={handleDismiss}
      >
        <Pressable
          onPress={() => {}}
          style={{ width: '100%', backgroundColor: '#fff', borderRadius: normalize(20), paddingTop: normalize(24), paddingHorizontal: normalize(20), paddingBottom: normalize(16), alignItems: 'center' }}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.3, marginBottom: normalize(6), textAlign: 'center' }}>
            {title}
          </Text>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: 'rgba(0,0,0,0.5)', letterSpacing: -0.2, lineHeight: FONT_SM * 1.5, textAlign: 'center', marginBottom: normalize(20) }}>
            {body}
          </Text>
          <View style={{ flexDirection: 'row', gap: normalize(8), width: '100%' }}>
            {cancelLabel && (
              <Pressable
                onPress={onCancel}
                style={{ flex: 1, height: normalize(44), borderRadius: normalize(22), backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                  {cancelLabel}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onConfirm}
              style={{ flex: 1, height: normalize(44), borderRadius: normalize(22), backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', letterSpacing: -0.2 }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
