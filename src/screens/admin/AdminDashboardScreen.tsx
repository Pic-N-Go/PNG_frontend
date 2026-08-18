import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Modal,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  IconChevronLeft,
  IconChevronRight,
  IconBrain,
  IconRefresh,
  IconPlayerPlay,
  IconMapPin,
  IconWorld,
  IconShield,
  IconSparkles,
  IconUsers,
  IconSearch,
  IconX,
  IconUserCheck,
  IconMessage2Question,
  IconSend,
  IconClock,
  IconCheck,
} from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import {
  FONT_2XS,
  FONT_XS,
  FONT_SM,
  FONT_MD,
  FONT_LG,
  FONT_2XL,
  GRID_PADDING,
  CARD_RADIUS,
  BUTTON_RADIUS,
  SPACING_SM,
  SPACING_MD,
} from '@/constants/layout';
import {
  useAdminUsers,
  useUpdateUserRole,
  useEmbeddingStatus,
  useBackfillEmbeddings,
  useRecalculateSpotEmbedding,
  useSyncAreaTourApi,
  useSyncAllTourApi,
} from '@/hooks/useAdmin';
import { useAdminInquiries, useAnswerInquiry } from '@/hooks/useInquiries';
import { useKeyboardOverlap } from '@/hooks/useKeyboardHeight';
import { AREA_CODES, type AreaCodeItem, type AdminUser } from '@/types/admin';
import {
  INQUIRY_TYPES,
  INQUIRY_ANSWER_TEMPLATES,
  getInquiryTypeLabel,
  type InquiryItem,
  type InquiryStatus,
} from '@/types/inquiry';
import { useAuthStore } from '@/store/useAuthStore';
import Toast from '@/components/common/Toast';

type AdminTab = 'users' | 'inquiries' | 'embeddings' | 'tour';

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const currentUser = useAuthStore((s) => s.user);
  const keyboardOverlap = useKeyboardOverlap();

  // 권한 확인 (ADMIN만 접근 가능)
  const isAdmin = currentUser?.role === 'ADMIN';

  // 탭 상태
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // ── 1. 회원 관리 상태 및 훅 ──────────────────────────────────────────
  const [userKeyword, setUserKeyword] = useState('');
  const [submittedKeyword, setSubmittedKeyword] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'USER' | 'ADMIN' | undefined>(undefined);
  const [userPage, setUserPage] = useState(0);

  const {
    data: userPageData,
    isLoading: isUsersLoading,
    isRefetching: isUsersRefetching,
    refetch: refetchUsers,
  } = useAdminUsers({
    keyword: submittedKeyword || undefined,
    role: userRoleFilter,
    page: userPage,
    size: 15,
  });

  const updateRoleMutation = useUpdateUserRole();

  // ── 2. 1:1 문의 관리 상태 및 훅 ──────────────────────────────────────
  const [inquiryKeyword, setInquiryKeyword] = useState('');
  const [submittedInquiryKeyword, setSubmittedInquiryKeyword] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<InquiryStatus | undefined>(undefined);
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState<string | undefined>(undefined);
  const [inquiryPage, setInquiryPage] = useState(0);

  const {
    data: adminInquiryData,
    isLoading: isInquiriesLoading,
    isRefetching: isInquiriesRefetching,
    refetch: refetchInquiries,
  } = useAdminInquiries({
    type: inquiryTypeFilter,
    status: inquiryStatusFilter,
    keyword: submittedInquiryKeyword || undefined,
    page: inquiryPage,
    size: 15,
  });

  const answerMutation = useAnswerInquiry();
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [answerModalVisible, setAnswerModalVisible] = useState(false);
  const answerScrollViewRef = useRef<ScrollView>(null);

  const handleOpenAnswerModal = (item: InquiryItem) => {
    setSelectedInquiry(item);
    const existingAnswer = item.answer || '';
    setAnswerInput(existingAnswer);
    setSelectedTemplateId(null);
    setAnswerModalVisible(true);
  };

  const handleCloseAnswerModal = () => {
    setAnswerModalVisible(false);
    setSelectedInquiry(null);
    setAnswerInput('');
    setSelectedTemplateId(null);
  };

  const handleSubmitAnswer = () => {
    if (!selectedInquiry || !answerInput.trim()) return;

    answerMutation.mutate(
      {
        id: selectedInquiry.id,
        answer: answerInput.trim(),
      },
      {
        onSuccess: () => {
          handleCloseAnswerModal();
          showToast(`문의 #${selectedInquiry.id}에 대한 답변이 등록되었습니다.`);
        },
        onError: (err) => {
          Alert.alert('답변 등록 실패', err.message || '오류가 발생했습니다.');
        },
      }
    );
  };

  // ── 3. 임베딩 관리 상태 및 훅 ────────────────────────────────────────
  const {
    data: embeddingStatus,
    isLoading: isStatusLoading,
    isRefetching: isStatusRefetching,
    refetch: refetchStatus,
  } = useEmbeddingStatus();

  const backfillMutation = useBackfillEmbeddings();
  const recalculateMutation = useRecalculateSpotEmbedding();
  const [targetSpotId, setTargetSpotId] = useState('');

  // ── 4. TourAPI 동기화 상태 및 훅 ──────────────────────────────────────
  const syncAreaMutation = useSyncAreaTourApi();
  const syncAllMutation = useSyncAllTourApi();
  const [selectedArea, setSelectedArea] = useState<AreaCodeItem>(AREA_CODES[0]); // 기본 서울(1)

  // ── 피드백 토스트 ───────────────────────────────────────────────────
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  };

  // ── 회원 권한 변경 핸들러 ───────────────────────────────────────────
  const handleToggleRole = (targetUser: AdminUser) => {
    const nextRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionLabel = nextRole === 'ADMIN' ? '관리자(ADMIN)로 격상' : '일반 유저(USER)로 전환';

    Alert.alert(
      '회원 권한 변경',
      `[${targetUser.nickname}] 님의 권한을 ${actionLabel}하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '변경 확인',
          style: nextRole === 'ADMIN' ? 'default' : 'destructive',
          onPress: () => {
            updateRoleMutation.mutate(
              { userId: targetUser.id, roleData: { role: nextRole } },
              {
                onSuccess: (updated) => {
                  showToast(`[${updated.nickname}] 님의 권한이 ${updated.role}로 변경되었습니다.`);
                },
                onError: (err) => {
                  Alert.alert('권한 변경 실패', err.message || '요청 중 오류가 발생했습니다.');
                },
              }
            );
          },
        },
      ]
    );
  };

  // ── 일괄 백필 실행 핸들러 ──────────────────────────────────────────
  const handleBackfill = () => {
    Alert.alert(
      '의미 검색 임베딩 일괄 백필',
      '임베딩 벡터가 없는 모든 스팟에 대해 AI 의미 벡터를 일괄 생성합니다. 실행하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '실행',
          onPress: () => {
            backfillMutation.mutate(undefined, {
              onSuccess: (res) => {
                showToast(
                  `백필 완료: 총 ${res.saved}건 생성 완료 (실패 ${res.failed}건)`
                );
              },
              onError: (err) => {
                Alert.alert('백필 실패', err.message || '요청 중 오류가 발생했습니다.');
              },
            });
          },
        },
      ]
    );
  };

  // ── 단일 스팟 재계산 핸들러 ─────────────────────────────────────────
  const handleRecalculateSpot = () => {
    const spotId = parseInt(targetSpotId.trim(), 10);
    if (isNaN(spotId) || spotId <= 0) {
      Alert.alert('입력 오류', '유효한 스팟 ID 숫자를 입력해 주세요.');
      return;
    }

    recalculateMutation.mutate(spotId, {
      onSuccess: (res) => {
        setTargetSpotId('');
        showToast(
          res.saved
            ? `스팟 #${spotId} AI 의미 벡터 재계산 완료`
            : `실패: ${res.message || '재계산에 실패했습니다.'}`
        );
      },
      onError: (err) => {
        Alert.alert('재계산 실패', err.message || '요청 중 오류가 발생했습니다.');
      },
    });
  };

  // ── 전국 TourAPI 전체 동기화 핸들러 ─────────────────────────────────
  const handleSyncAll = () => {
    Alert.alert(
      '전국 TourAPI 전체 동기화',
      '전국 17개 지역의 관광지 공공데이터를 일괄 동기화합니다.\n데이터 양에 따라 수 분이 소요될 수 있습니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전체 동기화 시작',
          style: 'destructive',
          onPress: () => {
            syncAllMutation.mutate(undefined, {
              onSuccess: (resText) => {
                showToast(resText || '전국 TourAPI 동기화가 완료되었습니다.');
              },
              onError: (err) => {
                Alert.alert('동기화 실패', err.message || '요청 중 오류가 발생했습니다.');
              },
            });
          },
        },
      ]
    );
  };

  // ── 특정 지역 TourAPI 동기화 핸들러 ──────────────────────────────────
  const handleSyncArea = () => {
    Alert.alert(
      `[${selectedArea.name}] 데이터 동기화`,
      `${selectedArea.name}(지역코드: ${selectedArea.code}) 공공데이터를 동기화하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '동기화 실행',
          onPress: () => {
            syncAreaMutation.mutate(
              { areaCode: selectedArea.code },
              {
                onSuccess: (resText) => {
                  showToast(resText || `[${selectedArea.name}] 동기화가 완료되었습니다.`);
                },
                onError: (err) => {
                  Alert.alert('동기화 실패', err.message || '요청 중 오류가 발생했습니다.');
                },
              }
            );
          },
        },
      ]
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View className="flex-1 items-center justify-center p-6">
          <IconShield size={normalize(48)} color="#E31B59" />
          <Text
            style={{
              fontSize: FONT_LG,
              fontFamily: 'Pretendard-SemiBold',
              color: '#111',
              marginTop: normalize(16),
              marginBottom: normalize(8),
            }}
          >
            접근 권한이 없습니다
          </Text>
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: 'Pretendard-Regular',
              color: 'rgba(0,0,0,0.5)',
              textAlign: 'center',
              marginBottom: normalize(24),
            }}
          >
            관리자(ADMIN) 권한을 가진 계정으로 로그인해 주세요.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              height: normalize(44),
              paddingHorizontal: normalize(24),
              borderRadius: BUTTON_RADIUS,
              backgroundColor: '#111',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Medium', color: '#fff' }}>
              돌아가기
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const coverage = embeddingStatus?.coveragePercentage ?? 0;
  const embeddedCount = embeddingStatus?.withEmbedding ?? embeddingStatus?.embeddedSpots ?? 0;
  const totalCount = embeddingStatus?.total ?? embeddingStatus?.totalSpots ?? 0;
  const missingCount = embeddingStatus?.missing ?? embeddingStatus?.missingSpots ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f7]" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Nav Header */}
      <View
        className="flex-row items-center justify-between border-b border-black/5 bg-white"
        style={{ height: normalize(54), paddingHorizontal: normalize(16) }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={{
            width: normalize(40),
            height: normalize(40),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.8)" strokeWidth={1.8} />
        </TouchableOpacity>

        <View className="flex-row items-center" style={{ gap: normalize(6) }}>
          <Text
            style={{
              fontSize: FONT_LG,
              fontFamily: 'Pretendard-SemiBold',
              color: '#000',
              letterSpacing: -0.3,
            }}
          >
            관리자 대시보드
          </Text>
          <View
            style={{
              paddingHorizontal: normalize(7),
              paddingVertical: normalize(2),
              borderRadius: normalize(4),
              backgroundColor: '#e0f2fe',
            }}
          >
            <Text
              style={{
                fontSize: FONT_2XS,
                fontFamily: 'Pretendard-Bold',
                color: '#0284c7',
                letterSpacing: 0.5,
              }}
            >
              ADMIN
            </Text>
          </View>
        </View>

        <View style={{ width: normalize(40) }} />
      </View>

      {/* Top Segmented Tabs (4 Tabs) */}
      <View className="flex-row bg-white border-b border-black/5" style={{ paddingHorizontal: GRID_PADDING }}>
        <TouchableOpacity
          onPress={() => setActiveTab('users')}
          style={{
            flex: 1,
            paddingVertical: normalize(13),
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'users' ? '#111827' : 'transparent',
            flexDirection: 'row',
            gap: normalize(5),
          }}
        >
          <IconUsers
            size={normalize(18)}
            color={activeTab === 'users' ? '#111827' : 'rgba(0,0,0,0.4)'}
            strokeWidth={activeTab === 'users' ? 2.2 : 1.8}
          />
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: activeTab === 'users' ? 'Pretendard-Bold' : 'Pretendard-Medium',
              color: activeTab === 'users' ? '#111827' : 'rgba(0,0,0,0.4)',
            }}
          >
            회원
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('inquiries')}
          style={{
            flex: 1,
            paddingVertical: normalize(13),
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'inquiries' ? '#E31B59' : 'transparent',
            flexDirection: 'row',
            gap: normalize(5),
          }}
        >
          <IconMessage2Question
            size={normalize(18)}
            color={activeTab === 'inquiries' ? '#E31B59' : 'rgba(0,0,0,0.4)'}
            strokeWidth={activeTab === 'inquiries' ? 2.2 : 1.8}
          />
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: activeTab === 'inquiries' ? 'Pretendard-Bold' : 'Pretendard-Medium',
              color: activeTab === 'inquiries' ? '#E31B59' : 'rgba(0,0,0,0.4)',
            }}
          >
            1:1 문의
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('embeddings')}
          style={{
            flex: 1,
            paddingVertical: normalize(13),
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'embeddings' ? '#4f46e5' : 'transparent',
            flexDirection: 'row',
            gap: normalize(5),
          }}
        >
          <IconBrain
            size={normalize(18)}
            color={activeTab === 'embeddings' ? '#4f46e5' : 'rgba(0,0,0,0.4)'}
            strokeWidth={activeTab === 'embeddings' ? 2.2 : 1.8}
          />
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: activeTab === 'embeddings' ? 'Pretendard-Bold' : 'Pretendard-Medium',
              color: activeTab === 'embeddings' ? '#4f46e5' : 'rgba(0,0,0,0.4)',
            }}
          >
            의미 검색
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('tour')}
          style={{
            flex: 1,
            paddingVertical: normalize(13),
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'tour' ? '#0284c7' : 'transparent',
            flexDirection: 'row',
            gap: normalize(5),
          }}
        >
          <IconWorld
            size={normalize(18)}
            color={activeTab === 'tour' ? '#0284c7' : 'rgba(0,0,0,0.4)'}
            strokeWidth={activeTab === 'tour' ? 2.2 : 1.8}
          />
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: activeTab === 'tour' ? 'Pretendard-Bold' : 'Pretendard-Medium',
              color: activeTab === 'tour' ? '#0284c7' : 'rgba(0,0,0,0.4)',
            }}
          >
            관광 동기화
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: GRID_PADDING,
          paddingTop: SPACING_MD,
          paddingBottom: insets.bottom + normalize(40),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════════════════════════════════════════════════════════
            TAB 1: 회원 및 권한 관리 (/admin/users)
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <View>
            {/* 검색창 & 새로고침 버튼 */}
            <View className="flex-row items-center" style={{ gap: normalize(8), marginBottom: normalize(12) }}>
              <View
                className="flex-row items-center bg-white border border-black/5 flex-1"
                style={{
                  borderRadius: normalize(12),
                  paddingHorizontal: normalize(14),
                  height: normalize(46),
                }}
              >
                <IconSearch size={normalize(20)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
                <TextInput
                  value={userKeyword}
                  onChangeText={setUserKeyword}
                  onSubmitEditing={() => {
                    setUserPage(0);
                    setSubmittedKeyword(userKeyword.trim());
                  }}
                  placeholder="이메일 또는 닉네임으로 검색"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  returnKeyType="search"
                  className="flex-1 text-black"
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-Medium',
                    paddingHorizontal: normalize(10),
                    height: '100%',
                  }}
                />
                {userKeyword.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setUserKeyword('');
                      setSubmittedKeyword('');
                      setUserPage(0);
                    }}
                    style={{ padding: normalize(6) }}
                  >
                    <IconX size={normalize(18)} color="rgba(0,0,0,0.4)" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setUserPage(0);
                    setSubmittedKeyword(userKeyword.trim());
                  }}
                  style={{
                    height: normalize(34),
                    paddingHorizontal: normalize(14),
                    borderRadius: normalize(8),
                    backgroundColor: '#111827',
                    marginLeft: normalize(4),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                    검색
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => refetchUsers()}
                disabled={isUsersLoading || isUsersRefetching}
                style={{
                  width: normalize(46),
                  height: normalize(46),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: normalize(12),
                  backgroundColor: '#fff',
                  borderWidth: 0.5,
                  borderColor: 'rgba(0,0,0,0.08)',
                }}
              >
                {isUsersRefetching ? (
                  <ActivityIndicator size="small" color="#111827" />
                ) : (
                  <IconRefresh size={normalize(20)} color="#374151" strokeWidth={1.8} />
                )}
              </TouchableOpacity>
            </View>

            {/* 권한 필터 칩 */}
            <View className="flex-row items-center" style={{ gap: normalize(8), marginBottom: normalize(14) }}>
              <TouchableOpacity
                onPress={() => {
                  setUserRoleFilter(undefined);
                  setUserPage(0);
                }}
                style={{
                  paddingHorizontal: normalize(14),
                  paddingVertical: normalize(8),
                  borderRadius: normalize(9999),
                  backgroundColor: userRoleFilter === undefined ? '#111827' : '#fff',
                  borderWidth: 0.5,
                  borderColor: userRoleFilter === undefined ? '#111827' : 'rgba(0,0,0,0.08)',
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: userRoleFilter === undefined ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                    color: userRoleFilter === undefined ? '#fff' : 'rgba(0,0,0,0.7)',
                  }}
                >
                  전체
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setUserRoleFilter('USER');
                  setUserPage(0);
                }}
                style={{
                  paddingHorizontal: normalize(14),
                  paddingVertical: normalize(8),
                  borderRadius: normalize(9999),
                  backgroundColor: userRoleFilter === 'USER' ? '#111827' : '#fff',
                  borderWidth: 0.5,
                  borderColor: userRoleFilter === 'USER' ? '#111827' : 'rgba(0,0,0,0.08)',
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: userRoleFilter === 'USER' ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                    color: userRoleFilter === 'USER' ? '#fff' : 'rgba(0,0,0,0.7)',
                  }}
                >
                  USER (일반)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setUserRoleFilter('ADMIN');
                  setUserPage(0);
                }}
                style={{
                  paddingHorizontal: normalize(14),
                  paddingVertical: normalize(8),
                  borderRadius: normalize(9999),
                  backgroundColor: userRoleFilter === 'ADMIN' ? '#0284c7' : '#fff',
                  borderWidth: 0.5,
                  borderColor: userRoleFilter === 'ADMIN' ? '#0284c7' : 'rgba(0,0,0,0.08)',
                }}
              >
                <Text
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: userRoleFilter === 'ADMIN' ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                    color: userRoleFilter === 'ADMIN' ? '#fff' : 'rgba(0,0,0,0.7)',
                  }}
                >
                  ADMIN (관리자)
                </Text>
              </TouchableOpacity>
            </View>

            {/* 총 회원 수 안내 */}
            <View style={{ marginBottom: normalize(10) }}>
              <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Medium', color: 'rgba(0,0,0,0.5)' }}>
                총 <Text style={{ fontFamily: 'Pretendard-Bold', color: '#111' }}>{userPageData?.totalElements ?? 0}</Text>명의 회원이 등록되어 있습니다.
              </Text>
            </View>

            {/* 회원 목록 */}
            {isUsersLoading ? (
              <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#111827" />
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.4)', marginTop: normalize(8) }}>
                  회원 목록을 불러오는 중...
                </Text>
              </View>
            ) : !userPageData?.content || userPageData.content.length === 0 ? (
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: CARD_RADIUS,
                  padding: normalize(32),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconUsers size={normalize(40)} color="rgba(0,0,0,0.2)" />
                <Text
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-Medium',
                    color: 'rgba(0,0,0,0.4)',
                    marginTop: normalize(10),
                  }}
                >
                  검색 조건에 일치하는 회원이 없습니다.
                </Text>
              </View>
            ) : (
              <View style={{ gap: normalize(10) }}>
                {userPageData.content.map((item) => {
                  const isUserAdmin = item.role === 'ADMIN';
                  const isSelf = currentUser?.id === item.id;
                  const createdDate = item.createdAt ? item.createdAt.slice(0, 10) : '';

                  return (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: CARD_RADIUS,
                        padding: normalize(14),
                      }}
                    >
                      <View className="flex-row items-center justify-between">
                        {/* 프로필 아바타 + 유저 정보 */}
                        <View className="flex-row items-center flex-1" style={{ gap: normalize(12) }}>
                          {item.profileImageUrl ? (
                            <Image
                              source={{ uri: item.profileImageUrl }}
                              style={{
                                width: normalize(44),
                                height: normalize(44),
                                borderRadius: normalize(22),
                                backgroundColor: '#e5e7eb',
                              }}
                            />
                          ) : (
                            <View
                              style={{
                                width: normalize(44),
                                height: normalize(44),
                                borderRadius: normalize(22),
                                backgroundColor: isUserAdmin ? '#e0f2fe' : '#f3f4f6',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: FONT_MD,
                                  fontFamily: 'Pretendard-Bold',
                                  color: isUserAdmin ? '#0284c7' : '#6b7280',
                                }}
                              >
                                {item.nickname ? item.nickname.charAt(0) : '?'}
                              </Text>
                            </View>
                          )}

                          <View className="flex-1">
                            <View className="flex-row items-center" style={{ gap: normalize(6) }}>
                              <Text
                                numberOfLines={1}
                                style={{
                                  fontSize: FONT_MD,
                                  fontFamily: 'Pretendard-Bold',
                                  color: '#111827',
                                  maxWidth: normalize(140),
                                }}
                              >
                                {item.nickname}
                              </Text>
                              {/* 소셜 제공자 뱃지 */}
                              <View
                                style={{
                                  paddingHorizontal: normalize(6),
                                  paddingVertical: normalize(2),
                                  borderRadius: normalize(4),
                                  backgroundColor: item.provider === 'KAKAO' ? '#FEE500' : '#f3f4f6',
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: FONT_2XS,
                                    fontFamily: 'Pretendard-SemiBold',
                                    color: item.provider === 'KAKAO' ? '#191919' : '#6b7280',
                                  }}
                                >
                                  {item.provider}
                                </Text>
                              </View>
                            </View>

                            <Text
                              numberOfLines={1}
                              style={{
                                fontSize: FONT_XS,
                                fontFamily: 'Pretendard-Regular',
                                color: 'rgba(0,0,0,0.5)',
                                marginTop: normalize(2),
                              }}
                            >
                              {item.email}
                            </Text>

                            <Text
                              style={{
                                fontSize: FONT_2XS,
                                fontFamily: 'Pretendard-Regular',
                                color: 'rgba(0,0,0,0.35)',
                                marginTop: normalize(2),
                              }}
                            >
                              가입일: {createdDate} (ID: #{item.id})
                            </Text>
                          </View>
                        </View>

                        {/* 권한 뱃지 및 변경 액션 버튼 */}
                        <View className="items-end" style={{ gap: normalize(6) }}>
                          <View
                            style={{
                              paddingHorizontal: normalize(8),
                              paddingVertical: normalize(3),
                              borderRadius: normalize(6),
                              backgroundColor: isUserAdmin ? '#e0f2fe' : '#f3f4f6',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: FONT_2XS,
                                fontFamily: 'Pretendard-Bold',
                                color: isUserAdmin ? '#0284c7' : '#4b5563',
                              }}
                            >
                              {item.role}
                            </Text>
                          </View>

                          {!isSelf && (
                            <TouchableOpacity
                              onPress={() => handleToggleRole(item)}
                              disabled={updateRoleMutation.isPending}
                              style={{
                                height: normalize(34),
                                paddingHorizontal: normalize(12),
                                borderRadius: normalize(8),
                                backgroundColor: isUserAdmin ? '#fee2e2' : '#f0fdf4',
                                borderWidth: 0.5,
                                borderColor: isUserAdmin ? '#fecaca' : '#bbf7d0',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: normalize(4),
                              }}
                            >
                              <IconUserCheck
                                size={normalize(14)}
                                color={isUserAdmin ? '#dc2626' : '#16a34a'}
                              />
                              <Text
                                style={{
                                  fontSize: FONT_SM,
                                  fontFamily: 'Pretendard-SemiBold',
                                  color: isUserAdmin ? '#dc2626' : '#16a34a',
                                }}
                              >
                                {isUserAdmin ? '일반 전환' : '관리자 지정'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 페이징 컨트롤 */}
            {userPageData && userPageData.totalPages > 1 && (
              <View
                className="flex-row items-center justify-between"
                style={{ marginTop: normalize(16), paddingHorizontal: normalize(8) }}
              >
                <TouchableOpacity
                  onPress={() => setUserPage((p) => Math.max(0, p - 1))}
                  disabled={userPageData.first || isUsersLoading}
                  style={{
                    height: normalize(38),
                    paddingHorizontal: normalize(16),
                    borderRadius: normalize(8),
                    backgroundColor: userPageData.first ? '#f3f4f6' : '#fff',
                    borderWidth: 0.5,
                    borderColor: 'rgba(0,0,0,0.08)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(5),
                  }}
                >
                  <IconChevronLeft
                    size={normalize(16)}
                    color={userPageData.first ? '#9ca3af' : '#111'}
                  />
                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: 'Pretendard-Medium',
                      color: userPageData.first ? '#9ca3af' : '#111',
                    }}
                  >
                    이전
                  </Text>
                </TouchableOpacity>

                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#111827' }}>
                  {userPage + 1} / {userPageData.totalPages} 페이지
                </Text>

                <TouchableOpacity
                  onPress={() => setUserPage((p) => Math.min(userPageData.totalPages - 1, p + 1))}
                  disabled={userPageData.last || isUsersLoading}
                  style={{
                    height: normalize(38),
                    paddingHorizontal: normalize(16),
                    borderRadius: normalize(8),
                    backgroundColor: userPageData.last ? '#f3f4f6' : '#fff',
                    borderWidth: 0.5,
                    borderColor: 'rgba(0,0,0,0.08)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(5),
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: 'Pretendard-Medium',
                      color: userPageData.last ? '#9ca3af' : '#111',
                    }}
                  >
                    다음
                  </Text>
                  <IconChevronRight
                    size={normalize(16)}
                    color={userPageData.last ? '#9ca3af' : '#111'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: 1:1 문의 관리 (/admin/inquiries)
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'inquiries' && (
          <View>
            {/* 검색창 & 새로고침 버튼 */}
            <View className="flex-row items-center" style={{ gap: normalize(8), marginBottom: normalize(12) }}>
              <View
                className="flex-row items-center bg-white border border-black/5 flex-1"
                style={{
                  borderRadius: normalize(12),
                  paddingHorizontal: normalize(14),
                  height: normalize(46),
                }}
              >
                <IconSearch size={normalize(20)} color="rgba(0,0,0,0.4)" strokeWidth={2} />
                <TextInput
                  value={inquiryKeyword}
                  onChangeText={setInquiryKeyword}
                  onSubmitEditing={() => {
                    setInquiryPage(0);
                    setSubmittedInquiryKeyword(inquiryKeyword.trim());
                  }}
                  placeholder="제목, 내용, 작성자 닉네임/이메일 검색"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  returnKeyType="search"
                  className="flex-1 text-black"
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-Medium',
                    paddingHorizontal: normalize(10),
                    height: '100%',
                  }}
                />
                {inquiryKeyword.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setInquiryKeyword('');
                      setSubmittedInquiryKeyword('');
                      setInquiryPage(0);
                    }}
                    style={{ padding: normalize(6) }}
                  >
                    <IconX size={normalize(18)} color="rgba(0,0,0,0.4)" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setInquiryPage(0);
                    setSubmittedInquiryKeyword(inquiryKeyword.trim());
                  }}
                  style={{
                    height: normalize(34),
                    paddingHorizontal: normalize(14),
                    borderRadius: normalize(8),
                    backgroundColor: '#E31B59',
                    marginLeft: normalize(4),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                    검색
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => refetchInquiries()}
                disabled={isInquiriesLoading || isInquiriesRefetching}
                style={{
                  width: normalize(46),
                  height: normalize(46),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: normalize(12),
                  backgroundColor: '#fff',
                  borderWidth: 0.5,
                  borderColor: 'rgba(0,0,0,0.08)',
                }}
              >
                {isInquiriesRefetching ? (
                  <ActivityIndicator size="small" color="#E31B59" />
                ) : (
                  <IconRefresh size={normalize(20)} color="#374151" strokeWidth={1.8} />
                )}
              </TouchableOpacity>
            </View>

            {/* 1) 유형(type) 필터 칩 바 */}
            <View style={{ marginBottom: normalize(10) }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: normalize(8) }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setInquiryTypeFilter(undefined);
                    setInquiryPage(0);
                  }}
                  style={{
                    paddingHorizontal: normalize(14),
                    paddingVertical: normalize(8),
                    borderRadius: normalize(9999),
                    backgroundColor: inquiryTypeFilter === undefined ? '#374151' : '#fff',
                    borderWidth: 0.5,
                    borderColor: inquiryTypeFilter === undefined ? '#374151' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: inquiryTypeFilter === undefined ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                      color: inquiryTypeFilter === undefined ? '#fff' : 'rgba(0,0,0,0.7)',
                    }}
                  >
                    전체 유형
                  </Text>
                </TouchableOpacity>

                {INQUIRY_TYPES.map((t) => {
                  const isSelected = inquiryTypeFilter === t.code;
                  return (
                    <TouchableOpacity
                      key={t.code}
                      onPress={() => {
                        setInquiryTypeFilter(t.code);
                        setInquiryPage(0);
                      }}
                      style={{
                        paddingHorizontal: normalize(14),
                        paddingVertical: normalize(8),
                        borderRadius: normalize(9999),
                        backgroundColor: isSelected ? '#374151' : '#fff',
                        borderWidth: 0.5,
                        borderColor: isSelected ? '#374151' : 'rgba(0,0,0,0.08)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: FONT_SM,
                          fontFamily: isSelected ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                          color: isSelected ? '#fff' : 'rgba(0,0,0,0.7)',
                        }}
                      >
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2) 상태(status) 필터 칩 바 */}
            <View style={{ marginBottom: normalize(12) }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: normalize(8) }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setInquiryStatusFilter(undefined);
                    setInquiryPage(0);
                  }}
                  style={{
                    paddingHorizontal: normalize(14),
                    paddingVertical: normalize(8),
                    borderRadius: normalize(9999),
                    backgroundColor: inquiryStatusFilter === undefined ? '#111827' : '#fff',
                    borderWidth: 0.5,
                    borderColor: inquiryStatusFilter === undefined ? '#111827' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: inquiryStatusFilter === undefined ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                      color: inquiryStatusFilter === undefined ? '#fff' : 'rgba(0,0,0,0.7)',
                    }}
                  >
                    전체 상태
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setInquiryStatusFilter('PENDING');
                    setInquiryPage(0);
                  }}
                  style={{
                    paddingHorizontal: normalize(14),
                    paddingVertical: normalize(8),
                    borderRadius: normalize(9999),
                    backgroundColor: inquiryStatusFilter === 'PENDING' ? '#f59e0b' : '#fff',
                    borderWidth: 0.5,
                    borderColor: inquiryStatusFilter === 'PENDING' ? '#f59e0b' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: inquiryStatusFilter === 'PENDING' ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                      color: inquiryStatusFilter === 'PENDING' ? '#fff' : '#b45309',
                    }}
                  >
                    답변대기 (PENDING)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setInquiryStatusFilter('ANSWERED');
                    setInquiryPage(0);
                  }}
                  style={{
                    paddingHorizontal: normalize(14),
                    paddingVertical: normalize(8),
                    borderRadius: normalize(9999),
                    backgroundColor: inquiryStatusFilter === 'ANSWERED' ? '#0284c7' : '#fff',
                    borderWidth: 0.5,
                    borderColor: inquiryStatusFilter === 'ANSWERED' ? '#0284c7' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: inquiryStatusFilter === 'ANSWERED' ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                      color: inquiryStatusFilter === 'ANSWERED' ? '#fff' : '#0369a1',
                    }}
                  >
                    답변완료 (ANSWERED)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setInquiryStatusFilter('RESOLVED');
                    setInquiryPage(0);
                  }}
                  style={{
                    paddingHorizontal: normalize(14),
                    paddingVertical: normalize(8),
                    borderRadius: normalize(9999),
                    backgroundColor: inquiryStatusFilter === 'RESOLVED' ? '#16a34a' : '#fff',
                    borderWidth: 0.5,
                    borderColor: inquiryStatusFilter === 'RESOLVED' ? '#16a34a' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: inquiryStatusFilter === 'RESOLVED' ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                      color: inquiryStatusFilter === 'RESOLVED' ? '#fff' : '#15803d',
                    }}
                  >
                    해결됨 (RESOLVED)
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* 7일 자동 해결 정책 안내 배너 */}
            <View
              style={{
                backgroundColor: '#fffbeb',
                borderRadius: CARD_RADIUS,
                padding: normalize(12),
                marginBottom: normalize(10),
                borderWidth: 1,
                borderColor: '#fef3c7',
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: normalize(8),
              }}
            >
              <IconClock size={normalize(16)} color="#d97706" style={{ marginTop: normalize(2) }} />
              <Text style={{ flex: 1, fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: '#92400e', lineHeight: normalize(16) }}>
                <Text style={{ fontFamily: 'Pretendard-Bold' }}>7일 미응답 자동 해결 정책</Text>: 관리자가 답변(ANSWERED) 등록 후 사용자가 7일간 해결 버튼을 누르지 않은 건은 새벽 배치에 의해 자동으로 &apos;해결됨(RESOLVED)&apos; 상태로 전환됩니다.
              </Text>
            </View>

            {/* 총 문의 수 안내 */}
            <View style={{ marginBottom: normalize(10) }}>
              <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Medium', color: 'rgba(0,0,0,0.5)' }}>
                총 <Text style={{ fontFamily: 'Pretendard-Bold', color: '#111' }}>{adminInquiryData?.totalElements ?? 0}</Text>건의 문의가 있습니다.
              </Text>
            </View>

            {/* 문의 목록 */}
            {isInquiriesLoading ? (
              <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#E31B59" />
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.4)', marginTop: normalize(8) }}>
                  문의 목록을 불러오는 중...
                </Text>
              </View>
            ) : !adminInquiryData?.content || adminInquiryData.content.length === 0 ? (
              <View
                style={{
                  backgroundColor: '#fff',
                  borderRadius: CARD_RADIUS,
                  padding: normalize(32),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconMessage2Question size={normalize(40)} color="rgba(0,0,0,0.2)" />
                <Text
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-Medium',
                    color: 'rgba(0,0,0,0.4)',
                    marginTop: normalize(10),
                  }}
                >
                  해당 조건의 문의 내역이 없습니다.
                </Text>
              </View>
            ) : (
              <View style={{ gap: normalize(12) }}>
                {adminInquiryData.content.map((item) => {
                  const isPending = item.status === 'PENDING';
                  const isAnswered = item.status === 'ANSWERED';
                  const isResolved = item.isResolved || item.status === 'RESOLVED';
                  const createdDate = item.createdAt ? item.createdAt.slice(0, 16).replace('T', ' ') : '';
                  const typeLabel = item.type ? getInquiryTypeLabel(item.type) : null;

                  return (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: CARD_RADIUS,
                        padding: normalize(16),
                      }}
                    >
                      {/* 카드 헤더: 작성자 및 상태 */}
                      <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(8) }}>
                        <View className="flex-row items-center" style={{ gap: normalize(6) }}>
                          <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Bold', color: '#111' }}>
                            {item.userNickname || '회원'}
                          </Text>
                          {item.userEmail && (
                            <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.4)' }}>
                              ({item.userEmail})
                            </Text>
                          )}
                        </View>

                        {/* 유형 & 상태 뱃지 */}
                        <View className="flex-row items-center" style={{ gap: normalize(4) }}>
                          {typeLabel && (
                            <View
                              style={{
                                paddingHorizontal: normalize(7),
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

                          {isResolved ? (
                            <View style={{ paddingHorizontal: normalize(7), paddingVertical: normalize(2), borderRadius: normalize(4), backgroundColor: '#dcfce7' }}>
                              <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Bold', color: '#15803d' }}>
                                해결됨
                              </Text>
                            </View>
                          ) : isAnswered ? (
                            <View style={{ paddingHorizontal: normalize(7), paddingVertical: normalize(2), borderRadius: normalize(4), backgroundColor: '#e0f2fe' }}>
                              <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Bold', color: '#0369a1' }}>
                                답변완료
                              </Text>
                            </View>
                          ) : (
                            <View style={{ paddingHorizontal: normalize(7), paddingVertical: normalize(2), borderRadius: normalize(4), backgroundColor: '#fef3c7' }}>
                              <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Bold', color: '#b45309' }}>
                                답변대기
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* 제목 & 본문 */}
                      <Text
                        style={{
                          fontSize: FONT_MD,
                          fontFamily: 'Pretendard-Bold',
                          color: '#111',
                          marginBottom: normalize(6),
                        }}
                      >
                        {item.title}
                      </Text>

                      <View
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: normalize(8),
                          padding: normalize(12),
                          marginBottom: normalize(10),
                        }}
                      >
                        <Text
                          numberOfLines={3}
                          style={{
                            fontSize: FONT_SM,
                            fontFamily: 'Pretendard-Regular',
                            color: '#374151',
                            lineHeight: normalize(21),
                          }}
                        >
                          {item.content}
                        </Text>
                      </View>

                      {/* 등록된 답변 미리보기 */}
                      {item.answer ? (
                        <View
                          style={{
                            backgroundColor: '#f0f9ff',
                            borderRadius: normalize(8),
                            padding: normalize(12),
                            borderWidth: 0.5,
                            borderColor: '#bae6fd',
                            marginBottom: normalize(10),
                          }}
                        >
                          <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(4) }}>
                            <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Bold', color: '#0369a1' }}>
                              [관리자 답변] {item.answeredByNickname || '운영팀'}
                            </Text>
                            {item.answeredAt && (
                              <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: '#64748b' }}>
                                {item.answeredAt.slice(0, 16).replace('T', ' ')}
                              </Text>
                            )}
                          </View>
                          <Text
                            numberOfLines={2}
                            style={{
                              fontSize: FONT_SM,
                              fontFamily: 'Pretendard-Regular',
                              color: '#0c4a6e',
                              lineHeight: normalize(20),
                            }}
                          >
                            {item.answer}
                          </Text>
                        </View>
                      ) : null}

                      {/* 카드 푸터: 작성 일시 + 답변 액션 버튼 */}
                      <View className="flex-row items-center justify-between pt-3 border-t border-black/5">
                        <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.4)' }}>
                          문의 ID: #{item.id} · {createdDate}
                        </Text>

                        <TouchableOpacity
                          onPress={() => handleOpenAnswerModal(item)}
                          style={{
                            height: normalize(36),
                            paddingHorizontal: normalize(14),
                            borderRadius: normalize(8),
                            backgroundColor: isPending ? '#E31B59' : '#111827',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: normalize(5),
                          }}
                        >
                          <IconSend size={normalize(14)} color="#fff" />
                          <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                            {item.answer ? '답변 수정' : '답변 작성'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* 페이징 컨트롤 */}
            {adminInquiryData && adminInquiryData.totalPages > 1 && (
              <View
                className="flex-row items-center justify-between"
                style={{ marginTop: normalize(16), paddingHorizontal: normalize(8) }}
              >
                <TouchableOpacity
                  onPress={() => setInquiryPage((p) => Math.max(0, p - 1))}
                  disabled={adminInquiryData.first || isInquiriesLoading}
                  style={{
                    height: normalize(38),
                    paddingHorizontal: normalize(16),
                    borderRadius: normalize(8),
                    backgroundColor: adminInquiryData.first ? '#f3f4f6' : '#fff',
                    borderWidth: 0.5,
                    borderColor: 'rgba(0,0,0,0.08)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(5),
                  }}
                >
                  <IconChevronLeft
                    size={normalize(16)}
                    color={adminInquiryData.first ? '#9ca3af' : '#111'}
                  />
                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: 'Pretendard-Medium',
                      color: adminInquiryData.first ? '#9ca3af' : '#111',
                    }}
                  >
                    이전
                  </Text>
                </TouchableOpacity>

                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#111827' }}>
                  {inquiryPage + 1} / {adminInquiryData.totalPages} 페이지
                </Text>

                <TouchableOpacity
                  onPress={() => setInquiryPage((p) => Math.min(adminInquiryData.totalPages - 1, p + 1))}
                  disabled={adminInquiryData.last || isInquiriesLoading}
                  style={{
                    height: normalize(38),
                    paddingHorizontal: normalize(16),
                    borderRadius: normalize(8),
                    backgroundColor: adminInquiryData.last ? '#f3f4f6' : '#fff',
                    borderWidth: 0.5,
                    borderColor: 'rgba(0,0,0,0.08)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(5),
                  }}
                >
                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: 'Pretendard-Medium',
                      color: adminInquiryData.last ? '#9ca3af' : '#111',
                    }}
                  >
                    다음
                  </Text>
                  <IconChevronRight
                    size={normalize(16)}
                    color={adminInquiryData.last ? '#9ca3af' : '#111'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: AI 의미 검색 임베딩 관리 (/admin/embeddings)
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'embeddings' && (
          <View>
            {/* 의미 검색 및 임베딩 개념 설명 가이드 카드 */}
            <View
              style={{
                backgroundColor: '#eef2ff',
                borderRadius: CARD_RADIUS,
                padding: normalize(16),
                marginBottom: SPACING_SM,
                borderWidth: 1,
                borderColor: '#e0e7ff',
              }}
            >
              <View className="flex-row items-center" style={{ gap: normalize(6), marginBottom: normalize(6) }}>
                <IconSparkles size={normalize(18)} color="#4f46e5" strokeWidth={2} />
                <Text
                  style={{
                    fontSize: FONT_MD,
                    fontFamily: 'Pretendard-Bold',
                    color: '#3730a3',
                  }}
                >
                  의미 검색(Semantic Search) & 임베딩이란?
                </Text>
              </View>
              <Text
                style={{
                  fontSize: FONT_SM,
                  fontFamily: 'Pretendard-Regular',
                  color: '#4338ca',
                  lineHeight: normalize(21),
                }}
              >
                스팟의 이름·개요·분위기·태그 등의 텍스트를 <Text style={{ fontFamily: 'Pretendard-Bold' }}>AI 언어 모델</Text>을 통해 고차원 의미 벡터(Vector) 데이터로 변환하여 저장하는 기술입니다.{'\n'}
                단순 키워드 일치 검색뿐만 아니라, 사용자가 <Text style={{ fontFamily: 'Pretendard-Bold' }}>&quot;노을이 예쁘고 조용한 해변&quot;</Text>과 같이 자연어로 질문해도 AI가 문맥과 의미를 이해하여 가장 적합한 명소를 찾아냅니다.
              </Text>
            </View>

            {/* 1. 커버리지 현황 카드 */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: CARD_RADIUS,
                padding: normalize(16),
                marginBottom: SPACING_SM,
              }}
            >
              <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(12) }}>
                <Text
                  style={{
                    fontSize: FONT_MD,
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#111827',
                  }}
                >
                  의미 검색 임베딩 커버리지 현황
                </Text>
                <TouchableOpacity
                  onPress={() => refetchStatus()}
                  disabled={isStatusLoading || isStatusRefetching}
                  style={{
                    height: normalize(34),
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(5),
                    paddingHorizontal: normalize(12),
                    borderRadius: normalize(8),
                    backgroundColor: '#f3f4f6',
                  }}
                >
                  {isStatusRefetching ? (
                    <ActivityIndicator size="small" color="#4f46e5" />
                  ) : (
                    <IconRefresh size={normalize(16)} color="#4b5563" strokeWidth={2} />
                  )}
                  <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Medium', color: '#4b5563' }}>
                    새로고침
                  </Text>
                </TouchableOpacity>
              </View>

              {isStatusLoading ? (
                <View style={{ paddingVertical: normalize(20), alignItems: 'center' }}>
                  <ActivityIndicator color="#4f46e5" />
                </View>
              ) : (
                <>
                  <View className="flex-row items-baseline justify-between" style={{ marginBottom: normalize(8) }}>
                    <Text
                      style={{
                        fontSize: FONT_2XL,
                        fontFamily: 'Pretendard-Bold',
                        color: '#4f46e5',
                        letterSpacing: -0.5,
                      }}
                    >
                      {coverage.toFixed(1)}%
                    </Text>
                    <Text
                      style={{
                        fontSize: FONT_SM,
                        fontFamily: 'Pretendard-Medium',
                        color: 'rgba(0,0,0,0.5)',
                      }}
                    >
                      {embeddedCount.toLocaleString()} / {totalCount.toLocaleString()} 스팟
                    </Text>
                  </View>

                  {/* 프로그레스 바 게이지 */}
                  <View
                    style={{
                      height: normalize(8),
                      borderRadius: normalize(4),
                      backgroundColor: '#e5e7eb',
                      overflow: 'hidden',
                      marginBottom: normalize(10),
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, coverage))}%`,
                        backgroundColor: '#4f46e5',
                        borderRadius: normalize(4),
                      }}
                    />
                  </View>

                  {/* 세부 수치 라벨 */}
                  <View className="flex-row items-center justify-between pt-2 border-t border-black/5">
                    <View className="flex-row items-center" style={{ gap: normalize(4) }}>
                      <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.5)' }}>
                        임베딩 완료:
                      </Text>
                      <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#4f46e5' }}>
                        {embeddedCount.toLocaleString()}개
                      </Text>
                    </View>
                    <View className="flex-row items-center" style={{ gap: normalize(4) }}>
                      <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.5)' }}>
                        미생성(누락):
                      </Text>
                      <Text
                        style={{
                          fontSize: FONT_SM,
                          fontFamily: 'Pretendard-SemiBold',
                          color: missingCount > 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        {missingCount.toLocaleString()}개
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* 2. 일괄 백필 카드 */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: CARD_RADIUS,
                padding: normalize(16),
                marginBottom: SPACING_SM,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_MD,
                  fontFamily: 'Pretendard-SemiBold',
                  color: '#111827',
                  marginBottom: normalize(4),
                }}
              >
                미임베딩 스팟 일괄 생성 (Backfill)
              </Text>
              <Text
                style={{
                  fontSize: FONT_SM,
                  fontFamily: 'Pretendard-Regular',
                  color: 'rgba(0,0,0,0.5)',
                  lineHeight: normalize(20),
                  marginBottom: normalize(14),
                }}
              >
                임베딩이 비어 있는 스팟들을 OpenAI API로 일괄 계산하여 DB에 채웁니다. (기존 완료 스팟 제외)
              </Text>

              <TouchableOpacity
                onPress={handleBackfill}
                disabled={backfillMutation.isPending}
                style={{
                  height: normalize(46),
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: backfillMutation.isPending ? '#9ca3af' : '#4f46e5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: normalize(6),
                }}
              >
                {backfillMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconPlayerPlay size={normalize(18)} color="#fff" strokeWidth={2} />
                )}
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                  {backfillMutation.isPending ? '백필 실행 중...' : '일괄 백필 실행'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. 단일 스팟 재계산 카드 */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: CARD_RADIUS,
                padding: normalize(16),
              }}
            >
              <Text
                style={{
                  fontSize: FONT_MD,
                  fontFamily: 'Pretendard-SemiBold',
                  color: '#111827',
                  marginBottom: normalize(4),
                }}
              >
                특정 스팟 임베딩 강제 재계산
              </Text>
              <Text
                style={{
                  fontSize: FONT_SM,
                  fontFamily: 'Pretendard-Regular',
                  color: 'rgba(0,0,0,0.5)',
                  marginBottom: normalize(12),
                }}
              >
                스팟 ID를 입력하여 해당 스팟의 AI 의미 벡터를 즉시 다시 계산하여 덮어씁니다.
              </Text>

              <View className="flex-row items-stretch" style={{ gap: normalize(8) }}>
                <TextInput
                  value={targetSpotId}
                  onChangeText={setTargetSpotId}
                  placeholder="스팟 ID (예: 1)"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  keyboardType="numeric"
                  className="flex-1 bg-[#f5f5f7] text-black"
                  style={{
                    height: normalize(46),
                    borderRadius: normalize(10),
                    paddingHorizontal: normalize(14),
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-Medium',
                  }}
                />
                <TouchableOpacity
                  onPress={handleRecalculateSpot}
                  disabled={recalculateMutation.isPending || !targetSpotId.trim()}
                  style={{
                    height: normalize(46),
                    paddingHorizontal: normalize(20),
                    borderRadius: normalize(10),
                    backgroundColor:
                      recalculateMutation.isPending || !targetSpotId.trim() ? '#e5e7eb' : '#111827',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {recalculateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text
                      style={{
                        fontSize: FONT_SM,
                        fontFamily: 'Pretendard-SemiBold',
                        color: !targetSpotId.trim() ? '#9ca3af' : '#fff',
                      }}
                    >
                      재계산
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: 한국관광공사 TourAPI 동기화 (/admin/tour-api)
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'tour' && (
          <View>
            {/* 1. 전국 17개 지역 전체 동기화 */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: CARD_RADIUS,
                padding: normalize(16),
                marginBottom: SPACING_SM,
              }}
            >
              <Text
                style={{
                  fontSize: FONT_MD,
                  fontFamily: 'Pretendard-SemiBold',
                  color: '#111827',
                  marginBottom: normalize(4),
                }}
              >
                전국 17개 지역 전체 데이터 동기화
              </Text>
              <Text
                style={{
                  fontSize: FONT_SM,
                  fontFamily: 'Pretendard-Regular',
                  color: 'rgba(0,0,0,0.5)',
                  lineHeight: normalize(20),
                  marginBottom: normalize(14),
                }}
              >
                전국 17개 지역 관광지 데이터를 전부 가져와 동기화합니다.{'\n'}
                <Text style={{ color: '#dc2626', fontFamily: 'Pretendard-Medium' }}>
                  주의: 전체 동기화는 수 분 이상 소요될 수 있습니다. (최초 1회 구축용)
                </Text>
              </Text>

              <TouchableOpacity
                onPress={handleSyncAll}
                disabled={syncAllMutation.isPending}
                style={{
                  height: normalize(46),
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: syncAllMutation.isPending ? '#9ca3af' : '#0284c7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: normalize(6),
                }}
              >
                {syncAllMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconRefresh size={normalize(18)} color="#fff" strokeWidth={2} />
                )}
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                  {syncAllMutation.isPending ? '전국 동기화 진행 중...' : '전국 데이터 전체 동기화'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. 특정 지역 선택 수동 동기화 */}
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: CARD_RADIUS,
                padding: normalize(16),
              }}
            >
              <Text
                style={{
                  fontSize: FONT_MD,
                  fontFamily: 'Pretendard-SemiBold',
                  color: '#111827',
                  marginBottom: normalize(4),
                }}
              >
                지역별 선택 수동 동기화
              </Text>
              <Text
                style={{
                  fontSize: FONT_SM,
                  fontFamily: 'Pretendard-Regular',
                  color: 'rgba(0,0,0,0.5)',
                  marginBottom: normalize(12),
                }}
              >
                동기화할 특정 시/도 지역을 선택하세요.
              </Text>

              {/* 지역 칩 그리드 */}
              <View className="flex-row flex-wrap" style={{ gap: normalize(8), marginBottom: normalize(16) }}>
                {AREA_CODES.map((area) => {
                  const isSelected = selectedArea.code === area.code;
                  return (
                    <TouchableOpacity
                      key={area.code}
                      onPress={() => setSelectedArea(area)}
                      style={{
                        paddingHorizontal: normalize(14),
                        paddingVertical: normalize(9),
                        borderRadius: normalize(10),
                        backgroundColor: isSelected ? '#0284c7' : '#f3f4f6',
                        borderWidth: 0.5,
                        borderColor: isSelected ? '#0284c7' : 'rgba(0,0,0,0.08)',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: FONT_SM,
                          fontFamily: isSelected ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
                          color: isSelected ? '#fff' : '#374151',
                        }}
                      >
                        {area.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 선택 지역 동기화 실행 버튼 */}
              <TouchableOpacity
                onPress={handleSyncArea}
                disabled={syncAreaMutation.isPending}
                style={{
                  height: normalize(46),
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: syncAreaMutation.isPending ? '#9ca3af' : '#111827',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: normalize(6),
                }}
              >
                {syncAreaMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconMapPin size={normalize(18)} color="#fff" strokeWidth={2} />
                )}
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                  {syncAreaMutation.isPending
                    ? `[${selectedArea.name}] 동기화 진행 중...`
                    : `[${selectedArea.name}] 데이터 동기화 실행`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── 관리자 답변 작성/수정 모달 ──────────────────────────────── */}
      <Modal
        visible={answerModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCloseAnswerModal}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          style={{ paddingBottom: keyboardOverlap }}
          onPress={handleCloseAnswerModal}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: normalize(24),
              borderTopRightRadius: normalize(24),
              maxHeight: Math.min(
                Dimensions.get('screen').height * 0.9,
                Dimensions.get('screen').height - keyboardOverlap - (Platform.OS === 'android' ? 24 : 0)
              ),
              paddingHorizontal: normalize(20),
              paddingTop: normalize(18),
              paddingBottom:
                keyboardOverlap > 0
                  ? normalize(12)
                  : Math.max(insets.bottom, normalize(16)) + normalize(8),
            }}
          >
            {/* 모달 헤더 */}
            <View className="flex-row items-center justify-between border-b border-black/5 pb-3">
              <View>
                <Text style={{ fontSize: FONT_LG, fontFamily: 'Pretendard-Bold', color: '#111' }}>
                  1:1 문의 답변 등록
                </Text>
                <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.4)', marginTop: normalize(2) }}>
                  문의 ID: #{selectedInquiry?.id} · 작성자: {selectedInquiry?.userNickname}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseAnswerModal} hitSlop={8} style={{ padding: normalize(4) }}>
                <IconX size={normalize(22)} color="rgba(0,0,0,0.5)" />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={answerScrollViewRef}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              style={{ marginVertical: normalize(10), flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: normalize(8) }}
            >
              {/* 문의 원문 카드 */}
              <View
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: normalize(12),
                  padding: normalize(14),
                  marginBottom: normalize(14),
                }}
              >
                <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(4) }}>
                  <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Bold', color: '#6b7280' }}>
                    문의 제목
                  </Text>
                  {selectedInquiry?.type && (
                    <View
                      style={{
                        paddingHorizontal: normalize(7),
                        paddingVertical: normalize(2),
                        borderRadius: normalize(4),
                        backgroundColor: 'rgba(0,0,0,0.06)',
                      }}
                    >
                      <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-SemiBold', color: '#4b5563' }}>
                        {getInquiryTypeLabel(selectedInquiry.type)}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#111', marginBottom: normalize(10) }}>
                  {selectedInquiry?.title}
                </Text>

                <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Bold', color: '#6b7280', marginBottom: normalize(4) }}>
                  문의 내용
                </Text>
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Regular', color: '#374151', lineHeight: normalize(20) }}>
                  {selectedInquiry?.content}
                </Text>
              </View>

              {/* 빠른 답변 템플릿 선택 영역 */}
              <View style={{ marginBottom: normalize(12) }}>
                <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(6) }}>
                  <View className="flex-row items-center" style={{ gap: normalize(4) }}>
                    <IconSparkles size={normalize(14)} color="#E31B59" />
                    <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Bold', color: '#E31B59' }}>
                      빠른 답변 템플릿
                    </Text>
                  </View>
                  <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: 'rgba(0,0,0,0.4)' }}>
                    버튼 탭 시 자동 입력
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: normalize(6) }}
                >
                  {INQUIRY_ANSWER_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedTemplateId === tmpl.id;
                    const isRecommended = Boolean(
                      selectedInquiry?.type &&
                        (tmpl.type.toUpperCase() === selectedInquiry.type.toUpperCase() ||
                          (tmpl.type === 'SPOT' && selectedInquiry.type === 'SPOT_INFO'))
                    );

                    const handleSelect = () => {
                      setAnswerInput(tmpl.content);
                      setSelectedTemplateId(tmpl.id);
                    };

                    return (
                      <TouchableOpacity
                        key={tmpl.id}
                        onPress={() => {
                          if (answerInput.trim() && answerInput.trim() !== tmpl.content.trim()) {
                            Alert.alert(
                              '템플릿 불러오기',
                              '작성 중인 내용을 선택한 템플릿 문구로 교체하시겠습니까?',
                              [
                                { text: '취소', style: 'cancel' },
                                { text: '교체', onPress: handleSelect },
                              ]
                            );
                          } else {
                            handleSelect();
                          }
                        }}
                        style={{
                          paddingHorizontal: normalize(11),
                          paddingVertical: normalize(6),
                          borderRadius: normalize(8),
                          backgroundColor: isSelected ? '#E31B59' : '#ffffff',
                          borderWidth: 1,
                          borderColor: isSelected ? '#E31B59' : 'rgba(0,0,0,0.12)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: normalize(4),
                        }}
                      >
                        {isSelected && <IconCheck size={normalize(12)} color="#ffffff" strokeWidth={2.5} />}
                        <Text
                          style={{
                            fontSize: FONT_XS,
                            fontFamily: isSelected ? 'Pretendard-Bold' : 'Pretendard-Medium',
                            color: isSelected ? '#ffffff' : '#374151',
                          }}
                        >
                          {tmpl.label}
                        </Text>
                        {isRecommended && !isSelected && (
                          <View
                            style={{
                              paddingHorizontal: normalize(5),
                              paddingVertical: normalize(1.5),
                              borderRadius: normalize(4),
                              backgroundColor: 'rgba(227, 27, 89, 0.08)',
                            }}
                          >
                            <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Bold', color: '#E31B59' }}>
                              추천
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 답변 작성 영역 */}
              <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Bold', color: '#111', marginBottom: normalize(8) }}>
                관리자 답변 내용
              </Text>
              <View
                style={{
                  backgroundColor: '#f5f5f7',
                  borderRadius: normalize(12),
                  padding: normalize(14),
                  marginBottom: normalize(12),
                }}
              >
                <TextInput
                  multiline
                  value={answerInput}
                  onChangeText={(text) => {
                    setAnswerInput(text);
                    const matchedTmpl = INQUIRY_ANSWER_TEMPLATES.find((t) => t.content.trim() === text.trim());
                    setSelectedTemplateId(matchedTmpl ? matchedTmpl.id : null);
                  }}
                  onFocus={() => {
                    setTimeout(() => {
                      answerScrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                  placeholder="고객에게 전달할 답변을 친절하게 작성해 주세요."
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  className="text-black"
                  style={{
                    minHeight: normalize(110),
                    textAlignVertical: 'top',
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-Regular',
                    lineHeight: normalize(22),
                    padding: 0,
                  }}
                />
              </View>

              {/* 7일 정책 안내 */}
              <View
                style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: normalize(8),
                  padding: normalize(10),
                  borderWidth: 0.5,
                  borderColor: '#bbf7d0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: normalize(6),
                }}
              >
                <IconCheck size={normalize(14)} color="#16a34a" />
                <Text style={{ flex: 1, fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: '#15803d', lineHeight: normalize(15) }}>
                  답변 등록 시 상태가 &apos;답변완료(ANSWERED)&apos;로 변경되며, 7일 동안 사용자가 미응답 시 자동 해결 처리됩니다.
                </Text>
              </View>
            </ScrollView>

            {/* 답변 제출 버튼 */}
            <TouchableOpacity
              onPress={handleSubmitAnswer}
              disabled={answerMutation.isPending || !answerInput.trim()}
              style={{
                height: normalize(48),
                borderRadius: BUTTON_RADIUS,
                backgroundColor: !answerInput.trim() || answerMutation.isPending ? '#e5e7eb' : '#E31B59',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: normalize(6),
                marginTop: normalize(4),
              }}
            >
              {answerMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconSend size={normalize(16)} color={!answerInput.trim() ? '#9ca3af' : '#fff'} />
                  <Text
                    style={{
                      fontSize: FONT_MD,
                      fontFamily: 'Pretendard-Bold',
                      color: !answerInput.trim() ? '#9ca3af' : '#fff',
                    }}
                  >
                    답변 등록 및 저장
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Toast Feedback */}
      <Toast visible={toastVisible} message={toastMessage} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  );
}
