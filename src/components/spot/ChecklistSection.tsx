import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Check, Plus, X } from 'lucide-react-native';
import { toErrorMessage } from '@/api/auth';
import { useAddChecklistItem, useChecklist, useDeleteChecklistItem, useHideDefaultChecklistItem } from '@/hooks/useSpot';
import { FONT_SM, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const MAX_USER_ITEMS = 10;
const MAX_CONTENT_LEN = 20;

const ACCENT = '#E31B59';
const CARD_BORDER = 'rgba(0,0,0,0.07)';
const C = { text: '#1F1E1D', muted: '#B5B0AA', labelMuted: '#A39E98' };

interface Props {
  spotId: string;
}

// 기본 항목(defaultItemId로 숨김)과 사용자 항목(id로 삭제)을 한 리스트로 정규화
type ChecklistRow =
  | { kind: 'default'; key: string; content: string; defaultItemId: number }
  | { kind: 'user'; key: string; content: string; id: number };

export default function ChecklistSection({ spotId }: Props) {
  const { data, isLoading, isError } = useChecklist(spotId);
  const addItem = useAddChecklistItem(spotId);
  const deleteItem = useDeleteChecklistItem(spotId);
  const hideDefault = useHideDefaultChecklistItem(spotId);

  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');

  function toggleChecked(key: string) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleAdd() {
    const content = input.trim();
    if (!content || addItem.isPending || (data?.userItems.length ?? 0) >= MAX_USER_ITEMS) return;
    addItem.mutate(content, { onSuccess: () => setInput('') });
  }

  const heading = (count?: { done: number; total: number }) => (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: normalize(16) }}>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(20), color: C.text, letterSpacing: -0.4 }}>
        촬영 체크리스트
      </Text>
      {count ? (
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(13), color: C.labelMuted }}>
          {count.done}/{count.total}
        </Text>
      ) : null}
    </View>
  );

  // 로그인은 앱 진입 시 강제되므로(RootNavigator) 이 화면 도달 시 토큰은 항상 존재 → 미인증 분기 불필요
  if (isLoading || !data) {
    return (
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        {heading()}
        <View style={{ borderRadius: normalize(14), backgroundColor: '#F7F6F4', padding: normalize(20), alignItems: 'center' }}>
          {isError ? (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
              체크리스트를 불러오지 못했어요.
            </Text>
          ) : (
            <ActivityIndicator color={ACCENT} />
          )}
        </View>
      </View>
    );
  }

  const rows: ChecklistRow[] = [
    ...data.defaultItems.map((d) => ({ kind: 'default' as const, key: `d:${d.defaultItemId}`, content: d.content, defaultItemId: d.defaultItemId })),
    ...data.userItems.map((u) => ({ kind: 'user' as const, key: `u:${u.id}`, content: u.content, id: u.id })),
  ];
  const deleting = deleteItem.isPending || hideDefault.isPending;
  const canAdd = input.trim().length > 0 && data.userItems.length < MAX_USER_ITEMS && !addItem.isPending;
  const doneCount = rows.filter((r) => checkedKeys.has(r.key)).length;

  return (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      {heading({ done: doneCount, total: rows.length })}

      <View style={{ gap: normalize(8) }}>
        {rows.map((row) => {
          const checked = checkedKeys.has(row.key);
          return (
            <View
              key={row.key}
              style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), backgroundColor: '#fff', borderWidth: 1, borderColor: CARD_BORDER, borderRadius: normalize(13), paddingVertical: normalize(14), paddingHorizontal: normalize(15) }}
            >
              <Pressable
                onPress={() => toggleChecked(row.key)}
                hitSlop={8}
                style={{
                  width: normalize(24),
                  height: normalize(24),
                  borderRadius: normalize(12),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: checked ? ACCENT : 'transparent',
                  borderWidth: 2,
                  borderColor: checked ? ACCENT : '#D8D4CF',
                }}
              >
                {checked && <Check size={normalize(15)} color="#fff" strokeWidth={3} />}
              </Pressable>
              <Text
                allowFontScaling={false}
                style={{
                  flex: 1,
                  fontFamily: 'Pretendard-Medium',
                  fontSize: normalizeFontSize(15.5),
                  letterSpacing: -0.2,
                  color: checked ? C.muted : C.text,
                  textDecorationLine: checked ? 'line-through' : 'none',
                }}
              >
                {row.content}
              </Text>
              <Pressable
                onPress={() => (row.kind === 'user' ? deleteItem.mutate(row.id) : hideDefault.mutate(row.defaultItemId))}
                disabled={deleting}
                hitSlop={8}
              >
                <X size={normalize(19)} color="#C4BFB9" />
              </Pressable>
            </View>
          );
        })}

        {/* 자유 입력 추가 카드 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), backgroundColor: '#fff', borderWidth: 1, borderColor: CARD_BORDER, borderRadius: normalize(13), paddingVertical: normalize(10), paddingHorizontal: normalize(15) }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleAdd}
            editable={data.userItems.length < MAX_USER_ITEMS}
            placeholder={data.userItems.length < MAX_USER_ITEMS ? '준비물 추가 (최대 20자)' : '최대 10개까지 추가할 수 있어요'}
            placeholderTextColor="rgba(0,0,0,0.3)"
            maxLength={MAX_CONTENT_LEN}
            returnKeyType="done"
            allowFontScaling={false}
            style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(15), color: C.text, letterSpacing: -0.2, paddingVertical: normalize(4) }}
          />
          <Pressable
            onPress={handleAdd}
            disabled={!canAdd}
            hitSlop={8}
            style={{ width: normalize(28), height: normalize(28), borderRadius: normalize(14), alignItems: 'center', justifyContent: 'center', backgroundColor: canAdd ? ACCENT : 'rgba(0,0,0,0.08)' }}
          >
            {addItem.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Plus size={normalize(16)} color={canAdd ? '#fff' : 'rgba(0,0,0,0.25)'} strokeWidth={2.5} />
            )}
          </Pressable>
        </View>
      </View>

      {(addItem.isError || deleteItem.isError || hideDefault.isError) && (
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#FF453A', letterSpacing: -0.2, marginTop: normalize(8) }}
        >
          {addItem.isError
            ? toErrorMessage(addItem.error, '항목 추가에 실패했어요.')
            : deleteItem.isError
              ? toErrorMessage(deleteItem.error, '항목 삭제에 실패했어요.')
              : toErrorMessage(hideDefault.error, '기본 항목 삭제에 실패했어요.')}
        </Text>
      )}
    </View>
  );
}
