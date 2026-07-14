import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft, IconPlus, IconMessage2Question } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { useInquiries, Inquiry } from '@/hooks/useInquiries';
import { normalize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants/layout';

type Props = NativeStackScreenProps<MyPageStackParamList, 'Inquiry'>;

const BRAND = '#E31B59';
const SUB = '#8a8a8e';
const OK_BG = '#e0f0dc';
const OK_TXT = '#5a9855';
const BADGE_BG = '#f5f5f7';
const BADGE_TXT = '#8a8a8e';

type FilterKey = 'all' | 'answered' | 'pending';

export default function InquiryListScreen({ navigation }: Props) {
  const { inquiries, markRead } = useInquiries();
  const [filter, setFilter] = React.useState<FilterKey>('all');
  const state = (inquiries.length === 0 ? 'empty' : 'normal') as 'normal' | 'empty' | 'loading' | 'error';

  const counts = {
    all: inquiries.length,
    answered: inquiries.filter((i) => i.status === 'answered').length,
    pending: inquiries.filter((i) => i.status === 'pending').length,
  };

  const filtered = filter === 'all' ? inquiries : inquiries.filter((i) => i.status === filter);

  const handleOpen = (item: Inquiry) => {
    markRead(item.id);
    navigation.navigate('InquiryDetail', { id: item.id });
  };

  const handleCompose = () => navigation.navigate('ComposeInquiry');

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View className="flex-row items-center justify-between" style={{ height: normalize(52), paddingHorizontal: normalize(12) }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <IconChevronLeft size={normalize(24)} color="#111111" strokeWidth={1.75} />
        </Pressable>
        <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG }}>1:1 문의</Text>
        <Pressable onPress={handleCompose} hitSlop={8} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <IconPlus size={normalize(22)} color={BRAND} strokeWidth={2} />
        </Pressable>
      </View>

      {state === 'loading' && <LoadingBody />}
      {state === 'error' && <ErrorBody />}
      {state === 'empty' && <EmptyBody onCompose={handleCompose} />}
      {state === 'normal' && (
        <>
          {/* 필터 pill */}
          <View className="flex-row" style={{ gap: normalize(8), paddingHorizontal: normalize(20), paddingTop: normalize(8), paddingBottom: normalize(12) }}>
            <FilterPill label={`전체 ${counts.all}`} active={filter === 'all'} onPress={() => setFilter('all')} />
            <FilterPill label={`답변 완료 ${counts.answered}`} active={filter === 'answered'} onPress={() => setFilter('answered')} />
            <FilterPill label={`답변 대기 ${counts.pending}`} active={filter === 'pending'} onPress={() => setFilter('pending')} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: normalize(24) }} showsVerticalScrollIndicator={false}>
            {filtered.map((item) => (
              <InquiryCard key={item.id} item={item} onPress={() => handleOpen(item)} />
            ))}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={active ? 'items-center justify-center' : 'items-center justify-center border border-black/5'}
      style={{ paddingHorizontal: normalize(14), paddingVertical: normalize(7), borderRadius: normalize(9999), backgroundColor: active ? BRAND : '#f5f5f7' }}
    >
      <Text className={active ? 'font-medium text-white' : 'text-[#555]'} style={{ fontSize: FONT_SM }}>{label}</Text>
    </Pressable>
  );
}

function InquiryCard({ item, onPress }: { item: Inquiry; onPress: () => void }) {
  const isAnswered = item.status === 'answered';
  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-black/10 relative"
      style={{
        marginHorizontal: normalize(20), marginBottom: normalize(12),
        borderRadius: normalize(16), padding: normalize(16),
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
      }}
    >
      {item.unread && (
        <View
          className="absolute rounded-full"
          style={{ top: normalize(16), right: normalize(16), width: normalize(8), height: normalize(8), backgroundColor: BRAND }}
        />
      )}

      <View className="flex-row items-center" style={{ gap: normalize(8) }}>
        <StatusBadge status={item.status} />
        <View className="flex-1" />
        <Text style={{ fontSize: FONT_XS, color: SUB, marginRight: item.unread ? normalize(16) : 0 }}>{item.timeText}</Text>
      </View>

      <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_MD, marginTop: normalize(10) }}>{item.title}</Text>

      <Text numberOfLines={1} style={{ fontSize: FONT_SM, color: '#555555', marginTop: normalize(4) }}>{item.preview}</Text>

      {isAnswered && item.answerPreview && (
        <View className="border-t border-black/5" style={{ marginTop: normalize(12), paddingTop: normalize(12) }}>
          <Text numberOfLines={1} style={{ fontSize: FONT_SM, color: '#111111' }}>
            <Text style={{ color: SUB }}>답변 · </Text>{item.answerPreview}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function StatusBadge({ status }: { status: Inquiry['status'] }) {
  const answered = status === 'answered';
  return (
    <View className="rounded-md" style={{ paddingHorizontal: normalize(8), paddingVertical: normalize(4), backgroundColor: answered ? OK_BG : BADGE_BG }}>
      <Text className="font-semibold" style={{ fontSize: FONT_XS, color: answered ? OK_TXT : BADGE_TXT }}>{answered ? '답변 완료' : '답변 대기'}</Text>
    </View>
  );
}

function LoadingBody() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color={BRAND} />
    </View>
  );
}

function EmptyBody({ onCompose }: { onCompose: () => void }) {
  return (
    <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: normalize(28) }}>
      <View className="items-center justify-center bg-[#f5f5f7]" style={{ width: normalize(64), height: normalize(64), borderRadius: normalize(32), marginBottom: normalize(16) }}>
        <IconMessage2Question size={normalize(28)} color={SUB} strokeWidth={1.5} />
      </View>
      <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_MD }}>아직 문의한 내역이 없어요</Text>
      <Text className="text-center" style={{ fontSize: FONT_XS, color: SUB, marginTop: normalize(8), lineHeight: normalize(20) }}>
        {'서비스에 대해 궁금한 점이 있으면\n언제든 문의해 주세요.'}
      </Text>
      <Pressable
        onPress={onCompose}
        className="items-center justify-center"
        style={{ marginTop: normalize(24), height: BUTTON_HEIGHT, paddingHorizontal: normalize(32), borderRadius: BUTTON_RADIUS, backgroundColor: BRAND }}
      >
        <Text className="font-semibold text-white" style={{ fontSize: FONT_MD }}>새 문의 작성하기</Text>
      </Pressable>
    </View>
  );
}

function ErrorBody() {
  return (
    <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: normalize(28) }}>
      <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_MD }}>문의 내역을 불러올 수 없어요</Text>
      <Text style={{ fontSize: FONT_XS, color: SUB, marginTop: normalize(8) }}>잠시 후 다시 시도해 주세요.</Text>
    </View>
  );
}
