import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Platform,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  IconX,
  IconSparkles,
  IconCalendar,
  IconMapPin,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react-native';
import {
  BOTTOM_SHEET_RADIUS,
  BUTTON_HEIGHT,
  BUTTON_RADIUS,
  FONT_2XS,
  FONT_XS,
  FONT_SM,
  FONT_MD,
  FONT_TITLE,
  SPACING_LG,
} from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import { BRAND } from '@/constants/colors';
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
  const insets = useSafeAreaInsets();
  const panY = useRef(new Animated.Value(0)).current;

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
    Animated.timing(panY, {
      toValue: Dimensions.get('window').height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      resetForm();
      onClose();
    });
  }, [panY, status, resetForm, onClose]);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      panY.setValue(Dimensions.get('window').height);
      Animated.timing(panY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, panY]);

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

            // 기획 완료 시 즉시 모달을 닫고 코스 상세 화면으로 이동
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

  const screenHeight = Dimensions.get('screen').height;
  const sheetMaxHeight = screenHeight * 0.88;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onPress={handleClose}
      >
        <Animated.View style={{ transform: [{ translateY: panY }] }}>
          <Pressable onPress={() => {}}>
            <View
              className="bg-[#18181B] shrink overflow-hidden"
              style={{
                borderTopLeftRadius: BOTTOM_SHEET_RADIUS,
                borderTopRightRadius: BOTTOM_SHEET_RADIUS,
                maxHeight: sheetMaxHeight,
                paddingBottom: Math.max(insets.bottom, SPACING_LG),
              }}
            >
              {/* 핸들 바 */}
              <View className="items-center" style={{ paddingTop: normalize(10), paddingBottom: normalize(6) }}>
                <View
                  style={{
                    width: normalize(36),
                    height: normalize(4),
                    borderRadius: normalize(2),
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }}
                />
              </View>

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
                        color: '#FFFFFF',
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
                      color: 'rgba(255,255,255,0.6)',
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
                    className="p-1 rounded-full bg-white/10"
                  >
                    <IconX size={normalize(18)} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                )}
              </View>

              {/* 본문 콘텐츠: 진행 상태에 따른 분기 */}
              {status === 'loading' ? (
                <View className="items-center justify-center py-10 px-6">
                  <ActivityIndicator size="large" color={BRAND} style={{ marginBottom: normalize(20) }} />
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Pretendard-SemiBold',
                      fontSize: FONT_TITLE,
                      color: '#FFFFFF',
                      letterSpacing: -0.3,
                      marginBottom: normalize(24),
                    }}
                  >
                    출사 코스를 기획하고 있습니다
                  </Text>

                  {/* 단계별 진행 상태 목록 */}
                  <View className="w-full bg-white/5 rounded-2xl p-4 gap-y-3">
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
                                ? 'rgba(227, 27, 89, 0.2)'
                                : 'rgba(255,255,255,0.1)',
                            }}
                          >
                            {isDone ? (
                              <IconCheck size={normalize(12)} color="#FFFFFF" strokeWidth={2.5} />
                            ) : (
                              <View
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor: isCurrent ? BRAND : 'rgba(255,255,255,0.3)',
                                }}
                              />
                            )}
                          </View>
                          <Text
                            allowFontScaling={false}
                            style={{
                              fontFamily: isCurrent ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                              fontSize: FONT_SM,
                              color: isDone || isCurrent ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
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
                    style={{ backgroundColor: status === 'error' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255,255,255,0.1)' }}
                  >
                    <IconAlertCircle
                      size={normalize(24)}
                      color={status === 'error' ? '#FF3B30' : '#FFFFFF'}
                    />
                  </View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Pretendard-SemiBold',
                      fontSize: FONT_TITLE,
                      color: '#FFFFFF',
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
                      color: 'rgba(255,255,255,0.6)',
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
                        color: 'rgba(255,255,255,0.9)',
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
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      style={{
                        minHeight: normalize(104),
                        borderRadius: normalize(16),
                        backgroundColor: 'rgba(255,255,255,0.07)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.12)',
                        padding: normalize(14),
                        color: '#FFFFFF',
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
                        color: 'rgba(255,255,255,0.5)',
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
                              backgroundColor: isSelected ? 'rgba(227, 27, 89, 0.2)' : 'rgba(255,255,255,0.08)',
                              borderWidth: 1,
                              borderColor: isSelected ? BRAND : 'rgba(255,255,255,0.15)',
                            }}
                          >
                            <Text
                              allowFontScaling={false}
                              style={{
                                fontFamily: isSelected ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                                fontSize: FONT_XS,
                                color: isSelected ? BRAND : 'rgba(255,255,255,0.85)',
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
                        <IconMapPin size={normalize(14)} color="rgba(255,255,255,0.6)" style={{ marginRight: normalize(4) }} />
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Pretendard-Medium',
                            fontSize: FONT_XS,
                            color: 'rgba(255,255,255,0.6)',
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
                                backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                              }}
                            >
                              <Text
                                allowFontScaling={false}
                                style={{
                                  fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                                  fontSize: FONT_2XS,
                                  color: active ? '#000000' : 'rgba(255,255,255,0.7)',
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
                        <IconCalendar size={normalize(14)} color="rgba(255,255,255,0.6)" style={{ marginRight: normalize(4) }} />
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Pretendard-Medium',
                            fontSize: FONT_XS,
                            color: 'rgba(255,255,255,0.6)',
                          }}
                        >
                          출사 일정
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowDatePicker((prev) => !prev)}
                        className="flex-row items-center justify-between rounded-xl px-4 py-3"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.07)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.12)',
                        }}
                      >
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Pretendard-Medium',
                            fontSize: FONT_SM,
                            color: '#FFFFFF',
                          }}
                        >
                          {formatDate(targetDate)}
                        </Text>
                        <IconCalendar size={normalize(18)} color="rgba(255,255,255,0.5)" />
                      </TouchableOpacity>

                      {showDatePicker && (
                        <View className="mt-2 items-center bg-white/10 rounded-xl p-2">
                          <DateTimePicker
                            value={targetDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            minimumDate={new Date()}
                            themeVariant="dark"
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
                      backgroundColor: prompt.trim() ? BRAND : 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <IconSparkles size={normalize(18)} color="#FFFFFF" strokeWidth={2} style={{ marginRight: normalize(6) }} />
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Pretendard-SemiBold',
                        fontSize: FONT_MD,
                        color: prompt.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                        letterSpacing: -0.2,
                      }}
                    >
                      AI 출사 코스 기획하기
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
