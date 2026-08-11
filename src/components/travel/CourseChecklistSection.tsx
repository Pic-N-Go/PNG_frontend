import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import { useMutation } from '@tanstack/react-query';
import { toErrorMessage } from '@/api/auth';
import { coursesApi, type CourseChecklist } from '@/api/courses';
import { FONT_SM } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

// 스팟 상세 ChecklistSection의 UI를 코스 API(플랫 목록 + 서버 저장 isChecked)에 맞춰 옮긴 것.
// 스타일은 normalize()로 스케일되는 값이라 className으로 옮기면 360dp 대응이 깨져 인라인 유지.

// 코스에는 스팟의 cat3 같은 카테고리 근거가 없어 기본 항목을 상수로 둔다.
// 서버에 미리 만들어두지 않고 탭할 때 일반 항목으로 추가한다 → 조회만 했는데 쓰기가 발생하는 일 없음.
// ponytail: 백엔드가 코스 기본 항목을 내려주면 이 상수와 아래 preset 블록을 지운다.
const PRESET = ['삼각대', '여분 배터리', '메모리카드', '렌즈 클리너', '보조배터리', '편한 신발'];

// 코스 API는 개수 제한이 없고 content는 200자까지 허용하지만,
// 카드 한 줄에 담기는 길이만 받도록 스팟과 같은 20자로 맞춘다.
const MAX_CONTENT_LEN = 20;

const ACCENT = '#E31B59';
const CARD_BORDER = 'rgba(0,0,0,0.07)';
const C = { text: '#1F1E1D', muted: '#B5B0AA', labelMuted: '#A39E98' };

interface Props {
  courseId: number;
  items: CourseChecklist[];
  loading?: boolean;
  /** 코스 쿼리 refetch — 항목이 바뀐 뒤 목록을 다시 읽는다. */
  onChanged: () => Promise<unknown>;
}

export default function CourseChecklistSection({ courseId, items, loading, onChanged }: Props) {
  const [input, setInput] = useState('');
  // 서버 왕복 + refetch가 끝날 때까지 체크박스가 멈춰 보이지 않도록 낙관적 값을 들고 있는다.
  const [pendingChecks, setPendingChecks] = useState<Record<number, boolean>>({});
  // 사용자가 직접 접거나 펼치기 전까지는 "항목이 하나도 없으면 펼침"이 기본.
  // 초기값으로 넣으면 로딩 중(items=[]) 시점에 고정돼버려 렌더마다 items로 판단한다.
  const [presetToggled, setPresetToggled] = useState<boolean | null>(null);
  const showPreset = presetToggled ?? items.length === 0;

  const isChecked = (item: CourseChecklist) => pendingChecks[item.id] ?? item.isChecked;

  const toggleItem = useMutation({
    mutationFn: (checklistId: number) => coursesApi.toggleChecklist(courseId, checklistId),
    onMutate: (checklistId: number) => {
      const target = items.find((i) => i.id === checklistId);
      setPendingChecks((prev) => ({ ...prev, [checklistId]: !(target ? isChecked(target) : false) }));
    },
    // refetch가 끝난 뒤에 낙관적 값을 버린다. 먼저 버리면 예전 값으로 한 번 깜빡인다.
    onSettled: async (_data, _error, checklistId) => {
      await onChanged();
      setPendingChecks(({ [checklistId]: _drop, ...rest }) => rest);
    },
  });

  const addItem = useMutation({
    mutationFn: (content: string) => coursesApi.addChecklist(courseId, content),
    onSuccess: () => onChanged(),
  });

  const deleteItem = useMutation({
    mutationFn: (checklistId: number) => coursesApi.deleteChecklist(courseId, checklistId),
    onSuccess: () => onChanged(),
  });

  function handleAdd() {
    const content = input.trim();
    if (!content || addItem.isPending) return;
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

  if (loading) {
    return (
      <View>
        {heading()}
        <View style={{ borderRadius: normalize(14), backgroundColor: '#F7F6F4', padding: normalize(20), alignItems: 'center' }}>
          <ActivityIndicator color={ACCENT} />
        </View>
      </View>
    );
  }

  // 이미 추가한 기본 항목은 목록에 있으니 프리셋에서 뺀다.
  const remainingPreset = PRESET.filter((p) => !items.some((i) => i.content === p));

  const canAdd = input.trim().length > 0 && !addItem.isPending;
  const doneCount = items.filter(isChecked).length;

  return (
    // 좌우 패딩은 부모(코스 화면 footer, CONTENT_PADDING)가 가진다 → 위쪽 팁 배너와 같은 선에 맞음
    <View>
      {heading({ done: doneCount, total: items.length })}

      <View style={{ gap: normalize(8) }}>
        {items.map((item) => {
          const checked = isChecked(item);
          return (
            <View
              key={item.id}
              style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), backgroundColor: '#fff', borderWidth: 1, borderColor: CARD_BORDER, borderRadius: normalize(13), paddingVertical: normalize(14), paddingHorizontal: normalize(15) }}
            >
              <Pressable
                onPress={() => toggleItem.mutate(item.id)}
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
                {item.content}
              </Text>
              <Pressable onPress={() => deleteItem.mutate(item.id)} disabled={deleteItem.isPending} hitSlop={8}>
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
            placeholder="준비물 추가 (최대 20자)"
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

      {remainingPreset.length > 0 && (
        <View style={{ marginTop: normalize(12) }}>
          <Pressable
            onPress={() => setPresetToggled(!showPreset)}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}
          >
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: C.labelMuted, letterSpacing: -0.2 }}
            >
              {`기본 항목 ${remainingPreset.length}개`}
            </Text>
            {showPreset ? (
              <ChevronUp size={normalize(15)} color={C.labelMuted} strokeWidth={2} />
            ) : (
              <ChevronDown size={normalize(15)} color={C.labelMuted} strokeWidth={2} />
            )}
          </Pressable>

          {showPreset && (
            <View style={{ gap: normalize(8), marginTop: normalize(10) }}>
              {remainingPreset.map((content) => (
                <View
                  key={`p:${content}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), backgroundColor: '#F7F6F4', borderRadius: normalize(13), paddingVertical: normalize(12), paddingHorizontal: normalize(15) }}
                >
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    style={{ flex: 1, fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(15), color: C.muted, letterSpacing: -0.2 }}
                  >
                    {content}
                  </Text>
                  <Pressable onPress={() => addItem.mutate(content)} disabled={addItem.isPending} hitSlop={8}>
                    <Text
                      allowFontScaling={false}
                      style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: ACCENT, letterSpacing: -0.2 }}
                    >
                      추가
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {(addItem.isError || deleteItem.isError || toggleItem.isError) && (
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#FF453A', letterSpacing: -0.2, marginTop: normalize(8) }}
        >
          {addItem.isError
            ? toErrorMessage(addItem.error, '항목 추가에 실패했어요.')
            : deleteItem.isError
              ? toErrorMessage(deleteItem.error, '항목 삭제에 실패했어요.')
              : toErrorMessage(toggleItem.error, '체크 상태 변경에 실패했어요.')}
        </Text>
      )}
    </View>
  );
}
