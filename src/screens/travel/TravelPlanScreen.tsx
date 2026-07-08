import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import {
  IconChevronLeft, IconShare, IconMap, IconDots,
  IconClock, IconCar, IconWalk, IconTrash,
  IconMapPinFilled, IconRoad, IconCheck, IconChevronUp, IconChevronDown
} from '@tabler/icons-react-native';
import NaviSheet from '@/components/spot/NaviSheet';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

const DAY_COLORS: Record<string, string> = { '1': '#f59e0b', '2': '#3b82f6', '3': '#10b981', '4': '#8b5cf6' };
const COMMON_CHECKLIST = ['삼각대', '광각렌즈 (16-35mm)', 'ND 필터', '보조배터리', '편한 신발', '드론', '편광 필터'];

const MOCK_DATA: Record<string, any> = {
  '1': {
    date: '5월 17일 토요일',
    tip: '광안리 일출 시간 05:32 · 골든아워 06:00~06:40\n미세먼지 좋음 · 일출 포인트로 이동 추천',
    checklist: ['삼각대', '광각렌즈 (16-35mm)', 'ND 필터', '보조배터리', '편한 신발'],
    spots: [
      { id: 'spot1', name: '광안리 해수욕장', loc: '부산 수영구 · 야경/바다', time: '06:30 ~ 08:00', dur: '1시간 30분', score: '87점', scoreColor: '#ff9f0a', bg: '#0f2027', lat: 35.1531696, lng: 129.118666 },
      { id: 'spot2', name: '해동용궁사', loc: '부산 기장군 · 한옥/바다', time: '09:00 ~ 10:30', dur: '1시간 30분', score: '82점', scoreColor: '#ff9f0a', bg: '#8e7b5a', lat: 35.1884148, lng: 129.223293 },
      { id: 'spot3', name: '감천문화마을', loc: '부산 사하구 · 인물/감성', time: '11:00 ~ 13:00', dur: '2시간', score: '79점', scoreColor: '#34c759', bg: '#b44a3a', lat: 35.0974711, lng: 129.010595 }
    ],
    transports: [
      { type: 'car', label: '차량 25분 · 18km' },
      { type: 'walk', label: '도보 12분· 0.8km' }
    ]
  },
  '2': {
    date: '5월 18일 일요일',
    tip: '영도 일몰 시간 19:22 · 골든아워 18:40~19:22\n미세먼지 보통 · 흰여울마을 오전 방문 추천',
    checklist: ['편광 필터', '드론', '삼각대', '여분의 메모리카드'],
    spots: [
      { id: 'spot4', name: '흰여울문화마을', loc: '부산 영도구 · 뷰/감성', time: '09:30 ~ 11:00', dur: '1시간 30분', score: '91점', scoreColor: '#e31b59', bg: '#667eea', lat: 35.0788, lng: 129.0439 },
      { id: 'spot5', name: '태종대 유원지', loc: '부산 영도구 · 바다/절벽', time: '11:30 ~ 13:30', dur: '2시간', score: '88점', scoreColor: '#ff9f0a', bg: '#1a6b8a', lat: 35.0527, lng: 129.0877 }
    ],
    transports: [
      { type: 'car', label: '차량 15분 · 7km' }
    ]
  },
  '3': {
    date: '5월 19일 월요일',
    tip: null,
    checklist: [],
    spots: [],
    transports: []
  },
  '4': {
    date: '5월 20일 화요일',
    tip: null,
    checklist: [],
    spots: [],
    transports: []
  }
};

export default function TravelPlanScreen({ navigation }: any) {
  const [currentDay, setCurrentDay] = useState<string>('1');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDepartModalVisible, setIsDepartModalVisible] = useState(false);
  const [data, setData] = useState(MOCK_DATA);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const scrollRef = useRef<any>(null);
  const headerHeightRef = useRef<number>(0);
  const rowOffsets = useRef<{ [key: number]: number }>({});

  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const currentData = data[currentDay];

  const handleMapMessage = (event: any) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed.type === 'SPOT_CLICK') {
        const spotId = parsed.data.id;
        const index = currentData.spots.findIndex((s: any) => s.id === spotId);
        if (index === -1) return;

        setSelectedSpotId(spotId); // 선택 하이라이트 (항상 동작)

        const yOffset = rowOffsets.current[index] || 0;
        scrollRef.current?.scrollTo({ y: headerHeightRef.current + yOffset - 24, animated: true });
      } else if (parsed.type === 'MAP_CLICK') {
        setSelectedSpotId(null);
      }
    } catch (e) {
      console.log('WebView Message Parse Error:', e);
    }
  };

  const toggleChecklist = (item: string) => {
    setCheckedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const moveSpot = (index: number, dir: -1 | 1) => {
    setData((prev) => {
      const dayData = prev[currentDay];
      const target = index + dir;
      if (target < 0 || target >= dayData.spots.length) return prev;
      const spots = [...dayData.spots];
      [spots[index], spots[target]] = [spots[target], spots[index]];
      return { ...prev, [currentDay]: { ...dayData, spots } };
    });
  };


  const removeSpot = (spotId: string) => {
    setData((prev) => {
      const dayData = prev[currentDay];
      const newSpots = dayData.spots.filter((s: any) => s.id !== spotId);
      const newTransports = [...dayData.transports];
      if (newTransports.length >= newSpots.length && newTransports.length > 0) {
        newTransports.pop();
      }
      return {
        ...prev,
        [currentDay]: { ...dayData, spots: newSpots, transports: newTransports }
      };
    });
  };

  const renderKakaoMapHTML = (showAllDays = true, drawLine = true, isInteractive = false) => {
    let allMarkersHtml = '';
    let allPolylinesHtml = '';
    let totalSpots = 0;

    const daysToRender = showAllDays ? Object.keys(data) : [currentDay];

    daysToRender.forEach((day) => {
      // @ts-ignore
      const spots = data[day].spots;
      totalSpots += spots.length;
      const isSelected = day === currentDay;
      const opacity = isSelected ? 1 : 0.3;
      // @ts-ignore
      const color = DAY_COLORS[day] || '#e31b59';

      const markersHtml = spots.map((spot: any, i: number) => `
        var pos_${day}_${i} = new kakao.maps.LatLng(${spot.lat}, ${spot.lng});
        bounds.extend(pos_${day}_${i});
        
        var contentWrapper_${day}_${i} = document.createElement('div');
        contentWrapper_${day}_${i}.innerHTML = '<div style="background:${color}; opacity:${opacity}; color:white; font-size:12px; font-weight:bold; padding:4px 8px; border-radius:12px; transform:translateY(-10px); box-shadow:0 2px 4px rgba(0,0,0,0.2); pointer-events:auto;">${i+1}</div>';
        
        ${isInteractive ? `
        contentWrapper_${day}_${i}.onclick = function(e) {
            e.stopPropagation();
            cancelMapClose();
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPOT_CLICK', data: ${JSON.stringify(spot).replace(/</g, '\\u003c')} }));
        };
        contentWrapper_${day}_${i}.addEventListener('touchstart', function(e) { e.stopPropagation(); cancelMapClose(); }, { passive: true });
        ` : ''}

        var customOverlay_${day}_${i} = new kakao.maps.CustomOverlay({
            position: pos_${day}_${i},
            content: contentWrapper_${day}_${i},
            yAnchor: 1
        });
        customOverlay_${day}_${i}.setMap(map);
      `).join('\n');

      allMarkersHtml += markersHtml + '\n';

      if (drawLine && spots.length > 1) {
        allPolylinesHtml += `
          var linePath_${day} = [
            ${spots.map((spot: any) => `new kakao.maps.LatLng(${spot.lat}, ${spot.lng})`).join(',\n')}
          ];
          var polyline_${day} = new kakao.maps.Polyline({
            path: linePath_${day},
            strokeWeight: 3,
            strokeColor: '${color}',
            strokeOpacity: ${opacity},
            strokeStyle: 'shortdash'
          });
          polyline_${day}.setMap(map);
        `;
      }
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false"></script>
          <style>
            html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
            #map { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            kakao.maps.load(function() {
              function initMap() {
                var mapContainer = document.getElementById('map');
                if (mapContainer.clientHeight === 0 || mapContainer.clientWidth === 0) {
                  setTimeout(initMap, 50);
                  return;
                }
                
                var mapOption = { 
                    center: new kakao.maps.LatLng(35.1531696, 129.118666), 
                    level: 7 
                };
                var map = new kakao.maps.Map(mapContainer, mapOption);
                var bounds = new kakao.maps.LatLngBounds();

                var pendingMapClose = null;
                function scheduleMapClose() {
                  if (pendingMapClose) clearTimeout(pendingMapClose);
                  pendingMapClose = setTimeout(function () {
                    pendingMapClose = null;
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
                  }, 80);
                }
                function cancelMapClose() {
                  if (pendingMapClose) { clearTimeout(pendingMapClose); pendingMapClose = null; }
                }
                
                ${allMarkersHtml}
                ${allPolylinesHtml}
                
                if (${totalSpots} > 0) {
                    map.setBounds(bounds, 50, 50, 50, 50);
                }

                ${isInteractive ? `
                kakao.maps.event.addListener(map, 'click', function() {
                    scheduleMapClose();
                });
                ` : ''}
              }
              initMap();
            });
          </script>
        </body>
      </html>
    `;
  };

  // 마커 선택(setState)마다 HTML 문자열이 새로 만들어져 WebView가 리로드되지 않도록,
  // data/currentDay가 바뀔 때만 재생성한다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const interactiveMapHtml = React.useMemo(() => renderKakaoMapHTML(true, true, true), [data, currentDay]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const miniMapHtml = React.useMemo(() => renderKakaoMapHTML(false, true), [data, currentDay]);

  const renderHeader = () => (
    <View className="bg-white pt-4 pb-2">
        {/* Map Area */}
        <View className="h-[210px] bg-[#e8e8ed] overflow-hidden relative">
          <WebView
            source={{ html: interactiveMapHtml }}
            onMessage={handleMapMessage}
            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
            scrollEnabled={false}
          />
        </View>

        <View className="px-5 pt-6 pb-0">
          {/* Summary Card */}
          <View className="bg-[#f5f5f7] p-4 rounded-2xl mb-5 flex-row">
            <View className="flex-1 items-start">
              <View className="w-7 h-7 rounded-lg bg-[#e31b59]/10 items-center justify-center mb-1">
                <IconMapPinFilled size={14} color="#e31b59" />
              </View>
              <Text className="text-[14px] font-semibold text-black">{currentData.spots.length}곳</Text>
              <Text className="text-[12px] text-black/30">포토스팟</Text>
            </View>
            <View className="flex-1 items-start">
              <View className="w-7 h-7 rounded-lg bg-[#e31b59]/10 items-center justify-center mb-1">
                <IconRoad size={14} color="#e31b59" />
              </View>
              <Text className="text-[14px] font-semibold text-black">142km</Text>
              <Text className="text-[12px] text-black/30">총 이동거리</Text>
            </View>
            <View className="flex-1 items-start">
              <View className="w-7 h-7 rounded-lg bg-[#e31b59]/10 items-center justify-center mb-1">
                <IconClock size={14} color="#e31b59" />
              </View>
              <Text className="text-[14px] font-semibold text-black">12시간</Text>
              <Text className="text-[12px] text-black/30">예상 소요</Text>
            </View>
          </View>

          {/* Day Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 mb-2">
            <View className="flex-row gap-2 pr-5">
              {Object.keys(data).map(day => (
                <TouchableOpacity 
                  key={day}
                  onPress={() => setCurrentDay(day)}
                  className={`h-10 px-5 rounded-full items-center justify-center flex-row ${currentDay === day ? 'bg-black' : 'bg-[#f5f5f7]'}`}
                >
                  <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: DAY_COLORS[day] || '#ccc' }} />
                  <Text className={`text-[15px] font-medium ${currentDay === day ? 'text-white font-semibold' : 'text-black/50'}`}>DAY {day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text className="text-[14px] text-black/40 tracking-[-0.1px] mb-1">{currentData.date}</Text>
        </View>
      </View>
  );

  // Memoize the weather row to prevent SvgUri flickering when checklist state updates
  const hasWeather = parseInt(currentDay) <= 2; // 목업에서 1, 2일차만 날씨 제공 시뮬레이션

  const weatherRow = React.useMemo(() => (
    <View className="mt-8">
      <Text className="text-[18px] font-semibold text-black tracking-[-0.3px] mb-3">DAY {currentDay} 날씨</Text>
      {hasWeather ? (
        <View className="flex-row gap-2">
          <View className="flex-1 bg-[#f5f5f7] rounded-2xl p-3 relative">
            <Text className="text-[12px] text-black/35 mb-1.5">오전</Text>
            <Text className="text-[20px] font-semibold text-black mb-0.5">18°</Text>
            <Text className="text-[12px] text-black/35">맑음</Text>
            <View className="absolute right-3 top-[50%] -translate-y-2.5">
              <SvgUri width="24" height="24" uri="https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/clear-day.svg" />
            </View>
          </View>
          <View className="flex-1 bg-[#f5f5f7] rounded-2xl p-3 relative">
            <Text className="text-[12px] text-black/35 mb-1.5">오후</Text>
            <Text className="text-[20px] font-semibold text-black mb-0.5">24°</Text>
            <Text className="text-[12px] text-black/35">구름 조금</Text>
            <View className="absolute right-3 top-[50%] -translate-y-2.5">
              <SvgUri width="24" height="24" uri="https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/partly-cloudy-day.svg" />
            </View>
          </View>
          <View className="flex-1 bg-[#f5f5f7] rounded-2xl p-3 relative">
            <Text className="text-[12px] text-black/35 mb-1.5">저녁</Text>
            <Text className="text-[20px] font-semibold text-black mb-0.5">20°</Text>
            <Text className="text-[12px] text-black/35">맑음</Text>
            <View className="absolute right-3 top-[50%] -translate-y-2.5">
              <SvgUri width="24" height="24" uri="https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/clear-night.svg" />
            </View>
          </View>
        </View>
      ) : (
        <View className="bg-[#f5f5f7] rounded-2xl p-6 items-center justify-center">
          <Text className="text-[32px] mb-2">🧚‍♀️</Text>
          <Text className="text-[15px] font-semibold text-black/70 mb-0.5">날씨 요정도 아직 모른대요</Text>
          <Text className="text-[13px] text-black/40">어떤 날씨든 완벽한 여행이 될 거예요!</Text>
        </View>
      )}
    </View>
  ), [currentDay, hasWeather]);

  const renderFooter = () => (
    <View className="px-5 pb-12 pt-4">
      {isEditMode && (
        <TouchableOpacity 
          onPress={() => navigation.navigate('Map', { source: 'plan' })}
          className="h-12 border-[1px] border-dashed border-black/10 rounded-2xl items-center justify-center mb-6 mt-2 flex-row"
        >
          <Text className="text-[15px] text-black/25 font-medium">+ 스팟 추가하기</Text>
        </TouchableOpacity>
      )}

      {/* Tip Banner */}
      <View className="flex-row gap-3 p-4 bg-[#f5f5f7] rounded-2xl mt-4 items-center">
        {currentData.tip ? (
          <>
            <View className="w-8 h-8 rounded-full bg-[#ff9f0a]/10 items-center justify-center shrink-0">
              <IconClock size={16} color="#ff9f0a" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-black tracking-[-0.15px] mb-0.5">오늘의 촬영 팁</Text>
              <Text className="text-[12px] text-black/50 leading-relaxed">{currentData.tip}</Text>
            </View>
          </>
        ) : (
          <>
            <View className="w-8 h-8 rounded-full bg-[#e31b59]/10 items-center justify-center shrink-0">
              <Text className="text-[16px]">📷</Text>
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-black tracking-[-0.15px] mb-0.5">자유로운 셔터 찬스</Text>
              <Text className="text-[12px] text-black/50 leading-relaxed">계획에 얽매이지 말고 발길 닿는 대로, 마음 가는 대로 셔터를 눌러보세요!</Text>
            </View>
          </>
        )}
      </View>

      {/* Weather Row */}
      {weatherRow}

      {/* Route Mini Map */}
      <View className="mt-8">
        <View className="flex-row items-baseline justify-between mb-3">
          <Text className="text-[18px] font-semibold text-black tracking-[-0.3px]">이동 경로</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MapTab', { screen: 'Map', params: { spots: currentData.spots, from: 'TravelPlan' } })}>
            <Text className="text-[13px] text-[#e31b59]">지도에서 보기</Text>
          </TouchableOpacity>
        </View>
        <View className="h-[120px] bg-[#f5f5f7] rounded-2xl overflow-hidden relative border border-black/5" pointerEvents="none">
           <WebView
              source={{ html: miniMapHtml }}
              style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            />
        </View>
      </View>

      {/* Checklist */}
      {COMMON_CHECKLIST.length > 0 && (
        <View className="mt-8">
          <Text className="text-[18px] font-semibold text-black tracking-[-0.3px] mb-3">촬영 체크리스트</Text>
          <View className="flex-row flex-wrap gap-2">
            {COMMON_CHECKLIST.map((item, idx) => {
              const isChecked = checkedItems.includes(item);
              return (
                <TouchableOpacity 
                  key={idx} 
                  activeOpacity={0.7}
                  onPress={() => toggleChecklist(item)}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border transition-colors ${isChecked ? 'bg-black border-black' : 'bg-[#f5f5f7] border-black/5'}`}
                >
                  <View className={`w-3 h-3 rounded-full border items-center justify-center ${isChecked ? 'border-white bg-black' : 'border-black/15 bg-transparent'}`}>
                     {isChecked && <IconCheck size={8} color="white" strokeWidth={4} />}
                  </View>
                  <Text className={`text-[13px] tracking-[-0.2px] ${isChecked ? 'text-white' : 'text-black'}`}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  const renderSpotRow = (item: any, idx: number) => {
    const transport = currentData.transports[idx];
    const isSelected = selectedSpotId === item.id;
    const isFirst = idx === 0;
    const isLast = idx === currentData.spots.length - 1;

    return (
      // key는 스팟 id가 아니라 위치 인덱스(idx)를 쓴다.
      // id를 키로 쓰면 순서 변경 시 React가 같은 키의 네이티브 뷰 서브트리를
      // 물리적으로 '이동(reparent)'시키는데, Fabric(New Arch) 환경에서 이때 뷰 트리가
      // 붕괴되며 'Couldn't find a navigation context' 크래시가 난다.
      // 인덱스 키를 쓰면 순서 변경이 '뷰 이동'이 아니라 '제자리에서 내용만 교체'가 되어
      // (날짜 탭 전환과 동일한 동작) 크래시가 사라진다. 이 행들은 자체 상태가 없고
      // 레이아웃도 인덱스 기준(rowOffsets[idx])이라 위치 키가 안전하다.
      <View
        key={idx}
        className="px-5 relative pt-1 bg-white"
        onLayout={(e) => { rowOffsets.current[idx] = e.nativeEvent.layout.y; }}
      >
        <View className="absolute left-[31px] top-[24px] bottom-[-16px] w-[1.5px] bg-black/5" />

        <View className="flex-row items-start relative mb-2">
          <View className="absolute -left-[5px] top-[24px] w-6 h-6 rounded-full items-center justify-center z-10" style={{ backgroundColor: DAY_COLORS[currentDay] }}>
            <Text className="text-[10px] font-semibold text-white">{idx + 1}</Text>
          </View>

          <View
            className="flex-1 flex-row gap-3 p-3 rounded-[16px] ml-[28px] relative"
            style={[
              { backgroundColor: '#f5f5f7' },
              isSelected ? {
                backgroundColor: 'rgba(227,27,89,0.06)',
                borderColor: 'rgba(227,27,89,0.5)',
                borderWidth: 1.5,
              } : undefined
            ]}
          >
            {isEditMode && (
              <TouchableOpacity
                onPress={() => removeSpot(item.id)}
                className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white border border-black/10 items-center justify-center z-20 shadow-sm"
              >
                <IconTrash size={12} color="rgba(227,27,89,0.9)" />
              </TouchableOpacity>
            )}
            <View className="w-[72px] h-[72px] rounded-xl shrink-0" style={{ backgroundColor: item.bg }} />
            <View className={`flex-1 justify-center ${isEditMode ? 'pr-10' : 'pr-4'}`}>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[16px] font-semibold text-black tracking-[-0.2px]" numberOfLines={1}>{item.name}</Text>
                <View className="px-2.5 h-6 rounded-full items-center justify-center" style={{ backgroundColor: item.scoreColor }}>
                  <Text className="text-[12px] font-semibold text-white">{item.score}</Text>
                </View>
              </View>
              <Text className="text-[12px] text-black/40 mb-2">{item.loc}</Text>
              <View className="flex-row items-center gap-1.5">
                <IconClock size={12} color="rgba(0,0,0,0.3)" />
                <Text className="text-[12px] text-black/50">{item.time} <Text className="text-black/25">{item.dur}</Text></Text>
              </View>
            </View>

            {isEditMode && (
              <View className="absolute right-2 top-0 bottom-0 justify-center gap-1.5">
                <TouchableOpacity
                  onPress={() => moveSpot(idx, -1)}
                  disabled={isFirst}
                  className={`w-7 h-7 rounded-full items-center justify-center ${isFirst ? 'opacity-30 bg-black/5' : 'bg-white shadow-sm border border-black/5'}`}
                >
                  <IconChevronUp size={16} color="rgba(0,0,0,0.6)" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => moveSpot(idx, 1)}
                  disabled={isLast}
                  className={`w-7 h-7 rounded-full items-center justify-center ${isLast ? 'opacity-30 bg-black/5' : 'bg-white shadow-sm border border-black/5'}`}
                >
                  <IconChevronDown size={16} color="rgba(0,0,0,0.6)" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {transport && (
          <View className="ml-[28px] mb-3 py-2">
            <View className="self-start flex-row items-center gap-1.5 h-8 px-3.5 rounded-full bg-white border border-black/5">
              {transport.type === 'car' ? <IconCar size={14} color="rgba(0,0,0,0.3)" /> : <IconWalk size={14} color="rgba(0,0,0,0.3)" />}
              <Text className="text-[12px] text-black/45">{transport.label}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Sticky Navbar */}
      <View className="h-[52px] flex-row items-center px-3.5 border-b-[0.5px] border-black/5 z-50 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="w-8 h-8 rounded-full bg-black/5 items-center justify-center shrink-0">
          <IconChevronLeft size={20} color="rgba(0,0,0,0.6)" />
        </TouchableOpacity>
        <View className="flex-1 mx-3">
          <Text className="text-[16px] font-semibold tracking-[-0.35px]" numberOfLines={1}>부산 1박 2일</Text>
          <Text className="text-[11px] text-black/40 tracking-[-0.1px] mt-[1px]">2026.05.17 (토) ~ 05.18 (일)</Text>
        </View>
        <View className="flex-row gap-1">
          <TouchableOpacity className="w-8 h-8 rounded-full bg-black/5 items-center justify-center">
            <IconShare size={18} color="rgba(0,0,0,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity className="w-8 h-8 rounded-full bg-black/5 items-center justify-center">
            <IconMap size={18} color="rgba(0,0,0,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity className="w-8 h-8 rounded-full bg-black/5 items-center justify-center">
            <IconDots size={18} color="rgba(0,0,0,0.6)" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={scrollRef} className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        <View onLayout={(e) => { headerHeightRef.current = e.nativeEvent.layout.height; }}>
          {renderHeader()}
          <View className="bg-white">
            <View className="flex-row items-center justify-between px-5 mb-3 mt-1">
              <Text className="text-[18px] font-semibold text-black tracking-[-0.3px]">타임라인</Text>
            </View>
            
            {isEditMode && (
              <View className="px-5 mb-4">
                <View className="bg-[#f5f5f7] border border-black/5 rounded-xl py-3 px-4 items-center">
                  <Text className="text-[13px] text-black/60 font-medium tracking-[-0.2px]">✨ 우측의 화살표 버튼을 눌러 스팟 순서를 변경해보세요.</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {currentData.spots.length === 0 ? (
          <View className="items-center justify-center py-10 bg-white">
            <Text className="text-[14px] text-black/40">등록된 스팟이 없습니다.</Text>
          </View>
        ) : (
          currentData.spots.map((item: any, idx: number) => renderSpotRow(item, idx))
        )}

        <View className="bg-white">
          {renderFooter()}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="flex-row gap-3 p-5 pt-3 border-t-[0.5px] border-black/5 bg-white z-50">
        {isEditMode ? (
          <TouchableOpacity onPress={() => setIsEditMode(false)} className="flex-1 h-[52px] rounded-full bg-black items-center justify-center">
            <Text className="text-[16px] font-medium text-white">편집 완료</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={() => setIsEditMode(true)} className="flex-1 h-[52px] rounded-full bg-[#f5f5f7] items-center justify-center">
              <Text className="text-[16px] font-medium text-black">코스 편집</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsDepartModalVisible(true)} className="flex-1 h-[52px] rounded-full bg-[#e31b59] items-center justify-center">
              <Text className="text-[16px] font-medium text-white">바로 출발</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <NaviSheet 
        visible={isDepartModalVisible} 
        onClose={() => setIsDepartModalVisible(false)} 
        spotName={currentData?.spots?.[0]?.name || ''}
        address={currentData?.spots?.[0]?.loc || ''}
        onLaunched={(msg) => Alert.alert('안내', msg)}
      />
    </SafeAreaView>
  );
}
