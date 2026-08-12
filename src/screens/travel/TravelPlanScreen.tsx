import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
import { coursesApi } from "@/api/courses";
import { useCourseStore } from "@/store/useCourseStore";
import { useAnimatedRef } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { WebView } from "react-native-webview";
import Sortable from "react-native-sortables";
import { normalize, normalizeFontSize } from "@/utils/normalize";
import {
  IconChevronLeft,
  IconShare,
  IconDots,
  IconClock,
  IconCar,
  IconWalk,
  IconTrash,
  IconMapPinFilled,
  IconRoad,
  IconCloudQuestion,
  IconCamera,
  IconArrowsMaximize,
  IconGripVertical,
  IconBulb,
  IconPlus,
  IconAlertCircle,
  IconMap2,
} from "@tabler/icons-react-native";
import NaviSheet from "@/components/spot/NaviSheet";
import CourseMoreSheet from "@/components/travel/CourseMoreSheet";
import { parseValidCoordinate } from "@/utils/geo";
import ShareSheet from "@/components/common/ShareSheet";
import Toast from "@/components/common/Toast";
import CourseChecklistSection from "@/components/travel/CourseChecklistSection";
import { getCourseStats } from "@/utils/distance";
import { getDayColor } from "@/constants/dayColors";
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG, CONTENT_PADDING, BUTTON_HEIGHT, BUTTON_RADIUS, CARD_RADIUS, HEADER_HEIGHT, ICON_SM } from "@/constants/layout";

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

// 백엔드 CourseService.validateDaySpotLimits 와 같은 값. 넘으면 동기화 요청 전체가 400으로 거부된다.
const MAX_SPOTS_PER_DAY = 10;

// data[currentDay]가 없을 때 쓰는 빈 Day. 매 렌더 새 객체가 생기지 않게 모듈 상수로 둔다.
const EMPTY_DAY = { date: "", spots: [] as any[], transports: {} as Record<string, any>, tip: "" };

const getSunsetAndGoldenHour = (isoString?: string) => {
  if (!isoString) return { sunset: "정보 없음", golden: "정보 없음" };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { sunset: isoString, golden: "정보 없음" };
    
    const formatTime = (date: Date) => {
      const h = date.getHours().toString().padStart(2, '0');
      const m = date.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    const sunsetStr = formatTime(d);
    const start = new Date(d.getTime() - 20 * 60000);
    const end = new Date(d.getTime() + 20 * 60000);
    const goldenStr = `${formatTime(start)}~${formatTime(end)}`;

    return { sunset: sunsetStr, golden: goldenStr };
  } catch {
    return { sunset: isoString, golden: "정보 없음" };
  }
};

const getWeatherIcon = (status: string | undefined) => {
  if (!status || status.includes("데이터 없음")) return "https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/partly-cloudy-day.svg";
  if (status.includes("맑음") || status.includes("CLEAR")) return "https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/clear-day.svg";
  if (status.includes("구름") || status.includes("흐림") || status.includes("CLOUDY")) return "https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/partly-cloudy-day.svg";
  if (status.includes("비") || status.includes("눈") || status.includes("RAIN") || status.includes("SNOW")) return "https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/rain.svg";
  return "https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/partly-cloudy-day.svg"; // default
};

const WeatherCell = ({ period, data }: { period: string; data: { weatherStatus: string; temperature: number | null } }) => (
  <View className="flex-1 py-3 px-[14px] bg-[#f5f5f7] rounded-xl relative">
    <Text className="text-black/35 mb-1.5" style={{ fontSize: normalizeFontSize(11) }}>{period}</Text>
    <Text className="font-semibold text-black mb-0.5" style={{ fontSize: normalizeFontSize(20) }}>{data.temperature ?? '-'}°</Text>
    <Text className="text-black/40" style={{ fontSize: normalizeFontSize(11) }}>{data.weatherStatus}</Text>
    <View className="absolute right-3 top-1/2 -translate-y-1/2 opacity-80" style={{ transform: [{ translateY: -10 }] }}>
      <SvgUri width="20" height="20" uri={getWeatherIcon(data.weatherStatus)} />
    </View>
  </View>
);

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

// toLocaleDateString('ko-KR')은 안드로이드 Hermes에 ICU 데이터가 없으면 영어로 떨어져 배열로 뽑는다
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function mapCourseToData(course: any) {
  const result: Record<string, any> = {};
  if (!course) return MOCK_DATA;
  
  const start = new Date(course.startDate);
  const end = new Date(course.endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  for (let i = 1; i <= diffDays; i++) {
    const curDate = new Date(start.getTime() + (i - 1) * 24 * 60 * 60 * 1000);
    const dateStr = `${curDate.getMonth() + 1}월 ${curDate.getDate()}일 ${WEEKDAYS[curDate.getDay()]}`;
    
    const daySpots = (course.spots || [])
      .filter((s: any) => s.dayNumber === i)
      .sort((a: any, b: any) => a.sequenceOrder - b.sequenceOrder)
      .map((s: any) => {
        // 보정 좌표(navigation)가 유효하면 그것을 쓰고, 아니면 원본 스팟 좌표로 폴백한다.
        const navLat = s.navigation?.latitude;
        const navLng = s.navigation?.longitude;
        const hasNavCoord = Number.isFinite(navLat) && Number.isFinite(navLng);
        return {
          id: String(s.id),
          realSpotId: s.spotId,
          name: s.spotName || `스팟 ${s.spotId}`,
          address: s.address || "",
          loc: s.address || s.category || "",
          time: "10:00 ~ 11:00", // TODO: Add real time schedule fields
          dur: "1시간", // TODO: Add real duration
          // 등급 기준·색은 스팟 상세(PhotogenicScoreCard)와 동일하게 맞춘다.
          // 경계 80/60/40은 백엔드 PhotogenicResponse.gradeFrom과 같은 값이고,
          // 색은 좋음류=핑크 / 보통=주황 / 비추천=회색. 점수가 없으면 배지를 렌더하지 않는다(아래 renderSpotRow).
          score: typeof s.photogenicScore === "number" ? `${s.photogenicScore}점` : null,
          scoreColor:
            typeof s.photogenicScore !== "number" ? null
              : s.photogenicScore >= 60 ? "#E31B59"
                : s.photogenicScore >= 40 ? "#E8890B"
                  : "#9A9A9A",
          bg: "#2c6e91", // Default background color
          lat: hasNavCoord ? navLat : (s.latitude || 35.1531696),
          lng: hasNavCoord ? navLng : (s.longitude || 129.118666),
          photo: s.thumbnailUrl || '',
          travelTimeMinutes: s.travelTimeMinutes,
          travelTimeEstimated: s.travelTimeEstimated,
          navigation: s.navigation,
        };
      });

    const transports: Record<string, any> = {};
    for (let j = 0; j < daySpots.length - 1; j++) {
      const current = daySpots[j];
      const next = daySpots[j + 1];
      const driveMins = next.travelTimeMinutes;
      const isEstimated = next.travelTimeEstimated;
      const isCorrected = next.navigation?.status === "CORRECTED";
      const isUnreachable = next.navigation?.status === "UNREACHABLE";

      let label = "경로 확인 필요";
      if (driveMins != null && driveMins > 0) {
        const timeText = isEstimated ? `약 ${driveMins}분` : `${driveMins}분`;
        if (isCorrected) {
          label = `차량 ${timeText} + 도보 이동 필요`;
        } else {
          label = `차량 ${timeText}`;
        }
      } else if (isCorrected) {
        label = `도보 이동 필요`;
      } else if (isUnreachable) {
        label = `차량 이동 불가`;
      } else {
        label = `경로 확인 필요`;
      }

      transports[`${current.id}__${next.id}`] = {
        type: (driveMins != null && driveMins > 0) ? "car" : (isCorrected ? "walk" : "car"),
        label,
        driveMins: driveMins ?? 0,
        isEstimated,
        isCorrected,
      };
    }

    result[String(i)] = {
      date: dateStr,
      tip: null,
      checklist: [], // Replaced by course.checklists in UI
      spots: daySpots,
      transports,
    };
  }
  return result;
}

export default function TravelPlanScreen({ navigation, route }: any) {
  const { planId } = route?.params || {};
  const [currentDay, setCurrentDay] = useState<string>("1");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDepartModalVisible, setIsDepartModalVisible] = useState(false);
  const [isMoreSheetVisible, setIsMoreSheetVisible] = useState(false);
  const [isShareSheetVisible, setShareSheetVisible] = useState(false);
  const [data, setData] = useState<Record<string, any>>(MOCK_DATA);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const { data: course, refetch, isLoading: isCourseLoading, isError: isCourseError } = useQuery({
    queryKey: ['course', planId],
    queryFn: () => coursesApi.getCourse(Number(planId)),
    enabled: !!planId,
  });

  const { data: weatherData } = useQuery({
    queryKey: ['courseWeather', planId],
    queryFn: () => coursesApi.getCourseWeather(Number(planId)),
    enabled: !!planId,
  });

  useEffect(() => {
    if (course) {
      const next = mapCourseToData(course);
      setData(next);
      // 일정이 줄면(3박 → 1박) 보고 있던 Day가 사라진다. 남겨두면 빈 화면에 갇히므로 1일차로 되돌린다.
      setCurrentDay((day) => (next[day] ? day : "1"));
    }
  }, [course]);

  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const scrollRef = useAnimatedRef<ScrollView>();
  const headerHeightRef = useRef<number>(0);
  // Sortable.Grid는 각 행을 position:absolute로 배치하므로 onLayout의 y값은
  // 행 자신의 절대 위치가 아니라 그 위치 래퍼 안에서의 상대값(항상 0)이 된다.
  // 대신 각 행의 측정된 높이(height)를 모아 앞선 행들의 높이를 더해 오프셋을 직접 계산한다.
  const rowHeights = useRef<{ [key: string]: number }>({});


  // data[currentDay]가 없을 수 있다(일정 축소 직후, 날짜가 깨져 diffDays가 NaN인 코스 등).
  // 렌더 경로 여러 곳이 currentData를 직접 참조하므로 빈 Day를 기본값으로 둬 크래시를 막는다.
  // useMemo로 참조를 고정해야 아래 useMemo들이 매 렌더 재계산되지 않는다.
  const currentData = React.useMemo(
    () => data[currentDay] ?? EMPTY_DAY,
    [data, currentDay]
  );

  // 계획 전체가 아니라 현재 선택된 Day 기준. DAY 1에 스팟이 있고 DAY 2가 비면 DAY 2에서만 비활성으로 보인다.
  const isDayEmpty = (currentData?.spots?.length ?? 0) === 0;
  // 비활성은 채도만 뺀다 — 레이블은 활성과 같은 색을 유지해 무슨 항목인지 계속 읽히게.
  const statIconBg = isDayEmpty ? "rgba(0,0,0,0.05)" : "rgba(227,27,89,0.09)";
  const statIconColor = isDayEmpty ? "rgba(0,0,0,0.3)" : "#E31B59";
  const statValueColor = isDayEmpty ? "rgba(0,0,0,0.35)" : "#000";

  const { totalDistance, totalDurationFormatted } = React.useMemo(() => {
    const { distanceKm, durationText } = getCourseStats(currentData?.spots);
    return { totalDistance: Math.round(distanceKm), totalDurationFormatted: durationText };
  }, [currentData]);

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

  const syncSpotsMutation = useMutation({
    mutationFn: (data: {
      spots: { courseSpotId?: number, spotId: number, dayNumber: number, sequenceOrder: number, memo?: string }[]
    }) => coursesApi.syncSpots(Number(planId), data),
    onSuccess: () => refetch(),
    // 동기화가 실패했는데 화면은 낙관적으로 갱신된 상태라, 알리지 않으면 저장된 것처럼 보이다가
    // 다시 들어왔을 때 조용히 사라진다. 실패를 알리고 화면을 서버 상태로 되돌린다.
    //
    // refetch()만 호출하면 안 된다. 동기화가 거부됐으면 서버 데이터가 그대로이므로 응답이
    // 이전과 deeply equal이고, TanStack Query의 structural sharing이 같은 참조를 돌려준다.
    // 그러면 [course] 의존 effect가 재실행되지 않아 거부된 낙관적 상태가 화면에 남는다.
    // 결과를 직접 받아 setData 한다.
    onError: async (error: any) => {
      showToast(error?.message || "스팟을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      const { data: fresh } = await refetch();
      if (!fresh) return;
      const restored = mapCourseToData(fresh);
      setData(restored);
      setCurrentDay((day) => (restored[day] ? day : "1"));
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: () => coursesApi.deleteCourse(Number(planId)),
    onSuccess: () => {
      navigation.goBack();
    },
  });



  const handleMorePress = () => {
    setIsMoreSheetVisible(true);
  };

  const buildAllSpotsPayload = React.useCallback((currentData: typeof data) => {
    return Object.entries(currentData).flatMap(([dayStr, dayData]) => {
      const dNum = parseInt(dayStr, 10);
      return dayData.spots.map((s: any, index: number) => ({
        courseSpotId: (String(s.id).startsWith("new") || isNaN(Number(s.id))) ? undefined : Number(s.id),
        spotId: Number(s.realSpotId),
        dayNumber: dNum,
        sequenceOrder: index + 1,
      }));
    });
  }, []);

  const { selectedSpots, clearSpots } = useCourseStore();

  useFocusEffect(
    React.useCallback(() => {
      if (selectedSpots.length > 0 && planId) {
        
        const spotsToAdd = [...selectedSpots];
        clearSpots();

        const currentSpots = data[currentDay]?.spots || [];
        // 서버가 Day당 MAX_SPOTS_PER_DAY개를 넘으면 동기화 전체를 거부한다. 넘는 만큼은 담지 않는다.
        // 그냥 보내면 이 Day를 줄이기 전까지 이후 모든 저장(순서 변경·삭제 포함)이 계속 실패한다.
        const room = Math.max(0, MAX_SPOTS_PER_DAY - currentSpots.length);
        const acceptedSpots = spotsToAdd.slice(0, room);
        const rejectedCount = spotsToAdd.length - acceptedSpots.length;

        if (rejectedCount > 0) {
          showToast(
            room === 0
              ? `DAY ${currentDay}는 이미 ${MAX_SPOTS_PER_DAY}곳이라 더 담을 수 없어요`
              : `DAY ${currentDay}는 ${MAX_SPOTS_PER_DAY}곳까지예요. ${acceptedSpots.length}곳만 담았어요`
          );
        }
        if (acceptedSpots.length === 0) return;

        const newSpots = [
          ...currentSpots,
          ...acceptedSpots.map((spot: any, idx) => ({
            id: `new_${Date.now()}_${idx}`, // 임시 ID
            realSpotId: spot.id,
            name: spot.title || spot.name || `스팟 ${spot.id}`,
            address: spot.address || spot.loc || "",
            loc: spot.address || spot.loc || spot.category || "",
            bg: "#ccc",
            lat: spot.latitude || spot.mapY || spot.lat,
            lng: spot.longitude || spot.mapX || spot.lng,
            photo: spot.imageUrl || spot.firstimage || spot.photo || '',
            travelTimeMinutes: null,
            navigation: spot.navigation,
          }))
        ];
        
        const newData = {
          ...data,
          [currentDay]: { ...data[currentDay], spots: newSpots },
        };
        setData(newData);

        syncSpotsMutation.mutate({
          spots: buildAllSpotsPayload(newData)
        });
      }
    }, [selectedSpots, currentDay, data, planId, syncSpotsMutation, clearSpots, buildAllSpotsPayload])
  );

  const reorderSpots = (spots: any[]) => {
    const newData = {
      ...data,
      [currentDay]: { ...data[currentDay], spots },
    };
    setData(newData);
    if (planId) {
      syncSpotsMutation.mutate({
        spots: buildAllSpotsPayload(newData)
      });
    }
  };

  const removeSpot = (spotId: string) => {
    delete rowHeights.current[spotId];
    
    const dayData = data[currentDay];
    const newSpots = dayData.spots.filter((s: any) => s.id !== spotId);
    const newData = {
      ...data,
      [currentDay]: {
        ...dayData,
        spots: newSpots,
      },
    };
    setData(newData);
    
    if (planId) {
      syncSpotsMutation.mutate({
        spots: buildAllSpotsPayload(newData)
      });
    }
  };


  // 선택한 Day 하나만 그린다. 여러 Day를 한눈에 보는 건 확대 지도의 "전체" 드롭다운 몫이다.
  const renderKakaoMapHTML = () => {
    const day = currentDay;
    // currentDay가 data의 키라는 보장이 없다(일정이 줄어든 직후 등). 없으면 빈 지도로 둔다.
    // 좌표는 이 아래에서 생성 JS에 그대로 보간되므로, 숫자가 아닌 값이 섞이면 스크립트나
    // bounds 계산이 깨진다. mapCourseToData는 falsy 폴백만 하므로 여기서 한 번 더 검증한다.
    const spots: any[] = (data[day]?.spots || []).flatMap((spot: any) => {
      const coord = parseValidCoordinate(spot.lat, spot.lng);
      return coord ? [{ ...spot, lat: coord.latitude, lng: coord.longitude }] : [];
    });
    const color = getDayColor(day);

    const markersHtml = spots
      .map(
        (spot: any, i: number) => `
        var pos_${day}_${i} = new kakao.maps.LatLng(${spot.lat}, ${spot.lng});
        bounds.extend(pos_${day}_${i});

        var contentWrapper_${day}_${i} = document.createElement('div');
        // 래퍼가 블록이면 내용보다 넓게 잡혀 중앙 기준점이 실제 뱃지 중앙과 어긋난다 → 내용을 꼭 감싸게 한다
        contentWrapper_${day}_${i}.style.cssText = 'display:inline-block; font-size:0;';
        contentWrapper_${day}_${i}.innerHTML = '<div style="background:${color.bg}; color:${color.text}; font-size:12px; font-weight:600; padding:4px 8px; border-radius:12px; box-shadow:0 2px 4px rgba(0,0,0,0.2); pointer-events:auto;">${i + 1}</div>';

        contentWrapper_${day}_${i}.onclick = function(e) {
            e.stopPropagation();
            cancelMapClose();
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPOT_CLICK', data: ${JSON.stringify(spot).replace(/</g, "\\u003c")} }));
        };
        contentWrapper_${day}_${i}.addEventListener('touchstart', function(e) { e.stopPropagation(); cancelMapClose(); }, { passive: true });

        // 꼬리 없는 둥근 뱃지라 가로·세로 모두 중앙을 좌표에 맞춘다.
        // 기준점이 어긋나면 폴리라인은 좌표에 그려지므로 선이 뱃지 중앙에 닿지 않는다.
        var customOverlay_${day}_${i} = new kakao.maps.CustomOverlay({
            position: pos_${day}_${i},
            content: contentWrapper_${day}_${i},
            xAnchor: 0.5,
            yAnchor: 0.5
        });
        customOverlay_${day}_${i}.setMap(map);
      `,
      )
      .join("\n");

    const polylineHtml =
      spots.length > 1
        ? `
          var linePath_${day} = [
            ${spots.map((spot: any) => `new kakao.maps.LatLng(${spot.lat}, ${spot.lng})`).join(",\n")}
          ];
          var polyline_${day} = new kakao.maps.Polyline({
            path: linePath_${day},
            strokeWeight: 3,
            strokeColor: '${color.text}',
            strokeOpacity: 1,
            strokeStyle: 'shortdash'
          });
          polyline_${day}.setMap(map);
        `
        : "";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <!-- baseUrl을 https로 주면 카카오 SDK가 내부 라이브러리를 https로 받는다(iOS ATS 통과).
               단 Referer가 붙으면 미등록 도메인이라 401이 되므로 no-referrer로 억제한다. -->
          <meta name="referrer" content="no-referrer">
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
                
                ${markersHtml}
                ${polylineHtml}

                if (${spots.length} > 0) {
                    map.setBounds(bounds, 50, 50, 50, 50);
                }

                kakao.maps.event.addListener(map, 'click', function() {
                    scheduleMapClose();
                });
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
    () => renderKakaoMapHTML(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, currentDay]
  );

  const renderHeader = () => (
    // 지도는 헤더 구분선에 붙인다. 위 여백을 두면 구분선과 지도 사이가 떠 보인다.
    <View className="bg-white pb-2">
        {/* Map Area — 스팟 0개면 지도 SDK를 비운 채 두지 않고 플레이스홀더로 교체(같은 높이 유지) */}
        {isDayEmpty ? (
          <View
            className="bg-[#f5f5f7] items-center justify-center"
            style={{ height: normalize(210), gap: 8 }}
          >
            <IconMap2 size={normalize(26)} color="rgba(0,0,0,0.2)" strokeWidth={1.5} />
            <Text allowFontScaling={false} style={{ fontSize: FONT_SM, color: "rgba(0,0,0,0.3)", letterSpacing: -0.2 }}>
              표시할 경로가 없어요
            </Text>
          </View>
        ) : (
          <View className="bg-[#e8e8ed] overflow-hidden relative" style={{ height: normalize(210) }}>
            <WebView
              source={{ html: interactiveMapHtml, baseUrl: 'https://localhost' }}
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
              <IconArrowsMaximize size={normalize(20)} color="#000" />
            </TouchableOpacity>
          </View>
        )}

        <View className="pt-6 pb-0" style={{ paddingHorizontal: CONTENT_PADDING }}>
          {/* Summary Card — 스팟 0개면 카드/레이아웃은 그대로 두고 아이콘·값의 채도만 뺀다.
              opacity·pointerEvents는 쓰지 않는다(레이블 가독성이 같이 죽고 로딩으로 오해된다) */}
          <View className="bg-[#f5f5f7] p-4 rounded-2xl mb-5 flex-row">
            <View className="flex-1 items-center">
              <View className="items-center justify-center mb-1" style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(12), backgroundColor: statIconBg }}>
                <IconMapPinFilled size={normalize(20)} color={statIconColor} strokeWidth={1.8} />
              </View>
              <Text allowFontScaling={false} numberOfLines={1} style={{ fontSize: FONT_MD, fontFamily: "Pretendard-SemiBold", letterSpacing: -0.3, color: statValueColor }}>{currentData.spots.length}곳</Text>
              <Text allowFontScaling={false} style={{ fontSize: FONT_XS, fontFamily: "Pretendard-Regular", color: "rgba(0,0,0,0.5)", letterSpacing: -0.2 }}>포토스팟</Text>
            </View>
            <View className="flex-1 items-center">
              <View className="items-center justify-center mb-1" style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(12), backgroundColor: statIconBg }}>
                <IconRoad size={normalize(20)} color={statIconColor} strokeWidth={1.8} />
              </View>
              <Text allowFontScaling={false} numberOfLines={1} style={{ fontSize: FONT_MD, fontFamily: "Pretendard-SemiBold", letterSpacing: -0.3, color: statValueColor }}>{totalDistance}km</Text>
              <Text allowFontScaling={false} style={{ fontSize: FONT_XS, fontFamily: "Pretendard-Regular", color: "rgba(0,0,0,0.5)", letterSpacing: -0.2 }}>총 이동거리</Text>
            </View>
            <View className="flex-1 items-center">
              <View className="items-center justify-center mb-1" style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(12), backgroundColor: statIconBg }}>
                <IconClock size={normalize(20)} color={statIconColor} strokeWidth={1.8} />
              </View>
              <Text allowFontScaling={false} numberOfLines={1} style={{ fontSize: FONT_MD, fontFamily: "Pretendard-SemiBold", letterSpacing: -0.3, color: statValueColor }}>{totalDurationFormatted}</Text>
              <Text allowFontScaling={false} style={{ fontSize: FONT_XS, fontFamily: "Pretendard-Regular", color: "rgba(0,0,0,0.5)", letterSpacing: -0.2 }}>총 이동시간</Text>
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
                  style={{ height: normalize(36), paddingHorizontal: normalize(16) }}
                >
                  <View className="rounded-full" style={{ width: normalize(6), height: normalize(6), marginRight: normalize(6), backgroundColor: currentDay === day ? "#fff" : getDayColor(day).text }} />
                  <Text
                    className={`font-medium tracking-tight ${currentDay === day ? "text-white font-semibold" : "text-black/50"}`} style={{ fontSize: FONT_SM }}>DAY {day}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

  );

  const currentWeather = weatherData?.find((w: any) => w.dayNumber === parseInt(currentDay, 10));

  const hasValidWeather = currentWeather && 
    (currentWeather.morning?.weatherStatus !== "데이터 없음" ||
     currentWeather.afternoon?.weatherStatus !== "데이터 없음" ||
     currentWeather.evening?.weatherStatus !== "데이터 없음");

  const weatherRow = React.useMemo(
    () => (
      <View className="mt-9">
        {/* 섹션 제목 3개(타임라인 · DAY N 날씨 · 촬영 체크리스트)는 FONT_LG + 아래 간격 16으로 통일 */}
        <Text allowFontScaling={false} className="text-black tracking-[-0.3px] mb-4" style={{ fontSize: FONT_LG, fontFamily: "Pretendard-SemiBold" }}>
          DAY {currentDay} 날씨
        </Text>
        {hasValidWeather ? (
          <View className="flex-row gap-2">
            {currentWeather.morning && <WeatherCell period="오전" data={currentWeather.morning} />}
            {currentWeather.afternoon && <WeatherCell period="오후" data={currentWeather.afternoon} />}
            {currentWeather.evening && <WeatherCell period="저녁" data={currentWeather.evening} />}
          </View>
        ) : (
          <View
            className="bg-[#f5f5f7] rounded-2xl items-center justify-center"
            style={{ paddingVertical: normalize(28), paddingHorizontal: normalize(24) }}
          >
            {/* wand/sparkles 계열은 짧은 획이 round cap으로 뭉쳐 점처럼 보임 → 획이 긴 아이콘으로 교체 */}
            <IconCloudQuestion
              size={normalize(32)}
              strokeWidth={1.5}
              color="rgba(0,0,0,0.25)"
              style={{ marginBottom: normalize(12) }}
            />
            <Text allowFontScaling={false} className="font-semibold text-black" style={{ fontSize: FONT_MD, marginBottom: normalize(4) }}>
              날씨 요정도 아직 모른대요
            </Text>
            <Text allowFontScaling={false} className="text-center" style={{ fontSize: FONT_SM, color: "rgba(0,0,0,0.5)" }}>
              어떤 날씨든 완벽한 여행이 될 거예요!
            </Text>
          </View>
        )}
      </View>
    ),
    [currentDay, currentWeather, hasValidWeather]
  );

  const handleAddSpot = () => navigation.navigate("Map", { source: "plan" });

  // 현재 Day에 스팟이 0개일 때만 노출. 편집 모드와 무관 — 편집할 대상이 없으니 이 블록이 유일한 추가 진입점이다.
  // 기본 카드 규칙은 무테지만, 기존 점선 '+ 스팟 추가하기' 카드의 시각 언어를 계승하기 위한 의도적 예외.
  const renderDayEmptyState = (variant: "empty" | "error") => {
    const isError = variant === "error";
    return (
      <View
        style={{
          paddingVertical: normalize(32),
          paddingHorizontal: normalize(24),
          borderRadius: CARD_RADIUS,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: "rgba(0,0,0,0.12)",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: normalize(48),
            height: normalize(48),
            borderRadius: normalize(14),
            backgroundColor: "rgba(227,27,89,0.08)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isError ? (
            <IconAlertCircle size={normalize(24)} color="#E31B59" strokeWidth={1.6} />
          ) : (
            <IconCamera size={normalize(24)} color="#E31B59" strokeWidth={1.6} />
          )}
        </View>
        <Text
          allowFontScaling={false}
          style={{ marginTop: normalize(14), fontFamily: "Pretendard-SemiBold", fontSize: FONT_MD, fontWeight: "600", letterSpacing: -0.2, color: "#000", textAlign: "center" }}
        >
          {isError ? "일정을 불러오지 못했어요" : "자유로운 셔터 찬스"}
        </Text>
        <Text
          allowFontScaling={false}
          style={{ marginTop: normalize(6), fontFamily: "Pretendard-Regular", fontSize: FONT_SM, lineHeight: normalize(20), letterSpacing: -0.2, color: "rgba(0,0,0,0.5)", textAlign: "center" }}
        >
          {isError
            ? "잠시 후 다시 시도해 주세요."
            : "계획에 얽매이지 말고 발길 닿는 대로,\n마음 가는 대로 셔터를 눌러보세요!"}
        </Text>
        <TouchableOpacity
          onPress={isError ? () => refetch() : handleAddSpot}
          accessibilityRole="button"
          accessibilityLabel={isError ? "다시 시도" : "스팟 추가하기"}
          style={{
            marginTop: normalize(20),
            alignSelf: "stretch",
            height: BUTTON_HEIGHT,
            borderRadius: BUTTON_RADIUS,
            backgroundColor: "#E31B59",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: normalize(6),
          }}
        >
          {!isError && <IconPlus size={ICON_SM} color="#fff" strokeWidth={2} />}
          <Text
            allowFontScaling={false}
            style={{ fontFamily: "Pretendard-SemiBold", fontSize: FONT_MD, fontWeight: "600", color: "#fff", letterSpacing: -0.2 }}
          >
            {isError ? "다시 시도" : "스팟 추가하기"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 섹션 구분은 hairline 없이 여백 36으로만. 카드가 이미 #f5f5f7 배경으로 덩어리를 나눈다.
  // 여백 규칙: footer는 상단 패딩을 갖지 않고 뒤따르는 블록이 각자 자기 상단 여백(36)을 갖는다.
  // 부모에서 한 번 더 주면 블록에 따라 36이 두 번 겹쳐 72가 된다(RN은 마진 상쇄가 없다).
  // 빈 상태 블록만 예외로 0 — 제목 행의 mb-4(16)가 날짜와의 간격이 된다.
  const renderFooter = () => (
    <View className="pb-12 pt-0" style={{ paddingHorizontal: CONTENT_PADDING }}>
      {isCourseLoading ? (
        <View className="mt-9" style={{ height: normalize(88), borderRadius: CARD_RADIUS, backgroundColor: "#f5f5f7" }} />
      ) : /* 데이터가 아예 없을 때만 에러. 이미 받아둔 코스가 있으면 재조회 한 번 실패로 화면을 덮지 않는다 */
      isCourseError && !course ? (
        renderDayEmptyState("error")
      ) : isDayEmpty ? (
        renderDayEmptyState("empty")
      ) : isEditMode ? (
        <TouchableOpacity
          onPress={handleAddSpot}
          className="h-12 border-[1px] border-dashed border-black/15 rounded-2xl items-center justify-center mt-9 flex-row"
        >
          <Text allowFontScaling={false} className="text-black/40 font-medium" style={{ fontSize: FONT_MD }}>
            + 스팟 추가하기
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Tip Banner — 일몰 정보가 있을 때만. '자유로운 셔터 찬스'는 스팟 0개 빈 상태 블록으로 옮겼다 */}
      {currentWeather && currentWeather.sunsetTime && (
        <View className="flex-row gap-3 p-4 bg-[#f5f5f7] rounded-2xl items-center mt-9">
          <View className="w-8 h-8 rounded-lg bg-[#e31b59]/10 items-center justify-center shrink-0">
            <IconBulb size={normalize(16)} color="#e31b59" />
          </View>
          <View className="flex-1">
            <Text allowFontScaling={false} className="font-semibold text-black tracking-[-0.15px] mb-0.5" style={{ fontSize: normalizeFontSize(14) }}>
              오늘의 촬영 팁
            </Text>
            <Text allowFontScaling={false} className="text-black/50 leading-relaxed" style={{ fontSize: FONT_XS }}>
              {(() => {
                const { sunset, golden } = getSunsetAndGoldenHour(currentWeather.sunsetTime);
                const fineDust = currentWeather.fineDustStatus ? `미세먼지 ${currentWeather.fineDustStatus} · ` : '';
                return `${currentWeather.targetSpotName} 일몰 시간 ${sunset} · 골든아워 ${golden}\n${fineDust}일몰 포인트로 이동 추천`;
              })()}
            </Text>
          </View>
        </View>
      )}

      {/* Weather Row */}
      {weatherRow}

      {/* Checklist — 스팟 상세와 동일한 UI. 코스 전체 공통 1개 목록(일자별 아님) */}
      <View className="mt-9">
        <CourseChecklistSection
          courseId={Number(planId)}
          items={course?.checklists || []}
          loading={isCourseLoading}
          onChanged={refetch}
        />
      </View>

      {/* 모든 CTA는 고정 바 없이 본문 끝에 둔다 — 하단 탭바와 바가 두 겹으로 쌓이지 않게.
          편집 모드에선 '편집 완료' 하나, 그 외엔 코스 편집 + 바로 출발 */}
      {/* 스팟이 0개면 편집할 대상도 출발할 목적지도 없다 → 빈 상태 블록의 '스팟 추가하기'가 유일한 행동 */}
      {isEditMode ? (
        <View className="mt-12">
          <TouchableOpacity
            onPress={() => setIsEditMode(false)}
            className="rounded-full bg-[#e31b59] items-center justify-center"
            style={{ height: BUTTON_HEIGHT }}
          >
            <Text allowFontScaling={false} className="font-medium text-white" style={{ fontSize: FONT_MD }}>
              편집 완료
            </Text>
          </TouchableOpacity>
        </View>
      ) : !isDayEmpty ? (
        <View className="flex-row gap-3 mt-12">
          <TouchableOpacity
            onPress={() => setIsEditMode(true)}
            className="flex-1 rounded-full bg-[#f5f5f7] items-center justify-center"
            style={{ height: BUTTON_HEIGHT }}
          >
            <Text allowFontScaling={false} className="font-medium text-black" style={{ fontSize: FONT_MD }}>
              코스 편집
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsDepartModalVisible(true)}
            className="flex-1 rounded-full bg-[#e31b59] items-center justify-center"
            style={{ height: BUTTON_HEIGHT }}
          >
            <Text allowFontScaling={false} className="font-medium text-white" style={{ fontSize: FONT_MD }}>
              바로 출발
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
    // mb-2는 카드 사이 간격이라 마지막 카드에는 빼야 다음 섹션과의 간격이 정확히 36이 된다
    const isLastSpot = !nextSpot;

    return (
      <View
        className="relative pt-1" style={{ paddingHorizontal: CONTENT_PADDING }}
        onLayout={(e) => {
          rowHeights.current[item.id] = e.nativeEvent.layout.height;
        }}
      >
        <View className={`flex-row items-start relative ${isLastSpot ? "" : "mb-2"}`}>
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
              <Text className="font-semibold text-white" style={{ fontSize: normalizeFontSize(10) }}>
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
            {item.photo ? (
              <Image
                source={{ uri: item.photo }}
                className="rounded-xl shrink-0 bg-[#e8e8ed]"
                style={{ width: normalize(72), height: normalize(72) }}
                resizeMode="cover"
              />
            ) : (
              <View
                className="rounded-xl shrink-0"
                style={{ width: normalize(72), height: normalize(72),  backgroundColor: item.bg }}
              />
            )}
            <View
              className={`flex-1 justify-center ${isEditMode ? "pr-10" : "pr-4"}`}
            >
              {/* 제목 + 점수 배지는 한 행. justify-between으로 밀지 않고 gap으로 붙여 한 덩어리로 읽히게 한다 */}
              <View className="flex-row items-center gap-2 mb-1.5">
                <Text allowFontScaling={false}
                  className="font-semibold text-black tracking-[-0.2px] shrink" style={{ fontSize: FONT_MD }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {/* 점수가 없으면 배지를 그리지 않는다 — 색으로 최하위 등급처럼 보이는 걸 막는다 */}
                {item.score ? (
                  <View
                    className="px-2.5 h-6 rounded-full items-center justify-center shrink-0"
                    style={{ backgroundColor: item.scoreColor }}
                  >
                    <Text allowFontScaling={false} className="font-semibold text-white" style={{ fontSize: FONT_XS }}>
                      {item.score}
                    </Text>
                  </View>
                ) : null}
              </View>
              {Boolean(item.loc) && (
                // 한 줄로 자르면 장소를 특정하는 도로명·번지가 잘려나가고 광역 단위만 남는다 → 2줄 허용
                <Text allowFontScaling={false}
                  className="text-black/40"
                  style={{ fontSize: FONT_XS, lineHeight: normalize(16) }}
                  numberOfLines={2}
                >
                  {item.loc}
                </Text>
              )}
              {/* TODO: 추후 스팟별 방문 시간/체류 시간 기능 추가 시 활성화 */}
              {/* <View className="flex-row items-center gap-1.5 mt-1">
                <IconClock size={12} color="rgba(0,0,0,0.3)" />
                <Text className="text-black/50" style={{ fontSize: normalizeFontSize(12) }}>
                  {item.time} <Text className="text-black/25">{item.dur}</Text>
                </Text>
              </View> */}
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
              <Text className="text-black/45" style={{ fontSize: normalizeFontSize(12) }}>
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
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      {/* Sticky Navbar */}
      <View className="flex-row items-center px-3.5 border-b-[0.5px] border-black/5 z-50 bg-white" style={{ height: HEADER_HEIGHT }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-8 h-8 rounded-full bg-black/5 items-center justify-center shrink-0"
        >
          <IconChevronLeft size={20} color="rgba(0,0,0,0.6)" />
        </TouchableOpacity>
        <View className="flex-1 mx-3">
          <Text
            className="font-semibold tracking-[-0.35px]" style={{ fontSize: normalizeFontSize(16) }}
            numberOfLines={1}
          >
            {course?.title || "출사 계획"}
          </Text>
          <Text className="text-black/40 tracking-[-0.1px] mt-[1px]" style={{ fontSize: normalizeFontSize(11) }}>
            {course ? `${course.startDate.replace(/-/g, '.')} ~ ${course.endDate.replace(/-/g, '.')}` : "날짜 미정"}
          </Text>
        </View>
        <View className="flex-row gap-1">
          <TouchableOpacity 
            onPress={() => setShareSheetVisible(true)}
            className="w-8 h-8 rounded-full bg-black/5 items-center justify-center"
          >
            <IconShare size={18} color="rgba(0,0,0,0.6)" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleMorePress}
            className="w-8 h-8 rounded-full bg-black/5 items-center justify-center"
          >
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
            <View className="mb-4" style={{ paddingHorizontal: CONTENT_PADDING }}>
              <View>
                <Text allowFontScaling={false} className="text-black tracking-[-0.3px]" style={{ fontSize: FONT_LG, fontFamily: "Pretendard-SemiBold" }}>
                  타임라인
                </Text>
                {/* 탭 아래에 떠 있으면 소속이 애매해 제목 서브라인으로. 네비의 기간 표기와는 요일 유무로 구분 */}
                <Text allowFontScaling={false} className="text-black/40 tracking-[-0.1px] mt-1" style={{ fontSize: normalizeFontSize(14) }}>
                  {currentData.date}
                </Text>
              </View>
            </View>

            {/* 스팟이 0개면 드래그할 대상이 없으니 안내도 숨긴다 — 빈 상태 블록 하나만 남는다 */}
            {isEditMode && !isDayEmpty && (
              <View className="mb-4" style={{ paddingHorizontal: CONTENT_PADDING }}>
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

        {/* 스팟 0개 안내는 footer의 빈 상태 블록이 담당한다 — 여기선 아무것도 렌더하지 않는다 */}
        {!isDayEmpty && (
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

      <NaviSheet
        visible={isDepartModalVisible}
        onClose={() => setIsDepartModalVisible(false)}
        spotName={currentData?.spots?.[currentData.spots.length - 1]?.name || currentData?.spots?.[0]?.name || ""}
        address={currentData?.spots?.[currentData.spots.length - 1]?.address || currentData?.spots?.[currentData.spots.length - 1]?.loc || currentData?.spots?.[0]?.address || currentData?.spots?.[0]?.loc || ""}
        navigation={currentData?.spots?.[currentData.spots.length - 1]?.navigation}
        spots={(currentData?.spots || [])
          .map((s: any) => {
            const rawLat = s.navigation?.latitude ?? s.lat ?? s.latitude ?? s.y ?? s.mapY;
            const rawLng = s.navigation?.longitude ?? s.lng ?? s.longitude ?? s.x ?? s.mapX;
            const coord = parseValidCoordinate(rawLat, rawLng);
            if (!coord) return null;
            return {
              name: s.navigation?.name || s.name || s.spotName || "스팟",
              latitude: coord.latitude,
              longitude: coord.longitude,
              navigation: s.navigation,
            };
          })
          .filter(Boolean)}
        onLaunched={(msg) => Alert.alert("안내", msg)}
      />

      <CourseMoreSheet
        visible={isMoreSheetVisible}
        onClose={() => setIsMoreSheetVisible(false)}
        courseName={course?.title || "출사 계획"}
        onEditName={() => {
          if (planId && course) {
            navigation.navigate('TravelNew', {
              editMode: true,
              courseId: planId,
              initialTitle: course.title,
              initialStartDate: course.startDate,
              initialEndDate: course.endDate
            });
          }
        }}
        onDuplicate={() => Alert.alert('알림', '복제 기능은 준비중입니다.')}
        onInvite={() => Alert.alert('알림', '공동 편집자 초대 기능은 준비중입니다.')}
        onAddToCalendar={() => Alert.alert('알림', '캘린더 추가 기능은 준비중입니다.')}
        onDelete={() => {
          Alert.alert(
            '이 계획 전체 삭제',
            '정말 삭제하시겠습니까? 되돌릴 수 없어요.',
            [
              { text: '취소', style: 'cancel' },
              { text: '삭제', style: 'destructive', onPress: () => deleteCourseMutation.mutate() }
            ]
          );
        }}
      />

      <ShareSheet
        visible={isShareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
        onShared={(message) => showToast(message)}
      />

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
