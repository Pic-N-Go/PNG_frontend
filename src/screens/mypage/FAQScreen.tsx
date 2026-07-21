import React from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  IconChevronLeft, IconChevronDown, IconChevronUp, IconSearch, IconHeadset,
} from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_2XS, FONT_XS, FONT_SM, FONT_MD, FONT_LG, CONTENT_PADDING } from '@/constants/layout';

type Props = NativeStackScreenProps<MyPageStackParamList, 'FAQ'>;

const BRAND = '#E31B59';
const TEXT2 = 'rgba(0,0,0,0.48)';
const TEXT3 = 'rgba(0,0,0,0.28)';
const DIVIDER = 'rgba(0,0,0,0.06)';
const CHIP_BORDER = 'rgba(0,0,0,0.08)';

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'spot', label: '촬영 스팟' },
  { id: 'photo', label: '사진·업로드' },
  { id: 'account', label: '계정·보안' },
  { id: 'guide', label: '이용안내' },
  { id: 'etc', label: '기타' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

interface Faq {
  id: number;
  category: Exclude<CategoryId, 'all'>;
  q: string;
  a: string;
}

const FAQ_LIST: Faq[] = [
  { id: 1, category: 'spot', q: '촬영 스팟은 어떤 기준으로 추천되나요?', a: '현재 위치·시간대·날씨·계절, 그리고 다른 유저의 촬영 이력을 종합해 추천해요. 인기 순, 거리 순, 최근 촬영 순으로 정렬을 바꿀 수도 있어요.' },
  { id: 2, category: 'spot', q: '일몰·일출 시간은 어떻게 계산되나요?', a: '스팟의 위·경도 좌표를 기준으로 매일 자동 계산돼요. 골든아워(일출 전·일몰 후 30분)와 블루아워도 함께 표시됩니다.' },
  { id: 3, category: 'spot', q: '비공개/폐쇄된 스팟은 어떻게 신고하나요?', a: '스팟 상세 화면 우측 상단 더보기(⋯) > [신고하기]에서 사유를 선택해 접수할 수 있어요. 검토 후 지도에서 숨김 처리됩니다.' },
  { id: 4, category: 'spot', q: '내가 찾은 새로운 스팟을 등록할 수 있나요?', a: '지도 화면의 [+] 버튼으로 좌표·대표 사진·간단한 촬영 팁을 함께 등록할 수 있어요. 승인 후 공개됩니다.' },
  { id: 5, category: 'photo', q: '사진 업로드 시 위치 정보는 공개되나요?', a: '기본적으로 사진의 EXIF 위치는 공개되지 않아요. 스팟에 연결해 올리는 경우에만 해당 스팟 좌표가 표시됩니다.' },
  { id: 6, category: 'photo', q: '저장한 장소는 어디서 다시 볼 수 있나요?', a: '마이페이지 > 저장한 스팟에서 확인할 수 있어요. 폴더로 묶어서 정리할 수도 있습니다.' },
  { id: 7, category: 'photo', q: '올린 사진은 언제든 삭제할 수 있나요?', a: '내가 올린 사진 화면에서 언제든 삭제 가능해요. 삭제 후 30일간 임시보관되고 그 이후 영구 삭제됩니다.' },
  { id: 8, category: 'account', q: '비밀번호를 잊어버렸어요. 어떻게 재설정하나요?', a: '로그인 화면 하단의 [비밀번호 찾기]를 눌러 가입 시 등록한 이메일로 인증코드를 받아 재설정할 수 있어요.' },
  { id: 9, category: 'account', q: '회원 탈퇴 후 데이터는 어떻게 되나요?', a: '탈퇴 시 계정 정보와 활동 이력은 30일 보관 후 영구 삭제됩니다. 관련 법령에 따라 일부 기록은 최대 5년간 보관될 수 있어요.' },
  { id: 10, category: 'guide', q: '알림 설정은 어디서 바꾸나요?', a: '마이페이지 > 설정 > 알림에서 날씨/골든아워/새 스팟 알림을 개별로 켜고 끌 수 있어요.' },
  { id: 11, category: 'guide', q: '앱 버전은 어디서 확인하나요?', a: '마이페이지 > 설정 > 앱 정보에서 확인할 수 있어요.' },
  { id: 12, category: 'etc', q: '해외에서도 사용할 수 있나요?', a: '해외에서도 지도와 스팟 정보가 그대로 노출돼요. 추천 스팟은 국내 위주로 채워져 있어 지역에 따라 결과 수가 다를 수 있어요.' },
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FAQScreen({ navigation }: Props) {
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState<CategoryId>('all');
  const [openSet, setOpenSet] = React.useState<Set<number>>(() => new Set());

  const toggle = React.useCallback((id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_LIST.filter(
      (f) =>
        (category === 'all' || f.category === category) &&
        (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)),
    );
  }, [query, category]);

  const headTitle = category === 'all' ? '전체 질문' : CATEGORIES.find((c) => c.id === category)?.label;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View className="flex-row items-center" style={{ height: normalize(52), paddingHorizontal: normalize(12) }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <IconChevronLeft size={normalize(24)} color="#111111" strokeWidth={2} />
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG, marginRight: normalize(40) }}>
          자주 묻는 질문
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(8), paddingBottom: normalize(24) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 검색 */}
        <View
          className="flex-row items-center bg-[#f5f5f7]"
          style={{ gap: normalize(8), height: normalize(44), paddingHorizontal: normalize(14), borderRadius: normalize(12), marginBottom: normalize(14) }}
        >
          <IconSearch size={normalize(18)} color={TEXT2} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="궁금한 내용을 검색해 보세요"
            placeholderTextColor={TEXT2}
            returnKeyType="search"
            className="flex-1 p-0 text-black"
            style={{ fontSize: normalizeFontSize(14) }}
          />
        </View>

        {/* 카테고리 칩 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: normalize(8), paddingBottom: normalize(14) }}
        >
          {CATEGORIES.map((c) => {
            const active = c.id === category;
            return (
              <Pressable
                key={c.id}
                onPress={() => setCategory(c.id)}
                className="items-center justify-center"
                style={{
                  height: normalize(34), paddingHorizontal: normalize(14), borderRadius: normalize(9999),
                  backgroundColor: active ? BRAND : '#fff',
                  borderWidth: active ? 0 : 1, borderColor: CHIP_BORDER,
                }}
              >
                <Text style={{ fontSize: FONT_SM, fontWeight: active ? '600' : '500', color: active ? '#fff' : '#000' }}>
                  {c.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 리스트 헤더 */}
        <View className="flex-row items-baseline justify-between" style={{ marginBottom: normalize(12) }}>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_MD }}>{headTitle}</Text>
          <Text style={{ fontSize: FONT_XS, color: TEXT2 }}>총 {filtered.length}개</Text>
        </View>

        {/* FAQ 아코디언 */}
        {filtered.length === 0 ? (
          <View className="items-center" style={{ paddingVertical: normalize(60), gap: normalize(6) }}>
            <Text className="font-semibold text-black" style={{ fontSize: FONT_MD }}>검색 결과가 없어요</Text>
            <Text style={{ fontSize: FONT_SM, color: TEXT2 }}>다른 키워드로 다시 검색해 보세요.</Text>
          </View>
        ) : (
          <View style={{ gap: normalize(10) }}>
            {filtered.map((item) => (
              <FaqItem key={item.id} item={item} open={openSet.has(item.id)} onToggle={toggle} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 문의 CTA */}
      <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: normalize(12), paddingBottom: normalize(12) }}>
        <Pressable
          onPress={() => navigation.navigate('Inquiry')}
          className="flex-row items-center justify-between bg-[#f5f5f7]"
          style={{ gap: normalize(12), paddingVertical: normalize(14), paddingHorizontal: normalize(18), borderRadius: normalize(16) }}
        >
          <View className="flex-row items-center" style={{ gap: normalize(10) }}>
            <IconHeadset size={normalize(20)} color={BRAND} strokeWidth={2} />
            <View>
              <Text className="font-semibold text-black" style={{ fontSize: FONT_SM }}>원하는 답을 찾지 못했나요?</Text>
              <Text style={{ fontSize: FONT_XS, color: TEXT2, marginTop: normalize(2) }}>1:1 문의로 알려드릴게요</Text>
            </View>
          </View>
          <View className="items-center justify-center" style={{ height: normalize(36), paddingHorizontal: normalize(16), borderRadius: normalize(9999), backgroundColor: BRAND }}>
            <Text className="font-semibold text-white" style={{ fontSize: FONT_SM }}>문의하기</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function FaqItem({ item, open, onToggle }: { item: Faq; open: boolean; onToggle: (id: number) => void }) {
  return (
    <Pressable
      onPress={() => onToggle(item.id)}
      className="bg-[#f5f5f7]"
      style={{ borderRadius: normalize(16), paddingVertical: normalize(16), paddingHorizontal: normalize(18) }}
    >
      <View className="flex-row" style={{ gap: normalize(12), alignItems: open ? 'flex-start' : 'center' }}>
        <View
          className="items-center justify-center"
          style={{ width: normalize(22), height: normalize(22), borderRadius: normalize(6), backgroundColor: open ? BRAND : 'rgba(0,0,0,0.06)' }}
        >
          <Text className="font-semibold" style={{ fontSize: FONT_2XS, color: open ? '#fff' : TEXT2 }}>Q</Text>
        </View>
        <Text className="flex-1 text-black" style={{ fontSize: normalizeFontSize(14), fontWeight: open ? '600' : '500', lineHeight: normalize(20) }}>
          {item.q}
        </Text>
        {open
          ? <IconChevronUp size={normalize(18)} color={TEXT2} strokeWidth={2} />
          : <IconChevronDown size={normalize(18)} color={TEXT3} strokeWidth={2} />}
      </View>

      {open && (
        <View
          className="flex-row border-t"
          style={{ marginTop: normalize(12), paddingTop: normalize(12), borderTopColor: DIVIDER, gap: normalize(12) }}
        >
          <View
            className="items-center justify-center bg-white"
            style={{ width: normalize(22), height: normalize(22), borderRadius: normalize(6), borderWidth: 1, borderColor: CHIP_BORDER }}
          >
            <Text className="font-semibold" style={{ fontSize: FONT_2XS, color: TEXT2 }}>A</Text>
          </View>
          <Text className="flex-1" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.68)', lineHeight: normalize(20) }}>
            {item.a}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
