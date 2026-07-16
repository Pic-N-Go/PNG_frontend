// MyPageSettings.native.jsx
// 마이페이지 > 설정 (FAQ 진입 지점 수정본)
// - 변경: "FAQ 전체 보기"를 리스트 마지막 항목이 아니라 섹션 헤더 우측 텍스트 링크로 이동
// - 카드 안 아이템은 모두 "질문 → 답변 상세" 로 동작 통일 (예측 가능성 ↑)
// - 스타일: 기존 마이페이지 규칙 (배경 #fff, 카드 #f5f5f7, 포인트 #e31b59)
// - 인라인 style + @tabler/icons-react-native + normalize 사용

import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  IconChevronRight,
  IconCurrentLocation,
  IconBan,
  IconMessageCircle2,
  IconInfoCircle,
  IconLogout,
  IconTrash,
} from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';

// ─────────────────────────────────────────────────────────────
// tokens (마이페이지 공용 팔레트)
// ─────────────────────────────────────────────────────────────
const C = {
  bg: '#ffffff',
  card: '#f5f5f7',
  brand: '#e31b59',
  brandBg: '#fce9ee',
  text1: '#000000',
  text2: 'rgba(0,0,0,0.5)',
  text3: 'rgba(0,0,0,0.35)',
  divider: 'rgba(0,0,0,0.05)',
  iconBg: 'rgba(0,0,0,0.06)',
  locBg: '#e6f7ee',
  locFg: '#22a05a',
};

// FAQ 미리보기용 상위 3개 질문 (섹션 헤더 우측 "전체 보기"로 전체 목록 진입)
const FAQ_PREVIEW = [
  { id: 'photogenic', title: '포토제닉 점수는 어떻게 계산되나요?' },
  { id: 'wishlist', title: '위시리스트 알림이 오지 않아요.' },
  { id: 'report', title: '게시물이나 댓글을 신고하려면?' },
];

// ─────────────────────────────────────────────────────────────
// building blocks
// ─────────────────────────────────────────────────────────────
function SectionHeader({ label, actionLabel, onActionPress }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: normalize(8),
        marginBottom: normalize(8),
      }}
    >
      <Text
        style={{
          fontSize: normalize(13),
          fontWeight: '500',
          color: C.text2,
        }}
      >
        {label}
      </Text>

      {actionLabel ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: normalize(2),
            paddingLeft: normalize(8),
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Text
            style={{
              fontSize: normalize(13),
              fontWeight: '500',
              color: 'rgba(0,0,0,0.55)',
              marginRight: normalize(2),
            }}
          >
            {actionLabel}
          </Text>
          <IconChevronRight size={normalize(14)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: normalize(16),
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

function Row({ children, onPress, showDivider }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: normalize(14),
          paddingHorizontal: normalize(16),
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: C.divider,
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}

function IconBubble({ children, bg }) {
  return (
    <View
      style={{
        width: normalize(36),
        height: normalize(36),
        borderRadius: normalize(10),
        backgroundColor: bg ?? C.iconBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: normalize(14),
      }}
    >
      {children}
    </View>
  );
}

function Chevron() {
  return <IconChevronRight size={normalize(16)} color={C.text3} strokeWidth={2.2} />;
}

function Badge({ count }) {
  if (!count) return null;
  return (
    <View
      style={{
        minWidth: normalize(22),
        height: normalize(22),
        paddingHorizontal: normalize(7),
        borderRadius: normalize(999),
        backgroundColor: C.brand,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: normalize(8),
      }}
    >
      <Text style={{ color: '#fff', fontSize: normalize(12), fontWeight: '600' }}>{count}</Text>
    </View>
  );
}

// FAQ 프리뷰 한 줄
function FaqPreviewRow({ item, showDivider, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: normalize(16),
          paddingHorizontal: normalize(18),
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: C.divider,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: normalize(15),
            fontWeight: '600',
            color: C.text1,
            marginRight: normalize(12),
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Chevron />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// screen
// ─────────────────────────────────────────────────────────────
export default function MyPageSettings() {
  const navigation = useNavigation();

  const go = (route, params) => () => navigation?.navigate?.(route, params);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* header */}
      <View
        style={{
          height: normalize(52),
          justifyContent: 'center',
          paddingHorizontal: normalize(20),
        }}
      >
        <Text style={{ fontSize: normalize(22), fontWeight: '700', color: C.text1 }}>설정</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: normalize(20),
          paddingBottom: normalize(40),
          paddingTop: normalize(6),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 개인정보 및 보안 */}
        <View style={{ marginBottom: normalize(22) }}>
          <SectionHeader label="개인정보 및 보안" />
          <Card>
            <Row onPress={go('LocationPermission')} showDivider>
              <IconBubble bg={C.locBg}>
                <IconCurrentLocation size={normalize(20)} color={C.locFg} strokeWidth={2} />
              </IconBubble>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: normalize(15), fontWeight: '600', color: C.text1 }}>
                  위치 권한
                </Text>
                <Text
                  style={{ fontSize: normalize(12), color: C.text2, marginTop: normalize(2) }}
                >
                  앱 사용 중 허용
                </Text>
              </View>
              <Text style={{ fontSize: normalize(13), color: C.text2, marginRight: normalize(8) }}>
                허용됨
              </Text>
              <Chevron />
            </Row>

            <Row onPress={go('BlockList')}>
              <IconBubble>
                <IconBan size={normalize(20)} color="rgba(0,0,0,0.6)" strokeWidth={2} />
              </IconBubble>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: normalize(15), fontWeight: '600', color: C.text1 }}>
                  차단 목록
                </Text>
                <Text
                  style={{ fontSize: normalize(12), color: C.text2, marginTop: normalize(2) }}
                >
                  차단한 사용자 관리
                </Text>
              </View>
              <Chevron />
            </Row>
          </Card>
        </View>

        {/* 자주 묻는 질문
            ⚠️ 변경 포인트:
            - "FAQ 전체 보기" 항목을 카드 리스트에서 제거
            - 섹션 헤더 우측에 "전체 보기 >" 텍스트 링크로 이동
            - 카드 안 3개는 모두 질문 상세로 이동 (동작 통일) */}
        <View style={{ marginBottom: normalize(22) }}>
          <SectionHeader
            label="자주 묻는 질문"
            actionLabel="전체 보기"
            onActionPress={go('FAQ')}
          />
          <Card>
            {FAQ_PREVIEW.map((item, idx) => (
              <FaqPreviewRow
                key={item.id}
                item={item}
                showDivider={idx < FAQ_PREVIEW.length - 1}
                onPress={go('FAQDetail', { id: item.id })}
              />
            ))}
          </Card>
        </View>

        {/* 문의 */}
        <View style={{ marginBottom: normalize(22) }}>
          <SectionHeader label="문의" />
          <Card>
            <Row onPress={go('Inquiry')}>
              <IconBubble>
                <IconMessageCircle2 size={normalize(20)} color="rgba(0,0,0,0.6)" strokeWidth={2} />
              </IconBubble>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: normalize(15), fontWeight: '600', color: C.text1 }}>
                  1:1 문의
                </Text>
                <Text
                  style={{ fontSize: normalize(12), color: C.text2, marginTop: normalize(2) }}
                >
                  평균 응답 시간 24시간 이내
                </Text>
              </View>
              <Badge count={1} />
              <Chevron />
            </Row>
          </Card>
        </View>

        {/* 기타 */}
        <View style={{ marginBottom: normalize(22) }}>
          <SectionHeader label="기타" />
          <Card>
            <Row onPress={go('VersionInfo')} showDivider>
              <IconBubble>
                <IconInfoCircle size={normalize(20)} color="rgba(0,0,0,0.6)" strokeWidth={2} />
              </IconBubble>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: normalize(15), fontWeight: '600', color: C.text1 }}>
                  버전 정보
                </Text>
                <Text
                  style={{ fontSize: normalize(12), color: C.text2, marginTop: normalize(2) }}
                >
                  v1.0.0 (최신)
                </Text>
              </View>
              <Chevron />
            </Row>

            <Row onPress={go('Logout')} showDivider>
              <IconBubble>
                <IconLogout size={normalize(20)} color="rgba(0,0,0,0.6)" strokeWidth={2} />
              </IconBubble>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: normalize(15), fontWeight: '600', color: C.text1 }}>
                  로그아웃
                </Text>
              </View>
              <Chevron />
            </Row>

            <Row onPress={go('Withdraw')}>
              <IconBubble bg={C.brandBg}>
                <IconTrash size={normalize(20)} color={C.brand} strokeWidth={2} />
              </IconBubble>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: normalize(15), fontWeight: '600', color: C.brand }}>
                  회원 탈퇴
                </Text>
              </View>
              <Chevron />
            </Row>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
