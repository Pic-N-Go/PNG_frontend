import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { IconCheck, IconEdit } from '@tabler/icons-react-native';
import Chip from '@/components/common/Chip';
import { BUTTON_RADIUS, FONT_MD, FONT_SM, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { ChecklistOption } from '@/types/spot';

export const MOCK_CHECKLIST_OPTIONS: ChecklistOption[] = [
  { id: 'tripod', label: '삼각대' },
  { id: 'wide-lens', label: '광각렌즈 (16-35mm)' },
  { id: 'nd-filter', label: 'ND 필터' },
  { id: 'battery', label: '보조배터리' },
  { id: 'shoes', label: '편한 신발' },
  { id: 'jacket', label: '방수 재킷' },
  { id: 'memory-card', label: '여분 메모리카드' },
  { id: 'flashlight', label: '손전등' },
];

interface SavedItem {
  id: string;
  label: string;
  checked: boolean;
}

export default function ChecklistSection() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const hasSaved = savedItems.length > 0;

  function toggleOption(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function handleSave() {
    setSavedItems(
      selectedIds.map((id) => ({
        id,
        label: MOCK_CHECKLIST_OPTIONS.find((o) => o.id === id)?.label ?? id,
        checked: true,
      }))
    );
    setIsEditing(false);
  }

  function enterEdit() {
    setSelectedIds(savedItems.map((item) => item.id));
    setIsEditing(true);
  }

  function toggleChecked(id: string) {
    setSavedItems((prev) => prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)));
  }

  return (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: normalize(14) }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(20), color: '#000', letterSpacing: -0.3 }}>
          촬영 체크리스트
        </Text>
        {!isEditing && hasSaved && (
          <Pressable onPress={enterEdit} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
            <IconEdit size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2 }}>
              수정
            </Text>
          </Pressable>
        )}
      </View>

      {isEditing ? (
        <View style={{ borderRadius: normalize(14), backgroundColor: '#F5F5F7', padding: normalize(16) }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)', letterSpacing: -0.2, marginBottom: normalize(14) }}>
            촬영에 필요한 항목을 선택해 체크리스트를 등록하세요.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(8), marginBottom: normalize(16) }}>
            {MOCK_CHECKLIST_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                selected={selectedIds.includes(option.id)}
                onPress={() => toggleOption(option.id)}
                variant="outline"
                showDot
                fontSize={normalizeFontSize(13)}
              />
            ))}
          </View>
          <Pressable
            onPress={handleSave}
            disabled={selectedIds.length === 0}
            style={{
              width: '100%',
              height: normalize(44),
              borderRadius: BUTTON_RADIUS,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selectedIds.length === 0 ? 'rgba(0,0,0,0.08)' : '#E31B59',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: FONT_SM,
                color: selectedIds.length === 0 ? 'rgba(0,0,0,0.25)' : '#fff',
                letterSpacing: -0.2,
              }}
            >
              저장
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ borderRadius: normalize(14), backgroundColor: '#F5F5F7', paddingVertical: normalize(6) }}>
          {savedItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggleChecked(item.id)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), paddingHorizontal: normalize(16), paddingVertical: normalize(12) }}
            >
              <View
                style={{
                  width: normalize(24),
                  height: normalize(24),
                  borderRadius: normalize(12),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: item.checked ? '#E31B59' : 'transparent',
                  borderWidth: item.checked ? 0 : 1.2,
                  borderColor: 'rgba(0,0,0,0.12)',
                }}
              >
                {item.checked && <IconCheck size={normalize(14)} color="#fff" strokeWidth={2.5} />}
              </View>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, letterSpacing: -0.2, color: item.checked ? '#000' : 'rgba(0,0,0,0.4)' }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
