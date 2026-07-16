import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_SM, FONT_MD, FONT_LG, BUTTON_HEIGHT, BUTTON_RADIUS } from '@/constants/layout';
import CustomToggle from '@/components/common/CustomToggle';
import { useAuthStore } from '@/store/useAuthStore';
import FAQAccordion from './components/FAQAccordion';
import EmailSheet from './components/sheets/EmailSheet';
import PwSheet from './components/sheets/PwSheet';
import ThemeSheet from './components/sheets/ThemeSheet';
import SocialSheet from './components/sheets/SocialSheet';
import VersionSheet from './components/sheets/VersionSheet';
import { LogoutModal } from './components/sheets/SettingModals';
import { getMessaging, AuthorizationStatus } from '@react-native-firebase/messaging';

import {
  IconChevronLeft, IconChevronRight, IconUser, IconMail, IconLock,
  IconHeart, IconLink, IconBell, IconSun, IconMessageCircle,
  IconMapPin, IconUserOff, IconInfoCircle, IconHeadset, IconInfoSquareRounded,
  IconLogout, IconUserX
} from '@tabler/icons-react-native';

const FAQS = [
  { q: '포토제닉 점수는 어떻게 계산되나요?', a: '포토제닉 점수는 촬영 시간대, 날씨 조건, 스팟 방문 빈도, 커뮤니티 반응(좋아요·저장 수) 등을 종합해 산출돼요. 골든아워에 맑은 날 찍은 사진일수록 높은 점수를 받을 수 있어요.' },
  { q: '위시리스트 알림이 오지 않아요.', a: '설정 → 알림에서 위시리스트 알림이 켜져 있는지 확인해주세요. 기기 설정에서 PNG 앱의 알림 권한도 허용되어 있어야 해요. 그래도 오지 않는다면 1:1 문의로 연락해주세요.' },
  { q: '스팟 등록 후 반영까지 얼마나 걸리나요?', a: '등록된 스팟은 검토 후 보통 1~3 영업일 이내에 지도에 반영돼요. 검토 중 반려될 경우 사유와 함께 알림이 발송돼요.' },
  { q: '게시물이나 댓글을 신고하려면?', a: '게시물 또는 댓글 우측 상단의 ··· 버튼을 탭하면 신고 옵션이 나타나요. 신고 접수 후 24시간 이내 검토해드려요.' },
];

const SettingRow = ({ icon, label, desc, rightText, onPress, isDanger = false, toggleValue, onToggle }: any) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    disabled={!onPress && onToggle === undefined}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: normalize(14),
      paddingHorizontal: normalize(16),
      borderTopWidth: 0.5,
      borderTopColor: 'rgba(0,0,0,0.05)'
    }}
  >
    <View style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(9), backgroundColor: isDanger ? 'rgba(255, 69, 58, 0.08)' : 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: normalize(12) }}>
      {icon}
    </View>
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Text className="font-medium tracking-tight" style={{ fontSize: FONT_MD, color: isDanger ? '#ff453a' : '#000' }}>
        {label}
      </Text>
      {desc && <Text className="tracking-tight mt-0.5" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.38)' }}>{desc}</Text>}
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
      {rightText && <Text style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)' }}>{rightText}</Text>}
      {toggleValue !== undefined ? (
        <CustomToggle value={toggleValue} onValueChange={onToggle} />
      ) : (
        <IconChevronRight size={normalize(14)} color={isDanger ? '#ff453a' : 'rgba(0,0,0,0.2)'} strokeWidth={2} />
      )}
    </View>
  </TouchableOpacity>
);

export default function SettingScreen() {
  const navigation = useNavigation();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Sheets state
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  
  // Toggles state
  const [toggles, setToggles] = useState({
    wishlist: true,
    goldenHour: true,
    community: false,
  });

  // Inquiry state
  const [inquiryText, setInquiryText] = useState('');

  const closeSheet = () => setActiveSheet(null);
  const openSheet = (sheetName: string) => setActiveSheet(sheetName);

  // 1. 컴포넌트 마운트 시 권한 상태 확인 후 토글 덮어쓰기
  React.useEffect(() => {
    async function checkPushPermission() {
      const messaging = getMessaging();
      const authStatus = await messaging.hasPermission();
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      
      if (!enabled) {
        setToggles({ wishlist: false, goldenHour: false, community: false });
      }
    }
    checkPushPermission();
  }, []);

  const handleToggle = async (key: keyof typeof toggles) => {
    // 2. 권한 거부 상태에서 켜려고 할 때 경고창 띄우기
    if (!toggles[key]) {
      const messaging = getMessaging();
      const authStatus = await messaging.hasPermission();
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      
      if (!enabled) {
        Alert.alert('알림', '시스템 설정에서 앱의 알림 권한을 허용해주세요.');
        return;
      }
    }
    
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const submitInquiry = () => {
    if (!inquiryText.trim()) {
      Alert.alert('알림', '문의 내용을 입력해주세요.');
      return;
    }
    Alert.alert('완료', '문의가 접수됐어요 ✓');
    setInquiryText('');
  };



  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
      {/* Nav */}
      <View style={{ height: normalize(54), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: normalize(16), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: normalize(36), height: normalize(36), alignItems: 'center', justifyContent: 'center' }}>
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.5)" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG }}>설정</Text>
        <View style={{ width: normalize(36) }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: normalize(40) }} showsVerticalScrollIndicator={false}>
        
        {/* 계정 */}
        <View style={{ paddingTop: normalize(24), paddingHorizontal: normalize(20) }}>
          <Text className="font-semibold" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.3)', marginBottom: normalize(8), letterSpacing: 0.4 }}>계정</Text>
          <View style={{ borderRadius: normalize(16), backgroundColor: '#f8f8f9', overflow: 'hidden' }}>
            <SettingRow icon={<IconUser size={normalize(16)} color="rgba(0,0,0,0.4)" />} label="프로필 편집" desc="이미지, 닉네임, 소개 수정" onPress={() => navigation.navigate('ProfileEdit' as never)} />
            <SettingRow icon={<IconMail size={normalize(16)} color="rgba(0,0,0,0.4)" />} label="이메일 변경" desc="sunset_jk@gmail.com" onPress={() => openSheet('email')} />
            <SettingRow icon={<IconLock size={normalize(16)} color="rgba(0,0,0,0.4)" />} label="비밀번호 변경" onPress={() => openSheet('pw')} />
            <SettingRow icon={<IconHeart size={normalize(16)} color="#e31b59" />} label="관심 테마" desc="홈 피드 및 추천에 반영" onPress={() => openSheet('theme')} />
            <SettingRow icon={<IconLink size={normalize(16)} color="rgba(0,0,0,0.4)" />} label="연결된 소셜 계정" desc="카카오 연결됨" onPress={() => openSheet('social')} />
          </View>
        </View>

        {/* 알림 */}
        <View style={{ paddingTop: normalize(24), paddingHorizontal: normalize(20) }}>
          <Text className="font-semibold" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.3)', marginBottom: normalize(8), letterSpacing: 0.4 }}>알림</Text>
          <View style={{ borderRadius: normalize(16), backgroundColor: '#f8f8f9', overflow: 'hidden' }}>
            <SettingRow icon={<IconBell size={normalize(16)} color="#e31b59" />} label="위시리스트 알림" desc="조건 충족 시 알림" toggleValue={toggles.wishlist} onToggle={() => handleToggle('wishlist')} />
            <SettingRow icon={<IconSun size={normalize(16)} color="#ff9f0a" />} label="골든아워 알림" desc="일출·일몰 30분 전" toggleValue={toggles.goldenHour} onToggle={() => handleToggle('goldenHour')} />
            <SettingRow icon={<IconMessageCircle size={normalize(16)} color="#3b82f6" />} label="커뮤니티 알림" desc="좋아요, 댓글, 팔로우" toggleValue={toggles.community} onToggle={() => handleToggle('community')} />
          </View>
        </View>

        {/* 개인정보 및 보안 */}
        <View style={{ paddingTop: normalize(24), paddingHorizontal: normalize(20) }}>
          <Text className="font-semibold" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.3)', marginBottom: normalize(8), letterSpacing: 0.4 }}>개인정보 및 보안</Text>
          <View style={{ borderRadius: normalize(16), backgroundColor: '#f8f8f9', overflow: 'hidden' }}>
            <SettingRow icon={<IconMapPin size={normalize(16)} color="#34c759" />} label="위치 권한" desc="앱 사용 중 허용" rightText="허용됨" onPress={() => Alert.alert('알림', '시스템 설정 앱에서 위치 권한을 변경해주세요.')} />
            <SettingRow icon={<IconUserOff size={normalize(16)} color="rgba(0,0,0,0.4)" />} label="차단 목록" desc="차단한 사용자 관리" onPress={() => Alert.alert('알림', '차단 목록 기능은 추후 업데이트 될 예정입니다.')} />
          </View>
        </View>

        {/* 고객센터 */}
        <View style={{ paddingTop: normalize(24), paddingHorizontal: normalize(20) }}>
          <Text className="font-semibold" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.3)', marginBottom: normalize(8), letterSpacing: 0.4 }}>고객센터</Text>
          
          <View style={{ borderRadius: normalize(16), backgroundColor: '#f8f8f9', overflow: 'hidden', marginBottom: normalize(8) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(14), paddingHorizontal: normalize(16) }}>
              <View style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(9), backgroundColor: 'rgba(59, 130, 246, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: normalize(12) }}>
                <IconInfoCircle size={normalize(16)} color="#3b82f6" />
              </View>
              <Text className="font-medium text-black tracking-tight" style={{ fontSize: FONT_MD }}>자주 묻는 질문</Text>
            </View>
            {FAQS.map((faq, idx) => (
              <FAQAccordion key={idx} question={faq.q} answer={faq.a} isFirst={idx === 0} />
            ))}
          </View>

          <View style={{ borderRadius: normalize(16), backgroundColor: '#f8f8f9', overflow: 'hidden', marginBottom: normalize(8) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: normalize(14), paddingHorizontal: normalize(16) }}>
              <View style={{ width: normalize(32), height: normalize(32), borderRadius: normalize(9), backgroundColor: 'rgba(227, 27, 89, 0.08)', alignItems: 'center', justifyContent: 'center', marginRight: normalize(12) }}>
                <IconHeadset size={normalize(16)} color="#e31b59" />
              </View>
              <View>
                <Text className="font-medium text-black tracking-tight" style={{ fontSize: FONT_MD }}>1:1 문의</Text>
                <Text className="tracking-tight mt-0.5" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.38)' }}>평균 응답 시간 24시간 이내</Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: normalize(20), paddingBottom: normalize(24) }}>
              <Text className="font-medium tracking-tight mb-1.5" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)' }}>문의 내용</Text>
              <TextInput
                style={{
                  height: normalize(120),
                  borderRadius: normalize(12),
                  backgroundColor: '#fff',
                  padding: normalize(14),
                  fontSize: FONT_SM,
                  color: '#000',
                  textAlignVertical: 'top'
                }}
                multiline
                maxLength={500}
                placeholder="문의 내용을 자세히 적어주세요"
                placeholderTextColor="rgba(0,0,0,0.25)"
                value={inquiryText}
                onChangeText={setInquiryText}
              />
              <Text style={{ textAlign: 'right', fontSize: normalizeFontSize(10), color: 'rgba(0,0,0,0.25)', marginTop: normalize(4) }}>
                {inquiryText.length}/500
              </Text>
              <TouchableOpacity onPress={submitInquiry} className="w-full items-center justify-center bg-[#E31B59] mt-1" style={{ height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS }}>
                <Text className="font-medium text-white tracking-tight" style={{ fontSize: FONT_MD }}>문의 보내기</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ borderRadius: normalize(16), backgroundColor: '#f8f8f9', overflow: 'hidden' }}>
            <SettingRow icon={<IconInfoSquareRounded size={normalize(16)} color="rgba(0,0,0,0.4)" />} label="버전 정보" desc="v1.0.0 (최신)" onPress={() => openSheet('version')} />
          </View>
        </View>

        {/* 기타 */}
        <View style={{ paddingTop: normalize(24), paddingHorizontal: normalize(20) }}>
          <Text className="font-semibold" style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.3)', marginBottom: normalize(8), letterSpacing: 0.4 }}>기타</Text>
          <View style={{ borderRadius: normalize(16), backgroundColor: '#f8f8f9', overflow: 'hidden' }}>
            <SettingRow icon={<IconLogout size={normalize(16)} color="rgba(0,0,0,0.4)" />} label="로그아웃" onPress={() => openSheet('logout')} />
            <SettingRow icon={<IconUserX size={normalize(16)} color="#ff453a" />} label="회원 탈퇴" isDanger onPress={() => Alert.alert('알림', '회원 탈퇴 기능은 추후 업데이트 될 예정입니다.')} />
          </View>
        </View>

      </ScrollView>

      {/* Sheets & Modals */}
      <EmailSheet visible={activeSheet === 'email'} onClose={closeSheet} onSendAuth={(email, pw) => { closeSheet(); Alert.alert('완료', '인증 메일을 발송했어요 ✓'); }} />
      <PwSheet visible={activeSheet === 'pw'} onClose={closeSheet} onChangePw={(curr, newPw) => { closeSheet(); Alert.alert('완료', '비밀번호가 변경됐어요 ✓'); }} />
      <ThemeSheet visible={activeSheet === 'theme'} onClose={closeSheet} onSave={() => { closeSheet(); Alert.alert('완료', '관심 테마가 저장됐어요 ✓'); }} />
      <SocialSheet visible={activeSheet === 'social'} onClose={closeSheet} />
      <VersionSheet visible={activeSheet === 'version'} onClose={closeSheet} />
      
      <LogoutModal visible={activeSheet === 'logout'} onClose={closeSheet} onConfirm={() => { closeSheet(); Alert.alert('완료', '로그아웃 되었습니다.'); clearAuth(); }} />

    </SafeAreaView>
  );
}
