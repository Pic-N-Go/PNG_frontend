import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useAnimatedRef } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { WebView } from "react-native-webview";
import Sortable from "react-native-sortables";
import { normalize, normalizeFontSize } from "@/utils/normalize";
import {
  IconChevronLeft,
  IconShare,
  IconMap,
  IconDots,
  IconClock,
  IconCar,
  IconWalk,
  IconTrash,
  IconMapPinFilled,
  IconRoad,
  IconWand,
  IconCamera,
  IconArrowsMaximize,
  IconGripVertical,
  IconInfoCircle,
} from "@tabler/icons-react-native";
import NaviSheet from "@/components/spot/NaviSheet";
import { FONT_XS, FONT_SM } from "@/constants/layout";

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

// 스팟 상세 북마크(BookmarkSheet.tsx COLLECTION_COLOR_PALETTE)와 동일한 5색.
// bg는 스와치에 실제로 보이는 연한 톤, text는 선택 시 테두리/체크에 쓰이는 진한 톤.
// 6일째부터는 다시 1번 색상부터 순환한다.
const DAY_COLOR_PALETTE = [
  { bg: "#FFF0F3", text: "#E31B59" },
  { bg: "#E8F3FF", text: "#0071E3" },
  { bg: "#F3F0FF", text: "#7C3AED" },
  { bg: "#E8F5EB", text: "#34C759" },
  { bg: "#FFF3E0", text: "#FF9F0A" },
];
const getDayColor = (day: string) =>
  DAY_COLOR_PALETTE[(parseInt(day, 10) - 1) % DAY_COLOR_PALETTE.length];
const COMMON_CHECKLIST = [
  "삼각대",
  "광각렌즈 (16-35mm)",
  "ND 필터",
  "보조배터리",
  "편한 신발",
  "드론",
  "편광 필터",
];

const MOCK_DATA: Record<string, any> = {
  "1": {
    date: "5월 17일 토요일",
    tip: "광안리 일출 시간 05:32 · 골든아워 06:00~06:40\n미세먼지 좋음 · 일출 포인트로 이동 추천",
    checklist: [
      "삼각대",
      "광각렌즈 (16-35mm)",
      "ND 필터",
      "보조배터리",
      "편한 신발",
    ],
    spots: [
      {
        id: "spot1",
        name: "광안리 해수욕장",
        loc: "부산 수영구 · 야경/바다",
        time: "06:30 ~ 08:00",
        dur: "1시간 30분",
        score: "87점",
        scoreColor: "#ff9f0a",
        bg: "#0f2027",
        lat: 35.1531696,
        lng: 129.118666,
      },
      {
        id: "spot2",
        name: "해동용궁사",
        loc: "부산 기장군 · 한옥/바다",
        time: "09:00 ~ 10:30",
        dur: "1시간 30분",
        score: "82점",
        scoreColor: "#ff9f0a",
        bg: "#8e7b5a",
        lat: 35.1884148,
        lng: 129.223293,
      },
      {
        id: "spot3",
        name: "감천문화마을",
        loc: "부산 사하구 · 인물/감성",
        time: "11:00 ~ 13:00",
        dur: "2시간",
        score: "79점",
        scoreColor: "#34c759",
        bg: "#b44a3a",
        lat: 35.0974711,
        lng: 129.010595,
      },
    ],
    transports: {
      spot1__spot2: { type: "car", label: "차량 25분 · 18km" },
      spot2__spot3: { type: "walk", label: "도보 12분· 0.8km" },
    },
  },
  "2": {
    date: "5월 18일 일요일",
    tip: "영도 일몰 시간 19:22 · 골든아워 18:40~19:22\n미세먼지 보통 · 흰여울마을 오전 방문 추천",
    checklist: ["편광 필터", "드론", "삼각대", "여분의 메모리카드"],
    spots: [
      {
        id: "spot4",
        name: "흰여울문화마을",
        loc: "부산 영도구 · 뷰/감성",
        time: "09:30 ~ 11:00",
        dur: "1시간 30분",
        score: "91점",
        scoreColor: "#e31b59",
        bg: "#667eea",
        lat: 35.0788,
        lng: 129.0439,
      },
      {
        id: "spot5",
        name: "태종대 유원지",
        loc: "부산 영도구 · 바다/절벽",
        time: "11:30 ~ 13:30",
        dur: "2시간",
        score: "88점",
        scoreColor: "#ff9f0a",
        bg: "#1a6b8a",
        lat: 35.0527,
        lng: 129.0877,
      },
    ],
    transports: {
      spot4__spot5: { type: "car", label: "차량 15분 · 7km" },
    },
  },
  "3": {
    date: "5월 19일 월요일",
    tip: "국제시장 방문 추천 시간 10:00~12:00\n미세먼지 보통 · 실내 위주 일정",
    checklist: ["보조배터리", "편한 신발"],
    spots: [
      {
        id: "spot6",
        name: "부산 시립미술관",
        loc: "부산 해운대구 · 전시/실내",
        time: "10:00 ~ 11:30",
        dur: "1시간 30분",
        score: "84점",
        scoreColor: "#ff9f0a",
        bg: "#3a4750",
        lat: 35.1682,
        lng: 129.1305,
      },
      {
        id: "spot7",
        name: "국제시장",
        loc: "부산 중구 · 전통시장",
        time: "12:30 ~ 14:00",
        dur: "1시간 30분",
        score: "76점",
        scoreColor: "#34c759",
        bg: "#8e5a3c",
        lat: 35.1006,
        lng: 129.0284,
      },
    ],
    transports: {
      spot6__spot7: { type: "car", label: "차량 22분 · 14km" },
    },
  },
  "4": {
    date: "5월 20일 화요일",
    tip: "오륙도 스카이워크 일몰 시간 19:10 · 골든아워 18:30~19:10\n미세먼지 좋음 · 해안 산책로 이동 추천",
    checklist: ["삼각대", "편광 필터", "드론"],
    spots: [
      {
        id: "spot8",
        name: "오륙도 스카이워크",
        loc: "부산 남구 · 바다/전망",
        time: "17:30 ~ 19:00",
        dur: "1시간 30분",
        score: "93점",
        scoreColor: "#e31b59",
        bg: "#1c4b5e",
        lat: 35.0968,
        lng: 129.1214,
      },
      {
        id: "spot9",
        name: "이기대 해안산책로",
        loc: "부산 남구 · 절벽/바다",
        time: "19:30 ~ 21:00",
        dur: "1시간 30분",
        score: "89점",
        scoreColor: "#ff9f0a",
        bg: "#0f3d3e",
        lat: 35.1219,
        lng: 129.1231,
      },
    ],
    transports: {
      spot8__spot9: { type: "walk", label: "도보 15분 · 1.1km" },
    },
  },
  "5": {
    date: "5월 21일 수요일",
    tip: null,
    checklist: [],
    spots: [
      {
        id: "spot10",
        name: "송정해수욕장",
        loc: "부산 해운대구 · 바다/서핑",
        time: "08:00 ~ 09:30",
        dur: "1시간 30분",
        score: "80점",
        scoreColor: "#ff9f0a",
        bg: "#2c6e91",
        lat: 35.1786,
        lng: 129.2003,
      },
      {
        id: "spot11",
        name: "자갈치시장",
        loc: "부산 중구 · 전통시장/바다",
        time: "10:30 ~ 12:00",
        dur: "1시간 30분",
        score: "72점",
        scoreColor: "#34c759",
        bg: "#4a5568",
        lat: 35.0968,
        lng: 129.0306,
      },
      {
        id: "spot12",
        name: "용두산공원",
        loc: "부산 중구 · 전망/공원",
        time: "13:00 ~ 14:30",
        dur: "1시간 30분",
        score: "77점",
        scoreColor: "#34c759",
        bg: "#5c4a72",
        lat: 35.1007,
        lng: 129.0323,
      },
    ],
    transports: {
      spot10__spot11: { type: "car", label: "차량 18분 · 11km" },
      spot11__spot12: { type: "walk", label: "도보 8분 · 0.5km" },
    },
  },
};

export default function TravelPlanScreen({ navigation }: any) {
  const [currentDay, setCurrentDay] = useState<string>("1");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDepartModalVisible, setIsDepartModalVisible] = useState(false);
  const [data, setData] = useState(MOCK_DATA);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const scrollRef = useAnimatedRef<ScrollView>();
  const headerHeightRef = useRef<number>(0);
  // Sortable.Grid는 각 행을 position:absolute로 배치하므로 onLayout의 y값은
  // 행 자신의 절대 위치가 아니라 그 위치 래퍼 안에서의 상대값(항상 0)이 된다.
  // 대신 각 행의 측정된 높이(height)를 모아 앞선 행들의 높이를 더해 오프셋을 직접 계산한다.
  const rowHeights = useRef<{ [key: string]: number }>({});

  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const currentData = data[currentDay];

  const handleMapMessage = (event: any) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed.type === "SPOT_CLICK") {
        const spotId = parsed.data.id;
        let targetDay = currentDay;
        let index = currentData.spots.findIndex((s: any) => s.id === spotId);

        if (index === -1) {
          for (const [dayKey, dayData] of Object.entries(data)) {
            const foundIndex = dayData.spots.findIndex((s: any) => s.id === spotId);
            if (foundIndex !== -1) {
              targetDay = dayKey;
              index = foundIndex;
              break;
            }
          }
        }

        if (index === -1) return;

        setSelectedSpotId(spotId); // 선택 하이라이트 (항상 동작)

        const scrollToSpot = () => {
          let yOffset = 0;
          const targetSpots = data[targetDay].spots;
          for (let i = 0; i < index; i++) {
            yOffset += rowHeights.current[targetSpots[i].id] || 0;
          }
          scrollRef.current?.scrollTo({
            y: headerHeightRef.current + yOffset - 24,
            animated: true,
          });
        };

        if (targetDay !== currentDay) {
          // 다른 Day의 마커면 먼저 탭을 전환하고, 리스트가 다시 그려진 뒤 스크롤한다.
          setCurrentDay(targetDay);
          setTimeout(scrollToSpot, 100);
        } else {
          scrollToSpot();
        }
      } else if (parsed.type === "MAP_CLICK") {
        setSelectedSpotId(null);
      }
    } catch (e) {
      console.log("WebView Message Parse Error:", e);
    }
  };

  const toggleChecklist = (item: string) => {
    setCheckedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const reorderSpots = (spots: any[]) => {
    setData((prev) => ({
      ...prev,
      [currentDay]: { ...prev[currentDay], spots },
    }));
  };

  const removeSpot = (spotId: string) => {
    delete rowHeights.current[spotId];
    setData((prev) => {
      const dayData = prev[currentDay];
      const newSpots = dayData.spots.filter((s: any) => s.id !== spotId);
      return {
        ...prev,
        [currentDay]: {
          ...dayData,
          spots: newSpots,
        },
      };
    });
  };

  const renderKakaoMapHTML = (
    showAllDays = true,
    drawLine = true,
    isInteractive = false,
  ) => {
    let allMarkersHtml = "";
    let allPolylinesHtml = "";
    let totalSpots = 0;

    const daysToRender = showAllDays ? Object.keys(data) : [currentDay];

    daysToRender.forEach((day) => {
      // @ts-ignore
      const spots = data[day].spots;
      totalSpots += spots.length;
      const isSelected = day === currentDay;
      const opacity = isSelected ? 1 : 0.3;
      // @ts-ignore
      const color = getDayColor(day);

      const markersHtml = spots
        .map(
          (spot: any, i: number) => `
        var pos_${day}_${i} = new kakao.maps.LatLng(${spot.lat}, ${spot.lng});
        bounds.extend(pos_${day}_${i});
        
        var contentWrapper_${day}_${i} = document.createElement('div');
        contentWrapper_${day}_${i}.innerHTML = '<div style="background:${color.bg}; opacity:${opacity}; color:${color.text}; font-size:12px; font-weight:600; padding:4px 8px; border-radius:12px; transform:translateY(-10px); box-shadow:0 2px 4px rgba(0,0,0,0.2); pointer-events:auto;">${i + 1}</div>';
        
        ${
          isInteractive
            ? `
        contentWrapper_${day}_${i}.onclick = function(e) {
            e.stopPropagation();
            cancelMapClose();
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPOT_CLICK', data: ${JSON.stringify(spot).replace(/</g, "\\u003c")} }));
        };
        contentWrapper_${day}_${i}.addEventListener('touchstart', function(e) { e.stopPropagation(); cancelMapClose(); }, { passive: true });
        `
            : ""
        }

        var customOverlay_${day}_${i} = new kakao.maps.CustomOverlay({
            position: pos_${day}_${i},
            content: contentWrapper_${day}_${i},
            yAnchor: 1
        });
        customOverlay_${day}_${i}.setMap(map);
      `,
        )
        .join("\n");

      allMarkersHtml += markersHtml + "\n";

      if (drawLine && spots.length > 1) {
        allPolylinesHtml += `
          var linePath_${day} = [
            ${spots.map((spot: any) => `new kakao.maps.LatLng(${spot.lat}, ${spot.lng})`).join(",\n")}
          ];
          var polyline_${day} = new kakao.maps.Polyline({
            path: linePath_${day},
            strokeWeight: 3,
            strokeColor: '${color.text}',
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

                ${
                  isInteractive
                    ? `
                kakao.maps.event.addListener(map, 'click', function() {
                    scheduleMapClose();
                });
                `
                    : ""
                }
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
  const interactiveMapHtml = React.useMemo(
    () => renderKakaoMapHTML(true, true, true),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, currentDay]
  );

  const renderHeader = () => (
    <View className="bg-white pt-4 pb-2">
        {/* Map Area */}
        <View className="bg-[#e8e8ed] overflow-hidden relative" style={{ height: normalize(210) }}>
          <WebView
            source={{ html: interactiveMapHtml }}
            onMessage={handleMapMessage}
            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
            scrollEnabled={false}
          />
          <TouchableOpacity
            className="absolute top-3 right-3 bg-white/90 items-center justify-center rounded-lg shadow-sm"
            style={{ width: normalize(32), height: normalize(32) }}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Map', { source: 'plan-view', planData: data, initialDay: currentDay, from: 'TravelPlan' })}
          >
            <IconArrowsMaximize size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <View className="px-5 pt-6 pb-0">
          {/* Summary Card */}
          <View className="bg-[#f5f5f7] p-4 rounded-2xl mb-5 flex-row">
            <View className="flex-1 items-start">
              <View className="rounded-lg bg-[#e31b59]/10 items-center justify-center mb-1" style={{ width: normalize(28), height: normalize(28) }}>
                <IconMapPinFilled size={normalize(14)} color="#e31b59" />
              </View>
              <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(14) }}>{currentData.spots.length}곳</Text>
              <Text className="text-black/30 tracking-tight" style={{ fontSize: normalizeFontSize(12) }}>포토스팟</Text>
            </View>
            <View className="flex-1 items-start">
              <View className="rounded-lg bg-[#e31b59]/10 items-center justify-center mb-1" style={{ width: normalize(28), height: normalize(28) }}>
                <IconRoad size={normalize(14)} color="#e31b59" />
              </View>
              <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(14) }}>142km</Text>
              <Text className="text-black/30 tracking-tight" style={{ fontSize: normalizeFontSize(12) }}>총 이동거리</Text>
            </View>
            <View className="flex-1 items-start">
              <View className="rounded-lg bg-[#e31b59]/10 items-center justify-center mb-1" style={{ width: normalize(28), height: normalize(28) }}>
                <IconClock size={normalize(14)} color="#e31b59" />
              </View>
              <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(14) }}>12시간</Text>
              <Text className="text-black/30 tracking-tight" style={{ fontSize: normalizeFontSize(12) }}>예상 소요</Text>
            </View>
          </View>

          {/* Day Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 mb-2">
            <View className="flex-row gap-2 pr-5">
              {Object.keys(data).map(day => (
                <TouchableOpacity 
                  key={day}
                  onPress={() => setCurrentDay(day)}
                  className={`rounded-full items-center justify-center flex-row ${currentDay === day ? "bg-[#e31b59]" : "bg-[#f5f5f7]"}`}
                  style={{ height: normalize(40), paddingHorizontal: normalize(20) }}
                >
                  <View className="rounded-full" style={{ width: normalize(8), height: normalize(8), marginRight: normalize(6), backgroundColor: currentDay === day ? "#fff" : getDayColor(day).text }} />
                  <Text
                    className={`font-medium tracking-tight ${currentDay === day ? "text-white font-semibold" : "text-black/50"}`} style={{ fontSize: FONT_SM }}>DAY {day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <Text className="text-black/40 tracking-[-0.1px] mb-1" style={{ fontSize: normalizeFontSize(14) }}>{currentData.date}</Text>
        </View>
      </View>

  );

  // Memoize the weather row to prevent SvgUri flickering when checklist state updates
  const hasWeather = parseInt(currentDay) <= 2; // 목업에서 1, 2일차만 날씨 제공 시뮬레이션

  const weatherRow = React.useMemo(
    () => (
      <View className="mt-5">
        <Text className="text-[18px] font-semibold text-black tracking-[-0.3px] mb-5">
          DAY {currentDay} 날씨
        </Text>
        {hasWeather ? (
          <View className="flex-row gap-2">
            <View className="flex-1 bg-[#f5f5f7] rounded-2xl p-3 relative">
              <Text className="text-[12px] text-black/35 mb-1.5">오전</Text>
              <Text className="text-[20px] font-semibold text-black mb-0.5">
                18°
              </Text>
              <Text className="text-[12px] text-black/35">맑음</Text>
              <View className="absolute right-3 top-[50%] -translate-y-2.5">
                <SvgUri
                  width="24"
                  height="24"
                  uri="https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/clear-day.svg"
                />
              </View>
            </View>
            <View className="flex-1 bg-[#f5f5f7] rounded-2xl p-3 relative">
              <Text className="text-[12px] text-black/35 mb-1.5">오후</Text>
              <Text className="text-[20px] font-semibold text-black mb-0.5">
                24°
              </Text>
              <Text className="text-[12px] text-black/35">구름 조금</Text>
              <View className="absolute right-3 top-[50%] -translate-y-2.5">
                <SvgUri
                  width="24"
                  height="24"
                  uri="https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/partly-cloudy-day.svg"
                />
              </View>
            </View>
            <View className="flex-1 bg-[#f5f5f7] rounded-2xl p-3 relative">
              <Text className="text-[12px] text-black/35 mb-1.5">저녁</Text>
              <Text className="text-[20px] font-semibold text-black mb-0.5">
                20°
              </Text>
              <Text className="text-[12px] text-black/35">맑음</Text>
              <View className="absolute right-3 top-[50%] -translate-y-2.5">
                <SvgUri
                  width="24"
                  height="24"
                  uri="https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/clear-night.svg"
                />
              </View>
            </View>
          </View>
        ) : (
          <View className="bg-[#f5f5f7] rounded-2xl p-6 items-center justify-center">
            <IconWand
              size={32}
              color="rgba(0,0,0,0.3)"
              style={{ marginBottom: 8 }}
            />
            <Text className="text-[15px] font-semibold text-black/70 mb-0.5">
              날씨 요정도 아직 모른대요
            </Text>
            <Text className="text-[13px] text-black/40">
              어떤 날씨든 완벽한 여행이 될 거예요!
            </Text>
          </View>
        )}
      </View>
    ),
    [currentDay, hasWeather],
  );

  const renderFooter = () => (
    <View className="px-5 pb-12 pt-4">
      {isEditMode && (
        <TouchableOpacity
          onPress={() => navigation.navigate("Map", { source: "plan" })}
          className="h-12 border-[1px] border-dashed border-black/10 rounded-2xl items-center justify-center mb-6 mt-2 flex-row"
        >
          <Text className="text-[15px] text-black/25 font-medium">
            + 스팟 추가하기
          </Text>
        </TouchableOpacity>
      )}

      <View className="h-[1px] bg-black/5" />

      {/* Tip Banner */}
      <View className="flex-row gap-3 p-4 bg-[#f5f5f7] rounded-2xl mt-4 items-center">
        {currentData.tip ? (
          <>
            <View className="w-8 h-8 rounded-lg bg-[#e31b59]/10 items-center justify-center shrink-0">
              <IconInfoCircle size={16} color="#e31b59" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-black tracking-[-0.15px] mb-0.5">
                오늘의 촬영 팁
              </Text>
              <Text className="text-[12px] text-black/50 leading-relaxed">
                {currentData.tip}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View className="w-8 h-8 rounded-lg bg-[#e31b59]/10 items-center justify-center shrink-0">
              <IconCamera size={16} color="#e31b59" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-black tracking-[-0.15px] mb-0.5">
                자유로운 셔터 찬스
              </Text>
              <Text className="text-[12px] text-black/50 leading-relaxed">
                계획에 얽매이지 말고 발길 닿는 대로, 마음 가는 대로 셔터를
                눌러보세요!
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Weather Row */}
      {weatherRow}


      {/* Checklist */}
      {COMMON_CHECKLIST.length > 0 && (
        <View className="mt-8">
          <Text className="text-[18px] font-semibold text-black tracking-[-0.3px] mb-5">
            촬영 체크리스트
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {COMMON_CHECKLIST.map((item, idx) => {
              const isChecked = checkedItems.includes(item);
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => toggleChecklist(item)}
                  className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border border-black/5 ${isChecked ? "bg-[#e31b59]/10" : "bg-[#f5f5f7]"}`}
                >
                  <View
                    className={`w-1.5 h-1.5 rounded-full ${isChecked ? "bg-[#e31b59]" : "bg-black/15"}`}
                  />
                  <Text
                    className={`text-[13px] tracking-[-0.2px] ${isChecked ? "text-[#e31b59]" : "text-black"}`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  const renderSpotRow = ({ item, index }: { item: any; index: number }) => {
    const idx = index;
    // transports는 위치가 아니라 실제 스팟 id 쌍으로 조회한다.
    // 드래그로 순서가 바뀌어도 예전 이웃 사이의 이동 정보가 엉뚱한 스팟 쌍에 붙지 않고,
    // 원래 정의된 이웃이 아니면 그냥 표시하지 않는다.
    const nextSpot = currentData.spots[idx + 1];
    const transport = nextSpot ? currentData.transports[`${item.id}__${nextSpot.id}`] : undefined;
    const isSelected = selectedSpotId === item.id;

    return (
      <View
        className="px-5 relative pt-1"
        onLayout={(e) => {
          rowHeights.current[item.id] = e.nativeEvent.layout.height;
        }}
      >
        <View className="flex-row items-start relative mb-2">
          <View
            className="flex-1 flex-row gap-3 p-3 rounded-[16px] relative"
            style={[
              { backgroundColor: "#f5f5f7" },
              isSelected
                ? {
                    backgroundColor: "rgba(227,27,89,0.06)",
                    borderColor: "rgba(227,27,89,0.5)",
                    borderWidth: 1.5,
                  }
                : undefined,
            ]}
          >
            <View className="absolute -top-2 -left-2 w-6 h-6 rounded-full items-center justify-center z-20 shadow-sm bg-black">
              <Text className="text-[10px] font-semibold text-white">
                {idx + 1}
              </Text>
            </View>
            {isEditMode && (
              <TouchableOpacity
                onPress={() => removeSpot(item.id)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-black/10 items-center justify-center z-20"
              >
                <IconTrash size={12} color="rgba(227,27,89,0.9)" />
              </TouchableOpacity>
            )}
            <View
              className="w-[72px] h-[72px] rounded-xl shrink-0"
              style={{ backgroundColor: item.bg }}
            />
            <View
              className={`flex-1 justify-center ${isEditMode ? "pr-10" : "pr-4"}`}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text
                  className="text-[16px] font-semibold text-black tracking-[-0.2px]"
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <View
                  className="px-2.5 h-6 rounded-full items-center justify-center"
                  style={{ backgroundColor: item.scoreColor }}
                >
                  <Text className="text-[12px] font-semibold text-white">
                    {item.score}
                  </Text>
                </View>
              </View>
              <Text className="text-[12px] text-black/40 mb-2">{item.loc}</Text>
              <View className="flex-row items-center gap-1.5">
                <IconClock size={12} color="rgba(0,0,0,0.3)" />
                <Text className="text-[12px] text-black/50">
                  {item.time} <Text className="text-black/25">{item.dur}</Text>
                </Text>
              </View>
            </View>

            {isEditMode && (
              <Sortable.Handle
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: 36,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconGripVertical size={18} color="rgba(0,0,0,0.3)" />
              </Sortable.Handle>
            )}
          </View>
        </View>

        {transport && (
          <View className="mb-3 py-2">
            <View className="self-start flex-row items-center gap-1.5 h-8 px-3.5 rounded-full bg-white border border-black/5">
              {transport.type === "car" ? (
                <IconCar size={14} color="rgba(0,0,0,0.3)" />
              ) : (
                <IconWalk size={14} color="rgba(0,0,0,0.3)" />
              )}
              <Text className="text-[12px] text-black/45">
                {transport.label}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Sticky Navbar */}
      <View className="h-[52px] flex-row items-center px-3.5 border-b-[0.5px] border-black/5 z-50 bg-white">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-8 h-8 rounded-full bg-black/5 items-center justify-center shrink-0"
        >
          <IconChevronLeft size={20} color="rgba(0,0,0,0.6)" />
        </TouchableOpacity>
        <View className="flex-1 mx-3">
          <Text
            className="text-[16px] font-semibold tracking-[-0.35px]"
            numberOfLines={1}
          >
            부산 1박 2일
          </Text>
          <Text className="text-[11px] text-black/40 tracking-[-0.1px] mt-[1px]">
            2026.05.17 (토) ~ 05.18 (일)
          </Text>
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

      <ScrollView
        ref={scrollRef}
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
      >
        <View
          onLayout={(e) => {
            headerHeightRef.current = e.nativeEvent.layout.height;
          }}
        >
          {renderHeader()}
          <View className="bg-white">
            <View className="flex-row items-center justify-between px-5 mb-4">
              <Text className="text-[18px] font-semibold text-black tracking-[-0.3px]">
                타임라인
              </Text>
            </View>

            {isEditMode && (
              <View className="px-5 mb-4">
                <View className="bg-transparent border border-black/5 rounded-xl py-3 px-4 items-center">
                  <Text
                    style={{
                      fontSize: FONT_XS,
                      color: "rgba(0,0,0,0.6)",
                      letterSpacing: -0.2,
                      fontFamily: "Pretendard-Medium",
                    }}
                  >
                    카드 우측의 점 아이콘을 길게 눌러 드래그하면 스팟 순서를
                    변경할 수 있어요.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {currentData.spots.length === 0 ? (
          <View className="items-center justify-center py-10 bg-white">
            <Text className="text-[14px] text-black/40">
              등록된 스팟이 없습니다.
            </Text>
          </View>
        ) : (
          <Sortable.Grid
            columns={1}
            data={currentData.spots}
            keyExtractor={(item: any) => item.id}
            renderItem={renderSpotRow}
            customHandle
            scrollableRef={scrollRef}
            onDragEnd={({ data }: { data: any[] }) => reorderSpots(data)}
            rowGap={0}
          />
        )}

        <View className="bg-white">{renderFooter()}</View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="flex-row gap-3 p-5 pt-3 border-t-[0.5px] border-black/5 bg-white z-50">
        {isEditMode ? (
          <TouchableOpacity
            onPress={() => setIsEditMode(false)}
            className="flex-1 h-[52px] rounded-full bg-[#e31b59] items-center justify-center"
          >
            <Text className="text-[16px] font-medium text-white">
              편집 완료
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setIsEditMode(true)}
              className="flex-1 h-[52px] rounded-full bg-[#f5f5f7] items-center justify-center"
            >
              <Text className="text-[16px] font-medium text-black">
                코스 편집
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsDepartModalVisible(true)}
              className="flex-1 h-[52px] rounded-full bg-[#e31b59] items-center justify-center"
            >
              <Text className="text-[16px] font-medium text-white">
                바로 출발
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <NaviSheet
        visible={isDepartModalVisible}
        onClose={() => setIsDepartModalVisible(false)}
        spotName={currentData?.spots?.[0]?.name || ""}
        address={currentData?.spots?.[0]?.loc || ""}
        onLaunched={(msg) => Alert.alert("안내", msg)}
      />
    </SafeAreaView>
  );
}
