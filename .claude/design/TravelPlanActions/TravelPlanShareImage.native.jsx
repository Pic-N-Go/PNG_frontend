// TravelPlanShareImage.native.jsx
// 여행 계획 > 공유 > "이미지로 저장" 이 트리거하는 렌더링 컴포넌트
// - 실제 파일로 저장하는 방법: react-native-view-shot 의 captureRef(ref) → RN Camera Roll 또는 Share
// - 화면에 마운트되어 있지 않아도 됨 (off-screen 렌더 후 capture)
// - 크기: 1080 × 1920 (인스타 스토리)
//   → 개발 시 useWindowDimensions 로 실제 폰 폭에 맞춰 축소 렌더한 뒤,
//     captureRef 시 { width: 1080, height: 1920 } 옵션으로 고해상도 캡처
// - 폰트 토큰: 28(제목) / 15(요약값) / 13(스팟 이름) / 11(캡션·D1/D2 뱃지)

import React, { forwardRef } from 'react';
import { View, Text, Image } from 'react-native';
import { normalize } from '@/utils/normalize';

const C = {
  bg: '#ffffff',
  bgTintTop: '#fff0f4', // 브랜드 핑크 (#e31b59) 옅은 톤
  brand: '#e31b59',
  day1: '#f59e0b',
  day2: '#3b82f6',
  text1: '#000000',
  text2: 'rgba(0,0,0,0.55)',
  text3: 'rgba(0,0,0,0.4)',
  divider: 'rgba(0,0,0,0.08)',
  statBg: 'rgba(0,0,0,0.04)',
  mapBg: '#eef1f5',
};

const F = {
  '2xs': normalize(10),
  xs: normalize(11),
  sm: normalize(13),
  md: normalize(15),
  lg: normalize(17),
  xl: normalize(22),
  '2xl': normalize(28),
};

/**
 * @param {Object} plan
 *   { name, dateRange, spots: [{name, time, tag, thumb, day}], totalSpots, distanceKm, days, mapImage, qrImage, shareUrl }
 */
function DayBadge({ day }) {
  const bg = day === 2 ? C.day2 : C.day1;
  return (
    <View style={{ height: normalize(20), paddingHorizontal: normalize(7), borderRadius: normalize(6), backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: F['2xs'], fontWeight: '600', color: '#fff', letterSpacing: 0.2 }}>{`D${day ?? 1}`}</Text>
    </View>
  );
}

function StatCell({ value, label }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ fontSize: F.md, fontWeight: '600', color: C.text1 }}>{value}</Text>
      <Text style={{ fontSize: F.xs, color: C.text2, marginTop: normalize(2) }}>{label}</Text>
    </View>
  );
}

const TravelPlanShareImage = forwardRef(({ plan }, ref) => {
  const highlights = (plan?.spots ?? []).slice(0, 3);

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: normalize(390),
        height: normalize(693),
        borderRadius: normalize(20),
        overflow: 'hidden',
        padding: normalize(32),
        paddingHorizontal: normalize(28),
        backgroundColor: C.bgTintTop, // 상단만 옅은 핑크 (그라디언트 대신 단색)
      }}
    >
      {/* 상단 브랜드 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: normalize(28), height: normalize(28), borderRadius: normalize(8), backgroundColor: C.brand, marginRight: normalize(8) }} />
          <Text style={{ fontSize: F.sm, fontWeight: '600' }}>PNG</Text>
        </View>
        <Text style={{ fontSize: F.xs, color: C.text3, letterSpacing: 0.4 }}>MY TRAVEL PLAN</Text>
      </View>

      {/* 타이틀 */}
      <View style={{ marginTop: normalize(24) }}>
        <Text style={{ fontSize: F.xs, fontWeight: '600', color: C.day1, letterSpacing: 1 }}>
          {(plan?.days ?? 2) >= 2 ? 'DAY 1 · DAY 2' : 'DAY 1'}
        </Text>
        <Text style={{ fontSize: F['2xl'], fontWeight: '600', letterSpacing: -0.5, marginTop: normalize(4), lineHeight: normalize(32) }}>
          {plan?.name ?? '여행 계획'}
        </Text>
        <Text style={{ fontSize: F.sm, color: C.text2, marginTop: normalize(6) }}>{plan?.dateRange ?? ''}</Text>
      </View>

      {/* 지도 이미지 (서버 렌더 or 클라이언트 스냅샷) */}
      <View style={{ marginTop: normalize(16), height: normalize(180), borderRadius: normalize(16), backgroundColor: C.mapBg, overflow: 'hidden' }}>
        {plan?.mapImage ? (
          <Image source={{ uri: plan.mapImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : null}
      </View>

      {/* DAY 범례 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: normalize(14), gap: normalize(12) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: normalize(8), height: normalize(8), borderRadius: normalize(4), backgroundColor: C.day1, marginRight: normalize(6) }} />
          <Text style={{ fontSize: F.xs, fontWeight: '600', color: 'rgba(0,0,0,0.65)' }}>DAY 1</Text>
        </View>
        {(plan?.days ?? 2) >= 2 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: normalize(8), height: normalize(8), borderRadius: normalize(4), backgroundColor: C.day2, marginRight: normalize(6) }} />
            <Text style={{ fontSize: F.xs, fontWeight: '600', color: 'rgba(0,0,0,0.65)' }}>DAY 2</Text>
          </View>
        ) : null}
      </View>

      {/* HIGHLIGHTS 헤더 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: normalize(16), marginBottom: normalize(8) }}>
        <Text style={{ fontSize: F.xs, fontWeight: '600', color: C.text3, letterSpacing: 0.6 }}>HIGHLIGHTS</Text>
        <Text style={{ fontSize: F.xs, color: C.text3 }}>
          총 {plan?.totalSpots ?? 0}곳 중 대표 {highlights.length}곳
        </Text>
      </View>

      {/* 스팟 리스트 (D1/D2 뱃지 + 썸네일) */}
      <View style={{ flexDirection: 'column', gap: normalize(10) }}>
        {highlights.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
            <DayBadge day={s.day} />
            <View style={{ width: normalize(36), height: normalize(36), borderRadius: normalize(8), backgroundColor: '#334', overflow: 'hidden' }}>
              {s.thumb ? <Image source={{ uri: s.thumb }} style={{ width: '100%', height: '100%' }} /> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ fontSize: F.sm, fontWeight: '600' }}>{s.name}</Text>
              <Text numberOfLines={1} style={{ fontSize: F.xs, color: C.text2 }}>
                {s.time}{s.tag ? ` · ${s.tag}` : ''}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* 요약 스탯 */}
      <View style={{ marginTop: normalize(28), flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(14), paddingHorizontal: normalize(16), backgroundColor: C.statBg, borderRadius: normalize(14) }}>
        <StatCell value={`${plan?.totalSpots ?? 0}곳`} label="포토스팟" />
        <View style={{ width: 1, height: normalize(24), backgroundColor: C.divider }} />
        <StatCell value={`${plan?.distanceKm ?? 0}km`} label="이동" />
        <View style={{ width: 1, height: normalize(24), backgroundColor: C.divider }} />
        <StatCell value={`${plan?.days ?? 0}일`} label="일정" />
      </View>

      {/* QR + 링크 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: normalize(14) }}>
        <View style={{ width: normalize(52), height: normalize(52), borderRadius: normalize(8), backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', padding: normalize(4), marginRight: normalize(10) }}>
          {plan?.qrImage ? <Image source={{ uri: plan.qrImage }} style={{ width: '100%', height: '100%' }} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: F.xs, color: C.text3 }}>QR로 이 계획 열기</Text>
          <Text numberOfLines={1} style={{ fontSize: F.sm, fontWeight: '600', color: C.text1, marginTop: normalize(2) }}>
            {(plan?.shareUrl ?? '').replace(/^https?:\/\//, '')}
          </Text>
        </View>
      </View>
    </View>
  );
});

export default TravelPlanShareImage;

// ─────────────────────────────────────────────────────────────
// 사용 예: 이미지로 저장 트리거
// ─────────────────────────────────────────────────────────────
// import { useRef } from 'react';
// import { captureRef } from 'react-native-view-shot';
// import CameraRoll from '@react-native-community/cameraroll';
//
// const shareImgRef = useRef(null);
// const onSaveImage = async () => {
//   const uri = await captureRef(shareImgRef, {
//     format: 'png',
//     quality: 1,
//     width: 1080,
//     height: 1920,
//     result: 'tmpfile',
//   });
//   await CameraRoll.save(uri, { type: 'photo' });
// };
