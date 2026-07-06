import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconCheck, IconChevronLeft, IconPlus } from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { BUTTON_RADIUS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { TravelPlanOption } from '@/types/spot';

export const MOCK_TRAVEL_PLANS: TravelPlanOption[] = [
  { id: 'busan', name: '부산 2박 3일 여행', meta: '5월 24일–26일 · 스팟 7개', days: ['5월 24일', '5월 25일', '5월 26일'], thumbGradient: ['#f59e0b', '#c2410c'] },
  { id: 'jeju', name: '제주 힐링 여행', meta: '6월 7일–9일 · 스팟 5개', days: ['6월 7일', '6월 8일', '6월 9일'], thumbGradient: ['#3b82f6', '#1d4ed8'] },
  { id: 'seoul', name: '서울 포토스팟 투어', meta: '미정 · 스팟 3개', days: null, thumbGradient: ['#10b981', '#065f46'] },
  { id: 'jeonju', name: '전주 한옥마을 여행', meta: '7월 12일–13일 · 스팟 4개', days: ['7월 12일', '7월 13일'], thumbGradient: ['#a78bfa', '#7c3aed'] },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export default function SaveToPlanSheet({ visible, onClose, onSaved }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const selectedPlan = MOCK_TRAVEL_PLANS.find((p) => p.id === selectedPlanId) ?? null;
  const multiDay = (selectedPlan?.days?.length ?? 0) > 1;

  function reset() {
    setStep(1);
    setSelectedPlanId(null);
    setSelectedDay(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handlePrimaryStep1() {
    if (!selectedPlan) return;
    if (multiDay) {
      setStep(2);
    } else {
      onSaved('코스에 저장했습니다');
      reset();
    }
  }

  function handleSaveDay() {
    onSaved('코스에 저장했습니다');
    reset();
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      {step === 1 ? (
        <>
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
              코스에 저장
            </Text>
          </View>
          <View style={{ paddingHorizontal: GRID_PADDING }}>
            {MOCK_TRAVEL_PLANS.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  onPress={() => setSelectedPlanId(plan.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(12),
                    padding: normalize(14),
                    borderRadius: normalize(16),
                    backgroundColor: isSelected ? 'rgba(227,27,89,0.03)' : '#F5F5F7',
                    borderWidth: 1.5,
                    borderColor: isSelected ? '#E31B59' : 'transparent',
                    marginBottom: normalize(8),
                  }}
                >
                  <LinearGradient colors={plan.thumbGradient} style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(12) }} />
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(15), color: '#000', letterSpacing: -0.2 }}>
                      {plan.name}
                    </Text>
                    <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginTop: normalize(2) }}>{plan.meta}</Text>
                  </View>
                  <View
                    style={{
                      width: normalize(24),
                      height: normalize(24),
                      borderRadius: normalize(12),
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#E31B59' : 'rgba(0,0,0,0.15)',
                      backgroundColor: isSelected ? '#E31B59' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && <IconCheck size={normalize(12)} color="#fff" strokeWidth={2.5} />}
                  </View>
                </Pressable>
              );
            })}

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: normalize(12),
                padding: normalize(14),
                borderRadius: normalize(16),
                borderWidth: 1.5,
                borderColor: 'rgba(227,27,89,0.3)',
                borderStyle: 'dashed',
                marginTop: normalize(4),
                marginBottom: normalize(8),
              }}
            >
              <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(12), backgroundColor: 'rgba(227,27,89,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                <IconPlus size={normalize(22)} color="#e31b59" strokeWidth={2} />
              </View>
              <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(14), color: '#000' }}>새 여행 계획 만들기</Text>
            </View>
          </View>
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(12), paddingBottom: normalize(12) }}>
            <Pressable
              onPress={handlePrimaryStep1}
              disabled={!selectedPlan}
              style={{ width: '100%', height: normalize(52), borderRadius: BUTTON_RADIUS, alignItems: 'center', justifyContent: 'center', backgroundColor: selectedPlan ? '#E31B59' : 'rgba(0,0,0,0.08)' }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: selectedPlan ? '#fff' : 'rgba(0,0,0,0.25)' }}>
                {multiDay ? '다음' : '저장하기'}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4), paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
            <Pressable onPress={() => setStep(1)} hitSlop={8} style={{ width: normalize(32), height: normalize(32), alignItems: 'center', justifyContent: 'center', marginLeft: normalize(-6) }}>
              <IconChevronLeft size={normalize(18)} color="#000" strokeWidth={2} />
            </Pressable>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
              DAY 선택
            </Text>
          </View>
          <View style={{ paddingHorizontal: GRID_PADDING }}>
            <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.45)', letterSpacing: -0.15, lineHeight: normalizeFontSize(13) * 1.5, marginBottom: normalize(16) }}>
              <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>{selectedPlan?.name}</Text>에서{'\n'}이 스팟을 추가할 날을 선택해 주세요
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(8), marginBottom: normalize(8) }}>
              {selectedPlan?.days?.map((date, idx) => {
                const isSelected = selectedDay === date;
                return (
                  <Pressable
                    key={date}
                    onPress={() => setSelectedDay(date)}
                    style={{
                      minWidth: normalize(76),
                      alignItems: 'center',
                      paddingVertical: normalize(12),
                      paddingHorizontal: normalize(16),
                      borderRadius: normalize(14),
                      backgroundColor: isSelected ? 'rgba(227,27,89,0.06)' : '#F5F5F7',
                      borderWidth: 2,
                      borderColor: isSelected ? '#E31B59' : 'transparent',
                    }}
                  >
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(11), color: isSelected ? '#E31B59' : 'rgba(0,0,0,0.4)', letterSpacing: -0.1, marginBottom: normalize(2) }}>
                      {`DAY ${idx + 1}`}
                    </Text>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: isSelected ? '#E31B59' : '#000', letterSpacing: -0.25 }}>
                      {date}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(12), paddingBottom: normalize(12) }}>
            <Pressable
              onPress={handleSaveDay}
              disabled={!selectedDay}
              style={{ width: '100%', height: normalize(52), borderRadius: BUTTON_RADIUS, alignItems: 'center', justifyContent: 'center', backgroundColor: selectedDay ? '#E31B59' : 'rgba(0,0,0,0.08)' }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: selectedDay ? '#fff' : 'rgba(0,0,0,0.25)' }}>
                저장하기
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </BottomSheet>
  );
}
