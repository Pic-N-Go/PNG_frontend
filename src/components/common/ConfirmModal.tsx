import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { FONT_MD, FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

interface Props {
  visible: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  /** 생략하면 확인 버튼 1개만 노출 (vote-limit-modal 패턴) */
  cancelLabel?: string;
  onCancel?: () => void;
}

export default function ConfirmModal({ visible, title, body, confirmLabel, onConfirm, cancelLabel, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel ?? onConfirm}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: normalize(40) }}
        onPress={onCancel ?? onConfirm}
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
                style={{ flex: 1, height: normalize(44), borderRadius: normalize(22), backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: 'rgba(0,0,0,0.55)', letterSpacing: -0.2 }}>
                  {cancelLabel}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={onConfirm}
              style={{ flex: 1, height: normalize(44), borderRadius: normalize(22), backgroundColor: '#E31B59', alignItems: 'center', justifyContent: 'center' }}
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
