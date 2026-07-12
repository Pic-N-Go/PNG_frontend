import React from 'react';
import { Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD, BUTTON_HEIGHT } from '@/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ visible, onClose, onConfirm }: ModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ backgroundColor: '#fff', borderTopLeftRadius: normalize(24), borderTopRightRadius: normalize(24), paddingHorizontal: normalize(24), paddingTop: normalize(28), paddingBottom: Math.max(insets.bottom, normalize(40)) }}>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(8) }}>
            로그아웃할까요?
          </Text>
          <Text className="tracking-tight" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', lineHeight: normalize(22), marginBottom: normalize(24) }}>
            다음에 다시 로그인하면 모든 기능을 이용할 수 있어요.
          </Text>

          <TouchableOpacity onPress={onConfirm} style={{ width: '100%', height: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginBottom: normalize(10) }}>
            <Text className="font-medium text-white tracking-tight" style={{ fontSize: FONT_MD }}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ width: '100%', height: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, backgroundColor: '#f8f8f9', alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-medium tracking-tight" style={{ fontSize: FONT_MD, color: 'rgba(0,0,0,0.55)' }}>취소</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function WithdrawModal({ visible, onClose, onConfirm }: ModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ backgroundColor: '#fff', borderTopLeftRadius: normalize(24), borderTopRightRadius: normalize(24), paddingHorizontal: normalize(24), paddingTop: normalize(28), paddingBottom: Math.max(insets.bottom, normalize(40)) }}>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(20), marginBottom: normalize(8) }}>
            정말 탈퇴하시겠어요?
          </Text>
          <Text className="tracking-tight" style={{ fontSize: FONT_BASE, color: 'rgba(0,0,0,0.45)', lineHeight: normalize(22), marginBottom: normalize(24) }}>
            탈퇴 시 모든 데이터(스팟, 사진, 여행 계획, 위시리스트)가 삭제되며 복구할 수 없어요.
          </Text>

          <TouchableOpacity onPress={onConfirm} style={{ width: '100%', height: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, backgroundColor: 'rgba(255, 69, 58, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: normalize(10) }}>
            <Text className="font-medium tracking-tight" style={{ fontSize: FONT_MD, color: '#ff453a' }}>탈퇴하기</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ width: '100%', height: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, backgroundColor: '#f8f8f9', alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-medium tracking-tight" style={{ fontSize: FONT_MD, color: 'rgba(0,0,0,0.55)' }}>취소</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
