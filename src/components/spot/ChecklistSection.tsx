import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { IconCheck, IconPlus, IconX } from '@tabler/icons-react-native';
import { toErrorMessage } from '@/api/auth';
import { useAddChecklistItem, useChecklist, useDeleteChecklistItem } from '@/hooks/useSpot';
import { FONT_MD, FONT_SM, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { ChecklistItemDTO } from '@/types/spot';

const MAX_USER_ITEMS = 10;
const MAX_CONTENT_LEN = 20;

interface Props {
  spotId: string;
}

// key: 기본 항목은 내용 기준, 사용자 항목은 id 기준 (재조회 후에도 체크 상태 유지)
function itemKey(item: ChecklistItemDTO): string {
  return item.id != null ? `u:${item.id}` : `d:${item.content}`;
}

export default function ChecklistSection({ spotId }: Props) {
  const { data, isLoading, isError } = useChecklist(spotId);
  const addItem = useAddChecklistItem(spotId);
  const deleteItem = useDeleteChecklistItem(spotId);

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

  const Title = (
    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(20), color: '#000', letterSpacing: -0.3, marginBottom: normalize(14) }}>
      촬영 체크리스트
    </Text>
  );

  // 로그인은 앱 진입 시 강제되므로(RootNavigator) 이 화면 도달 시 토큰은 항상 존재 → 미인증 분기 불필요
  if (isLoading || !data) {
    return (
      <View style={{ paddingHorizontal: GRID_PADDING }}>
        {Title}
        <View style={{ borderRadius: normalize(14), backgroundColor: '#F5F5F7', padding: normalize(20), alignItems: 'center' }}>
          {isError ? (
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
              체크리스트를 불러오지 못했어요.
            </Text>
          ) : (
            <ActivityIndicator color="#E31B59" />
          )}
        </View>
      </View>
    );
  }

  const items: ChecklistItemDTO[] = [...data.defaultItems, ...data.userItems];
  const canAdd = input.trim().length > 0 && data.userItems.length < MAX_USER_ITEMS && !addItem.isPending;

  return (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      {Title}
      <View style={{ borderRadius: normalize(14), backgroundColor: '#F5F5F7', paddingVertical: normalize(6) }}>
        {items.map((item) => {
          const key = itemKey(item);
          const checked = checkedKeys.has(key);
          const deletable = item.id != null;
          return (
            <View
              key={key}
              style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), paddingHorizontal: normalize(16), paddingVertical: normalize(12) }}
            >
              <Pressable
                onPress={() => toggleChecked(key)}
                hitSlop={8}
                style={{
                  width: normalize(24),
                  height: normalize(24),
                  borderRadius: normalize(12),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: checked ? '#E31B59' : 'transparent',
                  borderWidth: checked ? 0 : 1.2,
                  borderColor: 'rgba(0,0,0,0.12)',
                }}
              >
                {checked && <IconCheck size={normalize(14)} color="#fff" strokeWidth={2.5} />}
              </Pressable>
              <Text
                allowFontScaling={false}
                style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.2, color: checked ? '#000' : 'rgba(0,0,0,0.4)' }}
              >
                {item.content}
              </Text>
              {deletable && (
                <Pressable
                  onPress={() => deleteItem.mutate(item.id as number)}
                  disabled={deleteItem.isPending}
                  hitSlop={8}
                  style={{ width: normalize(24), height: normalize(24), alignItems: 'center', justifyContent: 'center' }}
                >
                  <IconX size={normalize(16)} color="rgba(0,0,0,0.3)" strokeWidth={2} />
                </Pressable>
              )}
            </View>
          );
        })}

        {/* 자유 입력 추가 행 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), paddingHorizontal: normalize(16), paddingVertical: normalize(10) }}>
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
            style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#000', letterSpacing: -0.2, paddingVertical: normalize(4) }}
          />
          <Pressable
            onPress={handleAdd}
            disabled={!canAdd}
            hitSlop={8}
            style={{
              width: normalize(28),
              height: normalize(28),
              borderRadius: normalize(14),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canAdd ? '#E31B59' : 'rgba(0,0,0,0.08)',
            }}
          >
            {addItem.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <IconPlus size={normalize(16)} color={canAdd ? '#fff' : 'rgba(0,0,0,0.25)'} strokeWidth={2.5} />
            )}
          </Pressable>
        </View>
      </View>

      {(addItem.isError || deleteItem.isError) && (
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#FF453A', letterSpacing: -0.2, marginTop: normalize(8) }}
        >
          {addItem.isError
            ? toErrorMessage(addItem.error, '항목 추가에 실패했어요.')
            : toErrorMessage(deleteItem.error, '항목 삭제에 실패했어요.')}
        </Text>
      )}
    </View>
  );
}
