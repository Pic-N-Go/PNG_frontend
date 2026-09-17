import React from 'react';
import { View, Text, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { Info, Share as ShareIcon } from 'lucide-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG } from '@/constants/layout';
import { BRAND, CARD, HAIRLINE, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<MyPageStackParamList, 'PrivacyPolicy'>;

const TEXT2 = 'rgba(0,0,0,0.55)';
const BODY = 'rgba(0,0,0,0.7)';

const META = { effectiveDate: '2026.05.01', version: 'v1.0', totalItems: 7 };

const SUMMARY = [
  '수집 항목: 이메일, 닉네임, 프로필, 위치(선택), 사진 EXIF',
  '보관 기간: 회원 탈퇴 후 30일 (복구 목적) 뒤 완전 파기 (법정 보관 제외)',
  '제3자 제공 없음 (인증·지도 등 필수 API 연동 제외)',
  '보호책임자: 다다익샷 (PNG 개발팀 / picngoservice@gmail.com)',
];

const SECTIONS = [
  {
    title: '1. 수집하는 개인정보 항목 및 수집방법',
    body: '회사는 회원가입, 서비스 제공, 고객 상담을 위해 최소한의 개인정보를 수집합니다.\n\n· 필수 항목: 이메일 주소, 닉네임, SNS 계정 식별자(간편 로그인 시)\n· 선택 항목: 프로필 사진, 위치 정보(GPS), 업로드 사진의 EXIF 메타데이터\n· 자동 수집 항목: 기기 식별자(FCM 토큰), OS 버전, 서비스 이용 기록, 접속 로그',
  },
  {
    title: '2. 개인정보의 수집 및 이용 목적',
    body: '수집한 개인정보는 다음 목적으로만 이용됩니다.\n\n· 회원 관리: 회원제 서비스 이용에 따른 본인확인, 가입 의사 확인, 고객 상담\n· 서비스 제공: 맞춤형 출사지 및 사진 촬영 명소 추천, 스마트 출사 플래너(골든아워/날씨 연동), 지도 기반 위치 서비스 제공, 사진 및 게시글 등록/공유\n· 알림 및 공지: 서비스 공지사항 및 이벤트 알림(푸시 알림)',
  },
  {
    title: '3. 개인정보의 보유 및 이용 기간',
    body: '회원 탈퇴 시 계정을 즉시 비활성화하고 닉네임·프로필 사진을 \'탈퇴한 사용자\'로 대체하여 다른 이용자에게 노출되지 않도록 합니다. 계정 복구를 위해 탈퇴일로부터 30일간 보관한 뒤 개인정보를 완전히 파기합니다. 30일 이내에는 동일한 계정으로 로그인하여 복구할 수 있습니다.\n\n단, 관계 법령(통신비밀보호법에 따른 로그인 기록 3개월, 전자상거래법상 소비자 분쟁 기록 3년 등)에 따라 보관이 필요한 정보는 해당 기간 동안 보관합니다.',
  },
  {
    title: '4. 개인정보의 제3자 제공 및 위탁',
    body: '회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 원활한 서비스 제공을 위해 아래와 같은 필수 외부 인프라를 이용합니다.\n\n· 카카오: 간편 로그인 인증\n· 네이버 클라우드 플랫폼(NCP): 지도 및 위치 기반 서비스\n· Google Firebase: 푸시 알림(FCM) 발송 및 기기 식별',
  },
  {
    title: '5. 이용자의 권리와 행사 방법',
    body: '이용자는 언제든지 앱 내 \'마이페이지\' 또는 고객센터를 통해 자신의 개인정보를 조회, 수정, 삭제(회원 탈퇴)를 요청할 수 있습니다. 또한 스마트폰 설정의 앱 권한 관리에서 위치 접근 권한을 언제든지 철회할 수 있습니다.',
  },
  {
    title: '6. 개인정보의 파기 절차 및 방법',
    body: '수집 및 이용 목적이 달성된 개인정보는 내부 방침 및 법령에 따라 일정 기간 저장된 후 파기됩니다. 전자적 파일 형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 안전하게 삭제합니다.',
  },
  {
    title: '7. 개인정보 보호책임자 및 문의처',
    body: '회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 이용자의 불만 처리 및 피해 구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.\n\n· 성명(담당자): 다다익샷\n· 소속: PNG 개발팀\n· 문의 이메일: picngoservice@gmail.com',
  },
];

export default function PrivacyPolicyScreen({ navigation }: Props) {
  const onShare = React.useCallback(async () => {
    try {
      await Share.share({ title: 'PNG 개인정보처리방침', message: `PNG 개인정보처리방침 (${META.version})` });
    } catch { /* 취소 */ }
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View className="flex-row items-center border-b-[0.5px] border-hairline" style={{ height: normalize(52), paddingHorizontal: normalize(12) }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <IconChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG, marginRight: normalize(40) }}>개인정보처리방침</Text>
      </View>

      {/* Meta */}
      <View className="flex-row items-center justify-between border-b-[0.5px] border-hairline" style={{ paddingHorizontal: normalize(24), paddingVertical: normalize(14), backgroundColor: CARD }}>
        <View>
          <Text className="font-normal" style={{ fontSize: FONT_XS, color: TEXT2 }}>시행일</Text>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_SM, marginTop: normalize(2) }}>{META.effectiveDate}</Text>
        </View>
        <View className="items-end">
          <Text className="font-normal" style={{ fontSize: FONT_XS, color: TEXT2 }}>버전</Text>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_SM, marginTop: normalize(2) }}>{META.version}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: normalize(20) }} showsVerticalScrollIndicator={false}>
        {/* 핵심 요약 카드 */}
        <View style={{ paddingHorizontal: normalize(24), paddingTop: normalize(16), paddingBottom: normalize(12) }}>
          <View className="bg-card" style={{ borderRadius: normalize(14), padding: normalize(16) }}>
            <View className="flex-row items-center" style={{ gap: normalize(6), marginBottom: normalize(8) }}>
              <Info size={normalize(14)} color={BRAND} strokeWidth={2} />
              <Text className="font-semibold text-black" style={{ fontSize: FONT_SM }}>핵심 요약</Text>
            </View>
            {SUMMARY.map((s) => (
              <View key={s} className="flex-row" style={{ gap: normalize(6), marginTop: normalize(2) }}>
                <Text className="font-normal" style={{ fontSize: FONT_SM, color: BODY }}>·</Text>
                <Text className="flex-1 font-normal" style={{ fontSize: FONT_SM, color: BODY, lineHeight: normalize(21) }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 본문 */}
        <View style={{ paddingHorizontal: normalize(24) }}>
          {SECTIONS.map((sec) => (
            <View key={sec.title} style={{ marginBottom: normalize(16) }}>
              <Text className="font-semibold text-black" style={{ fontSize: FONT_MD, marginBottom: normalize(6) }}>{sec.title}</Text>
              <Text className="font-normal" style={{ fontSize: FONT_SM, color: BODY, lineHeight: normalize(22) }}>{sec.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="border-t-[0.5px] border-hairline" style={{ paddingHorizontal: normalize(20), paddingTop: normalize(12), paddingBottom: normalize(12), borderTopColor: HAIRLINE }}>
        <Pressable onPress={onShare} className="w-full flex-row items-center justify-center border-[1.5px] border-black/10 bg-white" style={{ height: normalize(44), borderRadius: normalize(12) }}>
          <ShareIcon size={normalize(14)} color="#000" strokeWidth={2} />
          <Text className="font-semibold text-black" style={{ fontSize: FONT_SM, marginLeft: normalize(6) }}>방침 공유</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
