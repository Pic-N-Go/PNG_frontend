import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import {
  IconTrophy,
  IconPlus,
  IconTrash,
  IconAlertTriangle,
  IconBell,
  IconPhoto,
  IconRefresh,
  IconX,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
} from '@tabler/icons-react-native';
import { normalize } from '@/utils/normalize';
import {
  BUTTON_RADIUS,
  CARD_RADIUS,
  FONT_2XS,
  FONT_LG,
  FONT_MD,
  FONT_SM,
  FONT_XS,
} from '@/constants/layout';
import { BRAND, TEXT_SUB } from '@/constants/colors';
import {
  useAdminContests,
  useAdminContestDetail,
  useCreateContest,
  useSendContestStartNotification,
  useAdminContestEntries,
  useDeleteAdminContestEntry,
  useAdminContestReports,
} from '@/hooks/useAdmin';
import {
  CONTEST_PHASE_LABELS,
  CONTEST_REPORT_REASON_LABELS,
  type ContestPhase,
  type ContestReportReason,
} from '@/types/admin';

interface AdminContestTabProps {
  showToast: (msg: string) => void;
}

type ContestSubTab = 'contests' | 'reports';

const PHASE_COLORS: Record<ContestPhase, { bg: string; text: string }> = {
  UPCOMING: { bg: '#e0f2fe', text: '#0284c7' },
  SUBMITTING: { bg: '#dcfce7', text: '#15803d' },
  VOTING: { bg: '#ede9fe', text: '#7c3aed' },
  RESULT: { bg: '#fef3c7', text: '#b45309' },
  ENDED: { bg: '#f3f4f6', text: '#9ca3af' },
};

const REPORT_REASON_COLORS: Record<ContestReportReason, { bg: string; text: string }> = {
  SPAM: { bg: '#fee2e2', text: '#dc2626' },
  ABUSE: { bg: '#fee2e2', text: '#b91c1c' },
  COPYRIGHT: { bg: '#fef3c7', text: '#b45309' },
  INAPPROPRIATE: { bg: '#fce7f3', text: '#be185d' },
  ETC: { bg: '#f3f4f6', text: '#4b5563' },
};

function formatDateTime(str?: string | null): string {
  if (!str) return '-';
  return str.replace('T', ' ').slice(0, 16);
}

export default function AdminContestTab({ showToast }: AdminContestTabProps) {
  const [subTab, setSubTab] = useState<ContestSubTab>('contests');

  // ── 1. 회차 관리 상태 ──────────────────────────────────────────────
  const [contestPage, setContestPage] = useState(0);
  const {
    data: contestsData,
    isLoading: isContestsLoading,
    isRefetching: isContestsRefetching,
    refetch: refetchContests,
  } = useAdminContests(contestPage, 10);

  // 개설 모달 상태
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createThemeImageUrl, setCreateThemeImageUrl] = useState('');
  const [createMaxEntries, setCreateMaxEntries] = useState('3');
  const [createVoteLimit, setCreateVoteLimit] = useState('3');
  const [createSubmitStartAt, setCreateSubmitStartAt] = useState('');

  const createContestMutation = useCreateContest();
  const sendStartNotificationMutation = useSendContestStartNotification();

  // ── 2. 상세 & 출품작 모달 상태 ──────────────────────────────────────
  const [selectedContestId, setSelectedContestId] = useState<number | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [entriesPage, setEntriesPage] = useState(0);

  const {
    data: contestDetail,
    isLoading: isDetailLoading,
  } = useAdminContestDetail(selectedContestId);

  const {
    data: entriesData,
    isLoading: isEntriesLoading,
    refetch: refetchEntries,
  } = useAdminContestEntries(selectedContestId, entriesPage, 12);

  // ── 3. 출품작 강제 삭제 모달 상태 ────────────────────────────────────
  const [targetEntry, setTargetEntry] = useState<{
    entryId: number;
    userNickname?: string;
    caption?: string;
    contestId?: number;
  } | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteReason, setDeleteReason] = useState('운영자 권한 강제 삭제');

  const deleteEntryMutation = useDeleteAdminContestEntry();

  // ── 4. 신고 접수함 상태 ────────────────────────────────────────────
  const [reportPage, setReportPage] = useState(0);
  const {
    data: reportsData,
    isLoading: isReportsLoading,
    isRefetching: isReportsRefetching,
    refetch: refetchReports,
  } = useAdminContestReports(reportPage, 10);

  // ── 핸들러: 콘테스트 개설 제출 ─────────────────────────────────────
  const handleOpenCreateModal = () => {
    setCreateTitle('');
    setCreateDescription('');
    setCreateThemeImageUrl('');
    setCreateMaxEntries('3');
    setCreateVoteLimit('3');
    setCreateSubmitStartAt('');
    setCreateModalVisible(true);
  };

  const handleSubmitCreateContest = () => {
    if (!createTitle.trim()) {
      Alert.alert('입력 필요', '콘테스트 테마(제목)를 입력해 주세요.');
      return;
    }

    const maxEntries = parseInt(createMaxEntries, 10) || 3;
    const voteLimit = parseInt(createVoteLimit, 10) || 3;

    createContestMutation.mutate(
      {
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        themeImageUrl: createThemeImageUrl.trim() || undefined,
        maxEntriesPerUser: maxEntries,
        voteLimit: voteLimit,
        submitStartAt: createSubmitStartAt.trim() || undefined,
      },
      {
        onSuccess: () => {
          setCreateModalVisible(false);
          showToast('새로운 콘테스트 회차가 성공적으로 개설되었습니다.');
        },
        onError: (err) => {
          Alert.alert('개설 실패', err.message || '콘테스트 개설 중 오류가 발생했습니다.');
        },
      }
    );
  };

  // ── 핸들러: 상세 모달 열기 ─────────────────────────────────────────
  const handleOpenDetailModal = (contestId: number) => {
    setSelectedContestId(contestId);
    setEntriesPage(0);
    setDetailModalVisible(true);
  };

  // ── 핸들러: 출품 시작 알림 발송 ─────────────────────────────────────
  const handleSendStartNotification = (contestId: number, contestTitle: string) => {
    Alert.alert(
      '출품 시작 알림 발송',
      `[${contestTitle}] 구독자들에게 출품 시작 푸시/인앱 알림을 발송하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '알림 발송',
          onPress: () => {
            sendStartNotificationMutation.mutate(contestId, {
              onSuccess: (res) => {
                const count = res?.sentCount ?? 0;
                showToast(`출품 시작 알림이 발송되었습니다. (수신: ${count}명)`);
              },
              onError: (err) => {
                Alert.alert('발송 실패', err.message || '알림 발송 중 오류가 발생했습니다.');
              },
            });
          },
        },
      ]
    );
  };

  // ── 핸들러: 출품작 강제 삭제 열기 ───────────────────────────────────
  const handleOpenDeleteEntryModal = (
    entryId: number,
    userNickname?: string,
    caption?: string,
    contestId?: number
  ) => {
    setTargetEntry({ entryId, userNickname, caption, contestId });
    setDeleteReason('운영자 권한 강제 삭제 (부적절한 게시물)');
    setDeleteModalVisible(true);
  };

  // ── 핸들러: 출품작 강제 삭제 실행 ───────────────────────────────────
  const handleConfirmDeleteEntry = () => {
    if (!targetEntry) return;

    deleteEntryMutation.mutate(
      {
        entryId: targetEntry.entryId,
        reason: deleteReason.trim() || '운영자 권한 강제 삭제',
        contestId: targetEntry.contestId,
      },
      {
        onSuccess: () => {
          setDeleteModalVisible(false);
          showToast(`출품작 #${targetEntry.entryId}이(가) 강제 삭제되었습니다.`);
          setTargetEntry(null);
        },
        onError: (err) => {
          Alert.alert('삭제 실패', err.message || '출품작 삭제 중 오류가 발생했습니다.');
        },
      }
    );
  };

  return (
    <View style={{ gap: normalize(14) }}>
      {/* 서브 탭 세그먼트 (회차 관리 / 신고 접수함) */}
      <View
        className="flex-row bg-white"
        style={{
          borderRadius: normalize(10),
          padding: normalize(4),
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.06)',
        }}
      >
        <TouchableOpacity
          onPress={() => setSubTab('contests')}
          style={{
            flex: 1,
            paddingVertical: normalize(8),
            borderRadius: normalize(8),
            backgroundColor: subTab === 'contests' ? '#111827' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: normalize(6),
          }}
        >
          <IconTrophy
            size={normalize(15)}
            color={subTab === 'contests' ? '#fff' : TEXT_SUB}
            strokeWidth={2}
          />
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: subTab === 'contests' ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
              color: subTab === 'contests' ? '#fff' : TEXT_SUB,
            }}
          >
            회차 관리
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSubTab('reports')}
          style={{
            flex: 1,
            paddingVertical: normalize(8),
            borderRadius: normalize(8),
            backgroundColor: subTab === 'reports' ? '#111827' : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: normalize(6),
          }}
        >
          <IconAlertTriangle
            size={normalize(15)}
            color={subTab === 'reports' ? '#fff' : TEXT_SUB}
            strokeWidth={2}
          />
          <Text
            style={{
              fontSize: FONT_SM,
              fontFamily: subTab === 'reports' ? 'Pretendard-SemiBold' : 'Pretendard-Medium',
              color: subTab === 'reports' ? '#fff' : TEXT_SUB,
            }}
          >
            신고 접수함
          </Text>
        </TouchableOpacity>
      </View>

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 1: 회차 관리
      ══════════════════════════════════════════════════════════════ */}
      {subTab === 'contests' && (
        <View style={{ gap: normalize(12) }}>
          {/* 상단 액션 바 (개설 버튼 & 새로고침) */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text
                style={{
                  fontSize: FONT_LG,
                  fontFamily: 'Pretendard-Bold',
                  color: '#111',
                }}
              >
                콘테스트 회차 목록
              </Text>
              <Text
                style={{
                  fontSize: FONT_2XS,
                  fontFamily: 'Pretendard-Regular',
                  color: TEXT_SUB,
                  marginTop: normalize(2),
                }}
              >
                총 {contestsData?.totalElements ?? 0}개의 회차가 등록되어 있습니다
              </Text>
            </View>

            <View className="flex-row items-center" style={{ gap: normalize(8) }}>
              <TouchableOpacity
                onPress={() => refetchContests()}
                disabled={isContestsRefetching}
                style={{
                  width: normalize(38),
                  height: normalize(38),
                  borderRadius: normalize(10),
                  backgroundColor: '#fff',
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.08)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isContestsRefetching ? (
                  <ActivityIndicator size="small" color={BRAND} />
                ) : (
                  <IconRefresh size={normalize(18)} color="#4b5563" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenCreateModal}
                style={{
                  height: normalize(38),
                  paddingHorizontal: normalize(14),
                  borderRadius: normalize(10),
                  backgroundColor: BRAND,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: normalize(4),
                }}
              >
                <IconPlus size={normalize(16)} color="#fff" strokeWidth={2.2} />
                <Text
                  style={{
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-SemiBold',
                    color: '#fff',
                  }}
                >
                  새 회차 개설
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 목록 로딩 / 빈 화면 / 리스트 */}
          {isContestsLoading ? (
            <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
              <ActivityIndicator size="large" color={BRAND} />
              <Text
                style={{
                  fontSize: FONT_SM,
                  fontFamily: 'Pretendard-Medium',
                  color: TEXT_SUB,
                  marginTop: normalize(10),
                }}
              >
                콘테스트 목록을 불러오는 중...
              </Text>
            </View>
          ) : !contestsData || contestsData.content.length === 0 ? (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: CARD_RADIUS,
                paddingVertical: normalize(40),
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <IconTrophy size={normalize(40)} color="rgba(0,0,0,0.15)" strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: FONT_MD,
                  fontFamily: 'Pretendard-SemiBold',
                  color: '#374151',
                  marginTop: normalize(12),
                }}
              >
                개설된 콘테스트가 없습니다.
              </Text>
              <Text
                style={{
                  fontSize: FONT_XS,
                  fontFamily: 'Pretendard-Regular',
                  color: TEXT_SUB,
                  marginTop: normalize(4),
                }}
              >
                상단의 &apos;새 회차 개설&apos; 버튼으로 콘테스트를 시작해보세요.
              </Text>
            </View>
          ) : (
            <View style={{ gap: normalize(12) }}>
              {contestsData.content.map((item) => {
                const phaseConfig = PHASE_COLORS[item.phase] ?? { bg: '#f3f4f6', text: '#6b7280' };
                const phaseLabel = CONTEST_PHASE_LABELS[item.phase] ?? item.phase;

                return (
                  <View
                    key={item.contestId}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: CARD_RADIUS,
                      padding: normalize(16),
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* 카드 상단: 상태 뱃지 & 회차 ID & 시작 알림 상태 */}
                    <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(8) }}>
                      <View className="flex-row items-center" style={{ gap: normalize(6) }}>
                        <View
                          style={{
                            paddingHorizontal: normalize(8),
                            paddingVertical: normalize(3),
                            borderRadius: normalize(4),
                            backgroundColor: phaseConfig.bg,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: FONT_2XS,
                              fontFamily: 'Pretendard-SemiBold',
                              color: phaseConfig.text,
                            }}
                          >
                            {phaseLabel}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: FONT_XS,
                            fontFamily: 'Pretendard-Medium',
                            color: TEXT_SUB,
                          }}
                        >
                          #{item.contestId}
                        </Text>
                      </View>

                      {item.startNotificationSent ? (
                        <View
                          className="flex-row items-center"
                          style={{
                            gap: normalize(3),
                            paddingHorizontal: normalize(6),
                            paddingVertical: normalize(2),
                            borderRadius: normalize(4),
                            backgroundColor: '#f0fdf4',
                          }}
                        >
                          <IconCheck size={normalize(12)} color="#16a34a" />
                          <Text
                            style={{
                              fontSize: FONT_2XS,
                              fontFamily: 'Pretendard-Medium',
                              color: '#15803d',
                            }}
                          >
                            알림 발송완료
                          </Text>
                        </View>
                      ) : (
                        <View
                          style={{
                            paddingHorizontal: normalize(6),
                            paddingVertical: normalize(2),
                            borderRadius: normalize(4),
                            backgroundColor: '#fef2f2',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: FONT_2XS,
                              fontFamily: 'Pretendard-Medium',
                              color: '#b91c1c',
                            }}
                          >
                            알림 미발송
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 테마 제목 & 설명 */}
                    <Text
                      style={{
                        fontSize: FONT_MD,
                        fontFamily: 'Pretendard-SemiBold',
                        color: '#111',
                        marginBottom: normalize(4),
                      }}
                    >
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: FONT_XS,
                          fontFamily: 'Pretendard-Regular',
                          color: '#4b5563',
                          lineHeight: normalize(18),
                          marginBottom: normalize(10),
                        }}
                      >
                        {item.description}
                      </Text>
                    ) : null}

                    {/* 통계 요약 (출품작 수, 투표 수, 1인 제한) */}
                    <View
                      className="flex-row items-center"
                      style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: normalize(8),
                        paddingVertical: normalize(8),
                        paddingHorizontal: normalize(12),
                        marginBottom: normalize(10),
                        justifyContent: 'space-between',
                      }}
                    >
                      <View className="items-center">
                        <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: TEXT_SUB }}>
                          총 출품수
                        </Text>
                        <Text
                          style={{
                            fontSize: FONT_SM,
                            fontFamily: 'Pretendard-Bold',
                            color: '#111827',
                            marginTop: normalize(2),
                          }}
                        >
                          {item.totalEntries}개
                        </Text>
                      </View>

                      <View style={{ width: 1, height: normalize(18), backgroundColor: '#e5e7eb' }} />

                      <View className="items-center">
                        <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: TEXT_SUB }}>
                          총 투표수
                        </Text>
                        <Text
                          style={{
                            fontSize: FONT_SM,
                            fontFamily: 'Pretendard-Bold',
                            color: '#111827',
                            marginTop: normalize(2),
                          }}
                        >
                          {item.totalVotes}표
                        </Text>
                      </View>

                      <View style={{ width: 1, height: normalize(18), backgroundColor: '#e5e7eb' }} />

                      <View className="items-center">
                        <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: TEXT_SUB }}>
                          최대출품/투표
                        </Text>
                        <Text
                          style={{
                            fontSize: FONT_SM,
                            fontFamily: 'Pretendard-Bold',
                            color: '#111827',
                            marginTop: normalize(2),
                          }}
                        >
                          {item.maxEntriesPerUser}장 / {item.voteLimit}회
                        </Text>
                      </View>
                    </View>

                    {/* 일정 안내 */}
                    <View style={{ gap: normalize(3), marginBottom: normalize(12) }}>
                      <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: '#6b7280' }}>
                        출품: {formatDateTime(item.submitStartAt)} ~ {formatDateTime(item.submitEndAt)}
                      </Text>
                      <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: '#6b7280' }}>
                        투표: {formatDateTime(item.voteStartAt)} ~ {formatDateTime(item.voteEndAt)}
                      </Text>
                      <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: '#6b7280' }}>
                        발표: {formatDateTime(item.resultOpenAt)}
                      </Text>
                    </View>

                    {/* 하단 액션 버튼 그룹 */}
                    <View className="flex-row items-center" style={{ gap: normalize(8) }}>
                      <TouchableOpacity
                        onPress={() => handleOpenDetailModal(item.contestId)}
                        style={{
                          flex: 1,
                          height: normalize(36),
                          borderRadius: normalize(8),
                          backgroundColor: '#f3f4f6',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'row',
                          gap: normalize(4),
                        }}
                      >
                        <IconPhoto size={normalize(14)} color="#374151" />
                        <Text
                          style={{
                            fontSize: FONT_XS,
                            fontFamily: 'Pretendard-SemiBold',
                            color: '#374151',
                          }}
                        >
                          상세 및 출품작
                        </Text>
                      </TouchableOpacity>

                      {!item.startNotificationSent && (
                        <TouchableOpacity
                          onPress={() => handleSendStartNotification(item.contestId, item.title)}
                          disabled={sendStartNotificationMutation.isPending}
                          style={{
                            height: normalize(36),
                            paddingHorizontal: normalize(12),
                            borderRadius: normalize(8),
                            backgroundColor: '#e0f2fe',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: normalize(4),
                          }}
                        >
                          <IconBell size={normalize(14)} color="#0284c7" />
                          <Text
                            style={{
                              fontSize: FONT_XS,
                              fontFamily: 'Pretendard-SemiBold',
                              color: '#0284c7',
                            }}
                          >
                            시작 알림 발송
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* 페이징 컨트롤 */}
              {contestsData.totalPages > 1 && (
                <View
                  className="flex-row items-center justify-between"
                  style={{
                    paddingVertical: normalize(10),
                    paddingHorizontal: normalize(8),
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setContestPage((p) => Math.max(0, p - 1))}
                    disabled={contestsData.first}
                    style={{
                      height: normalize(36),
                      paddingHorizontal: normalize(14),
                      borderRadius: normalize(8),
                      backgroundColor: contestsData.first ? '#f3f4f6' : '#fff',
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: normalize(4),
                    }}
                  >
                    <IconChevronLeft
                      size={normalize(16)}
                      color={contestsData.first ? '#9ca3af' : '#374151'}
                    />
                    <Text
                      style={{
                        fontSize: FONT_XS,
                        fontFamily: 'Pretendard-Medium',
                        color: contestsData.first ? '#9ca3af' : '#374151',
                      }}
                    >
                      이전
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: 'Pretendard-Medium',
                      color: TEXT_SUB,
                    }}
                  >
                    {contestPage + 1} / {contestsData.totalPages} 페이지
                  </Text>

                  <TouchableOpacity
                    onPress={() => setContestPage((p) => Math.min(contestsData.totalPages - 1, p + 1))}
                    disabled={contestsData.last}
                    style={{
                      height: normalize(36),
                      paddingHorizontal: normalize(14),
                      borderRadius: normalize(8),
                      backgroundColor: contestsData.last ? '#f3f4f6' : '#fff',
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: normalize(4),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: FONT_XS,
                        fontFamily: 'Pretendard-Medium',
                        color: contestsData.last ? '#9ca3af' : '#374151',
                      }}
                    >
                      다음
                    </Text>
                    <IconChevronRight
                      size={normalize(16)}
                      color={contestsData.last ? '#9ca3af' : '#374151'}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SUBTAB 2: 신고 접수함
      ══════════════════════════════════════════════════════════════ */}
      {subTab === 'reports' && (
        <View style={{ gap: normalize(12) }}>
          <View className="flex-row items-center justify-between">
            <View>
              <Text
                style={{
                  fontSize: FONT_LG,
                  fontFamily: 'Pretendard-Bold',
                  color: '#111',
                }}
              >
                출품작 신고 접수함
              </Text>
              <Text
                style={{
                  fontSize: FONT_2XS,
                  fontFamily: 'Pretendard-Regular',
                  color: TEXT_SUB,
                  marginTop: normalize(2),
                }}
              >
                유저들이 접수한 부적절한 출품작 신고 내역입니다
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => refetchReports()}
              disabled={isReportsRefetching}
              style={{
                width: normalize(38),
                height: normalize(38),
                borderRadius: normalize(10),
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isReportsRefetching ? (
                <ActivityIndicator size="small" color={BRAND} />
              ) : (
                <IconRefresh size={normalize(18)} color="#4b5563" />
              )}
            </TouchableOpacity>
          </View>

          {/* 신고 목록 로딩 / 빈 화면 / 리스트 */}
          {isReportsLoading ? (
            <View style={{ paddingVertical: normalize(40), alignItems: 'center' }}>
              <ActivityIndicator size="large" color={BRAND} />
              <Text
                style={{
                  fontSize: FONT_SM,
                  fontFamily: 'Pretendard-Medium',
                  color: TEXT_SUB,
                  marginTop: normalize(10),
                }}
              >
                신고 접수 내역을 불러오는 중...
              </Text>
            </View>
          ) : !reportsData || reportsData.content.length === 0 ? (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: CARD_RADIUS,
                paddingVertical: normalize(40),
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(0,0,0,0.06)',
              }}
            >
              <IconCheck size={normalize(40)} color="#16a34a" strokeWidth={1.5} />
              <Text
                style={{
                  fontSize: FONT_MD,
                  fontFamily: 'Pretendard-SemiBold',
                  color: '#374151',
                  marginTop: normalize(12),
                }}
              >
                접수된 신고 내역이 없습니다.
              </Text>
              <Text
                style={{
                  fontSize: FONT_XS,
                  fontFamily: 'Pretendard-Regular',
                  color: TEXT_SUB,
                  marginTop: normalize(4),
                }}
              >
                모든 출품작이 쾌적하게 운영되고 있습니다.
              </Text>
            </View>
          ) : (
            <View style={{ gap: normalize(12) }}>
              {reportsData.content.map((item) => {
                const reasonColor = REPORT_REASON_COLORS[item.reason] ?? {
                  bg: '#f3f4f6',
                  text: '#4b5563',
                };
                const reasonLabel = CONTEST_REPORT_REASON_LABELS[item.reason] ?? item.reason;

                return (
                  <View
                    key={item.reportId}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: CARD_RADIUS,
                      padding: normalize(14),
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* 상단: 신고 사유 뱃지 + 신고일시 */}
                    <View className="flex-row items-center justify-between" style={{ marginBottom: normalize(8) }}>
                      <View
                        style={{
                          paddingHorizontal: normalize(8),
                          paddingVertical: normalize(3),
                          borderRadius: normalize(4),
                          backgroundColor: reasonColor.bg,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: FONT_2XS,
                            fontFamily: 'Pretendard-SemiBold',
                            color: reasonColor.text,
                          }}
                        >
                          {reasonLabel}
                        </Text>
                      </View>

                      <Text
                        style={{
                          fontSize: FONT_2XS,
                          fontFamily: 'Pretendard-Regular',
                          color: TEXT_SUB,
                        }}
                      >
                        {formatDateTime(item.createdAt)}
                      </Text>
                    </View>

                    {/* 출품작 사진 & 정보 */}
                    <View className="flex-row" style={{ gap: normalize(12), marginBottom: normalize(10) }}>
                      {item.entryPhotoUrl ? (
                        <Image
                          source={{ uri: item.entryPhotoUrl }}
                          style={{
                            width: normalize(72),
                            height: normalize(72),
                            borderRadius: normalize(8),
                            backgroundColor: '#e5e7eb',
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: normalize(72),
                            height: normalize(72),
                            borderRadius: normalize(8),
                            backgroundColor: '#f3f4f6',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <IconPhoto size={normalize(24)} color="#9ca3af" />
                        </View>
                      )}

                      <View style={{ flex: 1, justifyContent: 'space-between' }}>
                        <View>
                          <Text
                            style={{
                              fontSize: FONT_2XS,
                              fontFamily: 'Pretendard-Regular',
                              color: TEXT_SUB,
                            }}
                          >
                            출품작 #{item.entryId} · 작성자: {item.entryAuthorNickname}
                          </Text>
                          {item.entryCaption ? (
                            <Text
                              numberOfLines={2}
                              style={{
                                fontSize: FONT_XS,
                                fontFamily: 'Pretendard-Medium',
                                color: '#111827',
                                marginTop: normalize(2),
                              }}
                            >
                              &quot;{item.entryCaption}&quot;
                            </Text>
                          ) : null}
                        </View>

                        <Text
                          style={{
                            fontSize: FONT_2XS,
                            fontFamily: 'Pretendard-Regular',
                            color: '#6b7280',
                          }}
                        >
                          신고자: {item.reporterNickname} (#{item.reporterId})
                        </Text>
                      </View>
                    </View>

                    {/* 신고 상세 사유 */}
                    {item.content ? (
                      <View
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: normalize(8),
                          padding: normalize(10),
                          marginBottom: normalize(10),
                        }}
                      >
                        <Text
                          style={{
                            fontSize: FONT_2XS,
                            fontFamily: 'Pretendard-SemiBold',
                            color: '#6b7280',
                            marginBottom: normalize(2),
                          }}
                        >
                          신고 상세 내용
                        </Text>
                        <Text
                          style={{
                            fontSize: FONT_XS,
                            fontFamily: 'Pretendard-Regular',
                            color: '#374151',
                            lineHeight: normalize(18),
                          }}
                        >
                          {item.content}
                        </Text>
                      </View>
                    ) : null}

                    {/* 강제 삭제 액션 버튼 */}
                    <TouchableOpacity
                      onPress={() =>
                        handleOpenDeleteEntryModal(
                          item.entryId,
                          item.entryAuthorNickname,
                          item.entryCaption || undefined
                        )
                      }
                      style={{
                        height: normalize(34),
                        borderRadius: normalize(8),
                        backgroundColor: '#fef2f2',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: normalize(4),
                      }}
                    >
                      <IconTrash size={normalize(14)} color="#dc2626" />
                      <Text
                        style={{
                          fontSize: FONT_XS,
                          fontFamily: 'Pretendard-SemiBold',
                          color: '#dc2626',
                        }}
                      >
                        해당 출품작 강제 삭제
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* 페이징 컨트롤 */}
              {reportsData.totalPages > 1 && (
                <View
                  className="flex-row items-center justify-between"
                  style={{
                    paddingVertical: normalize(10),
                    paddingHorizontal: normalize(8),
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setReportPage((p) => Math.max(0, p - 1))}
                    disabled={reportsData.first}
                    style={{
                      height: normalize(36),
                      paddingHorizontal: normalize(14),
                      borderRadius: normalize(8),
                      backgroundColor: reportsData.first ? '#f3f4f6' : '#fff',
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: normalize(4),
                    }}
                  >
                    <IconChevronLeft
                      size={normalize(16)}
                      color={reportsData.first ? '#9ca3af' : '#374151'}
                    />
                    <Text
                      style={{
                        fontSize: FONT_XS,
                        fontFamily: 'Pretendard-Medium',
                        color: reportsData.first ? '#9ca3af' : '#374151',
                      }}
                    >
                      이전
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={{
                      fontSize: FONT_SM,
                      fontFamily: 'Pretendard-Medium',
                      color: TEXT_SUB,
                    }}
                  >
                    {reportPage + 1} / {reportsData.totalPages} 페이지
                  </Text>

                  <TouchableOpacity
                    onPress={() => setReportPage((p) => Math.min(reportsData.totalPages - 1, p + 1))}
                    disabled={reportsData.last}
                    style={{
                      height: normalize(36),
                      paddingHorizontal: normalize(14),
                      borderRadius: normalize(8),
                      backgroundColor: reportsData.last ? '#f3f4f6' : '#fff',
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.06)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: normalize(4),
                    }}
                  >
                    <Text
                      style={{
                        fontSize: FONT_XS,
                        fontFamily: 'Pretendard-Medium',
                        color: reportsData.last ? '#9ca3af' : '#374151',
                      }}
                    >
                      다음
                    </Text>
                    <IconChevronRight
                      size={normalize(16)}
                      color={reportsData.last ? '#9ca3af' : '#374151'}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL 1: 새 콘테스트 회차 개설 모달
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/60"
          style={{ paddingHorizontal: normalize(20) }}
          onPress={() => setCreateModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: CARD_RADIUS,
              padding: normalize(20),
              maxHeight: Dimensions.get('screen').height * 0.85,
            }}
          >
            {/* 모달 헤더 */}
            <View className="flex-row items-center justify-between border-b-[0.5px] border-hairline pb-3">
              <View className="flex-row items-center" style={{ gap: normalize(6) }}>
                <IconTrophy size={normalize(20)} color={BRAND} />
                <Text style={{ fontSize: FONT_LG, fontFamily: 'Pretendard-SemiBold', color: '#111' }}>
                  새 콘테스트 회차 개설
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)} hitSlop={8}>
                <IconX size={normalize(20)} color="rgba(0,0,0,0.5)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: normalize(14) }}>
              <View style={{ gap: normalize(14) }}>
                {/* 1. 테마(제목) */}
                <View>
                  <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#374151', marginBottom: normalize(4) }}>
                    콘테스트 테마명 (필수)
                  </Text>
                  <TextInput
                    value={createTitle}
                    onChangeText={setCreateTitle}
                    placeholder="예: 가을 단풍과 함께한 최고의 순간"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    style={{
                      height: normalize(42),
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.12)',
                      borderRadius: normalize(8),
                      paddingHorizontal: normalize(12),
                      fontSize: FONT_SM,
                      fontFamily: 'Pretendard-Medium',
                      color: '#111',
                    }}
                  />
                </View>

                {/* 2. 설명 */}
                <View>
                  <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#374151', marginBottom: normalize(4) }}>
                    테마 설명 (선택)
                  </Text>
                  <TextInput
                    value={createDescription}
                    onChangeText={setCreateDescription}
                    placeholder="콘테스트 참여 안내 및 테마 설명"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    multiline
                    numberOfLines={3}
                    style={{
                      height: normalize(72),
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.12)',
                      borderRadius: normalize(8),
                      paddingHorizontal: normalize(12),
                      paddingTop: normalize(8),
                      fontSize: FONT_SM,
                      fontFamily: 'Pretendard-Regular',
                      color: '#111',
                      textAlignVertical: 'top',
                    }}
                  />
                </View>

                {/* 3. 대표 이미지 URL */}
                <View>
                  <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#374151', marginBottom: normalize(4) }}>
                    대표 이미지 URL (선택)
                  </Text>
                  <TextInput
                    value={createThemeImageUrl}
                    onChangeText={setCreateThemeImageUrl}
                    placeholder="https://example.com/theme.jpg"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    autoCapitalize="none"
                    style={{
                      height: normalize(42),
                      borderWidth: 1,
                      borderColor: 'rgba(0,0,0,0.12)',
                      borderRadius: normalize(8),
                      paddingHorizontal: normalize(12),
                      fontSize: FONT_SM,
                      fontFamily: 'Pretendard-Regular',
                      color: '#111',
                    }}
                  />
                </View>

                {/* 4. 최대 출품수 & 투표수 */}
                <View className="flex-row" style={{ gap: normalize(12) }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#374151', marginBottom: normalize(4) }}>
                      1인 최대 출품 수
                    </Text>
                    <TextInput
                      value={createMaxEntries}
                      onChangeText={setCreateMaxEntries}
                      keyboardType="numeric"
                      placeholder="3"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      style={{
                        height: normalize(42),
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.12)',
                        borderRadius: normalize(8),
                        paddingHorizontal: normalize(12),
                        fontSize: FONT_SM,
                        fontFamily: 'Pretendard-Medium',
                        color: '#111',
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#374151', marginBottom: normalize(4) }}>
                      1인 최대 투표 수
                    </Text>
                    <TextInput
                      value={createVoteLimit}
                      onChangeText={setCreateVoteLimit}
                      keyboardType="numeric"
                      placeholder="3"
                      placeholderTextColor="rgba(0,0,0,0.3)"
                      style={{
                        height: normalize(42),
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.12)',
                        borderRadius: normalize(8),
                        paddingHorizontal: normalize(12),
                        fontSize: FONT_SM,
                        fontFamily: 'Pretendard-Medium',
                        color: '#111',
                      }}
                    />
                  </View>
                </View>

                {/* 안내 카드 */}
                <View
                  style={{
                    backgroundColor: '#eff6ff',
                    borderRadius: normalize(8),
                    padding: normalize(10),
                    flexDirection: 'row',
                    gap: normalize(6),
                  }}
                >
                  <IconClock size={normalize(16)} color="#2563eb" />
                  <Text
                    style={{
                      flex: 1,
                      fontSize: FONT_2XS,
                      fontFamily: 'Pretendard-Regular',
                      color: '#1d4ed8',
                      lineHeight: normalize(16),
                    }}
                  >
                    일정 규칙: 출품 2주 → 투표 2주 → 익일 오전 9시 발표 순으로 자동 산정됩니다.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* 개설 완료 버튼 */}
            <TouchableOpacity
              onPress={handleSubmitCreateContest}
              disabled={createContestMutation.isPending || !createTitle.trim()}
              style={{
                height: normalize(46),
                borderRadius: BUTTON_RADIUS,
                backgroundColor: !createTitle.trim() || createContestMutation.isPending ? '#e5e7eb' : BRAND,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: normalize(6),
              }}
            >
              {createContestMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <IconCheck size={normalize(16)} color={!createTitle.trim() ? '#9ca3af' : '#fff'} />
                  <Text
                    style={{
                      fontSize: FONT_MD,
                      fontFamily: 'Pretendard-SemiBold',
                      color: !createTitle.trim() ? '#9ca3af' : '#fff',
                    }}
                  >
                    콘테스트 개설하기
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 2: 콘테스트 상세 & 출품작 관리 모달
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setDetailModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: normalize(20),
              borderTopRightRadius: normalize(20),
              paddingHorizontal: normalize(20),
              paddingTop: normalize(18),
              paddingBottom: normalize(32),
              maxHeight: Dimensions.get('screen').height * 0.9,
            }}
          >
            {/* 헤더 */}
            <View className="flex-row items-center justify-between border-b-[0.5px] border-hairline pb-3">
              <View>
                <Text style={{ fontSize: FONT_LG, fontFamily: 'Pretendard-Bold', color: '#111' }}>
                  콘테스트 상세 및 출품작
                </Text>
                <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-Regular', color: TEXT_SUB, marginTop: normalize(2) }}>
                  #{selectedContestId} {contestDetail?.title ?? ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} hitSlop={8}>
                <IconX size={normalize(22)} color="rgba(0,0,0,0.5)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: normalize(12) }}>
              {isDetailLoading ? (
                <View style={{ paddingVertical: normalize(30), alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={BRAND} />
                </View>
              ) : contestDetail ? (
                <View style={{ gap: normalize(14) }}>
                  {/* 통계 4분할 그리드 */}
                  <View
                    className="flex-row flex-wrap"
                    style={{
                      backgroundColor: '#f9fafb',
                      borderRadius: normalize(12),
                      padding: normalize(12),
                      gap: normalize(8),
                    }}
                  >
                    <View style={{ width: '48%', paddingVertical: normalize(6) }}>
                      <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: TEXT_SUB }}>
                        구독자 수
                      </Text>
                      <Text style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-Bold', color: '#111', marginTop: normalize(2) }}>
                        {contestDetail.subscriberCount}명
                      </Text>
                    </View>

                    <View style={{ width: '48%', paddingVertical: normalize(6) }}>
                      <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: TEXT_SUB }}>
                        출품자 수
                      </Text>
                      <Text style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-Bold', color: '#111', marginTop: normalize(2) }}>
                        {contestDetail.participantCount}명
                      </Text>
                    </View>

                    <View style={{ width: '48%', paddingVertical: normalize(6) }}>
                      <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: TEXT_SUB }}>
                        총 출품 수
                      </Text>
                      <Text style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-Bold', color: '#111', marginTop: normalize(2) }}>
                        {contestDetail.totalEntries}개
                      </Text>
                    </View>

                    <View style={{ width: '48%', paddingVertical: normalize(6) }}>
                      <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: TEXT_SUB }}>
                        총 투표 수
                      </Text>
                      <Text style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-Bold', color: '#111', marginTop: normalize(2) }}>
                        {contestDetail.totalVotes}표
                      </Text>
                    </View>
                  </View>

                  {/* 출품작 섹션 타이틀 */}
                  <View className="flex-row items-center justify-between">
                    <Text style={{ fontSize: FONT_MD, fontFamily: 'Pretendard-SemiBold', color: '#111' }}>
                      출품작 관리 ({entriesData?.totalElements ?? 0})
                    </Text>
                    <TouchableOpacity onPress={() => refetchEntries()} hitSlop={6}>
                      <IconRefresh size={normalize(16)} color="#4b5563" />
                    </TouchableOpacity>
                  </View>

                  {/* 출품작 목록 */}
                  {isEntriesLoading ? (
                    <View style={{ paddingVertical: normalize(30), alignItems: 'center' }}>
                      <ActivityIndicator size="small" color={BRAND} />
                    </View>
                  ) : !entriesData || entriesData.content.length === 0 ? (
                    <View
                      style={{
                        paddingVertical: normalize(30),
                        alignItems: 'center',
                        backgroundColor: '#f9fafb',
                        borderRadius: normalize(10),
                      }}
                    >
                      <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Medium', color: TEXT_SUB }}>
                        등록된 출품작이 없습니다.
                      </Text>
                    </View>
                  ) : (
                    <View style={{ gap: normalize(10) }}>
                      {entriesData.content.map((entry) => (
                        <View
                          key={entry.entryId}
                          style={{
                            backgroundColor: '#fff',
                            borderRadius: normalize(10),
                            borderWidth: 1,
                            borderColor: 'rgba(0,0,0,0.06)',
                            padding: normalize(12),
                            flexDirection: 'row',
                            gap: normalize(12),
                          }}
                        >
                          {entry.photoUrl ? (
                            <Image
                              source={{ uri: entry.photoUrl }}
                              style={{
                                width: normalize(70),
                                height: normalize(70),
                                borderRadius: normalize(8),
                                backgroundColor: '#e5e7eb',
                              }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={{
                                width: normalize(70),
                                height: normalize(70),
                                borderRadius: normalize(8),
                                backgroundColor: '#f3f4f6',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconPhoto size={normalize(24)} color="#9ca3af" />
                            </View>
                          )}

                          <View style={{ flex: 1, justifyContent: 'space-between' }}>
                            <View>
                              <View className="flex-row items-center justify-between">
                                <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: TEXT_SUB }}>
                                  #{entry.entryId} · {entry.userNickname}
                                </Text>
                                <View className="flex-row items-center" style={{ gap: normalize(4) }}>
                                  <View
                                    style={{
                                      paddingHorizontal: normalize(6),
                                      paddingVertical: normalize(1),
                                      borderRadius: normalize(4),
                                      backgroundColor: '#f3f4f6',
                                    }}
                                  >
                                    <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Medium', color: '#4b5563' }}>
                                      {entry.voteCount}표
                                    </Text>
                                  </View>

                                  {entry.reportCount > 0 && (
                                    <View
                                      style={{
                                        paddingHorizontal: normalize(6),
                                        paddingVertical: normalize(1),
                                        borderRadius: normalize(4),
                                        backgroundColor: '#fee2e2',
                                      }}
                                    >
                                      <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-SemiBold', color: '#dc2626' }}>
                                        신고 {entry.reportCount}건
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>

                              {entry.caption ? (
                                <Text
                                  numberOfLines={2}
                                  style={{
                                    fontSize: FONT_XS,
                                    fontFamily: 'Pretendard-Medium',
                                    color: '#111',
                                    marginTop: normalize(3),
                                  }}
                                >
                                  {entry.caption}
                                </Text>
                              ) : null}

                              {entry.spotName ? (
                                <Text
                                  style={{
                                    fontSize: FONT_2XS,
                                    fontFamily: 'Pretendard-Regular',
                                    color: BRAND,
                                    marginTop: normalize(2),
                                  }}
                                >
                                  📍 {entry.spotName}
                                </Text>
                              ) : null}
                            </View>

                            <TouchableOpacity
                              onPress={() =>
                                handleOpenDeleteEntryModal(
                                  entry.entryId,
                                  entry.userNickname,
                                  entry.caption || undefined,
                                  entry.contestId
                                )
                              }
                              style={{
                                alignSelf: 'flex-end',
                                paddingHorizontal: normalize(8),
                                paddingVertical: normalize(3),
                                borderRadius: normalize(6),
                                backgroundColor: '#fef2f2',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: normalize(3),
                              }}
                            >
                              <IconTrash size={normalize(12)} color="#dc2626" />
                              <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-SemiBold', color: '#dc2626' }}>
                                강제 삭제
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}

                      {/* 출품작 페이징 */}
                      {entriesData.totalPages > 1 && (
                        <View className="flex-row items-center justify-between" style={{ marginTop: normalize(6) }}>
                          <TouchableOpacity
                            onPress={() => setEntriesPage((p) => Math.max(0, p - 1))}
                            disabled={entriesData.first}
                            style={{
                              paddingHorizontal: normalize(10),
                              paddingVertical: normalize(6),
                              borderRadius: normalize(6),
                              backgroundColor: entriesData.first ? '#f3f4f6' : '#fff',
                              borderWidth: 1,
                              borderColor: 'rgba(0,0,0,0.06)',
                            }}
                          >
                            <Text style={{ fontSize: FONT_2XS, color: entriesData.first ? '#9ca3af' : '#374151' }}>
                              이전
                            </Text>
                          </TouchableOpacity>

                          <Text style={{ fontSize: FONT_2XS, color: TEXT_SUB }}>
                            {entriesPage + 1} / {entriesData.totalPages}
                          </Text>

                          <TouchableOpacity
                            onPress={() => setEntriesPage((p) => Math.min(entriesData.totalPages - 1, p + 1))}
                            disabled={entriesData.last}
                            style={{
                              paddingHorizontal: normalize(10),
                              paddingVertical: normalize(6),
                              borderRadius: normalize(6),
                              backgroundColor: entriesData.last ? '#f3f4f6' : '#fff',
                              borderWidth: 1,
                              borderColor: 'rgba(0,0,0,0.06)',
                            }}
                          >
                            <Text style={{ fontSize: FONT_2XS, color: entriesData.last ? '#9ca3af' : '#374151' }}>
                              다음
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 3: 출품작 강제 삭제 사유 입력 모달
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center bg-black/60"
          style={{ paddingHorizontal: normalize(20) }}
          onPress={() => setDeleteModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: CARD_RADIUS,
              padding: normalize(20),
            }}
          >
            <View className="flex-row items-center justify-between border-b-[0.5px] border-hairline pb-3">
              <View className="flex-row items-center" style={{ gap: normalize(6) }}>
                <IconTrash size={normalize(20)} color="#dc2626" />
                <Text style={{ fontSize: FONT_LG, fontFamily: 'Pretendard-SemiBold', color: '#111' }}>
                  출품작 강제 삭제
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDeleteModalVisible(false)} hitSlop={8}>
                <IconX size={normalize(20)} color="rgba(0,0,0,0.5)" />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: normalize(14), gap: normalize(10) }}>
              <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Medium', color: '#374151' }}>
                출품작 #{targetEntry?.entryId} (작성자: {targetEntry?.userNickname})을(를) 삭제하시겠습니까?
              </Text>
              <Text style={{ fontSize: FONT_2XS, fontFamily: 'Pretendard-Regular', color: '#dc2626' }}>
                삭제 시 관련된 투표, 신고 내역, 이미지 스토리지 파일이 함께 정리됩니다.
              </Text>

              <View style={{ marginTop: normalize(4) }}>
                <Text style={{ fontSize: FONT_XS, fontFamily: 'Pretendard-SemiBold', color: '#374151', marginBottom: normalize(4) }}>
                  삭제 사유 입력
                </Text>
                <TextInput
                  value={deleteReason}
                  onChangeText={setDeleteReason}
                  placeholder="예: 타인의 저작권 침해 또는 부적절한 이미지"
                  placeholderTextColor="rgba(0,0,0,0.3)"
                  style={{
                    height: normalize(42),
                    borderWidth: 1,
                    borderColor: 'rgba(0,0,0,0.12)',
                    borderRadius: normalize(8),
                    paddingHorizontal: normalize(12),
                    fontSize: FONT_SM,
                    fontFamily: 'Pretendard-Regular',
                    color: '#111',
                  }}
                />
              </View>
            </View>

            <View className="flex-row items-center" style={{ gap: normalize(8) }}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={{
                  flex: 1,
                  height: normalize(44),
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: '#f3f4f6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-Medium', color: '#4b5563' }}>
                  취소
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDeleteEntry}
                disabled={deleteEntryMutation.isPending}
                style={{
                  flex: 1,
                  height: normalize(44),
                  borderRadius: BUTTON_RADIUS,
                  backgroundColor: '#dc2626',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {deleteEntryMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontSize: FONT_SM, fontFamily: 'Pretendard-SemiBold', color: '#fff' }}>
                    삭제 확인
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
