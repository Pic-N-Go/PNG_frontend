import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft, IconPlus, IconMessage2Question } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { useMyInquiries } from '@/hooks/useInquiries';
import { getInquiryTypeLabel } from '@/types/inquiry';
import { normalize } from '@/utils/normalize';
import { FONT_2XS, FONT_XS, FONT_SM, FONT_MD, FONT_LG, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants/layout';
import type { InquiryItem, InquiryStatus } from '@/types/inquiry';
import Chip from '@/components/common/Chip';
import { BRAND, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<MyPageStackParamList, 'Inquiry'>;

const SUB = TEXT_SUB;

type FilterKey = 'all' | 'pending' | 'answered';

export default function InquiryListScreen({ navigation }: Props) {
  const { data, isLoading, isError, refetch } = useMyInquiries(0, 50);
  const [filter, setFilter] = useState<FilterKey>('all');

  const inquiries = data?.content ?? [];

  const counts = {
    all: inquiries.length,
    pending: inquiries.filter((i) => i.status === 'PENDING').length,
    answered: inquiries.filter((i) => i.status === 'ANSWERED' || i.status === 'RESOLVED').length,
  };

  const filtered = inquiries.filter((item) => {
    if (filter === 'pending') return item.status === 'PENDING';
    if (filter === 'answered') return item.status === 'ANSWERED' || item.status === 'RESOLVED';
    return true;
  });

  const handleOpen = (item: InquiryItem) => {
    navigation.navigate('InquiryDetail', { id: String(item.id) });
  };

  const handleCompose = () => navigation.navigate('ComposeInquiry');

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View
        className="flex-row items-center justify-between"
        style={{ height: normalize(52), paddingHorizontal: normalize(12) }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          className="items-center justify-center"
          style={{ width: normalize(40), height: normalize(40) }}
        >
          <IconChevronLeft size={normalize(24)} color="#111111" strokeWidth={1.75} />
        </Pressable>
        <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG }}>
          1:1 문의
        </Text>
        <Pressable
          onPress={handleCompose}
          hitSlop={8}
          className="items-center justify-center"
          style={{ width: normalize(40), height: normalize(40) }}
        >
          <IconPlus size={normalize(22)} color={BRAND} strokeWidth={2} />
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingBody />
      ) : isError ? (
        <ErrorBody onRetry={() => refetch()} />
      ) : inquiries.length === 0 ? (
        <EmptyBody onCompose={handleCompose} />
      ) : (
        <>
          {/* 필터 pill */}
          <View
            className="flex-row"
            style={{
              gap: normalize(8),
              paddingHorizontal: normalize(20),
              paddingTop: normalize(8),
              paddingBottom: normalize(12),
            }}
          >
            <FilterPill
              label={`전체 ${counts.all}`}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <FilterPill
              label={`답변 대기 ${counts.pending}`}
              active={filter === 'pending'}
              onPress={() => setFilter('pending')}
            />
            <FilterPill
              label={`답변 완료 ${counts.answered}`}
              active={filter === 'answered'}
              onPress={() => setFilter('answered')}
            />
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

// 목록만 거르는 필터 — 활성색 블랙, 모양은 공통 Chip. FAQ·홈·지도 필터와 같은 규칙.
function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Chip label={label} selected={active} onPress={onPress} />;
}

function InquiryCard({ item, onPress }: { item: InquiryItem; onPress: () => void }) {
  const isAnswered = item.status === 'ANSWERED' || item.status === 'RESOLVED';
  const createdDate = item.createdAt ? item.createdAt.slice(0, 10) : '';
  const typeLabel = item.type ? getInquiryTypeLabel(item.type) : null;

  return (
    <Pressable
      onPress={onPress}
      className="bg-card relative"
      style={{
        marginHorizontal: normalize(20),
        marginBottom: normalize(12),
        borderRadius: normalize(16),
        padding: normalize(16),
      }}
    >
      <View className="flex-row items-center justify-between" style={{ gap: normalize(8) }}>
        <View className="flex-row items-center" style={{ gap: normalize(6) }}>
          {typeLabel && (
            <View
              style={{
                paddingHorizontal: normalize(6),
                paddingVertical: normalize(2),
                borderRadius: normalize(4),
                backgroundColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-SemiBold', color: '#4b5563' }}>
                {typeLabel}
              </Text>
            </View>
          )}
          <StatusBadge status={item.status} isResolved={item.isResolved} />
        </View>

        <Text style={{ fontSize: FONT_XS, color: SUB, fontFamily: 'Pretendard-Regular' }}>
          {createdDate}
        </Text>
      </View>

      <Text
        className="font-semibold text-black tracking-tight"
        style={{ fontSize: FONT_MD, marginTop: normalize(10), fontFamily: 'Pretendard-SemiBold' }}
      >
        {item.title}
      </Text>

      <Text
        numberOfLines={2}
        style={{
          fontSize: FONT_SM,
          color: '#555555',
          marginTop: normalize(4),
          fontFamily: 'Pretendard-Regular',
          lineHeight: normalize(20),
        }}
      >
        {item.content}
      </Text>

      {isAnswered && item.answer && (
        <View
          className="border-t-[0.5px] border-hairline"
          style={{ marginTop: normalize(12), paddingTop: normalize(12) }}
        >
          <Text
            numberOfLines={1}
            style={{ fontSize: FONT_SM, color: '#111111', fontFamily: 'Pretendard-Medium' }}
          >
            <Text style={{ color: SUB, fontFamily: 'Pretendard-Regular' }}>답변 · </Text>
            {item.answer}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function StatusBadge({ status, isResolved }: { status: InquiryStatus; isResolved?: boolean }) {
  if (isResolved || status === 'RESOLVED') {
    return (
      <View
        className="rounded-md"
        style={{ paddingHorizontal: normalize(8), paddingVertical: normalize(4), backgroundColor: '#dcfce7' }}
      >
        <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#15803d' }}>
          해결됨
        </Text>
      </View>
    );
  }

  if (status === 'ANSWERED') {
    return (
      <View
        className="rounded-md"
        style={{ paddingHorizontal: normalize(8), paddingVertical: normalize(4), backgroundColor: '#e0f2fe' }}
      >
        <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#0369a1' }}>
          답변 완료
        </Text>
      </View>
    );
  }

  return (
    <View
      className="rounded-md"
      style={{ paddingHorizontal: normalize(8), paddingVertical: normalize(4), backgroundColor: '#ffffff' }}
    >
      <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: TEXT_SUB }}>
        답변 대기
      </Text>
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
      <View
        className="items-center justify-center bg-card"
        style={{
          width: normalize(64),
          height: normalize(64),
          borderRadius: normalize(32),
          marginBottom: normalize(16),
        }}
      >
        <IconMessage2Question size={normalize(28)} color={SUB} strokeWidth={1.5} />
      </View>
      <Text
        className="font-semibold text-black tracking-tight"
        style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold' }}
      >
        아직 문의한 내역이 없어요
      </Text>
      <Text
        className="text-center"
        style={{
          fontSize: FONT_XS,
          color: SUB,
          marginTop: normalize(8),
          lineHeight: normalize(20),
          fontFamily: 'Pretendard-Regular',
        }}
      >
        {'서비스에 대해 궁금한 점이 있으면\n언제든 문의해 주세요.'}
      </Text>
      <Pressable
        onPress={onCompose}
        className="items-center justify-center"
        style={{
          marginTop: normalize(24),
          height: BUTTON_HEIGHT,
          paddingHorizontal: normalize(32),
          borderRadius: BUTTON_RADIUS,
          backgroundColor: BRAND,
        }}
      >
        <Text style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold', color: '#ffffff' }}>
          새 문의 작성하기
        </Text>
      </Pressable>
    </View>
  );
}

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: normalize(28) }}>
      <Text
        className="font-semibold text-black tracking-tight"
        style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold' }}
      >
        문의 내역을 불러올 수 없어요
      </Text>
      <Text style={{ fontSize: FONT_XS, color: SUB, marginTop: normalize(8), fontFamily: 'Pretendard-Regular' }}>
        잠시 후 다시 시도해 주세요.
      </Text>
      <Pressable
        onPress={onRetry}
        style={{
          marginTop: normalize(16),
          paddingHorizontal: normalize(20),
          paddingVertical: normalize(10),
          borderRadius: BUTTON_RADIUS,
          backgroundColor: '#111827',
        }}
      >
        <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Medium', color: '#fff' }}>
          다시 시도
        </Text>
      </Pressable>
    </View>
  );
}
