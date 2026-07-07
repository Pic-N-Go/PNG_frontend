import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { IconChevronLeft, IconMapPin, IconX, IconStarFilled } from '@tabler/icons-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTravelStore, Spot } from '@/store/useTravelStore';
import { StatusBar } from 'expo-status-bar';

const KAKAO_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_API_KEY;

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // mode: 'plan' 이면 스팟 선택 모드
  const mode = route.params?.mode || 'view';

  const { selectedSpots, addSpot, removeSpot } = useTravelStore();
  const [activeSpot, setActiveSpot] = useState<Spot | null>(null);

  const isSelected = activeSpot ? selectedSpots.some(s => s.id === activeSpot.id) : false;

  const handleMessage = (event: any) => {
    try {
      const parsed = JSON.parse(event.nativeEvent.data);
      if (parsed.type === 'SPOT_CLICK') {
        setActiveSpot(parsed.data);
      } else if (parsed.type === 'MAP_CLICK') {
        setActiveSpot(null);
      }
    } catch (e) {
      console.log('WebView Message Parse Error:', e);
    }
  };

  const HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0">
  <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}"></script>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8e8ed; }
    #map { width: 100%; height: 100%; }
    .custom-marker {
      width: 32px; height: 32px; border-radius: 50%; background: #E31B59;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3); border: 2.5px solid white;
    }
    .custom-marker svg { width: 16px; height: 16px; fill: white; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    if (!window.kakao || !window.kakao.maps) {
       document.getElementById('map').innerHTML = '<div style="padding:20px;">Kakao Map API failed to load. API 키를 확인해주세요.</div>';
    } else {
      var mapContainer = document.getElementById('map');
      var mapOption = { 
          center: new kakao.maps.LatLng(36.5, 127.5),
          level: 13
      };
      var map = new kakao.maps.Map(mapContainer, mapOption);
      
      var spots = [
        { id: '1', name: '광안리 해수욕장', lat: 35.1532, lng: 129.1186, tags: ['바다', '야경'], score: '4.8', loc: '부산 수영구', photo: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8dd?q=80&w=400&auto=format&fit=crop' },
        { id: '2', name: '경복궁', lat: 37.5796, lng: 126.9770, tags: ['역사', '고궁'], score: '4.9', loc: '서울 종로구', photo: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=400&auto=format&fit=crop' },
        { id: '3', name: '제주 애월 해안도로', lat: 33.4632, lng: 126.3195, tags: ['드라이브', '바다'], score: '4.7', loc: '제주 제주시', photo: 'https://images.unsplash.com/photo-1600758208050-a35f99478f68?q=80&w=400&auto=format&fit=crop' },
        { id: '4', name: '남산 서울타워', lat: 37.5512, lng: 126.9882, tags: ['야경', '랜드마크'], score: '4.7', loc: '서울 용산구', photo: 'https://images.unsplash.com/photo-1610311756586-81e8eb9f3152?q=80&w=400&auto=format&fit=crop' },
        { id: '5', name: '전주 한옥마을', lat: 35.8147, lng: 127.1526, tags: ['한옥', '먹거리'], score: '4.6', loc: '전북 전주시', photo: 'https://images.unsplash.com/photo-1582236968962-d2f1f58b9cf6?q=80&w=400&auto=format&fit=crop' },
      ];

      var bounds = new kakao.maps.LatLngBounds();

      spots.forEach(function(spot) {
        var markerPosition = new kakao.maps.LatLng(spot.lat, spot.lng); 
        
        var content = document.createElement('div');
        content.className = 'custom-marker';
        content.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
        
        content.onclick = function(e) {
            e.stopPropagation();
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SPOT_CLICK', data: spot }));
        };

        var customOverlay = new kakao.maps.CustomOverlay({
            position: markerPosition,
            content: content,
            yAnchor: 1
        });
        customOverlay.setMap(map);
        bounds.extend(markerPosition);
      });

      map.setBounds(bounds);
      
      kakao.maps.event.addListener(map, 'click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK' }));
      });
    }
  </script>
</body>
</html>
  `;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      {/* 투명 헤더 */}
      <View className="absolute top-0 left-0 right-0 z-20 pt-[54px] px-4 pointer-events-box-none">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
          >
            <IconChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          {/* 플랜 모드 배너 */}
          {mode === 'plan' && (
            <View className="flex-1 flex-row items-center h-10 px-3 rounded-[20px] bg-[#E31B59]/95 shadow-sm">
              <Text className="text-[13px] font-medium text-white flex-1">출사 계획 스팟 추가 모드입니다</Text>
            </View>
          )}
        </View>
      </View>

      <WebView
        source={{ html: HTML }}
        onMessage={handleMessage}
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      {/* Spot Popup */}
      {activeSpot && (
        <View className="absolute bottom-[92px] left-4 right-4 bg-white rounded-[20px] overflow-hidden shadow-lg z-30">
          <View className="h-[110px] bg-gray-200">
            <Image source={{ uri: activeSpot.photo }} className="w-full h-full" resizeMode="cover" />
            <View className="absolute top-2 right-2 px-2.5 py-1 bg-black/45 rounded-full flex-row items-center">
              <IconStarFilled size={12} color="#FBBF24" />
              <Text className="text-white text-[12px] font-bold ml-1">{activeSpot.score}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setActiveSpot(null)}
              className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/35 items-center justify-center"
            >
              <IconX size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View className="p-4">
            <Text className="text-[18px] font-bold text-black mb-1">{activeSpot.name}</Text>
            <View className="flex-row items-center mb-3">
              <IconMapPin size={14} color="rgba(0,0,0,0.4)" />
              <Text className="text-[12px] text-black/50 ml-1">{activeSpot.loc}</Text>
            </View>
            
            <View className="flex-row flex-wrap gap-1.5 mb-4">
              {activeSpot.tags.map(tag => (
                <View key={tag} className="px-2.5 py-1 bg-[#f5f5f7] rounded-full">
                  <Text className="text-[12px] text-black/50">{tag}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity className="flex-1 h-11 rounded-full bg-[#f5f5f7] items-center justify-center">
                <Text className="text-[15px] font-medium text-black/60">상세 보기</Text>
              </TouchableOpacity>
              {mode === 'plan' && (
                <TouchableOpacity 
                  onPress={() => isSelected ? removeSpot(activeSpot.id) : addSpot(activeSpot)}
                  className={`flex-1 h-11 rounded-full items-center justify-center ${isSelected ? 'bg-black' : 'bg-[#E31B59]'}`}
                >
                  <Text className="text-[15px] font-medium text-white">{isSelected ? '추가됨' : '출사 계획에 추가'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Plan Mode 하단 CTA */}
      {mode === 'plan' && (
        <View className="absolute bottom-6 left-4 right-4 z-20 shadow-md">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="h-12 rounded-full bg-[#E31B59] items-center justify-center flex-row"
          >
            <Text className="text-[16px] font-medium text-white">
              {selectedSpots.length > 0 ? `${selectedSpots.length}개 스팟 선택 완료` : '선택 완료'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
