import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { useInquiries, Inquiry } from '@/hooks/useInquiries';
import Toast from '@/components/auth/Toast';
import { normalize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG } from '@/constants/layout';

type Props = NativeStackScreenProps<MyPageStackParamList, 'InquiryDetail'>;

const BRAND = '#E31B59';
const BRAND_SOFT = '#fdecf1';
const CARD = '#f5f5f7';
const SUB = '#8a8a8e';
const TEXT = '#111111';
const OK_BG = '#e0f0dc';
const OK_TXT = '#5a9855';
const BADGE_BG = '#f5f5f7';
const BADGE_TXT = '#8a8a8e';

export default function InquiryDetailScreen({ navigation, route }: Props) {
  const { getById } = useInquiries();
  const data = getById(route.params.id);
  const state: 'normal' | 'loading' | 'error' = (data ? 'normal' : 'error') as 'normal' | 'loading' | 'error';

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const showToast = (message: string) => { setToastMessage(message); setToastVisible(true); };

  const handleResolved = () => {
    // TODO: 백엔드 확정 후 실제 "해결됨" 처리 연동
    showToast('소중한 의견 감사합니다 ✓');
  };
  const handleFollowUp = () => {
    // TODO: 백엔드 확정 후 추가 문의 플로우 연동
    showToast('추가 문의는 새 문의로 작성해 주세요');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View className="flex-row items-center justify-between" style={{ height: normalize(52), paddingHorizontal: normalize(12) }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <IconChevronLeft size={normalize(24)} color={TEXT} strokeWidth={1.75} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 text-center font-semibold text-black tracking-tight"
          style={{ fontSize: FONT_LG, paddingHorizontal: normalize(8) }}
        >
          {data?.category ?? '문의'}
        </Text>
        <View style={{ width: normalize(40) }} />
      </View>

      {state === 'loading' && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={BRAND} />
        </View>
      )}

      {state === 'error' && (
        <View className="flex-1 items-center justify-center" style={{ paddingHorizontal: normalize(28) }}>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_MD }}>문의 내용을 불러올 수 없어요</Text>
          <Text style={{ fontSize: FONT_XS, color: SUB, marginTop: normalize(8) }}>잠시 후 다시 시도해 주세요.</Text>
        </View>
      )}

      {state === 'normal' && data && (
        <ScrollView contentContainerStyle={{ paddingBottom: normalize(32) }} showsVerticalScrollIndicator={false}>
          {/* 상태 헤더 */}
          <View className="flex-row items-center" style={{ gap: normalize(8), paddingHorizontal: normalize(20), paddingTop: normalize(12) }}>
            <StatusBadge status={data.status} />
            <Text style={{ fontSize: FONT_XS, color: SUB }}>{data.timeText}</Text>
          </View>

          {/* 내가 보낸 메시지 */}
          <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(16) }}>
            <Text style={{ fontSize: FONT_XS, color: SUB, marginBottom: normalize(8) }}>나 · {data.my.timeText}</Text>
            <View
              className="self-start"
              style={{
                backgroundColor: BRAND_SOFT, padding: normalize(14),
                borderTopLeftRadius: normalize(16), borderTopRightRadius: normalize(16),
                borderBottomLeftRadius: normalize(16), borderBottomRightRadius: normalize(4),
              }}
            >
              <Text style={{ fontSize: FONT_SM, color: TEXT, lineHeight: normalize(22) }}>{data.my.text}</Text>
            </View>
          </View>

          {/* 운영팀 답변들 */}
          {data.replies.map((reply, i) => (
            <View key={i} style={{ paddingHorizontal: normalize(20), paddingTop: normalize(16) }}>
              <View className="flex-row items-center" style={{ gap: normalize(8), marginBottom: normalize(8) }}>
                <View className="items-center justify-center rounded-full" style={{ width: normalize(24), height: normalize(24), backgroundColor: TEXT }}>
                  <Text className="font-semibold text-white" style={{ fontSize: FONT_XS }}>PNG</Text>
                </View>
                <Text style={{ fontSize: FONT_XS, color: SUB }}>{reply.staffName ?? '고객지원팀'} · {reply.timeText}</Text>
              </View>

              <View
                className="self-start"
                style={{
                  backgroundColor: CARD, padding: normalize(14),
                  borderTopLeftRadius: normalize(16), borderTopRightRadius: normalize(16),
                  borderBottomLeftRadius: normalize(4), borderBottomRightRadius: normalize(16),
                }}
              >
                <Text style={{ fontSize: FONT_SM, color: TEXT, lineHeight: normalize(22) }}>{reply.text}</Text>
              </View>
            </View>
          ))}

          {/* 하단 액션 */}
          {data.status === 'answered' ? (
            <View className="bg-[#f5f5f7]" style={{ margin: normalize(20), marginTop: normalize(24), padding: normalize(14), borderRadius: normalize(12) }}>
              <Text style={{ fontSize: FONT_SM, color: '#555555', marginBottom: normalize(10) }}>이 답변이 도움이 되셨나요?</Text>
              <View className="flex-row" style={{ gap: normalize(8) }}>
                <Pressable onPress={handleResolved} className="flex-1 items-center justify-center bg-white rounded-lg" style={{ height: normalize(44) }}>
                  <Text className="font-semibold" style={{ fontSize: FONT_SM, color: TEXT }}>👍 해결됐어요</Text>
                </Pressable>
                <Pressable onPress={handleFollowUp} className="flex-1 items-center justify-center bg-white rounded-lg" style={{ height: normalize(44) }}>
                  <Text className="font-semibold" style={{ fontSize: FONT_SM, color: BRAND }}>추가 문의</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="bg-[#f5f5f7]" style={{ margin: normalize(20), marginTop: normalize(24), padding: normalize(14), borderRadius: normalize(12) }}>
              <Text style={{ fontSize: FONT_XS, color: SUB, lineHeight: normalize(20) }}>
                답변을 준비하고 있어요. 평균 24시간 이내에 답변드릴게요.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <Toast message={toastMessage} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
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
