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
import Chip from '@/components/common/Chip';
import { BRAND , HAIRLINE } from '@/constants/colors';

type Props = NativeStackScreenProps<MyPageStackParamList, 'FAQ'>;

const TEXT2 = 'rgba(0,0,0,0.48)';
const TEXT3 = 'rgba(0,0,0,0.28)';
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
  {
    id: 1,
    category: 'spot',
    q: '촬영 스팟은 어떤 기준으로 추천되나요?',
    a: '현재 위치·시간대·날씨·계절, 그리고 스팟의 포토제닉 지수(인기도, 북마크, 리뷰 수 등)를 종합 분석하여 지금 사진 찍기 가장 좋은 스팟을 추천해 드려요.',
  },
  {
    id: 2,
    category: 'spot',
    q: '일몰·일출 시간은 어떻게 계산되나요?',
    a: '스팟의 위·경도 좌표를 기준으로 매일 자동 계산돼요. 사진 촬영의 황금 시간대인 골든아워(일출 전·일몰 후 30분)와 블루아워 정보도 함께 제공됩니다.',
  },
  {
    id: 3,
    category: 'spot',
    q: '게시물이나 댓글, 리뷰를 신고하려면 어떻게 하나요?',
    a: '부적절한 게시글은 상세 화면 우측 상단 더보기(⋯), 댓글 및 리뷰는 각 항목의 [신고하기]를 눌러 접수할 수 있어요. 접수된 신고는 운영팀 검토 후 즉시 블라인드 및 제재 처리됩니다. (폐쇄되거나 정보가 잘못된 스팟은 1:1 문의로 제보해 주세요.)',
  },
  {
    id: 4,
    category: 'spot',
    q: '내가 찾은 새로운 스팟을 등록할 수 있나요?',
    a: '현재는 한국관광공사 공공데이터와 검증된 출사 스팟을 엄선하여 제공하고 있어요. 나만 알고 있는 멋진 출사지가 있다면 마이페이지 > [1:1 문의]로 제보해 주시면 검토 후 등록해 드려요.',
  },
  {
    id: 5,
    category: 'photo',
    q: '사진 업로드 시 위치 정보는 공개되나요?',
    a: '기본적으로 사진 파일의 원본 EXIF 메타데이터(정밀 GPS 등)는 외부에 노출되지 않아요. 커뮤니티 작성 시 스팟과 연계해 등록한 경우에만 해당 스팟의 기본 위치가 표시됩니다.',
  },
  {
    id: 6,
    category: 'photo',
    q: '저장한 스팟은 어디서 다시 볼 수 있나요?',
    a: '마이페이지 > [즐겨찾기 스팟]에서 내가 저장한 스팟들을 확인할 수 있어요. 테마별 북마크 컬렉션으로 분류해 체계적으로 관리할 수도 있습니다.',
  },
  {
    id: 7,
    category: 'photo',
    q: '올린 사진이나 글, 리뷰는 언제든 삭제할 수 있나요?',
    a: '마이페이지 상단의 [글] 또는 [리뷰] 메뉴에서 내가 작성한 게시글과 사진 리뷰를 언제든지 즉시 수정하거나 삭제할 수 있어요.',
  },
  {
    id: 8,
    category: 'account',
    q: '비밀번호를 잊어버렸어요. 어떻게 재설정하나요?',
    a: '로그인 화면 하단의 [비밀번호를 잊으셨나요?]를 눌러 가입 시 등록한 이메일로 인증코드를 전송받은 후 새 비밀번호로 안전하게 재설정할 수 있어요.',
  },
  {
    id: 9,
    category: 'account',
    q: '회원 탈퇴 후 데이터는 어떻게 되나요?',
    a: '탈퇴 즉시 계정이 로그아웃되며, 작성자 이름은 \'탈퇴한 사용자\'로 익명 처리됩니다. 개인정보는 관련 법령에 따른 보존 의무 기간 이후 안전하게 영구 파기됩니다.',
  },
  {
    id: 10,
    category: 'guide',
    q: '알림 설정은 어디서 바꾸나요?',
    a: '마이페이지 우측 상단 설정(⚙️) > [알림]에서 출사 알림, 골든아워 알림, 커뮤니티 알림을 각각 켜거나 끌 수 있으며, [방해 금지 모드]로 원하는 시간대에 알림을 끌 수도 있어요.',
  },
  {
    id: 11,
    category: 'guide',
    q: '앱 버전은 어디서 확인하나요?',
    a: '마이페이지 우측 상단 설정(⚙️) > 기타 섹션의 [버전 정보]에서 현재 설치된 앱 버전과 최신 버전 상태, 오픈소스 라이선스를 확인하실 수 있어요.',
  },
  {
    id: 12,
    category: 'etc',
    q: '해외에서도 사용할 수 있나요?',
    a: 'PNG는 현재 한국관광공사 및 기상청 국내 공공데이터를 기반으로 대한민국 전국 출사지에 특화된 서비스를 제공하고 있어요. 글로벌 스팟 확장은 추후 업데이트를 기대해 주세요!',
  },
  {
    id: 13,
    category: 'guide',
    q: '출사 알림이 오지 않아요.',
    a: '마이페이지 설정(⚙️)의 [알림] 및 휴대폰 기기 설정에서 PNG 앱 알림 권한이 허용되어 있는지 확인해 주세요. 또한 방해 금지 모드가 켜져 있거나, 설정한 날씨·시간 조건이 아직 도달하지 않은 경우 알림이 발송되지 않습니다.',
  },
  {
    id: 14,
    category: 'spot',
    q: '포토제닉 점수는 어떻게 계산되나요?',
    a: '방문자 리뷰 평점, 사진 업로드 수, 북마크 수, 그리고 실시간 날씨와 계절 적합도를 종합 분석하여 사진이 가장 잘 나오는 정도를 100점 만점으로 자체 환산한 지수예요.',
  },
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

  // 질문 제목만 본다. 답변(f.a)까지 검색하면 아코디언이 접혀 있어 어디가 맞았는지 보이지 않고,
  // 답변은 긴 산문이라 노이즈가 제목 일치보다 많아진다 — '스팟'은 제목 3건 대 답변만 5건이었다.
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ_LIST.filter(
      (f) => (category === 'all' || f.category === category) && (!q || f.q.toLowerCase().includes(q)),
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
          className="flex-row items-center bg-card"
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
            style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14) }}
          />
        </View>

        {/* 카테고리 칩 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: normalize(8), paddingBottom: normalize(14) }}
        >
          {/* 목록만 거르는 필터라 활성색은 블랙이다(핑크는 화면 전환·데이터 변경용).
              모양도 공통 Chip으로 맞춰 앱 전체 필터 칩이 한 벌이 되게 한다. */}
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              selected={c.id === category}
              onPress={() => setCategory(c.id)}
              height={normalize(34)}
            />
          ))}
        </ScrollView>

        {/* 리스트 헤더 */}
        <View className="flex-row items-baseline justify-between" style={{ marginBottom: normalize(12) }}>
          <Text className="font-semibold text-black" style={{ fontSize: FONT_MD }}>{headTitle}</Text>
          <Text className="font-normal" style={{ fontSize: FONT_XS, color: TEXT2 }}>총 {filtered.length}개</Text>
        </View>

        {/* FAQ 아코디언 */}
        {filtered.length === 0 ? (
          <View className="items-center" style={{ paddingVertical: normalize(60), gap: normalize(6) }}>
            <Text className="font-semibold text-black" style={{ fontSize: FONT_MD }}>검색 결과가 없어요</Text>
            <Text className="font-normal" style={{ fontSize: FONT_SM, color: TEXT2 }}>다른 키워드로 다시 검색해 보세요.</Text>
          </View>
        ) : (
          <View style={{ gap: normalize(10) }}>
            {filtered.map((item) => (
              <FaqItem key={item.id} item={item} open={openSet.has(item.id)} onToggle={toggle} />
            ))}
          </View>
        )}

        {/* 문의 CTA는 목록 끝에 둔다 — 화면 하단에 고정하면 마지막 질문들을 계속 가린다.
            "답을 못 찾았다"는 안내이기도 해서 목록을 다 본 뒤에 나오는 게 맥락에도 맞다.
            질문 카드와 배경색(#f5f5f7)이 같아 목록의 연장으로 읽히므로 구분선으로 끊는다. */}
        <View style={{ height: 0.5, backgroundColor: HAIRLINE, marginTop: normalize(24), marginBottom: normalize(20) }} />
        <Pressable
          onPress={() => navigation.navigate('Inquiry')}
          className="flex-row items-center justify-between bg-card"
          style={{ gap: normalize(12), paddingVertical: normalize(14), paddingHorizontal: normalize(18), borderRadius: normalize(16) }}
        >
          <View className="flex-row items-center" style={{ gap: normalize(10) }}>
            <IconHeadset size={normalize(20)} color={BRAND} strokeWidth={2} />
            <View>
              <Text className="font-semibold text-black" style={{ fontSize: FONT_SM }}>원하는 답을 찾지 못했나요?</Text>
              <Text className="font-normal" style={{ fontSize: FONT_XS, color: TEXT2, marginTop: normalize(2) }}>1:1 문의로 알려드릴게요</Text>
            </View>
          </View>
          <View className="items-center justify-center" style={{ height: normalize(36), paddingHorizontal: normalize(16), borderRadius: normalize(9999), backgroundColor: BRAND }}>
            <Text className="font-semibold text-white" style={{ fontSize: FONT_SM }}>문의하기</Text>
          </View>
        </Pressable>
      </ScrollView>

    </SafeAreaView>
  );
}

function FaqItem({ item, open, onToggle }: { item: Faq; open: boolean; onToggle: (id: number) => void }) {
  return (
    <Pressable
      onPress={() => onToggle(item.id)}
      className="bg-card"
      style={{ borderRadius: normalize(16), paddingVertical: normalize(16), paddingHorizontal: normalize(18) }}
    >
      <View className="flex-row" style={{ gap: normalize(12), alignItems: open ? 'flex-start' : 'center' }}>
        <View
          className="items-center justify-center"
          style={{ width: normalize(22), height: normalize(22), borderRadius: normalize(6), backgroundColor: open ? BRAND : 'rgba(0,0,0,0.06)' }}
        >
          <Text className="font-semibold" style={{ fontSize: FONT_2XS, color: open ? '#fff' : TEXT2 }}>Q</Text>
        </View>
        <Text className="flex-1 text-black" style={{ fontSize: normalizeFontSize(14), fontFamily: open ? 'Pretendard-SemiBold' : 'Pretendard-Medium', lineHeight: normalize(20) }}>
          {item.q}
        </Text>
        {open
          ? <IconChevronUp size={normalize(18)} color={TEXT2} strokeWidth={2} />
          : <IconChevronDown size={normalize(18)} color={TEXT3} strokeWidth={2} />}
      </View>

      {open && (
        <View
          className="flex-row border-t-[0.5px]"
          style={{ marginTop: normalize(12), paddingTop: normalize(12), borderTopColor: HAIRLINE, gap: normalize(12) }}
        >
          <View
            className="items-center justify-center bg-white"
            style={{ width: normalize(22), height: normalize(22), borderRadius: normalize(6), borderWidth: 1, borderColor: CHIP_BORDER }}
          >
            <Text className="font-semibold" style={{ fontSize: FONT_2XS, color: TEXT2 }}>A</Text>
          </View>
          <Text className="flex-1 font-normal" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.68)', lineHeight: normalize(20) }}>
            {item.a}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
