import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  IconX,
  IconSparkles,
  IconCalendar,
  IconMapPin,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import {
  BUTTON_HEIGHT,
  BUTTON_RADIUS,
  FONT_2XS,
  FONT_XS,
  FONT_SM,
  FONT_MD,
  FONT_TITLE,
} from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';
import { getSeasonalSuggestions, type SuggestionChip } from '@/types/aiCourse';
import { coursesApi } from '@/api/courses';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccessNavigate: (courseId: number) => void;
}

const REGIONS = ['전체(자동)', '서울', '부산', '제주', '강원', '경북', '전남', '경기'];

const STEPS = [
  '1단계: 출사 의도 및 테마 분석 완료',
  '2단계: 실존 스팟 후보 탐색 완료',
  '3단계: 일몰 골든아워 및 최단 동선 계산 중',
  '4단계: 스팟별 사진 촬영 팁 작성 중',
];

function getTomorrow(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AiCoursePlannerBottomSheet({ visible, onClose, onSuccessNavigate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('전체(자동)');
  const [targetDate, setTargetDate] = useState<Date>(getTomorrow());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 진행 상태: 'idle' | 'loading' | 'error' | 'timeout'
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'timeout'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);

  const seasonalChips = React.useMemo(() => getSeasonalSuggestions(), []);

  const resetForm = useCallback(() => {
    setPrompt('');
    setSelectedRegion('전체(자동)');
    setTargetDate(getTomorrow());
    setShowDatePicker(false);
    setStatus('idle');
    setCurrentStepIndex(0);
    setErrorMessage('');
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    pollCountRef.current = 0;
  }, []);

  const handleClose = useCallback(() => {
    if (status === 'loading') return;
    resetForm();
    onClose();
  }, [status, resetForm, onClose]);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible, resetForm]);

  const handleSelectChip = (chip: SuggestionChip) => {
    setPrompt(chip.prompt);
    setSelectedRegion(chip.region);
  };

  const handleDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selected) {
      setTargetDate(selected);
    }
  };

  const startStepAnimation = () => {
    setCurrentStepIndex(0);
    stepTimerRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 900);
  };

  const handleSubmit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    Keyboard.dismiss();
    setStatus('loading');
    setErrorMessage('');
    startStepAnimation();

    try {
      const regionParam = selectedRegion === '전체(자동)' ? undefined : selectedRegion;
      const res = await coursesApi.requestAiPlan({
        prompt: trimmed,
        region: regionParam,
        targetDate: formatDate(targetDate),
      });

      const taskId = res.taskId;
      if (!taskId) {
        throw new Error('작업 ID를 발급받지 못했습니다.');
      }

      pollCountRef.current = 0;
      pollingTimerRef.current = setInterval(async () => {
        pollCountRef.current += 1;

        try {
          const pollRes = await coursesApi.getAiPlanStatus(taskId);
          if (pollRes.status === 'COMPLETED' && pollRes.courseId) {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            if (stepTimerRef.current) clearInterval(stepTimerRef.current);

            resetForm();
            onClose();
            onSuccessNavigate(pollRes.courseId);
          } else if (pollRes.status === 'FAILED') {
            if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
            if (stepTimerRef.current) clearInterval(stepTimerRef.current);
            setStatus('error');
            setErrorMessage('코스 기획에 실패했습니다. 다시 시도해 주세요.');
          }
        } catch (pollErr: any) {
          console.warn('AI plan polling error:', pollErr);
        }

        // 최대 10회(약 10초) 폴링 후 완료되지 않으면 타임아웃 안내
        if (pollCountRef.current >= 10) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          if (stepTimerRef.current) clearInterval(stepTimerRef.current);
          setStatus('timeout');
        }
      }, 1000);
    } catch (err: any) {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      setStatus('error');
      setErrorMessage(err.message || '코스 기획 요청 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    };
  }, []);

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-6 py-2">
        <View className="flex-1">
          <View className="flex-row items-center">
            <IconSparkles size={normalize(18)} color={BRAND} strokeWidth={2} style={{ marginRight: normalize(6) }} />
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: FONT_TITLE,
                color: '#000000',
                letterSpacing: -0.3,
              }}
            >
              AI 맞춤 출사 플래너
            </Text>
          </View>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: FONT_SM,
              color: TEXT_SUB,
              letterSpacing: -0.2,
              marginTop: normalize(4),
            }}
          >
            원하는 출사 여행을 자유롭게 입력해 주세요.
          </Text>
        </View>

        {status !== 'loading' && (
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="p-1.5 rounded-full bg-black/5"
          >
            <IconX size={normalize(18)} color="rgba(0,0,0,0.5)" />
          </TouchableOpacity>
        )}
      </View>

      {/* 본문 콘텐츠: 진행 상태에 따른 분기 */}
      {status === 'loading' ? (
        <View className="items-center justify-center py-8 px-6">
          <ActivityIndicator size="large" color={BRAND} style={{ marginBottom: normalize(18) }} />
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: FONT_TITLE,
              color: '#000000',
              letterSpacing: -0.3,
              marginBottom: normalize(20),
            }}
          >
            출사 코스를 기획하고 있습니다
          </Text>

          {/* 단계별 진행 상태 목록 */}
          <View className="w-full bg-card rounded-2xl p-4 gap-y-3">
            {STEPS.map((stepText, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <View key={stepText} className="flex-row items-center">
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center mr-2.5"
                    style={{
                      backgroundColor: isDone
                        ? BRAND
                        : isCurrent
                        ? 'rgba(227, 27, 89, 0.15)'
                        : 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {isDone ? (
                      <IconCheck size={normalize(12)} color="#FFFFFF" strokeWidth={2.5} />
                    ) : (
                      <View
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          backgroundColor: isCurrent ? BRAND : 'rgba(0,0,0,0.25)',
                        }}
                      />
                    )}
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: isCurrent ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                      fontSize: FONT_SM,
                      color: isDone || isCurrent ? '#000000' : 'rgba(0,0,0,0.35)',
                      letterSpacing: -0.2,
                    }}
                  >
                    {stepText}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : status === 'error' || status === 'timeout' ? (
        <View className="items-center justify-center py-8 px-6">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: status === 'error' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(0,0,0,0.06)' }}
          >
            <IconAlertCircle
              size={normalize(24)}
              color={status === 'error' ? '#FF3B30' : '#000000'}
            />
          </View>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-SemiBold',
              fontSize: FONT_TITLE,
              color: '#000000',
              letterSpacing: -0.3,
              marginBottom: normalize(8),
              textAlign: 'center',
            }}
          >
            {status === 'error' ? '기획 요청 실패' : '작업 진행 중'}
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: FONT_SM,
              color: TEXT_SUB,
              letterSpacing: -0.2,
              textAlign: 'center',
              lineHeight: normalize(20),
              marginBottom: normalize(24),
            }}
          >
            {status === 'error'
              ? errorMessage || '출사 코스를 기획하지 못했습니다.'
              : '코스 기획에 시간이 다소 소요되고 있습니다.\n완료되면 푸시 알림으로 코스를 안내해 드립니다.'}
          </Text>

          <TouchableOpacity
            onPress={resetForm}
            className="w-full rounded-full items-center justify-center bg-brand"
            style={{ height: BUTTON_HEIGHT }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: FONT_MD,
                color: '#FFFFFF',
              }}
            >
              {status === 'error' ? '다시 입력하기' : '확인'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: normalize(24), paddingTop: normalize(8), paddingBottom: normalize(16) }}
        >
          {/* 프롬프트 입력창 */}
          <View className="mb-4">
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: FONT_SM,
                color: '#000000',
                marginBottom: normalize(8),
              }}
            >
              출사 테마 및 원하는 일정
            </Text>
            <TextInput
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={4}
              placeholder="예: 이번 주말 부산에서 노을과 야경 보기 좋은 감성 출사 코스 추천해줘"
              placeholderTextColor="rgba(0,0,0,0.3)"
              style={{
                minHeight: normalize(100),
                borderRadius: normalize(16),
                backgroundColor: CARD,
                padding: normalize(14),
                color: '#000000',
                fontFamily: 'Pretendard-Regular',
                fontSize: FONT_SM,
                textAlignVertical: 'top',
                lineHeight: normalize(20),
              }}
            />
          </View>

          {/* 계절별 추천 칩 */}
          <View className="mb-5">
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-Medium',
                fontSize: FONT_XS,
                color: TEXT_SUB,
                marginBottom: normalize(8),
              }}
            >
              계절 추천 키워드
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: normalize(8) }}>
              {seasonalChips.map((chip) => {
                const isSelected = prompt === chip.prompt;
                return (
                  <TouchableOpacity
                    key={chip.label}
                    onPress={() => handleSelectChip(chip)}
                    activeOpacity={0.8}
                    className="items-center justify-center rounded-full"
                    style={{
                      height: normalize(32),
                      paddingHorizontal: normalize(12),
                      backgroundColor: isSelected ? 'rgba(227, 27, 89, 0.08)' : CARD,
                      borderWidth: 1,
                      borderColor: isSelected ? BRAND : 'transparent',
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: isSelected ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                        fontSize: FONT_XS,
                        color: isSelected ? BRAND : 'rgba(0,0,0,0.7)',
                        letterSpacing: -0.2,
                      }}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* 선택 옵션 (지역 & 날짜) */}
          <View className="mb-6 gap-y-4">
            {/* 지역 선택 */}
            <View>
              <View className="flex-row items-center mb-2">
                <IconMapPin size={normalize(14)} color={TEXT_SUB} style={{ marginRight: normalize(4) }} />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Medium',
                    fontSize: FONT_XS,
                    color: TEXT_SUB,
                  }}
                >
                  출사 지역
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: normalize(6) }}>
                {REGIONS.map((r) => {
                  const active = selectedRegion === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setSelectedRegion(r)}
                      className="items-center justify-center rounded-full"
                      style={{
                        height: normalize(30),
                        paddingHorizontal: normalize(12),
                        backgroundColor: active ? '#000000' : CARD,
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                          fontSize: FONT_2XS,
                          color: active ? '#FFFFFF' : 'rgba(0,0,0,0.65)',
                        }}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 날짜 선택 */}
            <View>
              <View className="flex-row items-center mb-2">
                <IconCalendar size={normalize(14)} color={TEXT_SUB} style={{ marginRight: normalize(4) }} />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Medium',
                    fontSize: FONT_XS,
                    color: TEXT_SUB,
                  }}
                >
                  출사 일정
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDatePicker((prev) => !prev)}
                className="flex-row items-center justify-between rounded-xl px-4 py-3"
                style={{
                  backgroundColor: CARD,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Medium',
                    fontSize: FONT_SM,
                    color: '#000000',
                  }}
                >
                  {formatDate(targetDate)}
                </Text>
                <IconCalendar size={normalize(18)} color="rgba(0,0,0,0.4)" />
              </TouchableOpacity>

              {showDatePicker && (
                <View className="mt-2 items-center bg-card rounded-xl p-2">
                  <DateTimePicker
                    value={targetDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={new Date()}
                    themeVariant="light"
                    accentColor={BRAND}
                    onChange={handleDateChange}
                  />
                </View>
              )}
            </View>
          </View>

          {/* 메인 액션 버튼 */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!prompt.trim()}
            activeOpacity={0.85}
            className="w-full rounded-full items-center justify-center flex-row"
            style={{
              height: BUTTON_HEIGHT,
              borderRadius: BUTTON_RADIUS,
              backgroundColor: prompt.trim() ? BRAND : 'rgba(0,0,0,0.08)',
            }}
          >
            <IconSparkles size={normalize(18)} color="#FFFFFF" strokeWidth={2} style={{ marginRight: normalize(6) }} />
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Pretendard-SemiBold',
                fontSize: FONT_MD,
                color: prompt.trim() ? '#FFFFFF' : 'rgba(0,0,0,0.3)',
                letterSpacing: -0.2,
              }}
            >
              AI 출사 코스 기획하기
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </BottomSheet>
  );
}
