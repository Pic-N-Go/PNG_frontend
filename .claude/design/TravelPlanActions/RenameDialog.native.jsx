// RenameDialog.native.jsx
// 여행 계획 > 더보기 시트 > "이름 변경" → 중앙 다이얼로그
// - X (클리어) 버튼 · 카운터 (기본 회색 → 41~50 브랜드 강조) · 최대 50자
// - 저장 disabled 규칙: 공백만 있거나 원본과 동일
// - 키보드 오픈 시 KeyboardAvoidingView(padding) 로 다이얼로그 위로 밀림
// - 폰트 토큰: 17(다이얼로그 타이틀) / 15(인풋·버튼) / 13(설명) / 11(카운터)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { IconX } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';

const MAX_LEN = 50;

const C = {
  bg: '#ffffff',
  cardShadow: 'rgba(0,0,0,0.18)',
  scrim: 'rgba(0,0,0,0.4)',
  brand: '#e31b59',
  cancelBg: '#f5f5f7',
  clearBg: 'rgba(0,0,0,0.2)',
  text1: '#000000',
  text2: 'rgba(0,0,0,0.5)',
  text3: 'rgba(0,0,0,0.4)',
  counterActive: 'rgba(0,0,0,0.5)',
};

const F = {
  xs: normalize(11),
  sm: normalize(13),
  md: normalize(15),
  lg: normalize(17),
};

export default function RenameDialog({ visible, initialName = '', onClose, onSubmit }) {
  const [value, setValue] = useState(initialName);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setValue(initialName);
      // 다음 tick 에 자동 포커스 (모달 마운트 후)
      const t = setTimeout(() => inputRef.current?.focus?.(), 80);
      return () => clearTimeout(t);
    }
  }, [visible, initialName]);

  const trimmed = value.trim();
  const isSame = trimmed === initialName.trim();
  const isEmpty = trimmed.length === 0;
  const canSave = !isEmpty && !isSame;

  const nearLimit = value.length >= 41;
  const counterColor = nearLimit ? C.brand : C.text3;
  const counterMainColor = nearLimit ? C.brand : C.counterActive;

  const onClear = useCallback(() => {
    setValue('');
    inputRef.current?.focus?.();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!canSave) return;
    Keyboard.dismiss();
    onSubmit?.(trimmed);
    onClose?.();
  }, [canSave, trimmed, onSubmit, onClose]);

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    onClose?.();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel} statusBarTranslucent>
      <Pressable style={{ flex: 1, backgroundColor: C.scrim }} onPress={handleCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'center', paddingHorizontal: normalize(24) }}
        >
          {/* 다이얼로그 (탭 시 dismiss 방지) */}
          <Pressable onPress={() => {}} style={{
            backgroundColor: C.bg,
            borderRadius: normalize(20),
            paddingHorizontal: normalize(20),
            paddingTop: normalize(24),
            paddingBottom: normalize(16),
            shadowColor: '#000',
            shadowOpacity: 0.18,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 12 },
            elevation: 24,
          }}>
            {/* header */}
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: F.lg, fontWeight: '700', color: C.text1 }}>이름 변경</Text>
              <Text style={{ fontSize: F.sm, color: C.text2, marginTop: normalize(6) }}>
                여행 계획의 이름을 입력해 주세요
              </Text>
            </View>

            {/* input */}
            <View style={{ marginTop: normalize(18), position: 'relative' }}>
              <View style={{
                borderWidth: 1.5,
                borderColor: C.brand,
                borderRadius: normalize(12),
                paddingVertical: normalize(12),
                paddingLeft: normalize(14),
                paddingRight: normalize(40),
                backgroundColor: '#fff',
                minHeight: normalize(48),
                justifyContent: 'center',
              }}>
                <TextInput
                  ref={inputRef}
                  value={value}
                  onChangeText={(t) => setValue(t.slice(0, MAX_LEN))}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="done"
                  maxLength={MAX_LEN}
                  placeholder="예: 부산 1박 2일"
                  placeholderTextColor="rgba(0,0,0,0.28)"
                  selectionColor={C.brand}
                  style={{
                    padding: 0,
                    margin: 0,
                    fontSize: F.md,
                    fontWeight: '500',
                    color: C.text1,
                    // Pretendard fallback (CJK 안정성)
                    fontFamily: Platform.select({
                      ios: 'Pretendard',
                      android: 'Pretendard',
                      default: undefined,
                    }),
                  }}
                />
              </View>

              {/* clear button */}
              {value.length > 0 ? (
                <Pressable
                  onPress={onClear}
                  hitSlop={8}
                  accessibilityLabel="지우기"
                  style={({ pressed }) => ({
                    position: 'absolute',
                    right: normalize(10),
                    top: '50%',
                    transform: [{ translateY: -normalize(11) }],
                    width: normalize(22),
                    height: normalize(22),
                    borderRadius: normalize(11),
                    backgroundColor: C.clearBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <IconX size={normalize(10)} color="#fff" strokeWidth={3} />
                </Pressable>
              ) : null}
            </View>

            {/* counter */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: normalize(6) }}>
              <Text style={{ fontSize: F.xs }}>
                <Text style={{ color: counterMainColor, fontWeight: '600' }}>{value.length}</Text>
                <Text style={{ color: counterColor }}>/{MAX_LEN}</Text>
              </Text>
            </View>

            {/* actions */}
            <View style={{ flexDirection: 'row', gap: normalize(8), marginTop: normalize(12) }}>
              <Pressable
                onPress={handleCancel}
                style={({ pressed }) => ({
                  flex: 1,
                  height: normalize(48),
                  backgroundColor: C.cancelBg,
                  borderRadius: normalize(14),
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: F.md, fontWeight: '600', color: 'rgba(0,0,0,0.7)' }}>취소</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={!canSave}
                style={({ pressed }) => ({
                  flex: 1.2,
                  height: normalize(48),
                  backgroundColor: C.brand,
                  borderRadius: normalize(14),
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: !canSave ? 0.4 : pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontSize: F.md, fontWeight: '700', color: '#fff' }}>저장</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// 사용 예 · TravelPlanMoreSheet 에서 트리거
// ─────────────────────────────────────────────────────────────
// const [renameOpen, setRenameOpen] = useState(false);
//
// <TravelPlanMoreSheet
//   ...
//   onRename={() => setRenameOpen(true)}
// />
//
// <RenameDialog
//   visible={renameOpen}
//   initialName={plan.name}
//   onClose={() => setRenameOpen(false)}
//   onSubmit={(nextName) => {
//     renamePlanMutation.mutate({ id: plan.id, name: nextName });
//   }}
// />
