import React from 'react';
import { Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { normalize } from '@/utils/normalize';
import { BUTTON_HEIGHT, FONT_MD, FONT_SM, FONT_TITLE } from '@/constants/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CARD, SCRIM } from '@/constants/colors';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutModal({ visible, onClose, onConfirm }: ModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: SCRIM, justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ backgroundColor: '#fff', borderTopLeftRadius: normalize(24), borderTopRightRadius: normalize(24), paddingHorizontal: normalize(24), paddingTop: normalize(28), paddingBottom: Math.max(insets.bottom, normalize(40)) }}>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_TITLE, marginBottom: normalize(8) }}>
            로그아웃할까요?
          </Text>
          <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', lineHeight: normalize(22), marginBottom: normalize(24) }}>
            다음에 다시 로그인하면 모든 기능을 이용할 수 있어요.
          </Text>

          <TouchableOpacity onPress={onConfirm} style={{ width: '100%', height: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginBottom: normalize(10) }}>
            <Text className="font-medium text-white tracking-tight" style={{ fontSize: FONT_MD }}>로그아웃</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ width: '100%', height: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-medium tracking-tight" style={{ fontSize: FONT_MD, color: 'rgba(0,0,0,0.55)' }}>취소</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function WithdrawModal({ visible, onClose, onConfirm, pending }: ModalProps & { pending?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: SCRIM, justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={() => {}} style={{ backgroundColor: '#fff', borderTopLeftRadius: normalize(24), borderTopRightRadius: normalize(24), paddingHorizontal: normalize(24), paddingTop: normalize(28), paddingBottom: Math.max(insets.bottom, normalize(40)) }}>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_TITLE, marginBottom: normalize(8) }}>
            정말 탈퇴하시겠어요?
          </Text>
          {/* 서버는 소프트 삭제 후 30일 뒤에 개인정보를 파기한다 —
              "복구할 수 없어요"로 두면 실제 동작과 다른 안내가 된다. */}
          <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', lineHeight: normalize(22), marginBottom: normalize(24) }}>
            탈퇴하면 바로 로그아웃되고, 프로필과 작성자 이름이 &apos;탈퇴한 사용자&apos;로 바뀌어요.
            작성한 게시글·댓글은 그대로 남습니다.{'\n'}
            30일 안에 같은 계정으로 다시 로그인하면 되돌릴 수 있고, 30일이 지나면 개인정보가 영구 삭제돼요.
          </Text>

          <TouchableOpacity
            onPress={onConfirm}
            disabled={pending}
            style={{ width: '100%', height: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, backgroundColor: 'rgba(255, 69, 58, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: normalize(10), opacity: pending ? 0.5 : 1 }}
          >
            <Text className="font-medium tracking-tight" style={{ fontSize: FONT_MD, color: '#ff453a' }}>
              {pending ? '처리 중...' : '탈퇴하기'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ width: '100%', height: BUTTON_HEIGHT, borderRadius: BUTTON_HEIGHT / 2, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-medium tracking-tight" style={{ fontSize: FONT_MD, color: 'rgba(0,0,0,0.55)' }}>취소</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
