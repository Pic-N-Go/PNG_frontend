import React from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft, IconUpload, IconHistory, IconInfoCircle } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG } from '@/constants/layout';

type Props = NativeStackScreenProps<MyPageStackParamList, 'PrivacyPolicy'>;

const BRAND = '#E31B59';
const TEXT2 = 'rgba(0,0,0,0.55)';
const BODY = 'rgba(0,0,0,0.7)';
const DIVIDER = 'rgba(0,0,0,0.05)';

const META = { effectiveDate: '2026.05.01', version: 'v1.3', totalItems: 12 };

const SUMMARY = [
  '수집 항목: 이메일, 프로필, 위치(선택), 사진 EXIF',
  '보관 기간: 회원 탈퇴 후 즉시 파기 (법정 보관 제외)',
  '제3자 제공 없음',
];

const SECTIONS = [
  { title: '1. 수집하는 개인정보 항목', body: '회사는 회원가입, 서비스 제공, 고객 상담을 위해 최소한의 개인정보를 수집합니다.\n필수: 이메일 주소, 닉네임\n선택: 프로필 사진, 위치 정보, 업로드 사진의 EXIF 메타데이터' },
  { title: '2. 개인정보의 이용 목적', body: '수집한 개인정보는 서비스 제공, 회원 관리, 부정 이용 방지, 신규 서비스 개발 및 통계 분석 목적으로 이용됩니다.' },
  { title: '3. 개인정보의 보유 및 이용 기간', body: '회원 탈퇴 요청 시 즉시 파기함을 원칙으로 합니다. 단, 관계 법령에 따라 일정 기간 보관이 필요한 정보(전자상거래법상 계약·결제 기록 5년 등)는 해당 기간 동안 보관합니다.' },
  { title: '4. 개인정보 보호책임자', body: '성명: 김담당\n이메일: privacy@dadaikshot.example' },
];

export default function PrivacyPolicyScreen({ navigation }: Props) {
  const onShare = React.useCallback(async () => {
    try {
      await Share.share({ title: '多多益Shot 개인정보처리방침', message: `多多益Shot 개인정보처리방침 (${META.version})` });
    } catch { /* 취소 */ }
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View className="flex-row items-center border-b border-black/5" style={{ height: normalize(52), paddingHorizontal: normalize(12) }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <IconChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG, marginRight: normalize(40) }}>개인정보처리방침</Text>
      </View>

      {/* Meta */}
      <View className="flex-row items-center justify-between border-b border-black/5" style={{ paddingHorizontal: normalize(24), paddingVertical: normalize(14), backgroundColor: '#faf9fb' }}>
        <View>
          <Text style={{ fontSize: FONT_XS, color: TEXT2 }}>시행일</Text>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_SM, marginTop: normalize(2) }}>{META.effectiveDate}</Text>
        </View>
        <View className="items-end">
          <Text style={{ fontSize: FONT_XS, color: TEXT2 }}>버전</Text>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_SM, marginTop: normalize(2) }}>{META.version}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: normalize(20) }} showsVerticalScrollIndicator={false}>
        {/* 핵심 요약 카드 */}
        <View style={{ paddingHorizontal: normalize(24), paddingTop: normalize(16), paddingBottom: normalize(12) }}>
          <View className="bg-[#f5f5f7]" style={{ borderRadius: normalize(14), padding: normalize(16) }}>
            <View className="flex-row items-center" style={{ gap: normalize(6), marginBottom: normalize(8) }}>
              <IconInfoCircle size={normalize(14)} color={BRAND} strokeWidth={2} />
              <Text className="font-semibold text-black" style={{ fontSize: FONT_SM }}>핵심 요약</Text>
            </View>
            {SUMMARY.map((s) => (
              <View key={s} className="flex-row" style={{ gap: normalize(6), marginTop: normalize(2) }}>
                <Text style={{ fontSize: FONT_SM, color: BODY }}>·</Text>
                <Text className="flex-1" style={{ fontSize: FONT_SM, color: BODY, lineHeight: normalize(21) }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 본문 */}
        <View style={{ paddingHorizontal: normalize(24) }}>
          {SECTIONS.map((sec) => (
            <View key={sec.title} style={{ marginBottom: normalize(16) }}>
              <Text className="font-semibold text-black" style={{ fontSize: FONT_MD, marginBottom: normalize(6) }}>{sec.title}</Text>
              <Text style={{ fontSize: FONT_SM, color: BODY, lineHeight: normalize(22) }}>{sec.body}</Text>
            </View>
          ))}
          <Text className="text-center" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', paddingTop: normalize(12) }}>
            — 이하 생략 · 총 {META.totalItems}개 항목 —
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="flex-row border-t border-black/5" style={{ gap: normalize(8), paddingHorizontal: normalize(20), paddingTop: normalize(12), paddingBottom: normalize(12), borderTopColor: DIVIDER }}>
        <Pressable onPress={onShare} className="flex-1 flex-row items-center justify-center border border-black/10 bg-white" style={{ height: normalize(44), borderRadius: normalize(12) }}>
          <IconUpload size={normalize(14)} color="#000" strokeWidth={2} />
          <Text className="font-semibold text-black" style={{ fontSize: FONT_SM, marginLeft: normalize(6) }}>공유</Text>
        </Pressable>
        <Pressable className="flex-1 flex-row items-center justify-center bg-black" style={{ height: normalize(44), borderRadius: normalize(12) }}>
          <Text className="font-semibold text-white" style={{ fontSize: FONT_SM, marginRight: normalize(6) }}>이전 버전 보기</Text>
          <IconHistory size={normalize(14)} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
