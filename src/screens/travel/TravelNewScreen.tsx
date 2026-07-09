import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  IconChevronLeft,
  IconCalendarEvent,
  IconX,
  IconChevronRight,
  IconMapPin,
  IconPlus,
} from '@tabler/icons-react-native';

import { StatusBar } from 'expo-status-bar';
import { useTravelStore, Spot } from '@/store/useTravelStore';

import { FONT_SM, FONT_MD, BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

// --- Types ---
type ChipType = '당일치기' | '1박 2일' | '2박 3일' | '3박 이상';

export default function TravelNewScreen() {
  const navigation = useNavigation<any>();

  // --- State ---
  const [isDirty, setIsDirty] = useState(false);
  const [tripName, setTripName] = useState('');
  
  // Dates
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedChip, setSelectedChip] = useState<ChipType | null>(null);

  // Timeline & Days
  const [activeDay, setActiveDay] = useState(1);
  const [daySpots, setDaySpots] = useState<Record<number, Spot[]>>({ 1: [] });
  const [daysCount, setDaysCount] = useState(1); // How many days are created

  // Zustand Store Integration
  const { selectedSpots, clearSpots } = useTravelStore();

  useFocusEffect(
    React.useCallback(() => {
      if (selectedSpots.length > 0) {
        setDaySpots((prev) => {
          const current = prev[activeDay] || [];
          const newSpots = selectedSpots.filter(s => !current.some(cs => cs.id === s.id));
          return {
            ...prev,
            [activeDay]: [...current, ...newSpots]
          };
        });
        clearSpots();
        setIsDirty(true);
      }
    }, [selectedSpots, activeDay, clearSpots])
  );

  // Modals
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [isUnsavedSheetOpen, setIsUnsavedSheetOpen] = useState(false);
  const [isDelSheetOpen, setIsDelSheetOpen] = useState(false);
  
  // Date Picker internal state
  const [pickPhase, setPickPhase] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  // Delete target
  const [pendingDelete, setPendingDelete] = useState<{ type: 'day' | 'spot'; dayIdx: number; spotId?: string } | null>(null);

  // --- Logic ---
  const markDirty = () => setIsDirty(true);

  // Max Days calculation
  const maxDays = useMemo(() => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return Math.min(Math.max(diffDays, 1), 15);
    }
    if (selectedChip === '당일치기') return 1;
    if (selectedChip === '1박 2일') return 2;
    if (selectedChip === '2박 3일') return 3;
    if (selectedChip === '3박 이상') return 15;
    return 15;
  }, [startDate, endDate, selectedChip]);

  // Adjust days if maxDays decreases
  useEffect(() => {
    if (daysCount > maxDays) {
      setDaysCount(maxDays);
      if (activeDay > maxDays) setActiveDay(maxDays);
    }
  }, [maxDays, daysCount, activeDay]);

  const handleBack = () => {
    if (isDirty) {
      setIsUnsavedSheetOpen(true);
    } else {
      navigation.goBack();
    }
  };

  const handleChipSelect = (chip: ChipType) => {
    setSelectedChip(chip);
    markDirty();
  };

  const handleSave = () => {
    // API 연동 (추후 구현)
    // navigation.navigate('TravelPlan', { planId: 'dummy-123' });
    navigation.goBack(); // 임시 동작
  };

  // -- Day Management --
  const addDay = () => {
    if (daysCount < maxDays) {
      const newCount = daysCount + 1;
      setDaysCount(newCount);
      setDaySpots((prev) => ({ ...prev, [newCount]: [] }));
      setActiveDay(newCount);
      markDirty();
    }
  };

  const deleteCurrentDay = () => {
    if (activeDay === 1) return;
    setPendingDelete({ type: 'day', dayIdx: activeDay });
    setIsDelSheetOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'day') {
      const newSpots = { ...daySpots };
      // Shift days
      for (let i = pendingDelete.dayIdx; i < daysCount; i++) {
        newSpots[i] = newSpots[i + 1] || [];
      }
      delete newSpots[daysCount];
      setDaySpots(newSpots);
      setDaysCount(daysCount - 1);
      setActiveDay(Math.max(1, activeDay - 1));
    } else if (pendingDelete.type === 'spot' && pendingDelete.spotId) {
      const daySpotsList = daySpots[pendingDelete.dayIdx] || [];
      setDaySpots({
        ...daySpots,
        [pendingDelete.dayIdx]: daySpotsList.filter(s => s.id !== pendingDelete.spotId),
      });
    }
    markDirty();
    setIsDelSheetOpen(false);
    setPendingDelete(null);
  };

  // -- Date Formatting --
  const formatDateStr = (d: Date | null) => {
    if (!d) return '';
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const getDayDateLabel = () => {
    if (!startDate) return '날짜를 선택해주세요';
    const base = new Date(startDate);
    base.setDate(base.getDate() + (activeDay - 1));
    return `${base.getMonth() + 1}월 ${base.getDate()}일`;
  };

  // -- Calendar Logic --
  const openDateSheet = (type: 'start' | 'end') => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setPickPhase((type === 'end' && startDate) ? 'end' : 'start');
    const ref = (type === 'end' && startDate) ? startDate : (startDate || new Date());
    setCalYear(ref.getFullYear());
    setCalMonth(ref.getMonth());
    setIsDateSheetOpen(true);
  };

  const changeMonth = (dir: number) => {
    let newM = calMonth + dir;
    let newY = calYear;
    if (newM < 0) { newM = 11; newY--; }
    if (newM > 11) { newM = 0; newY++; }
    setCalMonth(newM);
    setCalYear(newY);
  };

  const handleDaySelect = (d: number) => {
    const selectedObj = new Date(calYear, calMonth, d, 0, 0, 0);
    if (pickPhase === 'start') {
      setTempStart(selectedObj);
      setTempEnd(null);
      setPickPhase('end');
    } else {
      if (tempStart && selectedObj >= tempStart) {
        setTempEnd(selectedObj);
      } else {
        setTempStart(selectedObj);
        setTempEnd(null);
      }
    }
  };

  const confirmDate = () => {
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setIsDateSheetOpen(false);
    markDirty();
  };

  // Calendar rendering variables
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const today = new Date();
  today.setHours(0,0,0,0);

  const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} className="bg-black z-10" />
      
      {/* Nav */}
      <View className="flex-row items-center justify-between bg-black border-b border-white/10 z-10" style={{ height: BUTTON_HEIGHT, paddingHorizontal: CONTENT_PADDING }}>
        <TouchableOpacity onPress={handleBack} className="w-9 h-9 items-center justify-center rounded-full bg-white/10">
          <IconChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="font-semibold text-white tracking-[-0.4px]" style={{ fontSize: normalizeFontSize(18) }}>새 출사 계획</Text>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 출사 이름 */}
        <View className="pt-7" style={{ paddingHorizontal: CONTENT_PADDING }}>
          <Text className="font-medium text-black/40 mb-2" style={{ fontSize: normalizeFontSize(12) }}>출사 이름</Text>
          <TextInput
            className="w-full bg-[#f5f5f7] font-medium text-black tracking-[-0.3px]"
            style={{ height: BUTTON_HEIGHT, borderRadius: normalize(12), paddingHorizontal: normalize(20), fontSize: normalizeFontSize(16) }}
            placeholder="예) 부산 1박 2일, 서울 야경 투어"
            placeholderTextColor="rgba(0,0,0,0.22)"
            value={tripName}
            onChangeText={(t) => {
              setTripName(t);
              markDirty();
            }}
          />
        </View>

        {/* 날짜 */}
        <View className="pt-7" style={{ paddingHorizontal: CONTENT_PADDING }}>
          <Text className="font-medium text-black/40 mb-2" style={{ fontSize: normalizeFontSize(12) }}>날짜</Text>
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => openDateSheet('start')}
              className={`flex-1 bg-[#f5f5f7] flex-row items-center justify-between ${startDate ? '' : ''}`}
              style={{ height: BUTTON_HEIGHT, borderRadius: normalize(12), paddingHorizontal: normalize(14) }}
            >
              <Text className={`${startDate ? 'text-black font-medium' : 'text-black/25'}`} style={{ fontSize: normalizeFontSize(16) }}>
                {startDate ? formatDateStr(startDate) : '출발일 선택'}
              </Text>
              <IconCalendarEvent size={20} color={startDate ? "#e31b59" : "rgba(0,0,0,0.2)"} />
            </TouchableOpacity>
            <Text className="text-black/20" style={{ fontSize: normalizeFontSize(14) }}>—</Text>
            <TouchableOpacity
              onPress={() => openDateSheet('end')}
              className="flex-1 bg-[#f5f5f7] flex-row items-center justify-between"
              style={{ height: BUTTON_HEIGHT, borderRadius: normalize(12), paddingHorizontal: normalize(14) }}
            >
              <Text className={`${endDate ? 'text-black font-medium' : 'text-black/25'}`} style={{ fontSize: normalizeFontSize(16) }}>
                {endDate ? formatDateStr(endDate) : '도착일 선택'}
              </Text>
              <IconCalendarEvent size={20} color={endDate ? "#e31b59" : "rgba(0,0,0,0.2)"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 일정 유형 */}
        <View className="pt-7" style={{ paddingHorizontal: CONTENT_PADDING }}>
          <Text className="font-medium text-black/40 mb-2" style={{ fontSize: normalizeFontSize(12) }}>일정 유형</Text>
          <View className="flex-row flex-wrap gap-2">
            {(['당일치기', '1박 2일', '2박 3일', '3박 이상'] as ChipType[]).map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => handleChipSelect(chip)}
                className={`h-9 px-4 rounded-full justify-center ${
                  selectedChip === chip ? 'bg-[#e31b59]' : 'bg-[#f5f5f7]'
                }`}
              >
                <Text className={`font-medium ${
                  selectedChip === chip ? 'text-white' : 'text-black/45'
                }`} style={{ fontSize: normalizeFontSize(14) }}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="h-[0.5px] bg-gray-200 mt-7" />

        {/* 데이 탭 */}
        <View className="pt-5 px-[28px]">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-2">
            {Array.from({ length: daysCount }).map((_, i) => {
              const dayNum = i + 1;
              const isActive = activeDay === dayNum;
              return (
                <TouchableOpacity
                  key={dayNum}
                  onPress={() => setActiveDay(dayNum)}
                  className={`h-[38px] px-5 rounded-full justify-center mr-2 ${
                    isActive ? 'bg-black' : 'bg-[#f5f5f7]'
                  }`}
                >
                  <Text className={`font-medium ${isActive ? 'font-semibold text-white' : 'text-black/50'}`} style={{ fontSize: normalizeFontSize(14) }}>
                    DAY {dayNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {daysCount < maxDays && (
              <TouchableOpacity
                onPress={addDay}
                className="w-[38px] h-[38px] rounded-full bg-[#f5f5f7] items-center justify-center"
              >
                <Text className="text-black/25 leading-none" style={{ fontSize: normalizeFontSize(18) }}>+</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <Text className="text-black/35 mt-3 mb-2" style={{ fontSize: normalizeFontSize(14) }}>{getDayDateLabel()}</Text>

          {/* 타임라인 */}
          <View className="relative pl-8 min-h-[150px]">
            {daySpots[activeDay]?.length > 0 && (
              <View className="absolute left-[11px] top-4 bottom-4 w-[1.5px]" style={{
                // 점선 효과 (CSS의 repeating-linear-gradient 대체)
                borderStyle: 'dashed',
                borderWidth: 1.5,
                borderColor: 'rgba(0,0,0,0.08)',
                borderLeftWidth: 0, borderRightWidth: 0, borderTopWidth: 0,
              }} />
            )}

            {daySpots[activeDay]?.length === 0 ? (
              <View className="items-center py-9 ml-[-32px]">
                <View className="w-[52px] h-[52px] rounded-2xl bg-[#f5f5f7] items-center justify-center mb-2">
                  <IconMapPin size={22} color="rgba(0,0,0,0.2)" />
                </View>
                <Text className="font-medium text-black/40 mb-1" style={{ fontSize: normalizeFontSize(16) }}>아직 추가된 스팟이 없어요</Text>
                <Text className="text-black/20 text-center leading-relaxed" style={{ fontSize: normalizeFontSize(14) }}>아래 버튼으로 포토스팟을{'\n'}추가해보세요</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Map', { source: 'plan' })} className="mt-6 w-full h-[54px] rounded-2xl border-[1.5px] border-dashed border-black/10 flex-row items-center justify-center">
                  <IconPlus size={15} color="rgba(0,0,0,0.25)" />
                  <Text className="font-medium text-black/25 ml-2" style={{ fontSize: normalizeFontSize(16) }}>스팟 추가하기</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {daySpots[activeDay].map((spot, i) => (
                  <View key={spot.id} className="relative mb-[10px]">
                    <View className="absolute -left-[32px] top-4 w-[22px] h-[22px] rounded-full bg-[#e31b59] items-center justify-center z-10">
                      <Text className="font-semibold text-white" style={{ fontSize: normalizeFontSize(10) }}>{i + 1}</Text>
                    </View>
                    <View className="bg-[#f5f5f7] rounded-2xl p-3 flex-row items-center">
                      <View className="w-[60px] h-[60px] rounded-xl overflow-hidden" style={{ backgroundColor: '#2d9cdb' }} />
                      <View className="flex-1 ml-3">
                        <Text className="font-semibold text-black mb-1" style={{ fontSize: normalizeFontSize(16) }}>{spot.name}</Text>
                        <View className="flex-row items-center mb-1.5">
                          <IconMapPin size={10} color="rgba(0,0,0,0.38)" />
                          <Text className="text-black/40 ml-1" style={{ fontSize: normalizeFontSize(12) }}>{spot.loc}</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-1">
                          {spot.tags.map(t => (
                            <View key={t} className="h-5 px-2 rounded-full bg-black/5 items-center justify-center">
                              <Text className="text-black/45" style={{ fontSize: normalizeFontSize(12) }}>{t}</Text>
                            </View>
                          ))}
                          <Text className="font-semibold text-[#e31b59] ml-1" style={{ fontSize: normalizeFontSize(12) }}>★ {spot.score}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        className="w-7 h-7 rounded-full bg-black/5 items-center justify-center ml-2"
                        onPress={() => {
                          setPendingDelete({ type: 'spot', dayIdx: activeDay, spotId: spot.id });
                          setIsDelSheetOpen(true);
                        }}
                      >
                        <IconX size={14} color="rgba(0,0,0,0.35)" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <TouchableOpacity onPress={() => navigation.navigate('Map', { source: 'plan' })} className="mt-6 w-full h-[54px] rounded-2xl border-[1.5px] border-dashed border-black/10 flex-row items-center justify-center">
                  <IconPlus size={15} color="rgba(0,0,0,0.25)" />
                  <Text className="font-medium text-black/25 ml-2" style={{ fontSize: normalizeFontSize(16) }}>스팟 추가하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 하단 CTA */}
      <View className="flex-row px-[28px] py-5 border-t border-gray-100 bg-white">
        {activeDay > 1 && (
          <TouchableOpacity 
            onPress={deleteCurrentDay}
            className="flex-1 h-[52px] rounded-full bg-[#f5f5f7] items-center justify-center mr-3"
          >
            <Text className="font-medium text-black" style={{ fontSize: normalizeFontSize(16) }}>이 날 삭제</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          disabled={!tripName}
          onPress={handleSave}
          className={`flex-1 h-[52px] rounded-full items-center justify-center ${tripName ? 'bg-[#e31b59]' : 'bg-[#f5f5f7]'}`}
        >
          <Text className={`font-medium ${tripName ? 'text-white' : 'text-black/25'}`} style={{ fontSize: normalizeFontSize(16) }}>저장하기</Text>
        </TouchableOpacity>
      </View>

      {/* --- 달력 바텀 시트 (간이 구현) --- */}
      <Modal visible={isDateSheetOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setIsDateSheetOpen(false)} />
          <View className="bg-white rounded-t-[24px] pb-8 pt-2">
            <View className="w-9 h-1 rounded-full bg-black/10 mx-auto my-2" />
            <View className="flex-row items-center justify-between px-5 pt-3">
              <Text className="font-semibold" style={{ fontSize: normalizeFontSize(18) }}>{pickPhase === 'start' ? '출발일 선택' : '도착일 선택'}</Text>
              <TouchableOpacity onPress={() => setIsDateSheetOpen(false)} className="w-8 h-8 rounded-full bg-black/5 items-center justify-center">
                <IconX size={18} color="rgba(0,0,0,0.5)" />
              </TouchableOpacity>
            </View>

            {/* 월 이동 */}
            <View className="flex-row items-center justify-between px-5 mt-4 mb-2">
              <TouchableOpacity onPress={() => changeMonth(-1)} className="p-2">
                <IconChevronLeft size={20} color="#000" />
              </TouchableOpacity>
              <Text className="font-semibold" style={{ fontSize: normalizeFontSize(16) }}>{calYear}년 {calMonth + 1}월</Text>
              <TouchableOpacity onPress={() => changeMonth(1)} className="p-2">
                <IconChevronRight size={20} color="#000" />
              </TouchableOpacity>
            </View>

            {/* 요일 */}
            <View className="flex-row px-5 mb-1">
              {['일','월','화','수','목','금','토'].map((w, i) => (
                <Text key={w} className={`flex-1 text-center font-medium ${i===0 ? 'text-red-400' : i===6 ? 'text-blue-400' : 'text-black/35'}`} style={{ fontSize: normalizeFontSize(12) }}>{w}</Text>
              ))}
            </View>

            {/* 날짜 그리드 */}
            <View className="flex-row flex-wrap px-5">
              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`empty-${i}`} className="w-[14.28%] h-10" />
              ))}
              {calDays.map(d => {
                const dateObj = new Date(calYear, calMonth, d, 0,0,0);
                const isPast = dateObj < today;
                const isBeforeStart = pickPhase === 'end' && tempStart && dateObj < tempStart;
                const disabled = isPast || isBeforeStart;
                
                let bgClass = "bg-transparent";
                let textClass = disabled ? "text-black/20" : "text-black";
                
                if (tempStart && tempEnd && dateObj > tempStart && dateObj < tempEnd) {
                  bgClass = "bg-[#e31b59]/10 rounded-none";
                }
                if (tempStart && dateObj.getTime() === tempStart.getTime()) {
                  const isSameDay = tempEnd && tempStart.getTime() === tempEnd.getTime();
                  bgClass = (tempEnd && !isSameDay) ? "bg-[#e31b59] rounded-l-full rounded-r-none" : "bg-[#e31b59] rounded-full";
                  textClass = "text-white";
                } else if (tempEnd && dateObj.getTime() === tempEnd.getTime()) {
                  bgClass = "bg-[#e31b59] rounded-r-full rounded-l-none";
                  textClass = "text-white";
                }

                return (
                  <TouchableOpacity 
                    key={d} 
                    disabled={!!disabled}
                    onPress={() => handleDaySelect(d)}
                    className={`w-[14.28%] h-10 items-center justify-center ${bgClass}`}
                  >
                    <Text className={`font-medium ${textClass}`} style={{ fontSize: normalizeFontSize(16) }}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="px-5 mt-6">
              <TouchableOpacity 
                disabled={!(tempStart && tempEnd)}
                onPress={confirmDate}
                className={`items-center justify-center ${tempStart && tempEnd ? 'bg-[#e31b59]' : 'bg-[#f5f5f7]'}`}
                style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
              >
                <Text className={`font-medium ${tempStart && tempEnd ? 'text-white' : 'text-black/25'}`} style={{ fontSize: normalizeFontSize(16) }}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 미저장 나가기 시트 */}
      <Modal visible={isUnsavedSheetOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setIsUnsavedSheetOpen(false)} />
          <View className="bg-white rounded-t-[24px] px-5 pb-10 pt-3 items-center">
            <View className="w-9 h-1 rounded-full bg-black/10 mb-5" />
            <Text className="font-semibold text-black mb-2" style={{ fontSize: normalizeFontSize(18) }}>저장하지 않고 나갈까요?</Text>
            <Text className="text-black/45 mb-7 text-center" style={{ fontSize: normalizeFontSize(16) }}>변경 사항이 저장되지 않아요.</Text>
            <TouchableOpacity onPress={() => setIsUnsavedSheetOpen(false)} className="w-full bg-[#e31b59] items-center justify-center mb-2.5" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
              <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(16) }}>계속 편집</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} className="w-full bg-[#f5f5f7] items-center justify-center" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
              <Text className="font-medium text-black/60" style={{ fontSize: normalizeFontSize(16) }}>나가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 삭제 확인 시트 */}
      <Modal visible={isDelSheetOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setIsDelSheetOpen(false)} />
          <View className="bg-white rounded-t-[24px] px-5 pb-8 pt-3 items-center">
            <View className="w-9 h-1 rounded-full bg-black/10 mb-7" />
            <Text className="font-semibold text-black mb-2" style={{ fontSize: normalizeFontSize(18) }}>
              {pendingDelete?.type === 'day' ? '이 날을 삭제할까요?' : '스팟을 삭제할까요?'}
            </Text>
            <Text className="text-black/45 mb-7 text-center" style={{ fontSize: normalizeFontSize(16) }}>
              {pendingDelete?.type === 'day' ? `DAY ${pendingDelete.dayIdx}에 추가된 스팟이 모두 삭제되며\n복구할 수 없어요.` : '이 스팟이 일정에서 제거돼요.'}
            </Text>
            <TouchableOpacity onPress={confirmDelete} className="w-full bg-[#e31b59] items-center justify-center mb-2.5" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
              <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(16) }}>삭제하기</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsDelSheetOpen(false)} className="w-full bg-[#f5f5f7] items-center justify-center" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
              <Text className="font-medium text-black" style={{ fontSize: normalizeFontSize(16) }}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}
