import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import { toErrorMessage } from '@/api/auth';
import { useAddChecklistItem, useChecklist, useDeleteChecklistItem, useHideDefaultChecklistItem, useRestoreDefaultChecklistItem, useSpotDetail } from '@/hooks/useSpot';
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
  const restoreDefault = useRestoreDefaultChecklistItem(spotId);
  // 스팟 상세는 같은 화면에서 이미 조회됨 → 같은 쿼리키 캐시 재사용, 추가 요청 없음
  const { data: detail } = useSpotDetail(spotId);

  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  // 숨긴 항목은 접어둔 상태가 기본 — 숨긴 의도(정리)를 깨지 않기 위함
  const [showHidden, setShowHidden] = useState(false);

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
  // 숨긴 기본 항목 = 프리셋 전체(spot.checklist) - 현재 보이는 기본 항목.
  // defaultItemId는 프리셋 배열의 1-based 순번이라는 백엔드 규약에 기댄다(HiddenChecklistDefault).
  // ponytail: 백엔드가 숨김 목록을 안 내려줘서 클라에서 역산 — 응답에 hiddenDefaultItems가 생기면 이 블록은 지운다.
  const visibleDefaultIds = new Set(data.defaultItems.map((d) => d.defaultItemId));
  const hiddenDefaults = (detail?.info.checklist ?? [])
    .map((content, i) => ({ defaultItemId: i + 1, content }))
    .filter((p) => !visibleDefaultIds.has(p.defaultItemId));

  const deleting = deleteItem.isPending || hideDefault.isPending || restoreDefault.isPending;
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

      {hiddenDefaults.length > 0 && (
        <View style={{ marginTop: normalize(12) }}>
          <Pressable
            onPress={() => setShowHidden((v) => !v)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}
          >
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: C.labelMuted, letterSpacing: -0.2 }}
            >
              {`숨긴 기본 항목 ${hiddenDefaults.length}개`}
            </Text>
            {showHidden ? (
              <ChevronUp size={normalize(15)} color={C.labelMuted} strokeWidth={2} />
            ) : (
              <ChevronDown size={normalize(15)} color={C.labelMuted} strokeWidth={2} />
            )}
          </Pressable>

          {showHidden && (
            <View style={{ gap: normalize(8), marginTop: normalize(10) }}>
              {hiddenDefaults.map((item) => (
                <View
                  key={`h:${item.defaultItemId}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), backgroundColor: '#F7F6F4', borderRadius: normalize(13), paddingVertical: normalize(12), paddingHorizontal: normalize(15) }}
                >
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={{ flex: 1, fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(15), color: C.muted, letterSpacing: -0.2 }}
                  >
                    {item.content}
                  </Text>
                  <Pressable
                    onPress={() => restoreDefault.mutate(item.defaultItemId)}
                    disabled={deleting}
                    hitSlop={8}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: ACCENT, letterSpacing: -0.2 }}
                    >
                      되돌리기
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {(addItem.isError || deleteItem.isError || hideDefault.isError || restoreDefault.isError) && (
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#FF453A', letterSpacing: -0.2, marginTop: normalize(8) }}
        >
          {addItem.isError
            ? toErrorMessage(addItem.error, '항목 추가에 실패했어요.')
            : deleteItem.isError
              ? toErrorMessage(deleteItem.error, '항목 삭제에 실패했어요.')
              : hideDefault.isError
                ? toErrorMessage(hideDefault.error, '기본 항목 삭제에 실패했어요.')
                : toErrorMessage(restoreDefault.error, '되돌리기에 실패했어요.')}
        </Text>
      )}
    </View>
  );
}
