import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Switch, Modal, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_SM, BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { 
  IconChevronLeft, IconTrash, IconX, IconCheck, IconSearch, 
  IconSun, IconCloud, IconCloudRain, IconCloudSnow, IconCloudFog, IconCloudStorm
} from '@tabler/icons-react-native';

import BottomSheet from '@/components/common/BottomSheet';
import { useSpotAlert } from '@/hooks/useSpotAlert';
import { useSpots, useSearchSpots } from '@/hooks/useSpot';
import { WEATHER_API_TO_UI, WEATHER_UI_TO_API, TIME_API_TO_UI, TIME_UI_TO_API, DUST_API_TO_UI, DUST_UI_TO_API } from '@/utils/wishlistMapper';

const WEATHERS = [
  { id: '맑음', label: '맑음' },
  { id: '흐림', label: '구름조금' },
  { id: '비', label: '흐림' },
  { id: '눈', label: '비/눈' },
];

const DUSTS = [
  { id: '좋음', label: '좋음' },
  { id: '보통', label: '보통 이상' },
  { id: '상관없음', label: '상관없음' },
];

const TIMES = [
  { id: '일출', label: '일출' },
  { id: '주간', label: '낮' },
  { id: '일몰', label: '일몰' },
  { id: '야간', label: '야간' },
];

const getWeatherIcon = (id: string, selected: boolean) => {
  let IconComponent = IconSun;
  let activeColor = '#E31B59';
  switch (id) {
    case '맑음': 
      IconComponent = IconSun;
      activeColor = '#FBBF24';
      break;
    case '흐림': 
      IconComponent = IconCloud;
      break;
    case '비': 
      IconComponent = IconCloudRain;
      break;
    case '눈': 
      IconComponent = IconCloudSnow;
      break;
    case '안개': 
      IconComponent = IconCloudFog;
      break;
    case '뇌우': 
      IconComponent = IconCloudStorm;
      activeColor = '#FBBF24';
      break;
  }
  return <IconComponent size={normalize(22)} color={selected ? activeColor : 'rgba(0,0,0,0.25)'} style={{ marginBottom: normalize(2) }} />;
};

export default function SpotAlertSettingScreen({ navigation, route }: any) {
  const existingSpotId = route.params?.id;
  const { useSpotAlertDetailQuery, useUpdateSpotAlertMutation, useDeleteSpotAlertMutation } = useSpotAlert();
  const { data: initData, isLoading } = useSpotAlertDetailQuery(existingSpotId);

  const [selectedSpot, setSelectedSpot] = useState<any>({
    id: 1,
    name: '경복궁 근정전',
    loc: '서울 종로구',
    score: 98,
    bg: '#2b2a29',
    tags: ['#한옥', '#고궁'],
  });

  const [selectedWeathers, setSelectedWeathers] = useState<string[]>(['맑음']);
  const [selectedDust, setSelectedDust] = useState('좋음');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['일몰', '야간']);
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
      if (initData.weatherConditions) {
        setSelectedWeathers(initData.weatherConditions.map(c => WEATHER_API_TO_UI[c] || c));
      }
      if (initData.timeConditions) {
        setSelectedTimes(initData.timeConditions.map(c => TIME_API_TO_UI[c] || c));
      }
      if (initData.airQualityCondition) {
        setSelectedDust(DUST_API_TO_UI[initData.airQualityCondition] || '좋음');
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

  const markDirty = () => setDirty(true);

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
    const apiData = {
      memo,
      weatherConditions: selectedWeathers.map(w => WEATHER_UI_TO_API[w] || 'CLEAR'),
      timeConditions: selectedTimes.map(t => TIME_UI_TO_API[t] || 'SUNSET'),
      airQualityCondition: DUST_UI_TO_API[selectedDust] || 'GOOD',
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
    deleteMutation.mutate(selectedSpot.id, {
      onSuccess: () => {
        navigation.goBack();
      },
      onError: () => {
        Alert.alert('삭제 실패', '알림 설정을 삭제하지 못했습니다.');
      }
    });
  };

  const toggleWeather = (w: string) => {
    setSelectedWeathers(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
    markDirty();
  };

  const toggleTime = (t: string) => {
    setSelectedTimes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    markDirty();
  };

  if (existingSpotId && isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center" edges={['top', 'left', 'right', 'bottom']}>
        <ActivityIndicator size="large" color="#E31B59" />
        <Text className="text-black/40 mt-3" style={{ fontSize: normalizeFontSize(14) }}>설정을 불러오는 중입니다...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right', 'bottom']}>
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

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? normalize(54) : 0} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} className="flex-1" contentContainerStyle={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(40) }} showsVerticalScrollIndicator={false}>
        
        {/* Spot Card */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => setSpotSheetVisible(true)}
          className="overflow-hidden relative" 
          style={{ backgroundColor: selectedSpot.bg, marginTop: normalize(16), marginBottom: normalize(28), borderRadius: normalize(16), padding: normalize(18), paddingBottom: normalize(14) }}
        >
          <Text className="font-semibold text-white tracking-tight mb-1" style={{ fontSize: normalizeFontSize(18) }}>{selectedSpot.name}</Text>
          <Text className="text-white/50 mb-2.5" style={{ fontSize: normalizeFontSize(12) }}>{selectedSpot.loc} · 포토제닉 {selectedSpot.score}점</Text>
          <View className="flex-row gap-1.5 z-0">
            {(selectedSpot.tags || []).map((tag: string) => (
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
            {WEATHERS.map((w) => {
              const selected = selectedWeathers.includes(w.id);
              return (
                <TouchableOpacity 
                  key={w.id} 
                  onPress={() => toggleWeather(w.id)} 
                  className={`flex-1 items-center justify-center rounded-2xl border ${selected ? 'bg-[#E31B59]/5 border-[#E31B59]' : 'bg-[#f5f5f7] border-transparent'}`} 
                  style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(4) }}
                >
                  {getWeatherIcon(w.id, selected)}
                  <Text className={`font-medium ${selected ? 'text-[#E31B59]' : 'text-black/40'}`} style={{ fontSize: normalizeFontSize(11) }}>{w.label}</Text>
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
            {TIMES.map((t) => {
              const selected = selectedTimes.includes(t.id);
              return (
                <TouchableOpacity 
                  key={t.id} 
                  onPress={() => toggleTime(t.id)} 
                  className={`flex-1 items-center justify-center rounded-2xl border ${selected ? 'bg-[#E31B59]/5 border-[#E31B59]' : 'bg-[#f5f5f7] border-transparent'}`} 
                  style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(4) }}
                >
                  <Text className={`font-medium ${selected ? 'text-[#E31B59]' : 'text-black/40'}`} style={{ fontSize: normalizeFontSize(11) }}>{t.label}</Text>
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
            {DUSTS.map((d) => {
              const selected = selectedDust === d.id;
              return (
                <TouchableOpacity 
                  key={d.id} 
                  onPress={() => { setSelectedDust(d.id); markDirty(); }} 
                  className={`flex-1 items-center justify-center rounded-2xl border ${selected ? 'bg-[#E31B59]/5 border-[#E31B59]' : 'bg-[#f5f5f7] border-transparent'}`} 
                  style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(4) }}
                >
                  <Text className={`font-medium ${selected ? 'text-[#E31B59]' : 'text-black/40'}`} style={{ fontSize: normalizeFontSize(11) }}>{d.label}</Text>
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
              onValueChange={(v) => { setNotifEnabled(v); markDirty(); }} 
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
      </KeyboardAvoidingView>

      {/* Floating Save Button */}
      <View className="px-5 py-3 border-t border-black/5 bg-white">
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

        <ScrollView className="px-5" style={{ maxHeight: normalize(400) }} showsVerticalScrollIndicator={false}>
          <Text className="text-black/30 mb-2" style={{ fontSize: normalizeFontSize(12) }}>
            {isSearching ? '검색 결과' : '스팟 목록'}
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
              const isSelected = String(s.id) === String(selectedSpot.id);
              return (
                <TouchableOpacity 
                  key={s.id} 
                  onPress={() => { setSelectedSpot(s); setSpotSheetVisible(false); markDirty(); }} 
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
