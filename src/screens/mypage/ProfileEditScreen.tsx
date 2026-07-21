import React from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft, IconUser, IconPencil, IconCheck } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants/layout';

type Props = NativeStackScreenProps<MyPageStackParamList, 'ProfileEdit'>;

const BRAND = '#E31B59';
const SUB = '#8a8a8e';
const OK = '#5a9855';
const ERR = '#ff453a';
const BIO_MAX = 100;

const ORIGINAL = { nick: '사진가_준혁', handle: 'sunset_jk', bio: '야경과 바다를 사랑하는 아마추어 사진가' };

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const HELP: Record<'nick' | 'handle', Record<Status, string>> = {
  nick: {
    idle: '한글/영문/숫자 2~12자, 특수문자 불가',
    checking: '확인 중…',
    available: '사용 가능한 닉네임이에요',
    taken: '이미 사용 중인 닉네임이에요',
    invalid: '사용할 수 없는 닉네임이에요',
  },
  handle: {
    idle: '영문·숫자·언더바만 사용 가능, 변경 후 30일 이내 재변경 불가',
    checking: '확인 중…',
    available: '사용 가능한 핸들이에요',
    taken: '이미 사용 중인 핸들이에요',
    invalid: '사용할 수 없는 핸들이에요',
  },
};

export default function ProfileEditScreen({ navigation }: Props) {
  const [nick, setNick] = React.useState(ORIGINAL.nick);
  const [handle, setHandle] = React.useState(ORIGINAL.handle);
  const [bio, setBio] = React.useState(ORIGINAL.bio);
  const [nickStatus, setNickStatus] = React.useState<Status>('idle');
  const [handleStatus, setHandleStatus] = React.useState<Status>('idle');

  // 중복 확인 (mock — API 확정 시 교체). ponytail: 항상 available 반환.
  const checkField = (field: 'nick' | 'handle') => {
    const value = field === 'nick' ? nick : handle;
    if (!value) return;
    const setStatus = field === 'nick' ? setNickStatus : setHandleStatus;
    setStatus('checking');
    // TODO: GET /profile/check?{field}=... 로 교체
    setTimeout(() => setStatus('available'), 400);
  };

  const nickDirty = nick !== ORIGINAL.nick;
  const handleDirty = handle !== ORIGINAL.handle;
  const bioDirty = bio !== ORIGINAL.bio;

  let canSave = nickDirty || handleDirty || bioDirty;
  if (nickDirty && nickStatus !== 'available') canSave = false;
  if (handleDirty && handleStatus !== 'available') canSave = false;
  if (bio.length > BIO_MAX) canSave = false;

  const onSave = () => {
    if (!canSave) return;
    const doSave = () => {
      // TODO: PATCH /profile 로 교체
      Alert.alert('저장 완료', '프로필이 저장됐어요.', [{ text: '확인', onPress: () => navigation.goBack() }]);
    };
    if (handleDirty) {
      Alert.alert('핸들을 변경할까요?', '변경 후 30일 이내에는 다시 바꿀 수 없어요.', [
        { text: '취소', style: 'cancel' },
        { text: '변경', onPress: doSave },
      ]);
    } else {
      doSave();
    }
  };

  const onChangeAvatar = () => {
    // TODO: react-native-image-picker 연동 (현재 mock)
    Alert.alert('사진 변경', '앨범에서 사진을 선택해 주세요.');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View className="flex-row items-center border-b border-black/5" style={{ height: normalize(54), paddingHorizontal: normalize(12) }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <IconChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG, marginRight: normalize(40) }}>프로필 편집</Text>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: normalize(24) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* 아바타 */}
          <View className="items-center" style={{ paddingTop: normalize(16), paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
            <Pressable onPress={onChangeAvatar} style={{ marginBottom: normalize(12) }}>
              <LinearGradient colors={['#2c5364', '#4a7c8a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: normalize(88), height: normalize(88), borderRadius: normalize(44), alignItems: 'center', justifyContent: 'center' }}>
                <IconUser size={normalize(40)} color="rgba(255,255,255,0.75)" strokeWidth={2} />
              </LinearGradient>
              <View className="items-center justify-center" style={{ position: 'absolute', bottom: 0, right: 0, width: normalize(28), height: normalize(28), borderRadius: normalize(14), backgroundColor: BRAND, borderWidth: 2, borderColor: '#fff' }}>
                <IconPencil size={normalize(12)} color="#fff" strokeWidth={2} />
              </View>
            </Pressable>
            <Pressable onPress={onChangeAvatar} hitSlop={8}>
              <Text className="font-medium" style={{ fontSize: FONT_SM, color: BRAND }}>사진 변경</Text>
            </Pressable>
          </View>

          {/* 폼 */}
          <View style={{ paddingHorizontal: normalize(20) }}>
            {/* 닉네임 */}
            <View style={{ marginBottom: normalize(16) }}>
              <FieldLabel text="닉네임" />
              <View className="flex-row items-stretch" style={{ gap: normalize(8) }}>
                <TextInput
                  value={nick}
                  onChangeText={(t) => { setNick(t); setNickStatus('idle'); }}
                  maxLength={12}
                  className="flex-1 bg-[#f5f5f7] text-black"
                  style={{ height: normalize(52), borderRadius: normalize(12), paddingHorizontal: normalize(16), fontSize: FONT_MD }}
                />
                <CheckButton onPress={() => checkField('nick')} disabled={nickStatus === 'checking'} />
              </View>
              <FieldHelper field="nick" status={nickStatus} />
            </View>

            {/* 핸들 */}
            <View style={{ marginBottom: normalize(16) }}>
              <FieldLabel text="핸들 (고유 ID)" />
              <View className="flex-row items-stretch" style={{ gap: normalize(8) }}>
                <View className="flex-1 flex-row items-center bg-[#f5f5f7]" style={{ height: normalize(52), borderRadius: normalize(12), paddingHorizontal: normalize(16) }}>
                  <Text className="font-medium" style={{ fontSize: FONT_MD, color: SUB, marginRight: normalize(2) }}>@</Text>
                  <TextInput
                    value={handle}
                    onChangeText={(t) => { setHandle(t); setHandleStatus('idle'); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="flex-1 p-0 text-black"
                    style={{ fontSize: FONT_MD }}
                  />
                </View>
                <CheckButton onPress={() => checkField('handle')} disabled={handleStatus === 'checking'} />
              </View>
              <FieldHelper field="handle" status={handleStatus} />
            </View>

            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: normalize(16) }} />

            {/* 자기소개 */}
            <View style={{ marginBottom: normalize(16) }}>
              <FieldLabel text="자기소개" />
              <TextInput
                value={bio}
                onChangeText={setBio}
                maxLength={BIO_MAX}
                multiline
                placeholder="나를 표현하는 한 줄을 적어주세요"
                placeholderTextColor="rgba(0,0,0,0.25)"
                className="bg-[#f5f5f7] text-black"
                style={{ height: normalize(96), borderRadius: normalize(12), padding: normalize(14), fontSize: FONT_MD, lineHeight: normalize(22), textAlignVertical: 'top' }}
              />
              <Text className="text-right" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.25)', marginTop: normalize(4) }}>
                {bio.length}/{BIO_MAX}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 저장 */}
        <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(10), paddingBottom: normalize(14) }}>
          <Pressable
            onPress={onSave}
            disabled={!canSave}
            className="items-center justify-center"
            style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: canSave ? BRAND : '#f5f5f7' }}
          >
            <Text className="font-semibold" style={{ fontSize: FONT_MD, color: canSave ? '#fff' : '#c7c7cc' }}>저장</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text className="font-medium" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', marginBottom: normalize(8) }}>{text}</Text>;
}

function CheckButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="items-center justify-center bg-[#f5f5f7]"
      style={{ paddingHorizontal: normalize(16), borderRadius: normalize(12), opacity: disabled ? 0.5 : 1 }}
    >
      <Text className="font-medium" style={{ fontSize: FONT_SM, color: '#111' }}>중복 확인</Text>
    </Pressable>
  );
}

function FieldHelper({ field, status }: { field: 'nick' | 'handle'; status: Status }) {
  const ok = status === 'available';
  const err = status === 'taken' || status === 'invalid';
  const color = ok ? OK : err ? ERR : SUB;
  return (
    <View className="flex-row items-center" style={{ gap: normalize(4), marginTop: normalize(8) }}>
      {ok && <IconCheck size={normalize(14)} color={OK} strokeWidth={2} />}
      <Text style={{ fontSize: FONT_XS, color }}>{HELP[field][status]}</Text>
    </View>
  );
}
