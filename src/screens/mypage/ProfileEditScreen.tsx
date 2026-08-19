import React from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardOverlap } from '@/hooks/useKeyboardHeight';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft, IconPencil, IconCheck } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG, BUTTON_HEIGHT, BUTTON_RADIUS, TAB_BAR_HEIGHT } from '@/constants/layout';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useMyProfile, useUpdateMyProfile, useUpdateProfileImage, useDeleteProfileImage } from '@/hooks/useUser';
import * as ImagePicker from 'expo-image-picker';
import type { ProfileImageUpload } from '@/types/user';
import Avatar from '@/components/common/Avatar';
import { NICK_MAX, NICK_HELP as NICK_HELP_TEXT, nicknameError } from '@/constants/validation';

type Props = NativeStackScreenProps<MyPageStackParamList, 'ProfileEdit'>;

const BRAND = '#E31B59';
const SUB = '#8a8a8e';
const OK = '#5a9855';
const ERR = '#ff453a';
const BIO_MAX = 100;

/** `invalid`는 사유 문구를 따로 들고 다닌다 — 무엇이 잘못됐는지가 고칠 행동을 결정한다. */
type Status = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

// 핸들(고유 ID) 필드는 없앴다 — 서버에 핸들 컬럼이 없고 닉네임이 이미 유니크라 중복 정보였다.
const NICK_HELP: Record<Exclude<Status, 'invalid'>, string> = {
  idle: NICK_HELP_TEXT,
  checking: '확인 중…',
  available: '사용 가능한 닉네임이에요',
  taken: '이미 사용 중인 닉네임이에요',
  // 형식 문제와 구분한다 — 사용자가 닉네임을 고쳐도 해결되지 않는다.
  error: '확인하지 못했어요. 잠시 후 다시 시도해 주세요',
};

export default function ProfileEditScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardOverlap = useKeyboardOverlap();

  const authUser = useAuthStore((s) => s.user);
  const { data: profile } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const updateImage = useUpdateProfileImage();
  const deleteImage = useDeleteProfileImage();

  const initialNick = profile?.nickname || authUser?.nickname || '사용자';
  // 자기소개는 이제 서버 값이다. 비어 있으면 플레이스홀더만 보여주고 값은 빈 문자열로 둔다.
  const initialBio = profile?.bio ?? authUser?.bio ?? '';

  const keyboardLift = Math.max(0, keyboardOverlap - (TAB_BAR_HEIGHT + insets.bottom));

  const scrollRef = React.useRef<ScrollView>(null);
  const focusBio = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const [nick, setNick] = React.useState(initialNick);
  const [bio, setBio] = React.useState(initialBio);
  const [nickStatus, setNickStatus] = React.useState<Status>('idle');
  const [nickReason, setNickReason] = React.useState('');
  /**
   * 고르기만 하고 아직 안 올린 사진. 저장 버튼을 눌러야 실제로 반영된다 —
   * 사진만 즉시 반영하면 한 화면에 "바로 적용"과 "저장해야 적용" 두 규칙이 생긴다.
   */
  const [pendingImage, setPendingImage] = React.useState<ProfileImageUpload | null>(null);
  /** 사진 삭제를 골랐는지. 이것도 저장 시점에 반영한다. */
  const [imageRemoved, setImageRemoved] = React.useState(false);

  const checkNickname = () => {
    if (!nick) return;
    // 서버의 /auth/nickname/check는 중복만 본다 — 형식은 여기서 먼저 거른다.
    // 안 거르면 '!!!' 같은 값이 '사용 가능'으로 뜨고 저장 시점에야 400이 난다.
    const reason = nicknameError(nick);
    if (reason) {
      setNickReason(reason);
      setNickStatus('invalid');
      return;
    }
    setNickStatus('checking');
    authApi
      .checkNickname(nick)
      .then((res) => setNickStatus(res.available ? 'available' : 'taken'))
      // 통신 실패를 형식 오류로 뭉치면 사용자가 멀쩡한 닉네임을 계속 고치게 된다.
      .catch(() => setNickStatus('error'));
  };

  const nickDirty = nick !== initialNick;
  const bioDirty = bio !== initialBio;
  const imageDirty = pendingImage !== null || imageRemoved;
  const saving = updateProfile.isPending || updateImage.isPending || deleteImage.isPending;

  let canSave = nickDirty || bioDirty || imageDirty;
  if (nickDirty && nickStatus !== 'available') canSave = false;
  if (bio.length > BIO_MAX) canSave = false;
  if (saving) canSave = false;

  /** 미리보기: 고른 사진 > 삭제 예약 > 서버 사진 순. */
  const previewImageUrl = pendingImage?.uri ?? (imageRemoved ? null : profile?.profileImageUrl);

  const onSave = async () => {
    if (!canSave) return;
    try {
      // 사진을 먼저 처리한다. 여기서 실패하면 아무것도 바뀌지 않은 상태로 멈춘다 —
      // 용량·네트워크 문제로 실패할 확률이 닉네임 저장보다 높다.
      if (pendingImage) {
        await updateImage.mutateAsync(pendingImage);
      } else if (imageRemoved) {
        await deleteImage.mutateAsync();
      }

      if (nickDirty || bioDirty) {
        // PUT /users/me는 전체 교체다 — 바꾸지 않은 값까지 함께 보내야 서버에서 비워지지 않는다.
        // 사진은 예외다. 서버가 준 값은 presigned URL이라 되돌려 보내면 죽은 URL이 저장되므로,
        // 전용 경로(PATCH/DELETE /users/me/profile-image)로만 바꾼다.
        await updateProfile.mutateAsync({ nickname: nick, bio: bio.trim() || null });
      }

      setPendingImage(null);
      setImageRemoved(false);
      Alert.alert('저장 완료', '프로필이 저장됐어요.', [{ text: '확인', onPress: () => navigation.goBack() }]);
    } catch {
      // 사진만 올라가고 닉네임이 실패했을 수 있다. 다시 저장을 누르면 사진은 새로 올라가고
      // 직전 것은 서버가 지우므로(updateProfileImage) 남는 파일 없이 재시도된다.
      Alert.alert('저장 실패', '프로필을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const pickAvatar = async () => {
    if (saving) return;
    // iOS PHPickerViewController는 앱 프로세스 밖에서 뜨므로 권한 요청이 필요 없다.
    if (Platform.OS === 'android') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          '사진 접근 권한 필요',
          '설정에서 사진 접근을 허용해 주세요.',
          permission.canAskAgain
            ? [{ text: '확인' }]
            : [{ text: '취소', style: 'cancel' }, { text: '설정 열기', onPress: () => Linking.openSettings() }],
        );
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // 아바타는 원형으로 잘려 보이므로 정사각으로 받는다(aspect는 안드로이드 전용,
      // iOS는 allowsEditing이면 항상 정사각이다).
      allowsEditing: true,
      aspect: [1, 1],
      // 게시글·리뷰와 달리 EXIF를 쓸 일이 없다. 작을수록 좋으므로 압축한다.
      quality: 0.8,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;
    const ext = asset.uri.split('.').pop()?.toLowerCase();
    const safeExt = ext && /^(jpe?g|png|heic|webp)$/.test(ext) ? ext : 'jpg';
    // 여기서 올리지 않는다 — 저장 버튼을 눌러야 반영된다.
    setPendingImage({
      uri: asset.uri,
      name: `profile.${safeExt}`,
      type: safeExt === 'png' ? 'image/png' : safeExt === 'webp' ? 'image/webp' : 'image/jpeg',
    });
    setImageRemoved(false);
  };

  const onChangeAvatar = () => {
    if (saving) return;
    // 보여줄 사진이 없으면 고를 것만 있으면 되고, 있으면 삭제 선택지가 필요하다.
    if (!previewImageUrl) {
      void pickAvatar();
      return;
    }
    Alert.alert('프로필 사진', undefined, [
      { text: '앨범에서 선택', onPress: () => void pickAvatar() },
      {
        text: '사진 삭제',
        style: 'destructive',
        onPress: () => {
          setPendingImage(null);
          // 서버에 사진이 없는데(고른 것만 취소된 상태) 삭제를 예약하면 저장할 게 없다.
          setImageRemoved(!!profile?.profileImageUrl);
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
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

      {/* KeyboardAvoidingView를 쓰지 않는다 — 축소량이 부정확해 자기소개 입력창이 계속 잘렸다.
          키보드 상단까지를 직접 재서 그만큼 컨테이너를 줄인다(keyboardLift 주석). */}
      <View className="flex-1" style={{ paddingBottom: keyboardLift }}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: normalize(24) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* 아바타 */}
          <View className="items-center" style={{ paddingTop: normalize(16), paddingHorizontal: normalize(20), paddingBottom: normalize(16) }}>
            <Pressable onPress={onChangeAvatar} disabled={saving} style={{ marginBottom: normalize(12) }}>
              <Avatar userId={profile?.id ?? authUser?.id} nickname={nick} imageUrl={previewImageUrl} size={88} />
              {saving && (
                <View
                  className="items-center justify-center"
                  style={{ position: 'absolute', top: 0, left: 0, width: normalize(88), height: normalize(88), borderRadius: normalize(44), backgroundColor: 'rgba(0,0,0,0.35)' }}
                >
                  <ActivityIndicator color="#fff" />
                </View>
              )}
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
            {/* 아래 여백은 구분선의 marginVertical이 맡는다 — 여기에 marginBottom을 더하면
                도움말↔구분선(32)이 구분선↔자기소개(16)의 두 배가 되어 어긋난다. */}
            <View>
              <FieldLabel text="닉네임" />
              <View className="flex-row items-stretch" style={{ gap: normalize(8) }}>
                <TextInput
                  value={nick}
                  onChangeText={(t) => { setNick(t); setNickStatus('idle'); }}
                  maxLength={NICK_MAX}
                  className="flex-1 bg-[#f5f5f7] text-black"
                  style={{ height: normalize(52), borderRadius: normalize(12), paddingHorizontal: normalize(16), fontSize: FONT_MD }}
                />
                <CheckButton onPress={checkNickname} disabled={nickStatus === 'checking'} />
              </View>
              <FieldHelper status={nickStatus} reason={nickReason} />
            </View>

            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: normalize(16) }} />

            {/* 자기소개 */}
            <View style={{ marginBottom: normalize(16) }}>
              <FieldLabel text="자기소개" />
              <TextInput
                value={bio}
                onChangeText={setBio}
                onFocus={focusBio}
                maxLength={BIO_MAX}
                multiline
                placeholder="안녕하세요! 사진과 일상을 기록하는 것을 좋아합니다!"
                placeholderTextColor="rgba(0,0,0,0.25)"
                className="bg-[#f5f5f7] text-black"
                style={{ height: normalize(96), borderRadius: normalize(12), padding: normalize(14), fontSize: normalizeFontSize(14), lineHeight: normalize(22), textAlignVertical: 'top' }}
              />
              <Text className="text-right" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.25)', marginTop: normalize(4) }}>
                {bio.length}/{BIO_MAX}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 저장 */}
        {/* insets.bottom을 더하지 않는다 — 탭바가 자기 paddingBottom으로 이미 덮는다
            (docs/guide/dev/bottom-tab-usage.md 규칙 1). */}
        <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(10), paddingBottom: normalize(14) }}>
          <Pressable
            onPress={onSave}
            disabled={!canSave}
            className="items-center justify-center"
            style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, backgroundColor: canSave ? BRAND : '#f5f5f7' }}
          >
            <Text className="font-semibold" style={{ fontSize: FONT_MD, color: canSave ? '#fff' : '#c7c7cc' }}>
              {saving ? '저장 중...' : '저장'}
            </Text>
          </Pressable>
        </View>
      </View>
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

function FieldHelper({ status, reason }: { status: Status; reason: string }) {
  const ok = status === 'available';
  const err = status === 'taken' || status === 'invalid' || status === 'error';
  const color = ok ? OK : err ? ERR : SUB;
  const text = status === 'invalid' ? reason : NICK_HELP[status];
  return (
    <View className="flex-row items-center" style={{ gap: normalize(4), marginTop: normalize(8) }}>
      {ok && <IconCheck size={normalize(14)} color={OK} strokeWidth={2} />}
      <Text style={{ fontSize: FONT_XS, color }}>{text}</Text>
    </View>
  );
}
