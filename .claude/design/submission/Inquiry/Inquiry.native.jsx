// Inquiry.native.jsx
// 1:1 문의 스택 — FAQ의 [문의하기] CTA에서 진입
// 3개 스크린 export: InquiryComposeScreen / InquiryListScreen / InquiryDetailScreen
// 스타일: 인라인 style + @tabler/icons-react-native + normalize

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  IconChevronLeft,
  IconChevronDown,
  IconPlus,
  IconInfoCircle,
  IconX,
  IconThumbUp,
  IconThumbDown,
} from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';

// ─────────────────────────────────────────────────────────────
// tokens
// ─────────────────────────────────────────────────────────────
const C = {
  bg: '#ffffff',
  card: '#f5f5f7',
  brand: '#e31b59',
  brandSoft: '#fff5f8',
  brandBorder: '#fbd6e2',
  text1: '#000000',
  text2: 'rgba(0,0,0,0.48)',
  text3: 'rgba(0,0,0,0.28)',
  divider: 'rgba(0,0,0,0.06)',
  chipBorder: 'rgba(0,0,0,0.08)',
  warnBg: '#fff2d9',
  warnText: '#b06f00',
  okBg: '#e0f0dc',
  okText: '#5a9855',
};

const INQUIRY_TYPES = [
  { id: 'spot',    label: '촬영 스팟 관련' },
  { id: 'photo',   label: '사진·업로드' },
  { id: 'bug',     label: '앱 오류/버그' },
  { id: 'account', label: '계정·보안' },
  { id: 'guide',   label: '이용안내' },
  { id: 'etc',     label: '기타' },
];

// ─────────────────────────────────────────────────────────────
// shared header
// ─────────────────────────────────────────────────────────────
function NavHeader({ title, onBack }) {
  return (
    <View style={{
      height: normalize(52),
      flexDirection: 'row', alignItems: 'center',
      paddingLeft: normalize(12), paddingRight: normalize(20),
    }}>
      <Pressable hitSlop={8} onPress={onBack}
        style={{ width: normalize(40), height: normalize(40), alignItems: 'center', justifyContent: 'center' }}>
        <IconChevronLeft size={normalize(24)} color={C.text1} strokeWidth={2} />
      </Pressable>
      <Text style={{
        flex: 1, textAlign: 'center', marginRight: normalize(40),
        fontSize: normalize(17), fontWeight: '600', color: C.text1,
      }}>{title}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 2a — 문의 작성
// ─────────────────────────────────────────────────────────────
export function InquiryComposeScreen() {
  const navigation = useNavigation();
  const [type, setType]       = useState(null);            // {id,label}
  const [typeOpen, setTypeOpen] = useState(false);
  const [title, setTitle]     = useState('');
  const [body, setBody]       = useState('');
  const [images, setImages]   = useState([]);              // string[]
  const [email, setEmail]     = useState('yeeun@traport.com');

  const valid = type && title.trim() && body.trim();

  const onSubmit = () => {
    if (!valid) return;
    // TODO: API 연동 (POST /inquiries)
    navigation.replace('InquiryList', { justSubmitted: true });
  };

  const addImage = () => {
    if (images.length >= 3) return;
    // TODO: react-native-image-picker 연동
    setImages([...images, `mock://${Date.now()}`]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <NavHeader title="문의하기" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={normalize(24)}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: normalize(28),
            paddingTop: normalize(12), paddingBottom: normalize(24),
            gap: normalize(20),
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* 안내 */}
          <View style={{
            flexDirection: 'row', gap: normalize(10),
            padding: normalize(14), borderRadius: normalize(12),
            backgroundColor: C.brandSoft,
          }}>
            <IconInfoCircle size={normalize(18)} color={C.brand} strokeWidth={2} />
            <Text style={{ flex: 1, fontSize: normalize(12.5), color: 'rgba(0,0,0,0.68)', lineHeight: normalize(19) }}>
              답변은 <Text style={{ fontWeight: '700', color: C.text1 }}>영업일 기준 1~2일</Text> 이내
              등록한 이메일과 [내 문의 내역]에서 확인할 수 있어요.
            </Text>
          </View>

          {/* 유형 */}
          <Field label="문의 유형" required>
            <Pressable
              onPress={() => setTypeOpen(v => !v)}
              style={{
                height: normalize(48), paddingHorizontal: normalize(16),
                backgroundColor: C.card, borderRadius: normalize(12),
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              }}>
              <Text style={{ fontSize: normalize(14), color: type ? C.text1 : C.text2 }}>
                {type ? type.label : '문의 유형을 선택해 주세요'}
              </Text>
              <IconChevronDown size={normalize(18)} color={C.text2} strokeWidth={2} />
            </Pressable>
            {typeOpen && (
              <View style={{
                marginTop: normalize(8), backgroundColor: C.card,
                borderRadius: normalize(12), overflow: 'hidden',
              }}>
                {INQUIRY_TYPES.map((t, i) => (
                  <Pressable key={t.id}
                    onPress={() => { setType(t); setTypeOpen(false); }}
                    style={{
                      height: normalize(44), paddingHorizontal: normalize(16),
                      justifyContent: 'center',
                      borderTopWidth: i === 0 ? 0 : 1, borderTopColor: C.divider,
                    }}>
                    <Text style={{
                      fontSize: normalize(14),
                      fontWeight: type?.id === t.id ? '600' : '400',
                      color: type?.id === t.id ? C.brand : C.text1,
                    }}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Field>

          {/* 제목 */}
          <Field label="제목" required>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력해 주세요"
              placeholderTextColor={C.text2}
              maxLength={50}
              style={inputStyle()}
            />
          </Field>

          {/* 내용 */}
          <Field
            label="내용"
            required
            trailing={<Text style={{ fontSize: normalize(11), color: C.text2 }}>{body.length} / 1000</Text>}
          >
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="문의 내용을 자세히 적어 주세요"
              placeholderTextColor={C.text2}
              multiline
              maxLength={1000}
              textAlignVertical="top"
              style={{
                minHeight: normalize(140),
                paddingVertical: normalize(14), paddingHorizontal: normalize(16),
                backgroundColor: C.card, borderRadius: normalize(12),
                fontSize: normalize(14), color: C.text1, lineHeight: normalize(22),
                fontFamily: undefined,
              }}
            />
          </Field>

          {/* 사진 */}
          <Field label="사진 첨부" hint="(선택 · 최대 3장)">
            <View style={{ flexDirection: 'row', gap: normalize(8) }}>
              <Pressable
                onPress={addImage}
                disabled={images.length >= 3}
                style={{
                  width: normalize(64), height: normalize(64),
                  borderRadius: normalize(12), backgroundColor: C.card,
                  borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(0,0,0,0.12)',
                  alignItems: 'center', justifyContent: 'center', gap: normalize(2),
                  opacity: images.length >= 3 ? 0.5 : 1,
                }}>
                <IconPlus size={normalize(20)} color={C.text2} strokeWidth={2} />
                <Text style={{ fontSize: normalize(10), color: C.text2 }}>{images.length}/3</Text>
              </Pressable>
              {images.map((uri, i) => (
                <View key={i} style={{
                  width: normalize(64), height: normalize(64), borderRadius: normalize(12),
                  backgroundColor: '#e5e5e7', overflow: 'hidden',
                }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                  <Pressable
                    onPress={() => setImages(images.filter((_, idx) => idx !== i))}
                    hitSlop={6}
                    style={{
                      position: 'absolute', top: normalize(4), right: normalize(4),
                      width: normalize(18), height: normalize(18), borderRadius: normalize(9),
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                    <IconX size={normalize(12)} color="#fff" strokeWidth={2.5} />
                  </Pressable>
                </View>
              ))}
            </View>
          </Field>

          {/* 이메일 */}
          <Field label="답변 받을 이메일">
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={inputStyle()}
            />
          </Field>
        </ScrollView>

        {/* 제출 */}
        <View style={{ paddingHorizontal: normalize(28), paddingTop: normalize(12), paddingBottom: normalize(28) }}>
          <Pressable
            onPress={onSubmit}
            disabled={!valid}
            style={({ pressed }) => ({
              height: normalize(52), borderRadius: normalize(999),
              backgroundColor: valid ? C.brand : 'rgba(0,0,0,0.12)',
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed && valid ? 0.9 : 1,
            })}>
            <Text style={{ color: '#fff', fontSize: normalize(15), fontWeight: '600' }}>보내기</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, required, hint, trailing, children }) {
  return (
    <View style={{ gap: normalize(8) }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: normalize(13), fontWeight: '600', color: C.text1 }}>
          {label}
          {required && <Text style={{ color: C.brand }}> *</Text>}
          {hint && <Text style={{ fontWeight: '500', color: C.text2 }}>  {hint}</Text>}
        </Text>
        {trailing}
      </View>
      {children}
    </View>
  );
}

function inputStyle() {
  return {
    height: normalize(48),
    paddingHorizontal: normalize(16),
    backgroundColor: C.card,
    borderRadius: normalize(12),
    fontSize: normalize(14),
    color: C.text1,
    includeFontPadding: false,
  };
}

// ─────────────────────────────────────────────────────────────
// 2b — 내 문의 내역
// ─────────────────────────────────────────────────────────────
const MOCK_LIST = [
  { id: 'q1', status: 'waiting',  category: '촬영 스팟 관련', title: '추천 스팟이 안 뜨는 지역이 있어요', date: '2026.07.14', unread: false },
  { id: 'q2', status: 'answered', category: '앱 오류/버그',     title: '일몰 시간이 실제와 다르게 표시돼요', date: '2026.07.10', unread: true  },
  { id: 'q3', status: 'answered', category: '스팟 등록·심사',   title: '새 스팟 등록이 며칠째 심사중이에요', date: '2026.06.28', unread: false },
  { id: 'q4', status: 'answered', category: '계정·보안',        title: '계정 이메일 바꿀 수 있나요?',       date: '2026.06.12', unread: false },
];

const FILTERS = [
  { id: 'all',      label: '전체' },
  { id: 'waiting',  label: '답변 대기' },
  { id: 'answered', label: '답변 완료' },
];

export function InquiryListScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('all');

  const counts = useMemo(() => ({
    all:      MOCK_LIST.length,
    waiting:  MOCK_LIST.filter(q => q.status === 'waiting').length,
    answered: MOCK_LIST.filter(q => q.status === 'answered').length,
  }), []);

  const data = useMemo(
    () => filter === 'all' ? MOCK_LIST : MOCK_LIST.filter(q => q.status === filter),
    [filter]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <NavHeader title="내 문의 내역" onBack={() => navigation.goBack()} />

      <FlatList
        data={data}
        keyExtractor={(it) => it.id}
        contentContainerStyle={{ paddingHorizontal: normalize(28), paddingBottom: normalize(120) }}
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: normalize(8), paddingBottom: normalize(12), paddingTop: normalize(4) }}
          >
            {FILTERS.map(f => {
              const active = f.id === filter;
              return (
                <Pressable key={f.id} onPress={() => setFilter(f.id)}
                  style={{
                    height: normalize(32), paddingHorizontal: normalize(14),
                    borderRadius: normalize(999),
                    backgroundColor: active ? C.brand : '#fff',
                    borderWidth: active ? 0 : 1, borderColor: C.chipBorder,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Text style={{
                    fontSize: normalize(13), fontWeight: active ? '600' : '500',
                    color: active ? '#fff' : C.text1,
                  }}>{f.label} {counts[f.id]}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        }
        ItemSeparatorComponent={() => <View style={{ height: normalize(10) }} />}
        ListEmptyComponent={
          <View style={{ paddingVertical: normalize(80), alignItems: 'center', gap: normalize(6) }}>
            <Text style={{ fontSize: normalize(15), fontWeight: '600', color: C.text1 }}>문의 내역이 없어요</Text>
            <Text style={{ fontSize: normalize(13), color: C.text2 }}>궁금한 점이 있다면 새 문의를 남겨보세요.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('InquiryDetail', { id: item.id })}
            style={({ pressed }) => ({
              backgroundColor: C.card, borderRadius: normalize(16),
              paddingVertical: normalize(16), paddingHorizontal: normalize(18),
              opacity: pressed ? 0.9 : 1,
              gap: normalize(10),
            })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
                <StatusBadge status={item.status} />
                {item.unread && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4) }}>
                    <View style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: C.brand }} />
                    <Text style={{ fontSize: normalize(11), fontWeight: '600', color: C.brand }}>NEW</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: normalize(11), color: C.text2 }}>{item.date}</Text>
            </View>
            <Text style={{
              fontSize: normalize(14),
              fontWeight: item.status === 'waiting' || item.unread ? '600' : '500',
              color: item.status === 'answered' && !item.unread ? 'rgba(0,0,0,0.72)' : C.text1,
              lineHeight: normalize(20),
            }} numberOfLines={2}>{item.title}</Text>
            <Text style={{ fontSize: normalize(12), color: C.text2 }}>{item.category}</Text>
          </Pressable>
        )}
      />

      <View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        paddingHorizontal: normalize(28),
        paddingTop: normalize(12), paddingBottom: normalize(28),
        backgroundColor: C.bg,
      }}>
        <Pressable
          onPress={() => navigation.navigate('InquiryCompose')}
          style={({ pressed }) => ({
            height: normalize(52), borderRadius: normalize(999),
            backgroundColor: C.brand,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: normalize(6),
            opacity: pressed ? 0.9 : 1,
          })}>
          <IconPlus size={normalize(18)} color="#fff" strokeWidth={2} />
          <Text style={{ color: '#fff', fontSize: normalize(15), fontWeight: '600' }}>새 문의 작성</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function StatusBadge({ status }) {
  const map = {
    waiting:  { bg: C.warnBg, fg: C.warnText, label: '답변 대기' },
    answered: { bg: C.okBg,   fg: C.okText,   label: '답변 완료' },
  };
  const s = map[status];
  return (
    <View style={{
      height: normalize(22), paddingHorizontal: normalize(8),
      borderRadius: normalize(999), backgroundColor: s.bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: normalize(11), fontWeight: '600', color: s.fg }}>{s.label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// 2c — 문의 상세 & 답변
// ─────────────────────────────────────────────────────────────
export function InquiryDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};
  // TODO: API 연동. 아래는 목업.
  const inquiry = {
    id, status: 'answered', category: '앱 오류/버그',
    title: '일몰 시간이 실제와 다르게 표시돼요',
    date: '2026.07.10',
    body: '서울인데 앱에서 일몰 시간이 19:12로 뜨는데 실제로는 19:45쯤이에요. 며칠째 계속 다르게 나오네요.',
    images: ['mock://1', 'mock://2'],
    answer: {
      author: 'PNG 운영팀',
      at: '07.11 10:04',
      body: '안녕하세요, 사용해 주셔서 감사합니다. 확인 결과 위치 권한이 "대략적 위치"로 설정되어 있어 계산에 오차가 발생했어요. 설정 > 위치 > "정확한 위치 허용"으로 바꾸시면 정상 계산됩니다. 추가로 문제가 이어지면 이 문의에 답글로 알려주세요!',
    },
  };
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <NavHeader title="문의 상세" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: normalize(28),
          paddingTop: normalize(12), paddingBottom: normalize(24),
          gap: normalize(16),
        }}
      >
        {/* 헤더 */}
        <View style={{ gap: normalize(10) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
            <StatusBadge status={inquiry.status} />
            <Text style={{ fontSize: normalize(12), color: C.text2 }}>{inquiry.date} · {inquiry.category}</Text>
          </View>
          <Text style={{ fontSize: normalize(18), fontWeight: '700', letterSpacing: -0.2, color: C.text1, lineHeight: normalize(24) }}>
            {inquiry.title}
          </Text>
        </View>

        {/* 내 문의 */}
        <View style={{
          backgroundColor: C.card, borderRadius: normalize(16),
          padding: normalize(16), gap: normalize(10),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
            <View style={{
              width: normalize(24), height: normalize(24), borderRadius: normalize(12),
              backgroundColor: '#000', alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: '#fff', fontSize: normalize(11), fontWeight: '600' }}>Y</Text>
            </View>
            <Text style={{ fontSize: normalize(13), fontWeight: '600', color: C.text1 }}>나</Text>
            <Text style={{ fontSize: normalize(11), color: C.text2 }}>· 07.10 14:22</Text>
          </View>
          <Text style={{ fontSize: normalize(14), color: 'rgba(0,0,0,0.78)', lineHeight: normalize(22) }}>
            {inquiry.body}
          </Text>
          {inquiry.images?.length > 0 && (
            <View style={{ flexDirection: 'row', gap: normalize(6) }}>
              {inquiry.images.map((uri, i) => (
                <View key={i} style={{
                  width: normalize(56), height: normalize(56),
                  borderRadius: normalize(10), backgroundColor: '#e5e5e7', overflow: 'hidden',
                }}>
                  <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 답변 (있을 때) */}
        {inquiry.answer && (
          <View style={{ gap: normalize(10) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
              <View style={{ width: normalize(2), height: normalize(12), borderRadius: normalize(2), backgroundColor: C.brand }} />
              <Text style={{ fontSize: normalize(12), fontWeight: '600', color: C.brand, letterSpacing: 0.2 }}>관리자 답변</Text>
            </View>
            <View style={{
              backgroundColor: C.brandSoft,
              borderWidth: 1, borderColor: C.brandBorder,
              borderRadius: normalize(16), padding: normalize(16), gap: normalize(10),
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8) }}>
                <View style={{
                  width: normalize(24), height: normalize(24), borderRadius: normalize(12),
                  backgroundColor: C.brand, alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: normalize(11), fontWeight: '700' }}>P</Text>
                </View>
                <Text style={{ fontSize: normalize(13), fontWeight: '600', color: C.text1 }}>{inquiry.answer.author}</Text>
                <Text style={{ fontSize: normalize(11), color: C.text2 }}>· {inquiry.answer.at}</Text>
              </View>
              <Text style={{ fontSize: normalize(14), color: 'rgba(0,0,0,0.82)', lineHeight: normalize(22) }}>
                {inquiry.answer.body}
              </Text>
            </View>

            {/* 피드백 */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: normalize(8),
              paddingVertical: normalize(12), paddingHorizontal: normalize(14),
              backgroundColor: C.card, borderRadius: normalize(12),
            }}>
              <Text style={{ flex: 1, fontSize: normalize(12.5), color: 'rgba(0,0,0,0.68)' }}>답변이 도움이 됐나요?</Text>
              <Pressable
                onPress={() => setFeedback(feedback === 'up' ? null : 'up')}
                style={feedbackBtnStyle(feedback === 'up')}>
                <IconThumbUp size={normalize(14)} color={feedback === 'up' ? '#fff' : C.text1} strokeWidth={2} />
                <Text style={{ fontSize: normalize(12), fontWeight: '600', color: feedback === 'up' ? '#fff' : C.text1 }}>도움됨</Text>
              </Pressable>
              <Pressable
                onPress={() => setFeedback(feedback === 'down' ? null : 'down')}
                style={feedbackBtnStyle(feedback === 'down')}>
                <IconThumbDown size={normalize(14)} color={feedback === 'down' ? '#fff' : C.text1} strokeWidth={2} />
              </Pressable>
            </View>

            {/* 답글 */}
            <Pressable
              onPress={() => navigation.navigate('InquiryReply', { id: inquiry.id })}
              style={({ pressed }) => ({
                height: normalize(48), borderRadius: normalize(999),
                borderWidth: 1, borderColor: C.chipBorder, backgroundColor: '#fff',
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.9 : 1,
              })}>
              <Text style={{ fontSize: normalize(14), fontWeight: '600', color: C.text1 }}>답글 보내기</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function feedbackBtnStyle(active) {
  return {
    flexDirection: 'row', alignItems: 'center', gap: normalize(4),
    height: normalize(30), paddingHorizontal: normalize(12),
    borderRadius: normalize(999),
    borderWidth: active ? 0 : 1, borderColor: C.chipBorder,
    backgroundColor: active ? C.brand : '#fff',
  };
}
