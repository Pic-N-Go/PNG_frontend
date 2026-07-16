import React from 'react';
import { View, Text, ScrollView, Pressable, Share, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft, IconUpload, IconExternalLink } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG, CONTENT_PADDING } from '@/constants/layout';

type Props = NativeStackScreenProps<MyPageStackParamList, 'TermsOfService'>;

const TEXT2 = 'rgba(0,0,0,0.55)';
const BODY = 'rgba(0,0,0,0.7)';
const DIVIDER = 'rgba(0,0,0,0.05)';

const META = {
  lastRevision: '2026.04.15',
  version: 'v2.1',
  pdfUrl: 'https://dadaikshot.example/legal/tos-v2.1.pdf',
  totalArticles: 24,
};

const ARTICLES = [
  { title: '제1조 (목적)', body: '본 약관은 多多益Shot(이하 "회사")이 제공하는 촬영 스팟 공유 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.' },
  { title: '제2조 (정의)', body: '1. "서비스"란 회사가 제공하는 사진 촬영 장소 정보, 위시리스트, 커뮤니티 기능 등을 의미합니다.\n2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.\n3. "게시물"이란 이용자가 서비스에 게시한 사진, 텍스트, 위치 정보 등 일체의 정보를 의미합니다.' },
  { title: '제3조 (약관의 효력 및 변경)', body: '회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 시행일 7일 전부터 공지합니다.' },
  { title: '제4조 (회원가입 및 계정)', body: '이용자는 회사가 정한 절차에 따라 회원가입을 신청하며, 회사는 신청 내용을 확인한 후 회원가입을 승낙합니다. 회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.' },
  { title: '제5조 (서비스 이용)', body: '서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검·교체·고장, 통신 장애 등 부득이한 사유가 발생한 경우 서비스 제공이 일시 중단될 수 있습니다.' },
];

export default function TermsOfServiceScreen({ navigation }: Props) {
  const onShare = React.useCallback(async () => {
    try {
      // TODO: 실서비스 시 pdfUrl을 서버 값으로 교체
      await Share.share({ title: '多多益Shot 이용약관', message: `多多益Shot 이용약관 (${META.version}) — ${META.pdfUrl}`, url: META.pdfUrl });
    } catch { /* 사용자가 공유 취소 */ }
  }, []);

  const onOpenPdf = React.useCallback(() => {
    Linking.openURL(META.pdfUrl).catch(() => {});
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View className="flex-row items-center border-b border-black/5" style={{ height: normalize(52), paddingHorizontal: normalize(12) }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <IconChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG, marginRight: normalize(40) }}>이용약관</Text>
      </View>

      {/* Meta */}
      <View className="flex-row items-center justify-between border-b border-black/5" style={{ paddingHorizontal: normalize(24), paddingVertical: normalize(14), backgroundColor: '#faf9fb' }}>
        <View>
          <Text style={{ fontSize: FONT_XS, color: TEXT2 }}>최종 개정일</Text>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_SM, marginTop: normalize(2) }}>{META.lastRevision}</Text>
        </View>
        <View className="items-end">
          <Text style={{ fontSize: FONT_XS, color: TEXT2 }}>버전</Text>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_SM, marginTop: normalize(2) }}>{META.version}</Text>
        </View>
      </View>

      {/* Body */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: normalize(24), paddingVertical: normalize(20) }} showsVerticalScrollIndicator={false}>
        {ARTICLES.map((a) => (
          <View key={a.title} style={{ marginBottom: normalize(16) }}>
            <Text className="font-semibold text-black" style={{ fontSize: FONT_MD, marginBottom: normalize(6) }}>{a.title}</Text>
            <Text style={{ fontSize: FONT_SM, color: BODY, lineHeight: normalize(22) }}>{a.body}</Text>
          </View>
        ))}
        <Text className="text-center" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', paddingTop: normalize(12) }}>
          — 이하 생략 · 총 {META.totalArticles}조 —
        </Text>
      </ScrollView>

      {/* Footer */}
      <View className="flex-row border-t border-black/5" style={{ gap: normalize(8), paddingHorizontal: normalize(20), paddingTop: normalize(12), paddingBottom: normalize(12), borderTopColor: DIVIDER }}>
        <Pressable onPress={onShare} className="flex-1 flex-row items-center justify-center border border-black/10 bg-white" style={{ height: normalize(44), borderRadius: normalize(12) }}>
          <IconUpload size={normalize(14)} color="#000" strokeWidth={2} />
          <Text className="font-semibold text-black" style={{ fontSize: FONT_SM, marginLeft: normalize(6) }}>공유</Text>
        </Pressable>
        <Pressable onPress={onOpenPdf} className="flex-1 flex-row items-center justify-center bg-black" style={{ height: normalize(44), borderRadius: normalize(12) }}>
          <Text className="font-semibold text-white" style={{ fontSize: FONT_SM, marginRight: normalize(6) }}>원문(PDF) 열기</Text>
          <IconExternalLink size={normalize(14)} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
