import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft, IconChevronRight, IconMessageCheck } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { useCreateInquiry } from '@/hooks/useInquiries';
import { INQUIRY_TYPES, getInquiryTypeLabel } from '@/types/inquiry';
import OptionSheet from '@/components/common/OptionSheet';
import LinkBanner from '@/components/common/LinkBanner';
import { normalize } from '@/utils/normalize';
import {
  FONT_XS,
  FONT_SM,
  FONT_MD,
  FONT_LG,
  GRID_PADDING,
  BUTTON_HEIGHT,
  BUTTON_RADIUS,
} from '@/constants/layout';
import { BRAND, CARD, TEXT_SUB } from '@/constants/colors';

type Props = NativeStackScreenProps<MyPageStackParamList, 'ComposeInquiry'>;

const MAX_LEN = 1000;
// ponytail: 백엔드 InquiryCreateRequest @Size(max = 150)와 맞춘 값
const TITLE_MAX_LEN = 150;
const TYPE_LABELS = INQUIRY_TYPES.map((t) => t.label);

export default function ComposeInquiryScreen({ navigation }: Props) {
  const createInquiryMutation = useCreateInquiry();

  const [selectedTypeCode, setSelectedTypeCode] = useState('FEATURE');
  const [typeSheetVisible, setTypeSheetVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const selectedLabel = getInquiryTypeLabel(selectedTypeCode);
  const canSend = title.trim().length > 0 && message.trim().length > 0 && !createInquiryMutation.isPending;

  const handleSubmit = () => {
    if (!canSend) return;

    createInquiryMutation.mutate(
      {
        type: selectedTypeCode,
        title: title.trim(),
        content: message.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert('문의 등록 완료', '1:1 문의가 정상적으로 등록되었습니다.', [
            { text: '확인', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (err) => {
          Alert.alert('문의 등록 실패', err.message || '등록 중 오류가 발생했습니다.');
        },
      }
    );
  };

  const handleSelectLabel = (label: string) => {
    const item = INQUIRY_TYPES.find((t) => t.label === label);
    if (item) {
      setSelectedTypeCode(item.code);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Nav */}
        <View
          className="flex-row items-center justify-between"
          style={{ height: normalize(52), paddingHorizontal: normalize(12) }}
        >
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            className="items-center justify-center rounded-full"
            style={{ width: normalize(36), height: normalize(36) }}
          >
            <IconChevronLeft size={normalize(20)} color="rgba(0,0,0,0.7)" strokeWidth={1.75} />
          </Pressable>
          <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG }}>
            1:1 문의 작성
          </Text>
          <View style={{ width: normalize(36) }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: normalize(32) }} showsVerticalScrollIndicator={false}>
          {/* 안내 배너 */}
          <LinkBanner
            icon={IconMessageCheck}
            title="내 1:1 문의 목록"
            subtitle="답변이 등록되면 알림으로 알려드려요"
            marginTop={normalize(8)}
            onPress={() => navigation.navigate('Inquiry')}
          />

          {/* 문의 유형 */}
          <FieldLabel text="문의 유형" required />
          <Pressable
            onPress={() => setTypeSheetVisible(true)}
            className="flex-row items-center bg-card"
            style={{
              marginHorizontal: GRID_PADDING,
              borderRadius: normalize(12),
              paddingHorizontal: normalize(16),
              height: BUTTON_HEIGHT,
            }}
          >
            <Text
              className="flex-1"
              style={{
                fontSize: FONT_MD,
                fontFamily: selectedLabel ? 'Pretendard-Medium' : 'Pretendard-Regular',
                color: selectedLabel ? '#111111' : '#c7c7cc',
              }}
            >
              {selectedLabel || '유형을 선택해주세요'}
            </Text>
            <IconChevronRight size={normalize(18)} color={TEXT_SUB} strokeWidth={1.75} />
          </Pressable>

          {/* 문의 제목 */}
          <FieldLabel text="문의 제목" required />
          <View
            className="flex-row items-center bg-card"
            style={{
              marginHorizontal: GRID_PADDING,
              borderRadius: normalize(12),
              paddingHorizontal: normalize(16),
              height: BUTTON_HEIGHT,
              gap: normalize(8),
            }}
          >
            <TextInput
              value={title}
              onChangeText={setTitle}
              maxLength={TITLE_MAX_LEN}
              placeholder="제목을 입력해 주세요"
              placeholderTextColor="#c7c7cc"
              className="flex-1 text-black"
              style={{
                fontSize: FONT_MD,
                fontFamily: 'Pretendard-Medium',
                padding: 0,
              }}
            />
            <Text style={{ fontSize: FONT_XS, color: TEXT_SUB }}>
              {title.length}/{TITLE_MAX_LEN}
            </Text>
          </View>

          {/* 문의 내용 */}
          <FieldLabel text="문의 내용" required />
          <View
            className="bg-card"
            style={{
              marginHorizontal: GRID_PADDING,
              borderRadius: normalize(12),
              padding: normalize(14),
            }}
          >
            <TextInput
              multiline
              value={message}
              onChangeText={(t) => setMessage(t.slice(0, MAX_LEN))}
              placeholder="문의 내용을 자세히 적어주세요 (예: 발생 상황, 기기 모델 등)"
              placeholderTextColor="#c7c7cc"
              className="text-black"
              style={{
                // 높이를 고정해 박스가 자체 스크롤하게 둔다 — 네이티브가 커서를 알아서 따라간다
                // (무한히 늘어나면 부모 ScrollView를 손으로 내려야 함). ReviewWriteScreen과 같은 패턴.
                height: normalize(200),
                textAlignVertical: 'top',
                fontSize: FONT_MD,
                fontFamily: 'Pretendard-Regular',
                lineHeight: normalize(22),
                padding: 0,
              }}
            />
            <Text className="text-right" style={{ fontSize: FONT_XS, color: TEXT_SUB, marginTop: normalize(8) }}>
              {message.length}/{MAX_LEN}
            </Text>
          </View>

          {/* CTA — 내용이 길어지면 같이 밀려 내려가도록 스크롤 흐름 안에 둔다 */}
          <View style={{ marginTop: normalize(24), paddingHorizontal: GRID_PADDING }}>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSend}
              className="items-center justify-center"
              style={{
                height: BUTTON_HEIGHT,
                borderRadius: BUTTON_RADIUS,
                backgroundColor: canSend ? BRAND : CARD,
              }}
            >
              {createInquiryMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className="font-semibold"
                  style={{
                    fontSize: FONT_MD,
                    fontFamily: 'Pretendard-SemiBold',
                    color: canSend ? '#fff' : '#c7c7cc',
                  }}
                >
                  문의 보내기
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>

        <OptionSheet
          visible={typeSheetVisible}
          title="문의 유형"
          options={TYPE_LABELS}
          selected={selectedLabel}
          onSelect={handleSelectLabel}
          onClose={() => setTypeSheetVisible(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <View
      className="flex-row items-center"
      style={{
        gap: normalize(4),
        paddingHorizontal: GRID_PADDING,
        paddingTop: normalize(20),
        paddingBottom: normalize(8),
      }}
    >
      <Text style={{ fontSize: FONT_SM, color: TEXT_SUB, fontFamily: 'Pretendard-Medium' }}>{text}</Text>
      {required && <Text style={{ fontSize: FONT_SM, color: BRAND }}>*</Text>}
    </View>
  );
}
