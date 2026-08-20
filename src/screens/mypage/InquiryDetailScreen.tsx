import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft, IconCheck } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { useInquiryDetail, useResolveInquiry } from '@/hooks/useInquiries';
import { getInquiryTypeLabel } from '@/types/inquiry';
import Toast from '@/components/common/Toast';
import { normalize } from '@/utils/normalize';
import { FONT_2XS, FONT_XS, FONT_SM, FONT_MD, FONT_LG } from '@/constants/layout';
import type { InquiryStatus } from '@/types/inquiry';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<MyPageStackParamList, 'InquiryDetail'>;

const BRAND_SOFT = '#fdecf1';
const SUB = TEXT_SUB;
const TEXT = '#000';

export default function InquiryDetailScreen({ navigation, route }: Props) {
  const parsedId = Number(route.params?.id);
  const inquiryId = !isNaN(parsedId) && parsedId > 0 ? parsedId : null;
  const { data, isLoading, isError, refetch } = useInquiryDetail(inquiryId);
  const resolveMutation = useResolveInquiry();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleResolved = () => {
    if (!data) return;
    resolveMutation.mutate(
      { id: data.id, isResolved: true },
      {
        onSuccess: () => {
          showToast('문의가 해결 처리되었습니다. 감사합니다.');
        },
        onError: (err: any) => {
          showToast(err.message || '처리 중 오류가 발생했습니다.');
        },
      }
    );
  };

  const handleFollowUp = () => {
    navigation.navigate('ComposeInquiry');
  };

  const isResolved = data?.isResolved || data?.status === 'RESOLVED';
  const isAnswered = data?.status === 'ANSWERED' || isResolved;
  const typeLabel = data?.type ? getInquiryTypeLabel(data.type) : null;

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
          <IconChevronLeft size={normalize(24)} color={TEXT} strokeWidth={1.75} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 text-center font-semibold text-black tracking-tight"
          style={{ fontSize: FONT_LG, paddingHorizontal: normalize(8), fontFamily: 'Pretendard-SemiBold' }}
        >
          1:1 문의 상세
        </Text>
        <View style={{ width: normalize(40) }} />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={BRAND} />
        </View>
      ) : isError || !data ? (
        <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: normalize(28) }}>
          <Text
            className="font-semibold text-black tracking-tight"
            style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold' }}
          >
            {inquiryId === null ? '잘못된 문의입니다' : '문의 내용을 불러올 수 없어요'}
          </Text>
          <Text style={{ fontSize: FONT_XS, color: SUB, marginTop: normalize(8), fontFamily: 'Pretendard-Regular' }}>
            {inquiryId === null ? '문의 ID가 올바르지 않습니다.' : '잠시 후 다시 시도해 주세요.'}
          </Text>
          {inquiryId !== null && (
            <Pressable
              onPress={() => refetch()}
              style={{
                marginTop: normalize(16),
                paddingHorizontal: normalize(18),
                paddingVertical: normalize(10),
                borderRadius: normalize(8),
                backgroundColor: TEXT,
              }}
            >
              <Text style={{ fontSize: FONT_SM, color: '#ffffff', fontFamily: 'Pretendard-Medium' }}>
                다시 시도
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: normalize(32) }} showsVerticalScrollIndicator={false}>
          {/* 상태 헤더 */}
          <View
            className="flex-row items-center justify-between"
            style={{ paddingHorizontal: normalize(20), paddingTop: normalize(12) }}
          >
            <View className="flex-row items-center" style={{ gap: normalize(6) }}>
              {typeLabel && (
                <View
                  style={{
                    paddingHorizontal: normalize(7),
                    paddingVertical: normalize(3),
                    borderRadius: normalize(4),
                    backgroundColor: 'rgba(0,0,0,0.06)',
                  }}
                >
                  <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-SemiBold', color: TEXT_SUB }}>
                    {typeLabel}
                  </Text>
                </View>
              )}
              <StatusBadge status={data.status} isResolved={isResolved} />
            </View>

            <Text style={{ fontSize: FONT_XS, color: SUB, fontFamily: 'Pretendard-Regular' }}>
              {data.createdAt ? data.createdAt.slice(0, 16).replace('T', ' ') : ''}
            </Text>
          </View>

          {/* 문의 제목 */}
          <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(14) }}>
            <Text
              style={{
                fontSize: FONT_LG,
                fontFamily: 'Pretendard-SemiBold',
                color: TEXT,
                lineHeight: normalize(26),
              }}
            >
              {data.title}
            </Text>
          </View>

          {/* 내가 보낸 문의 본문 */}
          <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(16) }}>
            <Text style={{ fontSize: FONT_XS, color: SUB, marginBottom: normalize(8), fontFamily: 'Pretendard-Medium' }}>
              내 문의 내용
            </Text>
            <View
              className="self-stretch"
              style={{
                backgroundColor: BRAND_SOFT,
                padding: normalize(14),
                borderRadius: normalize(14),
              }}
            >
              <Text
                style={{
                  fontSize: FONT_SM,
                  color: TEXT,
                  lineHeight: normalize(22),
                  fontFamily: 'Pretendard-Regular',
                }}
              >
                {data.content}
              </Text>
            </View>
          </View>

          {/* 운영팀 답변 영역 */}
          {data.answer ? (
            <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(20) }}>
              <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(8) }}>
                <View className="flex-row items-center" style={{ gap: normalize(8) }}>
                  <View
                    className="items-center justify-center rounded-full"
                    style={{ width: normalize(24), height: normalize(24), backgroundColor: '#111' }}
                  >
                    <Text className="font-semibold text-white" style={{ fontSize: FONT_XS }}>
                      P
                    </Text>
                  </View>
                  <Text style={{ fontSize: FONT_XS, color: '#111', fontFamily: 'Pretendard-SemiBold' }}>
                    {data.answeredByNickname || 'PicNGo 고객지원팀'}
                  </Text>
                </View>

                {data.answeredAt && (
                  <Text style={{ fontSize: FONT_XS, color: SUB, fontFamily: 'Pretendard-Regular' }}>
                    {data.answeredAt.slice(0, 16).replace('T', ' ')}
                  </Text>
                )}
              </View>

              <View
                className="self-stretch"
                style={{
                  backgroundColor: CARD,
                  padding: normalize(14),
                  borderRadius: normalize(14),
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SM,
                    color: TEXT,
                    lineHeight: normalize(22),
                    fontFamily: 'Pretendard-Regular',
                  }}
                >
                  {data.answer}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 하단 액션 카드 */}
          {isResolved ? (
            <View
              className="bg-[#f0fdf4]"
              style={{
                margin: normalize(20),
                marginTop: normalize(24),
                padding: normalize(16),
                borderRadius: normalize(12),
                borderWidth: 0.5,
                borderColor: '#bbf7d0',
                flexDirection: 'row',
                alignItems: 'center',
                gap: normalize(10),
              }}
            >
              <IconCheck size={normalize(20)} color="#15803d" strokeWidth={2.5} />
              <View className="flex-1">
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#15803d' }}>
                  해결 완료된 문의입니다
                </Text>
                <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Regular', color: '#166534', marginTop: normalize(2) }}>
                  추가 문의가 필요하신 경우 새로운 1:1 문의를 남겨주세요.
                </Text>
              </View>
            </View>
          ) : isAnswered ? (
            <View
              className="bg-card"
              style={{
                margin: normalize(20),
                marginTop: normalize(24),
                padding: normalize(14),
                borderRadius: normalize(12),
              }}
            >
              <Text
                style={{
                  fontSize: FONT_SM,
                  color: TEXT_SUB,
                  marginBottom: normalize(10),
                  fontFamily: 'Pretendard-Medium',
                }}
              >
                답변이 충분히 도움되셨나요?
              </Text>
              <View className="flex-row" style={{ gap: normalize(8) }}>
                <Pressable
                  onPress={handleResolved}
                  disabled={resolveMutation.isPending}
                  className="flex-1 items-center justify-center bg-white rounded-lg border-[1.5px] border-black/5"
                  style={{ height: normalize(44) }}
                >
                  {resolveMutation.isPending ? (
                    <ActivityIndicator size="small" color="#111" />
                  ) : (
                    <View className="flex-row items-center" style={{ gap: normalize(4) }}>
                      <IconCheck size={normalize(16)} color={TEXT} strokeWidth={2} />
                      <Text
                        className="font-semibold"
                        style={{ fontSize: FONT_SM, color: TEXT, fontFamily: 'Pretendard-SemiBold' }}
                      >
                        해결됐어요
                      </Text>
                    </View>
                  )}
                </Pressable>
                <Pressable
                  onPress={handleFollowUp}
                  className="flex-1 items-center justify-center bg-white rounded-lg border-[1.5px] border-black/5"
                  style={{ height: normalize(44) }}
                >
                  <Text
                    className="font-semibold"
                    style={{ fontSize: FONT_SM, color: BRAND, fontFamily: 'Pretendard-SemiBold' }}
                  >
                    새 문의 작성
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View
              className="bg-card"
              style={{
                margin: normalize(20),
                marginTop: normalize(24),
                padding: normalize(14),
                borderRadius: normalize(12),
              }}
            >
              <Text style={{ fontSize: FONT_XS, color: SUB, lineHeight: normalize(20), fontFamily: 'Pretendard-Regular' }}>
                담당자가 확인 후 정성껏 답변을 준비하고 있어요. (평균 24시간 이내 답변)
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
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
      style={{ paddingHorizontal: normalize(8), paddingVertical: normalize(4), backgroundColor: CARD }}
    >
      <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: TEXT_SUB }}>
        답변 대기
      </Text>
    </View>
  );
}
