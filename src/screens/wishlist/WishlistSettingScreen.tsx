import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Switch, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { FONT_SM, BUTTON_HEIGHT, BUTTON_RADIUS, CONTENT_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { useWishlist } from '@/hooks/useWishlist';
import { WEATHER_API_TO_UI, WEATHER_UI_TO_API, TIME_API_TO_UI, TIME_UI_TO_API, DUST_API_TO_UI, DUST_UI_TO_API } from '@/utils/wishlistMapper';
import { IconChevronLeft, IconTrash, IconX, IconSearch, IconCheck, IconAlertCircle, IconSun, IconCloud, IconCloudRain, IconCloudSnow, IconCloudFog, IconCloudStorm } from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';

const MOCK_SPOTS = [
  { id: 1, name: '경복궁 야간개장', loc: '서울 종로구', score: 91, tags: ['야경', '한옥'], bg: '#8c3b31' },
  { id: 2, name: '광안리 해수욕장', loc: '부산 수영구', score: 87, tags: ['바다', '야경'], bg: '#2c3e50' },
  { id: 3, name: '제주 사려니숲길', loc: '제주 서귀포시', score: 78, tags: ['숲', '자연'], bg: '#2d5a27' },
  { id: 4, name: '에버랜드 장미원', loc: '경기 용인시', score: 92, tags: ['꽃', '테마파크'], bg: '#4a235a' }
];

const WEATHER_OPTIONS = ['맑음', '흐림', '비', '눈']; // API 지원 값만 포함 (CLEAR/CLOUDY/RAINY/SNOWY)
const DUST_OPTIONS = ['좋음', '보통 이하', '상관 없음'];
const TIME_OPTIONS = ['새벽', '일출', '오전', '오후', '일몰', '야간'];

const getWeatherIcon = (w: string, selected: boolean) => {
  let IconComponent = IconSun;
  let activeColor = 'white';
  
  switch (w) {
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

export default function WishlistSettingScreen({ navigation, route }: any) {
  const existingSpotId = route.params?.id;
  const { useWishlistDetailQuery, useUpdateWishlistMutation, useDeleteWishlistMutation } = useWishlist();
  const { data: initData, isLoading } = useWishlistDetailQuery(existingSpotId);

  const [selectedSpot, setSelectedSpot] = useState(MOCK_SPOTS[0]);
  const [selectedWeathers, setSelectedWeathers] = useState<string[]>(['맑음']);
  const [selectedDust, setSelectedDust] = useState('좋음');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['일몰', '야간']);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifTiming, setNotifTiming] = useState('1일 전');
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('07:00');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (initData) {
      setSelectedSpot({
        id: initData.spotId,
        name: initData.spotName,
        loc: initData.address || '',
        score: initData.photogenicScore || 0,
        tags: initData.tags || [],
        bg: '#2c3e50', // Fallback color
      });
      setSelectedWeathers(initData.weatherConditions?.map(w => WEATHER_API_TO_UI[w] || w) || []);
      setSelectedTimes(initData.timeConditions?.map(t => TIME_API_TO_UI[t] || t) || []);
      setSelectedDust(DUST_API_TO_UI[initData.airQualityCondition] || '좋음');
      setNotifEnabled(initData.isAlertEnabled);
      const timingMap: Record<number, string> = { 0: '당일', 1: '1일 전', 3: '3일 전' };
      setNotifTiming(timingMap[initData.alertTimingDays] || '1일 전');
      setDndStart(initData.dndStartTime ? initData.dndStartTime.slice(0, 5) : '22:00');
      setDndEnd(initData.dndEndTime ? initData.dndEndTime.slice(0, 5) : '07:00');
      setMemo(initData.memo || '');
    }
  }, [initData]);

  useEffect(() => {
    if (route.params?.newSpot) {
      const incomingSpot = route.params.newSpot;
      const existingMock = MOCK_SPOTS.find(s => String(s.id) === String(incomingSpot.id) || s.name === incomingSpot.name);
      
      setSelectedSpot({
        ...incomingSpot,
        bg: incomingSpot.bg || existingMock?.bg || '#2c3e50'
      });
      markDirty();
      navigation.setParams({ newSpot: undefined });
    }
  }, [route.params?.newSpot, navigation]);

  // Modals / Sheets
  const [spotSheetVisible, setSpotSheetVisible] = useState(false);
  const [unsavedModalVisible, setUnsavedModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [backAction, setBackAction] = useState<any>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty) return;
      e.preventDefault();
      setBackAction(e.data.action);
      setUnsavedModalVisible(true);
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  const updateMutation = useUpdateWishlistMutation();
  const deleteMutation = useDeleteWishlistMutation();

  const handleSave = () => {
    if (updateMutation.isPending) return;
    const data = {
      memo,
      weatherConditions: selectedWeathers.map(w => WEATHER_UI_TO_API[w] || 'CLEAR'),
      timeConditions: selectedTimes.map(t => TIME_UI_TO_API[t] || 'NONE'),
      airQualityCondition: DUST_UI_TO_API[selectedDust] || 'GOOD',
      isAlertEnabled: notifEnabled,
      alertTimingDays: notifTiming === '당일' ? 0 : notifTiming === '3일 전' ? 3 : 1,
      dndStartTime: dndStart + ':00',
      dndEndTime: dndEnd + ':00',
    };

    updateMutation.mutate(
      { spotId: selectedSpot.id, data },
      {
        onSuccess: () => {
          setIsDirty(false);
          setTimeout(() => {
            navigation.goBack();
          }, 50);
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (deleteMutation.isPending) return;
    setDeleteModalVisible(false);
    if (!existingSpotId) return;
    deleteMutation.mutate(existingSpotId, {
      onSuccess: () => {
        setIsDirty(false);
        setTimeout(() => {
          navigation.goBack();
        }, 50);
      },
    });
  };

  const markDirty = () => setIsDirty(true);

  const handleBack = () => {
    if (isDirty) {
      setBackAction(null);
      setUnsavedModalVisible(true);
    } else {
      navigation.goBack();
    }
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
        <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(18) }}>위시리스트 설정</Text>
        <TouchableOpacity onPress={() => setDeleteModalVisible(true)} className="items-center justify-center rounded-full" style={{ width: normalize(36), height: normalize(36) }}>
          <IconTrash size={normalize(20)} color="#ff453a" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? normalize(54) : 0} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} className="flex-1" contentContainerStyle={{ paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(40) }} showsVerticalScrollIndicator={false}>
        
        {/* Spot Card */}
        <View className="overflow-hidden" style={{ backgroundColor: selectedSpot.bg, marginTop: normalize(16), marginBottom: normalize(28), borderRadius: normalize(16), padding: normalize(18), paddingBottom: normalize(14) }}>
          <Text className="font-semibold text-white tracking-tight mb-1" style={{ fontSize: normalizeFontSize(18) }}>{selectedSpot.name}</Text>
          <Text className="text-white/50 mb-2.5" style={{ fontSize: normalizeFontSize(12) }}>{selectedSpot.loc} · 포토제닉 {selectedSpot.score}점</Text>
          <View className="flex-row gap-1.5 relative z-10">
            {(selectedSpot.tags || []).map((tag: string) => (
              <View key={tag} className="bg-white/10 items-center justify-center rounded-full" style={{ paddingVertical: normalize(2), paddingHorizontal: normalize(12) }}>
                <Text className="text-white/75" style={{ fontSize: normalizeFontSize(10) }}>{tag}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => setSpotSheetVisible(true)} className="absolute bg-white/15 items-center justify-center rounded-full" style={{ top: normalize(18), right: normalize(14), paddingVertical: normalize(6), paddingHorizontal: normalize(16) }}>
            <Text className="font-medium text-white/80" style={{ fontSize: normalizeFontSize(12) }}>스팟 변경</Text>
          </TouchableOpacity>
          <View className="absolute bottom-0 left-0 right-0 bg-black/10" style={{ height: normalize(40) }} />
        </View>

        {/* Weather Conditions */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-0.5" style={{ fontSize: normalizeFontSize(18) }}>날씨 조건</Text>
          <Text className="text-black/40 mb-3.5" style={{ fontSize: FONT_SM }}>조건이 맞을 때 알림을 받아요 (복수 선택)</Text>
          <View className="flex-row flex-wrap gap-2">
            {WEATHER_OPTIONS.map(w => {
              const selected = selectedWeathers.includes(w);
              return (
                <TouchableOpacity 
                  key={w} 
                  onPress={() => toggleWeather(w)} 
                  className="items-center justify-center border" 
                  style={{ 
                    width: normalize(66), 
                    height: normalize(66), 
                    borderRadius: normalize(16),
                    backgroundColor: selected ? '#E31B59' : 'white',
                    borderColor: selected ? '#E31B59' : 'rgba(0,0,0,0.1)'
                  }}
                >
                  {getWeatherIcon(w, selected)}
                  <Text className={selected ? 'font-semibold' : ''} style={{ fontSize: normalizeFontSize(12), color: selected ? 'white' : 'rgba(0,0,0,0.45)' }}>{w}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View className="w-full bg-black/5 mb-7" style={{ height: normalize(1) }} />

        {/* Dust Conditions */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-0.5" style={{ fontSize: normalizeFontSize(18) }}>미세먼지 조건</Text>
          <Text className="text-black/40 mb-3.5" style={{ fontSize: FONT_SM }}>선택한 등급 이상일 때 알림을 드려요 (단일 선택)</Text>
          <View className="flex-row flex-wrap gap-2">
            {DUST_OPTIONS.map(d => {
              const selected = selectedDust === d;
              return (
                <TouchableOpacity key={d} onPress={() => { setSelectedDust(d); markDirty(); }} className={`items-center justify-center border px-4 ${selected ? 'border-[#E31B59] bg-[#E31B59]' : 'border-black/10 bg-white'}`} style={{ height: normalize(40), borderRadius: normalize(20) }}>
                  <Text className={selected ? 'text-white font-semibold' : 'text-black/45'} style={{ fontSize: FONT_SM }}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View className="w-full bg-black/5 mb-7" style={{ height: normalize(1) }} />

        {/* Time Conditions */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-0.5" style={{ fontSize: normalizeFontSize(18) }}>시간대 조건</Text>
          <Text className="text-black/40 mb-3.5" style={{ fontSize: FONT_SM }}>해당 시간대가 가까워지면 알려드려요</Text>
          <View className="flex-row flex-wrap gap-2">
            {TIME_OPTIONS.map(t => {
              const selected = selectedTimes.includes(t);
              return (
                <TouchableOpacity key={t} onPress={() => toggleTime(t)} className={`items-center justify-center px-5 ${selected ? 'bg-[#E31B59]' : 'bg-[#f5f5f7]'}`} style={{ height: normalize(34), borderRadius: normalize(17) }}>
                  <Text className={selected ? 'text-white font-semibold' : 'text-black/45'} style={{ fontSize: FONT_SM }}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View className="w-full bg-black/5 mb-7" style={{ height: normalize(1) }} />

        {/* Notification Settings */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-3.5" style={{ fontSize: normalizeFontSize(18) }}>알림 설정</Text>
          <View className="bg-[#f5f5f7] rounded-2xl overflow-hidden">
            <View className="flex-row items-center justify-between border-b border-black/5" style={{ paddingVertical: normalize(14), paddingHorizontal: normalize(16) }}>
              <View>
                <Text className="font-medium text-black" style={{ fontSize: normalizeFontSize(16) }}>조건 충족 시 알림 받기</Text>
                <Text className="text-black/40 mt-1" style={{ fontSize: normalizeFontSize(12) }}>조건이 맞는 날 지정한 시점에 알림을 드려요</Text>
              </View>
              <Switch value={notifEnabled} onValueChange={(val) => { setNotifEnabled(val); markDirty(); }} trackColor={{ true: '#34C759' }} />
            </View>
            <View className="flex-row items-center justify-between border-b border-black/5" style={{ paddingVertical: normalize(14), paddingHorizontal: normalize(16) }}>
              <Text className="text-black" style={{ fontSize: normalizeFontSize(16) }}>알림 시점</Text>
              <View className="flex-row bg-black/5 p-0.5 rounded-lg" style={{ width: normalize(210) }}>
                {['당일', '1일 전', '3일 전'].map(seg => {
                  const isSelected = notifTiming === seg;
                  return (
                    <Pressable 
                      key={seg} 
                      onPress={() => { setNotifTiming(seg); markDirty(); }} 
                      style={{ 
                        flex: 1, 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: normalize(28), 
                        borderRadius: normalize(6),
                        backgroundColor: isSelected ? 'white' : 'transparent',
                        ...(isSelected ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 } : {})
                      }}
                    >
                      <Text style={{ fontSize: FONT_SM, fontWeight: isSelected ? '600' : 'normal', color: isSelected ? 'black' : 'rgba(0,0,0,0.4)' }}>
                        {seg}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
          <Text className="text-black/35 mt-2" style={{ fontSize: normalizeFontSize(12), lineHeight: normalize(18) }}>
            방해 금지 시간은{' '}
            <Text
              className="font-semibold"
              style={{ color: '#E31B59' }}
              onPress={() => {
                // TODO: 마이페이지 탭 > 설정 화면으로 이동
              }}
            >
              설정 › 방해 금지
            </Text>
            에서 모든 알림에 공통 적용돼요.
          </Text>
        </View>
        <View className="w-full bg-black/5 mb-7" style={{ height: normalize(1) }} />

        {/* Forecast Preview */}
        <View className="mb-7">
          <View className="flex-row justify-between items-baseline mb-3.5">
            <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(18) }}>예상 충족일</Text>
            <Text className="text-black/30" style={{ fontSize: normalizeFontSize(12) }}>기상청 7일 예보 기준</Text>
          </View>
          <View className="bg-[#f5f5f7] rounded-2xl" style={{ paddingVertical: normalize(14), paddingHorizontal: normalize(10) }}>
            <View className="flex-row justify-between">
              {[
                { day: '오늘', hit: false, date: '5/18' },
                { day: '내일', hit: true, date: '5/19' },
                { day: '+2', hit: false, date: '5/20' },
                { day: '+3', hit: true, date: '5/21' },
                { day: '+4', hit: false, date: '5/22' },
                { day: '+5', hit: false, date: '5/23' },
                { day: '+6', hit: false, date: '5/24' },
              ].map((f, i) => (
                <View key={i} className="flex-1 items-center gap-1">
                  <Text style={{ fontSize: normalizeFontSize(11), color: f.hit ? '#E31B59' : 'rgba(0,0,0,0.3)', fontWeight: f.hit ? '600' : 'normal' }}>{f.day}</Text>
                  <View className={`items-center justify-center rounded-full bg-white border ${f.hit ? 'border-[#E31B59] bg-[#E31B59]/10' : 'border-black/5'}`} style={{ width: normalize(38), height: normalize(38) }}>
                    {f.hit ? <IconSun size={normalize(20)} color="#E31B59" /> : <IconCloud size={normalize(20)} color="rgba(0,0,0,0.25)" />}
                  </View>
                  <Text style={{ fontSize: normalizeFontSize(10), color: f.hit ? '#E31B59' : 'rgba(0,0,0,0.25)', fontWeight: f.hit ? '500' : 'normal' }}>{f.hit ? '맑음' : '구름'}</Text>
                  <Text style={{ fontSize: normalizeFontSize(10), color: f.hit ? '#E31B59' : 'rgba(0,0,0,0.2)' }}>{f.date}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row items-start rounded-xl bg-[#E31B59]/5 mt-3" style={{ paddingVertical: normalize(12), paddingHorizontal: normalize(14) }}>
              <View className="bg-[#E31B59] items-center justify-center rounded-full mr-2.5 mt-0.5" style={{ width: normalize(20), height: normalize(20) }}>
                <IconCheck size={normalize(12)} color="#fff" />
              </View>
              <View>
                <Text className="font-medium text-[#E31B59] mb-1" style={{ fontSize: FONT_SM }}>조건 충족 예상: 5/19(내일), 5/21</Text>
                <Text className="text-black/50" style={{ fontSize: normalizeFontSize(12) }}>일몰 시간 18:47 · 맑음 예보</Text>
              </View>
            </View>
          </View>
        </View>
        <View className="w-full bg-black/5 mb-7" style={{ height: normalize(1) }} />

        {/* Memo */}
        <View className="mb-7">
          <Text className="font-semibold text-black tracking-tight mb-3.5" style={{ fontSize: normalizeFontSize(18) }}>메모</Text>
          <View className="relative">
            <TextInput
              value={memo}
              onChangeText={(t) => { setMemo(t); markDirty(); }}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 150);
              }}
              multiline
              maxLength={200}
              placeholder="메모를 입력하세요"
              className="bg-[#f5f5f7] rounded-xl text-black"
              style={{ height: normalize(96), padding: normalize(14), fontSize: FONT_SM, textAlignVertical: 'top' }}
            />
            <Text className="absolute bottom-2.5 right-3 text-black/30" style={{ fontSize: normalizeFontSize(12) }}>{memo.length}/200</Text>
          </View>
        </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* CTA Bar */}
      <View className="bg-white border-t border-black/5" style={{ padding: normalize(12), paddingHorizontal: CONTENT_PADDING, paddingBottom: normalize(28) }}>
        <TouchableOpacity onPress={handleSave} className="bg-[#E31B59] items-center justify-center" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
          <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(16) }}>설정 저장</Text>
        </TouchableOpacity>
      </View>

      {/* Unsaved Modal */}
      <BottomSheet visible={unsavedModalVisible} onClose={() => setUnsavedModalVisible(false)}>
        <View className="px-5 pb-5">
          <View className="items-center justify-center bg-[#f5f5f7] rounded-2xl mx-auto mb-4" style={{ width: normalize(52), height: normalize(52) }}>
            <IconAlertCircle size={normalize(24)} color="rgba(0,0,0,0.4)" />
          </View>
          <Text className="font-semibold text-black text-center mb-2" style={{ fontSize: normalizeFontSize(18) }}>저장하지 않고 나갈까요?</Text>
          <Text className="text-black/45 text-center mb-7" style={{ fontSize: normalizeFontSize(14) }}>변경 사항이 저장되지 않아요.</Text>
          <View className="gap-2.5">
            <TouchableOpacity onPress={() => setUnsavedModalVisible(false)} className="bg-[#E31B59] items-center justify-center" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
              <Text className="font-medium text-white" style={{ fontSize: normalizeFontSize(16) }}>계속 편집</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setUnsavedModalVisible(false);
                setIsDirty(false);
                setTimeout(() => {
                  if (backAction) navigation.dispatch(backAction);
                  else navigation.goBack();
                }, 10);
              }} 
              className="bg-[#f5f5f7] items-center justify-center" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
              <Text className="font-medium text-black/60" style={{ fontSize: normalizeFontSize(16) }}>나가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      {/* Delete Modal */}
      <BottomSheet visible={deleteModalVisible} onClose={() => setDeleteModalVisible(false)}>
        <View className="px-5 pb-5 pt-2">
          <Text className="font-semibold text-black mb-2" style={{ fontSize: normalizeFontSize(20) }}>위시리스트를 삭제할까요?</Text>
          <Text className="text-black/45 leading-relaxed mb-6" style={{ fontSize: normalizeFontSize(16) }}>{selectedSpot.name} 위시리스트가 삭제돼요. 삭제 후에는 복구할 수 없어요.</Text>
          <TouchableOpacity onPress={handleDeleteConfirm} className="bg-[#ff453a]/10 items-center justify-center mb-2.5" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
            <Text className="font-medium text-[#ff453a]" style={{ fontSize: normalizeFontSize(16) }}>삭제하기</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setDeleteModalVisible(false)} className="bg-[#f5f5f7] items-center justify-center" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
            <Text className="font-medium text-black/50" style={{ fontSize: normalizeFontSize(16) }}>취소</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

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
              placeholder="스팟 이름으로 검색" 
              placeholderTextColor="rgba(0,0,0,0.3)"
              className="flex-1 ml-2 text-black"
              style={{ fontSize: normalizeFontSize(14), padding: 0 }}
            />
          </View>
        </View>

        <ScrollView className="px-5" style={{ maxHeight: normalize(400) }}>
          <Text className="text-black/30 mb-2" style={{ fontSize: normalizeFontSize(12) }}>최근 본 스팟</Text>

          {MOCK_SPOTS.map((s) => {
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
                    <Text style={{ fontSize: normalizeFontSize(9), color: isSelected ? '#E31B59' : 'rgba(0,0,0,0.3)', fontWeight: '600' }}>포토제닉 {s.score}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View className="items-center justify-center bg-[#E31B59] rounded-full" style={{ width: normalize(22), height: normalize(22) }}>
                    <IconCheck size={normalize(14)} color="#fff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

        </ScrollView>
        <View className="px-5 pt-3 pb-2 bg-white">
          <TouchableOpacity onPress={() => {
            setSpotSheetVisible(false);
            navigation.push('Map', { source: 'wishlist-change' });
          }} className="items-center py-2">
            <Text className="font-medium text-[#E31B59]" style={{ fontSize: normalizeFontSize(14) }}>전체 스팟에서 검색 →</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

    </SafeAreaView>
  );
}
