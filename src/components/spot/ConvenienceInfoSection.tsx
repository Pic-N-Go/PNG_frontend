import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import {
  Accessibility,
  Baby,
  CalendarOff,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Dog,
  Info,
  Phone,
  SquareParking,
  TrainFront,
} from 'lucide-react-native';
import { FONT_SM, FONT_TITLE, GRID_PADDING, HAIRLINE_WIDTH } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { ConvenienceInfo, FacilityChipData, FacilityKey, FacilityStatus } from '@/types/spot';
import type { FestivalProgressStatus } from '@/types/festival';
import { BRAND, BRAND_TINT, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

const ACCENT = BRAND; // 앱 브랜드 핑크 (디자인 핸드오프의 #F5335F 대신 프로젝트 토큰 사용)

// 목업 spot-detail.html의 .convenience 블록 기준. 웜그레이 자체 팔레트에서 앱 토큰으로 편입.
const C = {
  text: '#000',
  textRow: '#000',
  label: TEXT_SUB,
  labelMuted: TEXT_SUB,
  muted: TEXT_SUB,
  green: '#34C759',
  divider: HAIRLINE,
};

type IconCmp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const FACILITY_ICON: Record<FacilityKey, IconCmp> = {
  parking: SquareParking,
  wheel: Accessibility,
  stroller: Baby,
  pet: Dog,
  subway: TrainFront,
  holiday: CalendarOff,
};

const STATUS_ICON_BG: Record<FacilityStatus, string> = { good: 'rgba(52,199,89,0.1)', neutral: CARD, missing: CARD, accent: BRAND_TINT };
const STATUS_ICON_COLOR: Record<FacilityStatus, string> = { good: C.green, neutral: TEXT_SUB, missing: C.muted, accent: ACCENT };
const STATUS_VALUE_COLOR: Record<FacilityStatus, string> = { good: C.green, neutral: C.text, missing: C.muted, accent: C.text };

function FacilityChip({ chip }: { chip: FacilityChipData }) {
  const { key, label, value, status } = chip;
  const Icon = FACILITY_ICON[key];
  const present = status !== 'missing';
  return (
    <View
      style={{
        width: '48%',
        flexGrow: 1,
        borderRadius: normalize(14),
        padding: normalize(13),
        gap: normalize(11),
        backgroundColor: CARD,
      }}
    >
      <View style={{ width: normalize(34), height: normalize(34), borderRadius: normalize(9), backgroundColor: STATUS_ICON_BG[status], alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={normalize(19)} color={STATUS_ICON_COLOR[status]} />
      </View>
      <View>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: present ? C.label : C.labelMuted, marginBottom: normalize(3) }}>
          {label}
        </Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(present ? 16 : 14), color: STATUS_VALUE_COLOR[status] }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

interface Props {
  info: ConvenienceInfo;
  eventPeriod?: {
    startDate?: string;
    endDate?: string;
    status?: FestivalProgressStatus;
  };
}

export default function ConvenienceInfoSection({ info, eventPeriod }: Props) {
  const [hoursOpen, setHoursOpen] = useState(false);

  const isOngoing = eventPeriod?.status === 'ONGOING';
  const isUpcoming = eventPeriod?.status === 'UPCOMING';
  const statusLabel = isOngoing ? '진행중' : isUpcoming ? '개최예정' : '종료';
  const statusColor = isOngoing ? '#34c759' : isUpcoming ? '#007aff' : 'rgba(0,0,0,0.4)';
  const statusBg = isOngoing ? 'rgba(52, 199, 89, 0.1)' : isUpcoming ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0,0,0,0.05)';
  const hasEventPeriod = !!(eventPeriod?.startDate && eventPeriod?.endDate);

  const groups = info.schedule ?? [];
  const visibleGroups = hoursOpen ? groups : groups.slice(0, 1);
  const scheduleCollapsible = groups.length > 1;
  const textCollapsible = !info.schedule && (info.scheduleText?.split('\n').length ?? 0) > 3;
  // 문의 텍스트에서 첫 전화번호 토큰만 추출 (예: "강남메디컬투어센터 1661-2230" → 16612230). 없으면 발신 불가.
  const telHref = info.phone?.replace(/\s+/g, '').match(/[\d-]{7,}/)?.[0]?.replace(/[^0-9]/g, '') || undefined;

  return (
    <View style={{ paddingHorizontal: GRID_PADDING }}>
      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, color: C.text, letterSpacing: -0.4, marginBottom: normalize(16) }}>
        편의 정보
      </Text>

      {/* 편의 항목 그리드 (2열) */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(10) }}>
        {info.facilities.map((f) => (
          <FacilityChip key={f.key} chip={f} />
        ))}
      </View>

      {/* 이용시간 */}
      <View style={{ marginTop: normalize(12), backgroundColor: CARD, borderRadius: normalize(16), paddingHorizontal: normalize(16), paddingTop: normalize(18), paddingBottom: normalize(8) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), marginBottom: normalize(14) }}>
          <View style={{ width: normalize(26), height: normalize(26), borderRadius: normalize(7), backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={normalize(15)} color={TEXT_SUB} />
          </View>
          <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: C.text }}>
            {hasEventPeriod ? '행사 기간 및 이용시간' : '이용시간'}
          </Text>
        </View>

        {hasEventPeriod && (
          <View style={{ marginBottom: normalize(14), paddingBottom: normalize(12), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: C.divider }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: normalize(4) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: C.label }}>
                행사 기간
              </Text>
              <View style={{ backgroundColor: statusBg, paddingHorizontal: normalize(6), paddingVertical: normalize(2), borderRadius: normalize(4) }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(11), color: statusColor }}>
                  {statusLabel}
                </Text>
              </View>
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: C.text, fontVariant: ['tabular-nums'] }}>
              {eventPeriod.startDate} ~ {eventPeriod.endDate}
            </Text>
          </View>
        )}

        {info.schedule ? (
          <>
            {visibleGroups.map((group, gi) => (
              <View key={`${gi}-${group.title}`} style={{ marginBottom: normalize(14) }}>
                {group.title ? (
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(11.5), letterSpacing: 0.3, color: C.labelMuted, marginBottom: normalize(7) }}>
                    {group.title}
                  </Text>
                ) : null}
                {group.rows.map((r, i) => {
                  if ('note' in r) {
                    return (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), backgroundColor: BRAND_TINT, borderRadius: normalize(8), paddingVertical: normalize(8), paddingHorizontal: normalize(10), marginVertical: normalize(4) }}>
                        <Info size={normalize(14)} color={ACCENT} />
                        <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, lineHeight: normalizeFontSize(12.5) * 1.45, color: ACCENT }}>
                          {r.note}
                        </Text>
                      </View>
                    );
                  }
                  const next = group.rows[i + 1];
                  const noBorder = i === group.rows.length - 1 || (next != null && 'note' in next);
                  if ('value' in r) {
                    return (
                      <View key={i} style={{ paddingVertical: normalize(6), borderBottomWidth: noBorder ? 0 : HAIRLINE_WIDTH, borderBottomColor: C.divider }}>
                        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(15), color: C.textRow, lineHeight: normalizeFontSize(15) * 1.4 }}>
                          {r.value}
                        </Text>
                      </View>
                    );
                  }
                  return (
                    <View
                      key={i}
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: normalize(6), borderBottomWidth: noBorder ? 0 : HAIRLINE_WIDTH, borderBottomColor: C.divider }}
                    >
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(15), color: C.textRow }}>
                        {r.name}
                      </Text>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: C.text, fontVariant: ['tabular-nums'] }}>
                        {r.time}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        ) : (
          <Text
            allowFontScaling={false}
            numberOfLines={textCollapsible && !hoursOpen ? 3 : undefined}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(14) * 1.5, color: info.scheduleText ? C.textRow : C.muted, marginBottom: normalize(10) }}
          >
            {info.scheduleText ?? '미제공'}
          </Text>
        )}

        {(scheduleCollapsible || textCollapsible) && (
          <Pressable
            onPress={() => setHoursOpen((o) => !o)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: normalize(4), paddingVertical: normalize(12), borderTopWidth: HAIRLINE_WIDTH, borderTopColor: 'rgba(0,0,0,0.05)', marginTop: normalize(4) }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: ACCENT }}>
              {hoursOpen ? '접기' : '펼치기'}
            </Text>
            {hoursOpen ? <ChevronUp size={normalize(16)} color={ACCENT} /> : <ChevronDown size={normalize(16)} color={ACCENT} />}
          </Pressable>
        )}
      </View>

      {/* 문의 */}
      {info.phone ? (
        <Pressable
          onPress={() => {
            if (telHref) Linking.openURL(`tel:${telHref}`).catch(() => {});
          }}
          disabled={!telHref}
          android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: normalize(12),
            marginTop: normalize(12),
            backgroundColor: CARD,
            borderRadius: normalize(16),
            padding: normalize(15),
          }}
        >
          <View style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(11), backgroundColor: BRAND_TINT, alignItems: 'center', justifyContent: 'center' }}>
            <Phone size={normalize(19)} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: FONT_SM, color: C.label, marginBottom: normalize(3) }}>
              문의
            </Text>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15.5), color: C.text, letterSpacing: 0.1 }}>
              {info.phone}
            </Text>
          </View>
          {telHref ? <ChevronRight size={normalize(20)} color="rgba(0,0,0,0.2)" /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}
