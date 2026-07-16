// FAQ.native.jsx
// 마이페이지 > FAQ 전체 보기 > 더보기 (자주 묻는 질문 전체 목록)
// - 진입: MyPageStack / Settings > FAQ 카드의 "더보기" tap
// - 스타일: 기존 마이페이지 규칙 (배경 #fff, 카드 #f5f5f7, 포인트 #e31b59)
// - 인라인 style + @tabler/icons-react-native + normalize 사용

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  SafeAreaView,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  IconChevronLeft,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconHeadset,
} from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';

// ─────────────────────────────────────────────────────────────
// tokens (마이페이지 공용 팔레트)
// ─────────────────────────────────────────────────────────────
const C = {
  bg: '#ffffff',
  card: '#f5f5f7',
  brand: '#e31b59',
  text1: '#000000',
  text2: 'rgba(0,0,0,0.48)',
  text3: 'rgba(0,0,0,0.28)',
  divider: 'rgba(0,0,0,0.06)',
  chipBorder: 'rgba(0,0,0,0.08)',
};

const CATEGORIES = [
  { id: 'all',     label: '전체' },
  { id: 'spot',    label: '촬영 스팟' },
  { id: 'photo',   label: '사진·업로드' },
  { id: 'account', label: '계정·보안' },
  { id: 'guide',   label: '이용안내' },
  { id: 'etc',     label: '기타' },
];

const FAQ_LIST = [
  { id: 1, category: 'spot',
    q: '촬영 스팟은 어떤 기준으로 추천되나요?',
    a: '현재 위치·시간대·날씨·계절, 그리고 다른 유저의 촬영 이력을 종합해 추천해요. 인기 순, 거리 순, 최근 촬영 순으로 정렬을 바꿀 수도 있어요.' },
  { id: 2, category: 'spot',
    q: '일몰·일출 시간은 어떻게 계산되나요?',
    a: '스팟의 위·경도 좌표를 기준으로 매일 자동 계산돼요. 골든아워(일출 전·일몰 후 30분)와 블루아워도 함께 표시됩니다.' },
  { id: 3, category: 'spot',
    q: '비공개/폐쇄된 스팟은 어떻게 신고하나요?',
    a: '스팟 상세 화면 우측 상단 더보기(⋯) > [신고하기]에서 사유를 선택해 접수할 수 있어요. 검토 후 지도에서 숨김 처리됩니다.' },
  { id: 4, category: 'spot',
    q: '내가 찾은 새로운 스팟을 등록할 수 있나요?',
    a: '지도 화면의 [+] 버튼으로 좌표·대표 사진·간단한 촬영 팁을 함께 등록할 수 있어요. 승인 후 공개됩니다.' },
  { id: 5, category: 'photo',
    q: '사진 업로드 시 위치 정보는 공개되나요?',
    a: '기본적으로 사진의 EXIF 위치는 공개되지 않아요. 스팟에 연결해 올리는 경우에만 해당 스팟 좌표가 표시됩니다.' },
  { id: 6, category: 'photo',
    q: '저장한 장소는 어디서 다시 볼 수 있나요?',
    a: '마이페이지 > 저장한 스팟에서 확인할 수 있어요. 폴더로 묶어서 정리할 수도 있습니다.' },
  { id: 7, category: 'photo',
    q: '올린 사진은 언제든 삭제할 수 있나요?',
    a: '내가 올린 사진 화면에서 언제든 삭제 가능해요. 삭제 후 30일간 임시보관되고 그 이후 영구 삭제됩니다.' },
  { id: 8, category: 'account',
    q: '비밀번호를 잊어버렸어요. 어떻게 재설정하나요?',
    a: '로그인 화면 하단의 [비밀번호 찾기]를 눌러 가입 시 등록한 이메일로 인증코드를 받아 재설정할 수 있어요.' },
  { id: 9, category: 'account',
    q: '회원 탈퇴 후 데이터는 어떻게 되나요?',
    a: '탈퇴 시 계정 정보와 활동 이력은 30일 보관 후 영구 삭제됩니다. 관련 법령에 따라 일부 기록은 최대 5년간 보관될 수 있어요.' },
  { id: 10, category: 'guide',
    q: '알림 설정은 어디서 바꾸나요?',
    a: '마이페이지 > 설정 > 알림에서 날씨/골든아워/새 스팟 알림을 개별로 켜고 끌 수 있어요.' },
  { id: 11, category: 'guide',
    q: '앱 버전은 어디서 확인하나요?',
    a: '마이페이지 > 설정 > 앱 정보에서 확인할 수 있어요.' },
  { id: 12, category: 'etc',
    q: '해외에서도 사용할 수 있나요?',
    a: '해외에서도 지도와 스팟 정보가 그대로 노출돼요. 추천 스팟은 국내 위주로 채워져 있어 지역에 따라 결과 수가 다를 수 있어요.' },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─────────────────────────────────────────────────────────────
// FAQItem
// ─────────────────────────────────────────────────────────────
const FAQItem = React.memo(function FAQItem({ item, open, onToggle }) {
  return (
    <Pressable
      onPress={() => onToggle(item.id)}
      style={{
        backgroundColor: C.card,
        borderRadius: normalize(16),
        paddingVertical: normalize(16),
        paddingHorizontal: normalize(18),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: open ? 'flex-start' : 'center', gap: normalize(12) }}>
        <View style={{
          width: normalize(22), height: normalize(22), borderRadius: normalize(6),
          backgroundColor: open ? C.brand : 'rgba(0,0,0,0.06)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{
            color: open ? '#fff' : C.text2,
            fontSize: normalize(12), fontWeight: '700',
          }}>Q</Text>
        </View>

        <Text style={{
          flex: 1,
          fontSize: normalize(14),
          fontWeight: open ? '600' : '500',
          color: C.text1,
          lineHeight: normalize(20),
        }}>
          {item.q}
        </Text>

        {open
          ? <IconChevronUp size={normalize(18)} color={C.text2} strokeWidth={2} />
          : <IconChevronDown size={normalize(18)} color={C.text3} strokeWidth={2} />}
      </View>

      {open && (
        <View style={{
          marginTop: normalize(12),
          paddingTop: normalize(12),
          borderTopWidth: 1,
          borderTopColor: C.divider,
          flexDirection: 'row',
          gap: normalize(12),
        }}>
          <View style={{
            width: normalize(22), height: normalize(22), borderRadius: normalize(6),
            backgroundColor: '#fff',
            borderWidth: 1, borderColor: C.chipBorder,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: C.text2, fontSize: normalize(12), fontWeight: '700' }}>A</Text>
          </View>
          <Text style={{
            flex: 1,
            fontSize: normalize(13),
            color: 'rgba(0,0,0,0.68)',
            lineHeight: normalize(20),
          }}>
            {item.a}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────
export default function FAQScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [openSet, setOpenSet] = useState(() => new Set());

  const toggle = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSet(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_LIST.filter(f =>
      (category === 'all' || f.category === category) &&
      (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    );
  }, [query, category]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Nav header — 기존 마이페이지 헤더와 동일 */}
      <View style={{
        height: normalize(52),
        flexDirection: 'row', alignItems: 'center',
        paddingLeft: normalize(12), paddingRight: normalize(20),
      }}>
        <Pressable
          hitSlop={8}
          onPress={() => navigation.goBack()}
          style={{ width: normalize(40), height: normalize(40), alignItems: 'center', justifyContent: 'center' }}
        >
          <IconChevronLeft size={normalize(24)} color={C.text1} strokeWidth={2} />
        </Pressable>
        <Text style={{
          flex: 1, textAlign: 'center', marginRight: normalize(40),
          fontSize: normalize(17), fontWeight: '600', color: C.text1,
        }}>
          자주 묻는 질문
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ paddingHorizontal: normalize(28), paddingBottom: normalize(120) }}
        ListHeaderComponent={
          <View style={{ gap: normalize(14), paddingTop: normalize(8), paddingBottom: normalize(14) }}>
            {/* search */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: normalize(8),
              height: normalize(44), paddingHorizontal: normalize(14),
              backgroundColor: C.card, borderRadius: normalize(12),
            }}>
              <IconSearch size={normalize(18)} color={C.text2} strokeWidth={2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="궁금한 내용을 검색해 보세요"
                placeholderTextColor={C.text2}
                style={{
                  flex: 1, fontSize: normalize(14), color: C.text1,
                  padding: 0, includeFontPadding: false,
                }}
                returnKeyType="search"
              />
            </View>

            {/* category chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: normalize(8), paddingRight: normalize(28) }}
            >
              {CATEGORIES.map(c => {
                const active = c.id === category;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategory(c.id)}
                    style={{
                      height: normalize(34),
                      paddingHorizontal: normalize(14),
                      borderRadius: normalize(999),
                      backgroundColor: active ? C.brand : '#fff',
                      borderWidth: active ? 0 : 1,
                      borderColor: C.chipBorder,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: normalize(13),
                      fontWeight: active ? '600' : '500',
                      color: active ? '#fff' : C.text1,
                    }}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={{ fontSize: normalize(15), fontWeight: '600', color: C.text1 }}>
                {category === 'all' ? '전체 질문' : CATEGORIES.find(c => c.id === category)?.label}
              </Text>
              <Text style={{ fontSize: normalize(12), color: C.text2 }}>총 {filtered.length}개</Text>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: normalize(10) }} />}
        renderItem={({ item }) => (
          <FAQItem item={item} open={openSet.has(item.id)} onToggle={toggle} />
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: normalize(60), alignItems: 'center', gap: normalize(6) }}>
            <Text style={{ fontSize: normalize(15), fontWeight: '600', color: C.text1 }}>
              검색 결과가 없어요
            </Text>
            <Text style={{ fontSize: normalize(13), color: C.text2 }}>
              다른 키워드로 다시 검색해 보세요.
            </Text>
          </View>
        }
      />

      {/* Contact CTA */}
      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingHorizontal: normalize(28),
        paddingTop: normalize(12), paddingBottom: normalize(28),
        backgroundColor: C.bg,
      }}>
        <Pressable
          onPress={() => navigation.navigate('Inquiry')}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            gap: normalize(12),
            paddingVertical: normalize(14), paddingHorizontal: normalize(18),
            backgroundColor: C.card, borderRadius: normalize(16),
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10) }}>
            <IconHeadset size={normalize(20)} color={C.brand} strokeWidth={2} />
            <View>
              <Text style={{ fontSize: normalize(13), fontWeight: '600', color: C.text1 }}>
                원하는 답을 찾지 못했나요?
              </Text>
              <Text style={{ fontSize: normalize(12), color: C.text2, marginTop: normalize(2) }}>
                1:1 문의로 알려드릴게요
              </Text>
            </View>
          </View>
          <View style={{
            height: normalize(36), paddingHorizontal: normalize(16),
            borderRadius: normalize(999), backgroundColor: C.brand,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: normalize(13), fontWeight: '600' }}>문의하기</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
