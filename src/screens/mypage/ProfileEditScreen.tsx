import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft, IconUser, IconPencil } from '@tabler/icons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants/layout';
import Toast from '@/components/auth/Toast';

export default function ProfileEditScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [nickname, setNickname] = useState('사진가_준혁');
  const [isNicknameOk, setIsNicknameOk] = useState(false);
  const [handle, setHandle] = useState('@sunset_jk');
  const [bio, setBio] = useState('야경과 바다를 사랑하는 아마추어 사진가');
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  const handleAvatarChange = () => {
    showToast('앨범에서 사진을 선택해주세요');
  };

  const handleNicknameChange = (text: string) => {
    setNickname(text);
    setIsNicknameOk(false);
  };

  const checkNickname = () => {
    setIsNicknameOk(true);
    showToast('사용 가능한 닉네임이에요');
  };

  const saveProfile = () => {
    showToast('프로필이 저장됐어요 ✓');
    setTimeout(() => {
      if (navigation.canGoBack()) navigation.goBack();
    }, 1200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      {/* Navigation Bar */}
      <View style={{ height: normalize(54), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: normalize(20), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: normalize(36), height: normalize(36), alignItems: 'center', justifyContent: 'center', marginLeft: -normalize(8) }}>
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="font-semibold text-black tracking-tight" style={{ fontSize: normalizeFontSize(18) }}>
          프로필 편집
        </Text>
        <View style={{ width: normalize(36) }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: normalize(120) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Avatar Section */}
          <View style={{ alignItems: 'center', paddingTop: normalize(28), paddingBottom: normalize(24) }}>
            <TouchableOpacity activeOpacity={0.8} onPress={handleAvatarChange} style={{ marginBottom: normalize(12), position: 'relative' }}>
              <LinearGradient
                colors={['#2c5364', '#4a7c8a']}
                style={{
                  width: normalize(88),
                  height: normalize(88),
                  borderRadius: normalize(44),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconUser size={normalize(40)} color="rgba(255,255,255,0.75)" strokeWidth={1.5} />
              </LinearGradient>
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: normalize(28),
                  height: normalize(28),
                  borderRadius: normalize(14),
                  backgroundColor: '#e31b59',
                  borderWidth: 2,
                  borderColor: '#fff',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconPencil size={normalize(14)} color="#fff" strokeWidth={2} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAvatarChange}>
              <Text className="font-medium tracking-tight" style={{ fontSize: FONT_SM, color: '#e31b59' }}>
                사진 변경
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={{ paddingHorizontal: normalize(20) }}>
            
            {/* Nickname */}
            <View style={{ marginBottom: normalize(20) }}>
              <Text className="font-medium tracking-tight" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', marginBottom: normalize(8) }}>
                닉네임
              </Text>
              <View style={{ flexDirection: 'row', gap: normalize(8) }}>
                <TextInput
                  value={nickname}
                  onChangeText={handleNicknameChange}
                  maxLength={12}
                  style={{
                    flex: 1,
                    height: normalize(52),
                    borderRadius: normalize(12),
                    backgroundColor: '#f8f8f9',
                    paddingHorizontal: normalize(16),
                    fontSize: FONT_MD,
                    color: '#000',
                  }}
                />
                <TouchableOpacity
                  onPress={checkNickname}
                  style={{
                    height: normalize(50),
                    paddingHorizontal: normalize(16),
                    borderRadius: normalize(12),
                    backgroundColor: isNicknameOk ? 'rgba(52,199,89,0.1)' : 'rgba(227,27,89,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text className="font-medium tracking-tight" style={{ fontSize: FONT_SM, color: isNicknameOk ? '#34c759' : '#e31b59' }}>
                    {isNicknameOk ? '사용 가능 ✓' : '중복확인'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)', marginTop: normalize(6) }}>
                한글/영문/숫자 2~12자, 특수문자 불가
              </Text>
            </View>

            {/* Handle */}
            <View style={{ marginBottom: normalize(20) }}>
              <Text className="font-medium tracking-tight" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', marginBottom: normalize(8) }}>
                핸들 (고유 ID)
              </Text>
              <TextInput
                value={handle}
                onChangeText={setHandle}
                placeholder="@아이디"
                placeholderTextColor="rgba(0,0,0,0.25)"
                style={{
                  height: normalize(52),
                  borderRadius: normalize(12),
                  backgroundColor: '#f8f8f9',
                  paddingHorizontal: normalize(16),
                  fontSize: FONT_MD,
                  color: '#000',
                }}
              />
              <Text className="tracking-tight" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)', marginTop: normalize(6) }}>
                영문·숫자·언더바만 사용 가능, 변경 후 30일 이내 재변경 불가
              </Text>
            </View>

            <View style={{ height: 0.5, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: normalize(24) }} />

            {/* Bio */}
            <View style={{ marginBottom: normalize(20) }}>
              <Text className="font-medium tracking-tight" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.45)', marginBottom: normalize(8) }}>
                한 줄 소개
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                maxLength={100}
                multiline
                placeholder="나를 소개해보세요"
                placeholderTextColor="rgba(0,0,0,0.25)"
                style={{
                  height: normalize(96),
                  borderRadius: normalize(12),
                  backgroundColor: '#f8f8f9',
                  paddingHorizontal: normalize(16),
                  paddingTop: normalize(14),
                  paddingBottom: normalize(14),
                  fontSize: FONT_MD,
                  color: '#000',
                  textAlignVertical: 'top',
                }}
              />
              <Text style={{ textAlign: 'right', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.25)', marginTop: normalize(4) }}>
                {bio.length}/100
              </Text>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Save Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <LinearGradient
          colors={['transparent', '#fff', '#fff']}
          locations={[0, 0.4, 1]}
          style={{
            paddingHorizontal: normalize(20),
            paddingTop: normalize(24),
            paddingBottom: Math.max(insets.bottom, normalize(24)),
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={saveProfile}
            style={{
              height: BUTTON_HEIGHT,
              borderRadius: BUTTON_RADIUS,
              backgroundColor: '#e31b59',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text className="font-medium text-white tracking-tight" style={{ fontSize: normalizeFontSize(16) }}>
              저장하기
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Toast */}
      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </View>
  );
}
