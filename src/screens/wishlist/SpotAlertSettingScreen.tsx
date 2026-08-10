import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Switch, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { useKeyboardOverlap } from '@/hooks/useKeyboardHeight';
import { 
  IconChevronLeft, IconTrash, IconX, IconCheck, IconSearch,
  IconSun, IconCloud, IconCloudRain, IconCloudSnow
} from '@tabler/icons-react-native';

import BottomSheet from '@/components/common/BottomSheet';
import { useSpotAlert } from '@/hooks/useSpotAlert';
import { useSpots, useSearchSpots } from '@/hooks/useSpot';
import { WEATHER_API_TO_UI, TIME_API_TO_UI, DUST_API_TO_UI } from '@/utils/wishlistMapper';
import type { WeatherCondition, TimeCondition, AirQualityCondition } from '@/api/spotAlert';

// 칩은 API enum을 그대로 id로 쓴다. 라벨은 *_API_TO_UI 한 곳에서만 정의한다 —
// 예전처럼 화면 상수가 별도 한글 id를 들면 매퍼 키와 어긋나 조용히 다른 값으로 저장된다.
// NONE("조건 없음")은 칩으로 노출하지 않는다. 아무것도 고르지 않은 상태가 곧 조건 없음이다.
const WEATHER_CHIPS: WeatherCondition[] = ['CLEAR', 'CLOUDY', 'RAINY', 'SNOWY'];
const TIME_CHIPS: TimeCondition[] = ['DAWN', 'SUNRISE', 'MORNING', 'AFTERNOON', 'SUNSET', 'NIGHT'];
const DUST_CHIPS: AirQualityCondition[] = ['GOOD', 'NORMAL_OR_BETTER', 'NONE'];

const DEFAULT_WEATHERS: WeatherCondition[] = ['CLEAR'];
const DEFAULT_TIMES: TimeCondition[] = ['SUNSET', 'NIGHT'];
const DEFAULT_DUST: AirQualityCondition = 'GOOD';

const uniq = <T,>(arr: T[]): T[] => Array.from(new Set(arr));

const getWeatherIcon = (id: WeatherCondition, selected: boolean) => {
  let IconComponent = IconSun;
  let activeColor = '#E31B59';
  switch (id) {
    case 'CLEAR':
      IconComponent = IconSun;
      activeColor = '#FBBF24';
      break;
    case 'CLOUDY':
      IconComponent = IconCloud;
      break;
    case 'RAINY':
      IconComponent = IconCloudRain;
      break;
    case 'SNOWY':
      IconComponent = IconCloudSnow;
      break;
  }
  return <IconComponent size={normalize(22)} color={selected ? activeColor : 'rgba(0,0,0,0.25)'} style={{ marginBottom: normalize(2) }} />;
};

export default function SpotAlertSettingScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();
  const { 
    useSpotAlertDetailQuery, 
    useUpdateSpotAlertMutation, 
    useDeleteSpotAlertMutation,
    useToggleSpotAlertActiveMutation 
  } = useSpotAlert();

  const [selectedSpot, setSelectedSpot] = useState<any>(null);

  // 조회 대상은 "현재 화면이 편집 중인 스팟"이어야 한다. 진입 시점의 route.params.id로
  // 고정해 두면 스팟을 바꿔도 이전 스팟의 조건이 폼에 남아 새 스팟에 덮어써진다.
  const targetSpotId = selectedSpot?.id ?? route.params?.id;
  const { data: initData, isLoading } = useSpotAlertDetailQuery(targetSpotId);

  const [selectedWeathers, setSelectedWeathers] = useState<WeatherCondition[]>(DEFAULT_WEATHERS);
  const [selectedDust, setSelectedDust] = useState<AirQualityCondition>(DEFAULT_DUST);
  const [selectedTimes, setSelectedTimes] = useState<TimeCondition[]>(DEFAULT_TIMES);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifTiming, setNotifTiming] = useState('1일 전');
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('07:00');
  const [memo, setMemo] = useState('');

  // 스팟 변경 바텀시트 실시간 검색 관련 상태
  const [searchText, setSearchText] = useState('');
  const isSearching = searchText.trim().length > 0;

  const { data: defaultSpotsData, isLoading: isDefaultSpotsLoading } = useSpots({ size: 20 }, { enabled: !isSearching });
  const { data: searchSpotsData, isLoading: isSearchSpotsLoading } = useSearchSpots({ keyword: searchText, size: 20 }, { enabled: isSearching });

  const rawSpotsList = isSearching ? searchSpotsData?.content : defaultSpotsData?.content;
  const isSpotsLoading = isSearching ? isSearchSpotsLoading : isDefaultSpotsLoading;

  const spotsList = (rawSpotsList || []).map((spot: any) => ({
    id: spot.id,
    name: spot.spotName || spot.title || spot.name || '스팟',
    loc: spot.address || spot.location || spot.district || '위치 정보 없음',
    score: spot.photogenicScore || spot.score || 90,
    bg: '#2b2a29',
    tags: spot.tags || ['#스팟', '#출사'],
  }));

  // 편집 대상 스팟이 바뀌면 폼을 먼저 기본값으로 되돌린다. 그 스팟에 저장된 설정이 있으면
  // 바로 아래 initData 이펙트가 곧이어 덮어쓴다. 이 리셋이 없으면 알림이 없는 스팟으로
  // 바꿨을 때 이전 스팟의 조건이 그대로 남아 저장된다.
  useEffect(() => {
    setSelectedWeathers(DEFAULT_WEATHERS);
    setSelectedTimes(DEFAULT_TIMES);
    setSelectedDust(DEFAULT_DUST);
    setNotifEnabled(true);
    setNotifTiming('1일 전');
    setDndStart('22:00');
    setDndEnd('07:00');
    setMemo('');
  }, [targetSpotId]);

  useEffect(() => {
    if (initData) {
      setSelectedSpot({
        id: initData.spotId,
        name: initData.spotName,
        loc: initData.address,
        score: initData.photogenicScore,
        bg: '#2b2a29',
        tags: initData.tags || [],
      });
      // 칩으로 노출하지 않는 값(NONE 등)과 중복은 여기서 걷어낸다. 예전에는 매핑 실패한
      // 값이 raw enum 문자열로 state에 남았다가 저장 시 기본값으로 붕괴해 중복을 만들었다.
      if (initData.weatherConditions) {
        setSelectedWeathers(uniq(initData.weatherConditions.filter(c => WEATHER_CHIPS.includes(c))));
      }
      if (initData.timeConditions) {
        setSelectedTimes(uniq(initData.timeConditions.filter(c => TIME_CHIPS.includes(c))));
      }
      if (initData.airQualityCondition) {
        setSelectedDust(DUST_CHIPS.includes(initData.airQualityCondition) ? initData.airQualityCondition : DEFAULT_DUST);
      }
      setNotifEnabled(initData.isAlertEnabled ?? true);
      if (initData.alertTimingDays) {
        setNotifTiming(`${initData.alertTimingDays}일 전`);
      }
      if (initData.dndStartTime) setDndStart(initData.dndStartTime);
      if (initData.dndEndTime) setDndEnd(initData.dndEndTime);
      if (initData.memo) setMemo(initData.memo);
    }
  }, [initData]);

  useEffect(() => {
    if (route.params?.newSpot) {
      const newSpot = route.params.newSpot;
      setSelectedSpot({
        id: newSpot.id,
        name: newSpot.name || newSpot.spotName || newSpot.title,
        loc: newSpot.loc || newSpot.address || newSpot.location || '위치 정보 없음',
        score: newSpot.score || newSpot.photogenicScore || 90,
        bg: '#2b2a29',
        tags: newSpot.tags || ['#스팟', '#출사'],
      });
      setDirty(true);
    }
  }, [route.params?.newSpot]);

  const [dirty, setDirty] = useState(false);
  const [spotSheetVisible, setSpotSheetVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const updateMutation = useUpdateSpotAlertMutation();
  const deleteMutation = useDeleteSpotAlertMutation();
  const toggleActiveMutation = useToggleSpotAlertActiveMutation();

  const markDirty = () => setDirty(true);

  const handleToggleNotif = (value: boolean) => {
    setNotifEnabled(value);
    markDirty();
    if (targetSpotId) {
      toggleActiveMutation.mutate({
        spotId: Number(targetSpotId),
        isAlertEnabled: value,
      });
    }
  };

  const handleBack = () => {
    if (dirty) {
      Alert.alert('변경사항 취소', '수정 중인 내용이 있어요. 정말 나갈까요?', [
        { text: '이어서 작성', style: 'cancel' },
        { text: '나가기', style: 'destructive', onPress: () => navigation.goBack() }
      ]);
    } else {
      navigation.goBack();
    }
  };

  const handleSave = () => {
    if (!selectedSpot?.id) {
      Alert.alert('스팟을 선택해 주세요', '알림을 설정할 스팟을 먼저 골라 주세요.');
      return;
    }

    const apiData = {
      memo,
      // state가 이미 API enum이라 변환이 없다. 명세상 uniqueItems: true라 중복만 제거한다.
      weatherConditions: uniq(selectedWeathers),
      timeConditions: uniq(selectedTimes),
      airQualityCondition: selectedDust,
      isAlertEnabled: notifEnabled,
      alertTimingDays: parseInt(notifTiming.replace(/[^0-9]/g, '')) || 1,
      dndStartTime: dndStart,
      dndEndTime: dndEnd,
    };

    updateMutation.mutate(
      { spotId: selectedSpot.id, data: apiData },
      {
        onSuccess: () => {
          setDirty(false);
          navigation.goBack();
        },
        onError: () => {
          Alert.alert('저장 실패', '설정을 저장하지 못했습니다.');
        }
      }
    );
  };

  const handleDelete = () => {
    if (!selectedSpot?.id) return;
    deleteMutation.mutate(selectedSpot.id, {
      onSuccess: () => {
        navigation.goBack();
      },
      onError: () => {
        Alert.alert('삭제 실패', '알림 설정을 삭제하지 못했습니다.');
      }
    });
  };

  const toggleWeather = (w: WeatherCondition) => {
    setSelectedWeathers(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
    markDirty();
  };

  const toggleTime = (t: TimeCondition) => {
    setSelectedTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    markDirty();
  };

  // 전체 화면 스피너는 최초 진입 때만. 스팟을 바꿀 때마다 화면이 통째로 날아가면 안 된다.
  if (!selectedSpot && isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top', 'left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color="#E31B59" />
        <Text className="text-black/40 mt-3" style={{ fontSize: normalizeFontSize(14) }}>설정을 불러오는 중입니다...</Text>
      </SafeAreaView>
    );
  }

  // SafeAreaView edges에서 'bottom'을 뺀다 — 키보드가 올라오면 내비바 자리를 키보드가 덮으므로
  // insets.bottom과 keyboardOverlap이 이중으로 더해지면 안 된다. 저장 바에서 직접 처리한다.
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Navigation */}
      <View className="flex-row items-center justify-between border-b border-black/5 bg-white z-20" style={{ height: normalize(54), paddingHorizontal: normalize(12) }}>
        <TouchableOpacity onPress={handleBack} className="items-center justify-center rounded-full" style={{ width: normalize(36), height: normalize(36) }}>
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.5)" />
        </TouchableOpacity>
        <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(18) }}>출사 알림 설정</Text>
        <TouchableOpacity onPress={handleDelete} className="items-center justify-center rounded-full" style={{ width: normalize(36), height: normalize(36) }}>
          <IconTrash size={normalize(20)} color="#ff453a" />
        </TouchableOpacity>
      </View>

      {/* 키보드 대응은 useKeyboardOverlap 하나로만 한다.
          예전에는 여기에 KeyboardAvoidingView(behavior='height')가 걸려 있었는데, 이 앱은
          엣지투엣지라 창이 리사이즈되지 않아 KAV의 창(window) 기준 계산이 맞지 않는다.
          KAV는 state.bottom이 정확히 0으로 돌아와야만 원래 레이아웃을 복구하는데
          (RN KeyboardAvoidingView.js: bottom > 0인 동안 flex를 0으로 고정),
          좌표계가 어긋나 0에 안착하지 못하면 고정 height로 굳어 버린다. 그러면 이 컨테이너
          바깥에 있던 저장 바가 화면 아래로 밀려 반쯤 잘렸다.
          컨테이너를 keyboardOverlap만큼 줄이면 스크롤 영역과 저장 바가 함께 키보드 위로 올라온다. */}
      <View style={{ flex: 1, paddingBottom: keyboardOverlap }}>
        <ScrollView ref={scrollViewRef} className="flex-1" contentContainerStyle={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(40) }} showsVerticalScrollIndicator={false}>
        
        {/* Spot Card */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => setSpotSheetVisible(true)}
          className="overflow-hidden relative" 
          style={{ backgroundColor: selectedSpot?.bg || '#2b2a29', marginTop: normalize(16), marginBottom: normalize(28), borderRadius: normalize(16), padding: normalize(18), paddingBottom: normalize(14) }}
        >
          <Text className="font-semibold text-white tracking-tight mb-1" style={{ fontSize: normalizeFontSize(18) }}>{selectedSpot?.name || '스팟을 선택해 주세요'}</Text>
          <Text className="text-white/50 mb-2.5" style={{ fontSize: normalizeFontSize(12) }}>
            {selectedSpot ? `${selectedSpot.loc} · 포토제닉 ${selectedSpot.score}점` : '아래 버튼으로 알림을 받을 스팟을 고르세요'}
          </Text>
          <View className="flex-row gap-1.5 z-0">
            {(selectedSpot?.tags || []).map((tag: string) => (
              <View key={tag} className="bg-white/10 items-center justify-center rounded-full" style={{ paddingVertical: normalize(2), paddingHorizontal: normalize(12) }}>
                <Text className="text-white/75" style={{ fontSize: normalizeFontSize(10) }}>{tag}</Text>
              </View>
            ))}
          </View>
          <View className="absolute bottom-3 right-3 bg-white/15 rounded-full items-center justify-center z-20" style={{ height: normalize(28), paddingHorizontal: normalize(12) }}>
            <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(11) }}>스팟 변경 →</Text>
          </View>
        </TouchableOpacity>

        {/* Section 1: Weather */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-1" style={{ fontSize: normalizeFontSize(16) }}>선호 날씨</Text>
          <Text className="text-black/40 mb-3" style={{ fontSize: normalizeFontSize(12) }}>중복 선택 가능 · 아무것도 안 고르면 날씨 조건 없음</Text>
          <View className="flex-row gap-2">
            {WEATHER_CHIPS.map((w) => {
              const selected = selectedWeathers.includes(w);
              return (
                <TouchableOpacity
                  key={w}
                  onPress={() => toggleWeather(w)}
                  className={`flex-1 items-center justify-center rounded-2xl border ${selected ? 'bg-[#E31B59]/5 border-[#E31B59]' : 'bg-[#f5f5f7] border-transparent'}`}
                  style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(4) }}
                >
                  {getWeatherIcon(w, selected)}
                  <Text className={`font-medium ${selected ? 'text-[#E31B59]' : 'text-black/40'}`} style={{ fontSize: normalizeFontSize(11) }}>{WEATHER_API_TO_UI[w]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Time */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-1" style={{ fontSize: normalizeFontSize(16) }}>선호 시간대</Text>
          <Text className="text-black/40 mb-3" style={{ fontSize: normalizeFontSize(12) }}>골든아워 또는 특정 촬영 시간대</Text>
          <View className="flex-row gap-2">
            {TIME_CHIPS.map((t) => {
              const selected = selectedTimes.includes(t);
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => toggleTime(t)}
                  className={`flex-1 items-center justify-center rounded-2xl border ${selected ? 'bg-[#E31B59]/5 border-[#E31B59]' : 'bg-[#f5f5f7] border-transparent'}`}
                  style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(4) }}
                >
                  <Text className={`font-medium ${selected ? 'text-[#E31B59]' : 'text-black/40'}`} style={{ fontSize: normalizeFontSize(11) }}>{TIME_API_TO_UI[t]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 3: Dust */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-1" style={{ fontSize: normalizeFontSize(16) }}>미세먼지 조건</Text>
          <Text className="text-black/40 mb-3" style={{ fontSize: normalizeFontSize(12) }}>시야 확보를 위한 공기질 조건</Text>
          <View className="flex-row gap-2">
            {DUST_CHIPS.map((d) => {
              const selected = selectedDust === d;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => { setSelectedDust(d); markDirty(); }}
                  className={`flex-1 items-center justify-center rounded-2xl border ${selected ? 'bg-[#E31B59]/5 border-[#E31B59]' : 'bg-[#f5f5f7] border-transparent'}`}
                  style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(4) }}
                >
                  <Text className={`font-medium ${selected ? 'text-[#E31B59]' : 'text-black/40'}`} style={{ fontSize: normalizeFontSize(11) }}>{DUST_API_TO_UI[d]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 4: Notification Settings */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-3" style={{ fontSize: normalizeFontSize(16) }}>알림 설정</Text>
          
          <View className="flex-row items-center justify-between bg-[#f5f5f7] rounded-2xl mb-2" style={{ padding: normalize(16) }}>
            <View>
              <Text className="font-medium text-black mb-0.5" style={{ fontSize: normalizeFontSize(14) }}>조건 충족 시 알림 받기</Text>
              <Text className="text-black/40" style={{ fontSize: normalizeFontSize(12) }}>푸시 알림으로 알려드려요</Text>
            </View>
            <Switch 
              value={notifEnabled} 
              onValueChange={handleToggleNotif} 
              trackColor={{ false: '#e9e9ea', true: '#E31B59' }} 
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Section 5: Memo */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-1" style={{ fontSize: normalizeFontSize(16) }}>촬영 메모</Text>
          <Text className="text-black/40 mb-3" style={{ fontSize: normalizeFontSize(12) }}>구도, 렌즈 선택 등 나만의 팁을 적어두세요</Text>
          <TextInput 
            value={memo} 
            onChangeText={(t) => { setMemo(t); markDirty(); }} 
            placeholder="예: 삼각대 필수! 일몰 20분 전 레인보우 브릿지 구도 잡기" 
            placeholderTextColor="rgba(0,0,0,0.25)" 
            multiline 
            className="bg-[#f5f5f7] rounded-2xl p-4 text-black leading-relaxed" 
            style={{ fontSize: normalizeFontSize(14), height: normalize(100), textAlignVertical: 'top' }} 
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
        </View>

        </ScrollView>

        {/* Floating Save Button
            키보드가 올라와 있으면 내비바 자리는 이미 키보드가 덮고 있으므로 insets.bottom을 더하지 않는다. */}
        <View
          className="px-5 border-t border-black/5 bg-white"
          style={{ paddingTop: normalize(12), paddingBottom: normalize(12) + (keyboardOverlap > 0 ? 0 : insets.bottom) }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateMutation.isPending}
            className="bg-[#E31B59] items-center justify-center"
            style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(16) }}>저장하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Spot Change Sheet */}
      <BottomSheet visible={spotSheetVisible} onClose={() => setSpotSheetVisible(false)}>
        <View className="flex-row items-center justify-between px-5 pb-3">
          <Text className="font-semibold text-black" style={{ fontSize: normalizeFontSize(20) }}>스팟 변경</Text>
          <TouchableOpacity onPress={() => setSpotSheetVisible(false)} className="bg-black/5 items-center justify-center rounded-full" style={{ width: normalize(32), height: normalize(32) }}>
            <IconX size={normalize(14)} color="rgba(0,0,0,0.4)" />
          </TouchableOpacity>
        </View>

        <View className="px-5 mb-4">
          <View className="flex-row items-center bg-[#f5f5f7] rounded-xl px-3" style={{ height: normalize(44) }}>
            <IconSearch size={normalize(18)} color="rgba(0,0,0,0.3)" />
            <TextInput 
              value={searchText}
              onChangeText={setSearchText}
              placeholder="스팟 이름으로 검색" 
              placeholderTextColor="rgba(0,0,0,0.3)"
              className="flex-1 ml-2 text-black"
              style={{ fontSize: normalizeFontSize(14), padding: 0 }}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} hitSlop={8}>
                <IconX size={normalize(16)} color="rgba(0,0,0,0.4)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* keyboardShouldPersistTaps 기본값('never')이면 키보드가 올라온 상태의 첫 탭을
            ScrollView가 키보드 닫는 데 써버려 아래 항목의 onPress가 실행되지 않는다.
            시트는 안 닫힌 채 키보드만 내려가며 높이가 재계산돼 깜빡이는 것처럼 보인다. */}
        <ScrollView className="px-5" style={{ height: normalize(360) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text className="text-black/30 mb-2" style={{ fontSize: normalizeFontSize(12) }}>
            {isSearching ? '검색 결과' : '최신순'}
          </Text>

          {isSpotsLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator color="#E31B59" size="small" />
              <Text className="text-black/40 text-xs mt-2">스팟을 불러오는 중...</Text>
            </View>
          ) : spotsList.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-black/40 text-sm">검색 결과가 없습니다.</Text>
            </View>
          ) : (
            spotsList.map((s: any) => {
              const isSelected = String(s.id) === String(selectedSpot?.id);
              return (
                <TouchableOpacity 
                  key={s.id} 
                  onPress={() => { Keyboard.dismiss(); setSelectedSpot(s); setSpotSheetVisible(false); markDirty(); }}
                  className={`flex-row items-center rounded-2xl mb-2 ${isSelected ? 'bg-white border border-[#E31B59]' : 'bg-[#f5f5f7]'}`} 
                  style={{ padding: normalize(14) }}
                >
                  <View className="rounded-xl mr-3" style={{ width: normalize(48), height: normalize(48), backgroundColor: s.bg }} />
                  <View className="flex-1">
                    <Text className="font-semibold text-black mb-1" style={{ fontSize: normalizeFontSize(16) }}>{s.name}</Text>
                    <Text className="text-black/40 mb-1" style={{ fontSize: normalizeFontSize(12) }}>{s.loc}</Text>
                    <View className="self-start rounded-full items-center justify-center" style={{ backgroundColor: isSelected ? 'rgba(227,27,89,0.1)' : 'rgba(0,0,0,0.05)', paddingHorizontal: normalize(6), paddingVertical: normalize(2) }}>
                      <Text style={{ fontSize: normalizeFontSize(9), color: isSelected ? '#E31B59' : 'rgba(0,0,0,0.3)', fontWeight: '600' }}>포토제닉 {s.score}점</Text>
                    </View>
                  </View>
                  {isSelected && (
                    <View className="items-center justify-center bg-[#E31B59] rounded-full" style={{ width: normalize(22), height: normalize(22) }}>
                      <IconCheck size={normalize(14)} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

        </ScrollView>
        <View className="px-5 pt-3 pb-2 bg-white">
          <TouchableOpacity onPress={() => {
            setSpotSheetVisible(false);
            navigation.push('Map', { source: 'wishlist-change' });
          }} className="items-center py-2">
            <Text className="font-medium text-[#E31B59]" style={{ fontSize: normalizeFontSize(14) }}>전체 스팟 지도에서 검색 →</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

    </SafeAreaView>
  );
}
