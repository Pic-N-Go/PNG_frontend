import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { IconCheck, IconChevronLeft, IconPlus } from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { BUTTON_HEIGHT, BUTTON_RADIUS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { coursesApi } from '@/api/courses';
import { useAddSpotToCourse } from '@/hooks/useCourses';
import { useCourseStore } from '@/store/useCourseStore';

const GRADIENT_PALETTES: [string, string][] = [
  ['#f59e0b', '#c2410c'],
  ['#3b82f6', '#1d4ed8'],
  ['#10b981', '#065f46'],
  ['#a78bfa', '#7c3aed'],
  ['#ec4899', '#be185d'],
  ['#06b6d4', '#0e7490'],
];

/** 'YYYY-MM-DD' 문자열을 UTC가 아닌 로컬 달력 날짜(자정)로 파싱 */
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isCourseCompleted(endDate: string): boolean {
  if (!endDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = parseLocalDate(endDate);
  return today > end;
}

function getCourseDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return [{ label: 'DAY 1', dateStr: '당일', dayNumber: 1 }];
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const days: { label: string; dateStr: string; dayNumber: number }[] = [];
  const cur = new Date(start);
  let dayNum = 1;
  while (cur <= end) {
    days.push({
      label: `DAY ${dayNum}`,
      dateStr: `${cur.getMonth() + 1}월 ${cur.getDate()}일`,
      dayNumber: dayNum,
    });
    cur.setDate(cur.getDate() + 1);
    dayNum++;
  }
  return days.length > 0 ? days : [{ label: 'DAY 1', dateStr: '당일', dayNumber: 1 }];
}

export interface SaveSpotTarget {
  id: number | string;
  name?: string;
  loc?: string;
  address?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  photo?: string;
  /** 대표 이미지 없는 스팟은 null로 온다 (SpotDetailInfo.imageUrl) */
  imageUrl?: string | null;
  category?: string;
  score?: string;
  tags?: string[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  spot?: SaveSpotTarget | null;
  onSaved?: (message: string) => void;
}

export default function SaveToPlanSheet({ visible, onClose, spot, onSaved }: Props) {
  const navigation = useNavigation<any>();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);

  const { mutateAsync: addSpotToCourse, isPending: isSaving } = useAddSpotToCourse();

  // 실시간 생성된 코스 목록 조회
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getCourses,
    enabled: visible,
  });

  // 완료된 코스(종료일 < 오늘) 제외
  const activeCourses = courses.filter((c) => !isCourseCompleted(c.endDate));

  const selectedCourse = activeCourses.find((c) => c.id === selectedCourseId) ?? null;
  const courseDays = selectedCourse ? getCourseDays(selectedCourse.startDate, selectedCourse.endDate) : [];
  const isMultiDay = courseDays.length > 1;

  function reset() {
    setStep(1);
    setSelectedCourseId(null);
    setSelectedDayNumber(1);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleCreateNewCourse() {
    if (spot) {
      const store = useCourseStore.getState();
      store.clearSpots();
      store.addSpot({
        id: String(spot.id),
        name: spot.name || `스팟 ${spot.id}`,
        loc: spot.loc || spot.address || spot.category || '위치 정보 없음',
        lat: spot.lat ?? spot.latitude ?? 0,
        lng: spot.lng ?? spot.longitude ?? 0,
        tags: spot.tags || [],
        score: spot.score || '-',
        photo: spot.photo || spot.imageUrl || '',
      });
    }
    handleClose();
    navigation.navigate('TravelTab', { screen: 'TravelNew' });
  }

  async function handleExecuteSave(dayNum: number) {
    if (!selectedCourse || !spot || isSaving) return;

    try {
      await addSpotToCourse({
        courseId: selectedCourse.id,
        spotId: Number(spot.id),
        dayNumber: dayNum,
      });
      onSaved?.(`'${selectedCourse.title}' 코스에 저장했습니다`);
      handleClose();
    } catch (err: any) {
      if (err?.status === 409 || err?.code === 'COURSE_MODIFIED_CONCURRENTLY') {
        Alert.alert('코스 변경 알림', err?.message || '다른 기기에서 코스가 변경되었습니다. 코스를 다시 불러온 후 담아주세요.');
      } else {
        Alert.alert('저장 실패', err?.message || '코스에 스팟을 저장하는 중 오류가 발생했습니다.');
      }
    }
  }

  function handlePrimaryStep1() {
    if (!selectedCourse) return;
    if (isMultiDay) {
      setSelectedDayNumber(1);
      setStep(2);
    } else {
      handleExecuteSave(1);
    }
  }

  function handleSaveDay() {
    handleExecuteSave(selectedDayNumber);
  }

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      {step === 1 ? (
        <>
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
              어떤 코스에 저장할까요?
            </Text>
          </View>

          <ScrollView style={{ maxHeight: normalize(320) }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingHorizontal: GRID_PADDING }}>
              {isLoading ? (
                <View style={{ paddingVertical: normalize(36), alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color="#E31B59" />
                  <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.4)', marginTop: normalize(8) }}>
                    코스 목록을 불러오는 중...
                  </Text>
                </View>
              ) : activeCourses.length === 0 ? (
                <View style={{ paddingVertical: normalize(20), alignItems: 'center', justifyContent: 'center' }}>
                  <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.45)', textAlign: 'center', lineHeight: normalize(20) }}>
                    진행 중이거나 예정된 코스가 없습니다.{'\n'}새로운 코스를 만들어보세요!
                  </Text>
                </View>
              ) : (
                activeCourses.map((course, idx) => {
                  const isSelected = selectedCourseId === course.id;
                  const gradient = GRADIENT_PALETTES[idx % GRADIENT_PALETTES.length];
                  const dateFormatted = `${course.startDate.replace(/-/g, '.')} ~ ${course.endDate.substring(5).replace(/-/g, '.')}`;
                  const spotsCount = course.spots?.length ?? 0;

                  return (
                    <Pressable
                      key={course.id}
                      onPress={() => setSelectedCourseId(course.id)}
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
                      <LinearGradient colors={gradient} style={{ width: normalize(52), height: normalize(52), borderRadius: normalize(12) }} />
                      <View style={{ flex: 1 }}>
                        <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(15), color: '#000', letterSpacing: -0.2 }}>
                          {course.title}
                        </Text>
                        <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginTop: normalize(2) }}>
                          {dateFormatted} · 스팟 {spotsCount}개
                        </Text>
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
                })
              )}

              {/* 새 코스 만들기 버튼 */}
              <Pressable
                onPress={handleCreateNewCourse}
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
                  marginBottom: normalize(12),
                }}
              >
                <View style={{ width: normalize(52), height: normalize(52), borderRadius: normalize(12), backgroundColor: 'rgba(227,27,89,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                  <IconPlus size={normalize(22)} color="#E31B59" strokeWidth={2} />
                </View>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: '#E31B59' }}>
                  + 새 코스 만들기
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(16) }}>
            <Pressable
              onPress={handlePrimaryStep1}
              disabled={!selectedCourse || isSaving}
              style={{
                width: '100%',
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selectedCourse && !isSaving ? '#E31B59' : 'rgba(0,0,0,0.08)',
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: selectedCourse ? '#fff' : 'rgba(0,0,0,0.25)' }}>
                  {isMultiDay ? '다음' : '저장하기'}
                </Text>
              )}
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
              <Text style={{ fontFamily: 'Pretendard-SemiBold', color: '#000' }}>{selectedCourse?.title}</Text>에서{'\n'}이 스팟을 추가할 날을 선택해 주세요
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(8), marginBottom: normalize(16) }}>
              {courseDays.map((dayItem) => {
                const isSelected = selectedDayNumber === dayItem.dayNumber;
                return (
                  <Pressable
                    key={dayItem.dayNumber}
                    onPress={() => setSelectedDayNumber(dayItem.dayNumber)}
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
                      {dayItem.label}
                    </Text>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: isSelected ? '#E31B59' : '#000', letterSpacing: -0.25 }}>
                      {dayItem.dateStr}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(16) }}>
            <Pressable
              onPress={handleSaveDay}
              disabled={isSaving}
              style={{
                width: '100%',
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSaving ? 'rgba(0,0,0,0.08)' : '#E31B59',
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: '#fff' }}>
                  저장하기
                </Text>
              )}
            </Pressable>
          </View>
        </>
      )}
    </BottomSheet>
  );
}
