import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NaverMapView, NaverMapMarkerOverlay } from '@mj-studio/react-native-naver-map';
import { IconMapPin } from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import { CARD_RADIUS, FONT_2XS, FONT_SM, FONT_TITLE, GRID_PADDING } from '@/constants/layout';

import { useNavigation } from '@react-navigation/native';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';
import { useBookmarkedSpots, useReviewedSpots } from '@/hooks/useSpot';
import { mergeMapSpots } from '@/utils/spotMappers';
import Skeleton from '@/components/common/Skeleton';
import { isLocationInKorea } from '@/utils/location';

import { PIN_SPOT_IMAGE, PIN_SPOT_DARK_IMAGE } from '@/constants/pins';

export default function PhotoMapPreview() {
  const navigation = useNavigation();
  const [isMapReady, setMapReady] = useState(false);

  const reviewed = useReviewedSpots();
  const bookmarked = useBookmarkedSpots();
  const spots = useMemo(
    () => mergeMapSpots(reviewed.data, bookmarked.data),
    [reviewed.data, bookmarked.data],
  );
  const isLoading = reviewed.isLoading || bookmarked.isLoading;
  const isError = reviewed.isError || bookmarked.isError;

  const validSpots = useMemo(
    () => spots.filter((s) => s.lat && s.lng && isLocationInKorea(s.lat, s.lng)),
    [spots],
  );

  return (
    <View className="mb-10" style={{ paddingHorizontal: GRID_PADDING }}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-semibold tracking-tight text-black" style={{ fontSize: FONT_TITLE }}>
          PIC MAP
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('PhotoMap' as never)}>
          <Text className="tracking-tight font-normal" style={{ fontSize: FONT_SM, color: BRAND }}>
            전체보기
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('PhotoMap' as never)}
        style={{
          height: normalize(200),
          borderRadius: CARD_RADIUS,
          backgroundColor: CARD,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 네이티브 네이버 지도 */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <NaverMapView
            style={{ flex: 1 }}
            camera={{
              latitude: validSpots[0]?.lat || 36.5,
              longitude: validSpots[0]?.lng || 127.5,
              zoom: validSpots.length > 0 ? 10 : 6,
            }}
            onInitialized={() => setMapReady(true)}
            isScrollGesturesEnabled={false}
            isZoomGesturesEnabled={false}
            isTiltGesturesEnabled={false}
            isRotateGesturesEnabled={false}
            isStopGesturesEnabled={false}
            isShowCompass={false}
            isShowScaleBar={false}
            isShowZoomControls={false}
            isShowLocationButton={false}
            logoMargin={{ bottom: 4, left: 4 }}
          >
            {isMapReady && validSpots.map((s) => (
              <NaverMapMarkerOverlay
                key={String(s.id)}
                latitude={s.lat}
                longitude={s.lng}
                width={normalize(18)}
                height={normalize(18)}
                anchor={{ x: 0.5, y: 0.5 }}
                image={s.reviewed ? PIN_SPOT_IMAGE : PIN_SPOT_DARK_IMAGE}
              />
            ))}
          </NaverMapView>
        </View>

        {isLoading && (
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <Skeleton width="100%" height={normalize(200)} borderRadius={CARD_RADIUS} />
          </View>
        )}

        {!isLoading && spots.length === 0 && (
          <View
            pointerEvents="none"
            className="absolute left-0 right-0 top-0 bottom-0 items-center justify-center"
            style={{ paddingHorizontal: normalize(24) }}
          >
            <Text
              className="font-normal text-center"
              style={{ fontSize: FONT_SM, color: TEXT_SUB, lineHeight: normalize(20) }}
            >
              {isError
                ? '핀을 불러오지 못했어요'
                : '리뷰를 쓰거나 스팟을 즐겨찾기하면\n여기에 핀이 표시돼요'}
            </Text>
          </View>
        )}

        {/* 범례 */}
        <View
          style={{
            position: 'absolute',
            bottom: normalize(10),
            right: normalize(10),
            flexDirection: 'row',
            gap: normalize(12),
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.88)',
            borderRadius: normalize(8),
            paddingHorizontal: normalize(10),
            paddingVertical: normalize(6),
            zIndex: 3,
          }}
          pointerEvents="none"
        >
          <View className="flex-row items-center" style={{ gap: normalize(3) }}>
            <IconMapPin size={normalize(12)} color={BRAND} fill={BRAND} />
            <Text className="tracking-tight font-normal" style={{ fontSize: FONT_2XS, color: TEXT_SUB }}>
              리뷰
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: normalize(3) }}>
            <IconMapPin size={normalize(12)} color="#1c1c1e" fill="#1c1c1e" />
            <Text className="tracking-tight font-normal" style={{ fontSize: FONT_2XS, color: TEXT_SUB }}>
              즐겨찾기
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
