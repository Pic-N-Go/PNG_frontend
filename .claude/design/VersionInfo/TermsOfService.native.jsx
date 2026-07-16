// TermsOfService.native.jsx
// 마이페이지 > 설정 > 버전 정보 > 약관 및 정책 > 이용약관
// - 구조: 네비바 + 메타 스트립(개정일/버전) + 본문 스크롤 + 하단 액션(공유/원문열기)
// - 폰트 토큰: 17(nav) / 15(조 제목) / 13(본문·값·버튼) / 11(캡션)
// - 스타일: 인라인 style + @tabler/icons-react-native + normalize

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Share,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  IconChevronLeft,
  IconUpload,
  IconExternalLink,
} from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';

const C = {
  bg: '#ffffff',
  card: '#f5f5f7',
  metaBg: '#faf9fb',
  black: '#000000',
  text1: '#000000',
  text2: 'rgba(0,0,0,0.55)',
  text3: 'rgba(0,0,0,0.35)',
  bodyText: 'rgba(0,0,0,0.7)',
  divider: 'rgba(0,0,0,0.05)',
  outline: 'rgba(0,0,0,0.1)',
};

const F = {
  xs: normalize(11),
  sm: normalize(13),
  md: normalize(15),
  lg: normalize(17),
};

// 이용약관 컨텐츠 (임시)
const TOS_META = {
  lastRevision: '2026.04.15',
  version: 'v2.1',
  pdfUrl: 'https://dadaikshot.example/legal/tos-v2.1.pdf',
  totalArticles: 24,
};

const TOS_ARTICLES = [
  {
    title: '제1조 (목적)',
    body:
      '본 약관은 多多益Shot(이하 "회사")이 제공하는 촬영 스팟 공유 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.',
  },
  {
    title: '제2조 (정의)',
    body:
      '1. "서비스"란 회사가 제공하는 사진 촬영 장소 정보, 위시리스트, 커뮤니티 기능 등을 의미합니다.\n2. "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.\n3. "게시물"이란 이용자가 서비스에 게시한 사진, 텍스트, 위치 정보 등 일체의 정보를 의미합니다.',
  },
  {
    title: '제3조 (약관의 효력 및 변경)',
    body:
      '회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지사항을 통해 시행일 7일 전부터 공지합니다.',
  },
  {
    title: '제4조 (회원가입 및 계정)',
    body:
      '이용자는 회사가 정한 절차에 따라 회원가입을 신청하며, 회사는 신청 내용을 확인한 후 회원가입을 승낙합니다. 회원은 자신의 계정 정보를 안전하게 관리할 책임이 있습니다.',
  },
  {
    title: '제5조 (서비스 이용)',
    body:
      '서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검·교체·고장, 통신 장애 등 부득이한 사유가 발생한 경우 서비스 제공이 일시 중단될 수 있습니다.',
  },
];

// ─────────────────────────────────────────────────────────────
export default function TermsOfService() {
  const navigation = useNavigation();

  const onShare = useCallback(async () => {
    try {
      await Share.share({
        title: '多多益Shot 이용약관',
        message: `多多益Shot 이용약관 (${TOS_META.version}) — ${TOS_META.pdfUrl}`,
        url: TOS_META.pdfUrl,
      });
    } catch {}
  }, []);

  const onOpenPdf = useCallback(() => {
    Linking.openURL(TOS_META.pdfUrl).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* nav */}
      <View
        style={{
          height: normalize(52),
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: normalize(12),
          borderBottomWidth: 1,
          borderBottomColor: C.divider,
        }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={({ pressed }) => ({
            width: normalize(40),
            height: normalize(40),
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <IconChevronLeft size={normalize(22)} color={C.black} strokeWidth={2} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', marginRight: normalize(40) }}>
          <Text style={{ fontSize: F.lg, fontWeight: '600', color: C.text1 }}>이용약관</Text>
        </View>
      </View>

      {/* meta strip */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: normalize(24),
          paddingVertical: normalize(14),
          backgroundColor: C.metaBg,
          borderBottomWidth: 1,
          borderBottomColor: C.divider,
        }}
      >
        <View>
          <Text style={{ fontSize: F.xs, color: C.text2 }}>최종 개정일</Text>
          <Text style={{ marginTop: normalize(2), fontSize: F.sm, fontWeight: '600', color: C.text1 }}>
            {TOS_META.lastRevision}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: F.xs, color: C.text2 }}>버전</Text>
          <Text style={{ marginTop: normalize(2), fontSize: F.sm, fontWeight: '600', color: C.text1 }}>
            {TOS_META.version}
          </Text>
        </View>
      </View>

      {/* body */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: normalize(24), paddingVertical: normalize(20) }}
        showsVerticalScrollIndicator={false}
      >
        {TOS_ARTICLES.map((a) => (
          <View key={a.title} style={{ marginBottom: normalize(16) }}>
            <Text style={{ fontSize: F.md, fontWeight: '700', color: C.text1, marginBottom: normalize(6) }}>
              {a.title}
            </Text>
            <Text style={{ fontSize: F.sm, color: C.bodyText, lineHeight: normalize(22) }}>{a.body}</Text>
          </View>
        ))}

        <Text
          style={{
            fontSize: F.xs,
            color: 'rgba(0,0,0,0.4)',
            textAlign: 'center',
            paddingTop: normalize(12),
          }}
        >
          — 이하 생략 · 총 {TOS_META.totalArticles}조 —
        </Text>
      </ScrollView>

      {/* footer actions */}
      <View
        style={{
          flexDirection: 'row',
          gap: normalize(8),
          paddingHorizontal: normalize(20),
          paddingTop: normalize(12),
          paddingBottom: normalize(28),
          borderTopWidth: 1,
          borderTopColor: C.divider,
        }}
      >
        <Pressable
          onPress={onShare}
          style={({ pressed }) => ({
            flex: 1,
            height: normalize(44),
            borderWidth: 1,
            borderColor: C.outline,
            backgroundColor: C.bg,
            borderRadius: normalize(12),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <IconUpload size={normalize(14)} color={C.black} strokeWidth={2} />
          <Text style={{ marginLeft: normalize(6), fontSize: F.sm, fontWeight: '600', color: C.text1 }}>공유</Text>
        </Pressable>

        <Pressable
          onPress={onOpenPdf}
          style={({ pressed }) => ({
            flex: 1,
            height: normalize(44),
            backgroundColor: C.black,
            borderRadius: normalize(12),
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ marginRight: normalize(6), fontSize: F.sm, fontWeight: '600', color: '#fff' }}>
            원문(PDF) 열기
          </Text>
          <IconExternalLink size={normalize(14)} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
