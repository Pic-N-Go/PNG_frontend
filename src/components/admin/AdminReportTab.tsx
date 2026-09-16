import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconChevronLeft, IconChevronRight, IconFlag, IconX } from '@tabler/icons-react-native';
import {
  useAdminReportDetail,
  useAdminReports,
  useDeleteAdminReportTarget,
  useProcessAdminReport,
} from '@/hooks/useAdmin';
import type {
  AdminReportFilter,
  AdminReportReason,
  AdminReportStatus,
  AdminReportTargetType,
} from '@/types/admin';
import { BUTTON_HEIGHT, BUTTON_RADIUS, FONT_LG, FONT_MD, FONT_SM, FONT_TITLE, FONT_XS } from '@/constants/layout';
import { BRAND, CARD, SCRIM, TEXT_SUB } from '@/constants/colors';

type ProcessAction = 'DISMISS' | 'DELETE';

const FILTERS: { value: AdminReportFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '처리 대기' },
  { value: 'RESOLVED', label: '조치 완료' },
  { value: 'DISMISSED', label: '신고 기각' },
];
const TARGET_LABELS: Record<AdminReportTargetType, string> = {
  POST: '게시글', REVIEW: '리뷰', COMMENT: '댓글', CHAT_MESSAGE: '채팅',
};
const REASON_LABELS: Record<AdminReportReason, string> = {
  SPAM: '스팸', ABUSE: '욕설/혐오', COPYRIGHT: '저작권 침해',
  INAPPROPRIATE: '부적절한 콘텐츠', ETC: '기타',
};
const STATUS: Record<AdminReportStatus, { label: string; color: string; background: string }> = {
  PENDING: { label: '처리 대기', color: '#b45309', background: '#fffbeb' },
  RESOLVED: { label: '조치 완료', color: '#047857', background: '#ecfdf5' },
  DISMISSED: { label: '신고 기각', color: '#64748b', background: '#f1f5f9' },
};

const formatDate = (value: string | null) => value ? value.replace('T', ' ').slice(0, 16) : '-';

interface Props { showToast: (message: string) => void }

export default function AdminReportTab({ showToast }: Props) {
  const [filter, setFilter] = useState<AdminReportFilter>('ALL');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [processAction, setProcessAction] = useState<ProcessAction | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const reports = useAdminReports(filter, page, 10);
  const detail = useAdminReportDetail(selectedId);
  const processReport = useProcessAdminReport();
  const deleteTarget = useDeleteAdminReportTarget();
  const processing = processReport.isPending || deleteTarget.isPending;

  const closeDetail = () => {
    if (processing) return;
    setProcessAction(null);
    setResolutionNote('');
    setSelectedId(null);
  };
  const openProcessModal = (action: ProcessAction) => {
    setResolutionNote('');
    setProcessAction(action);
  };
  const closeProcessModal = () => {
    if (processing) return;
    setProcessAction(null);
    setResolutionNote('');
  };
  const handleProcess = () => {
    if (!selectedId || !detail.data || !processAction) return;
    const note = resolutionNote.trim() || undefined;
    if (processAction === 'DISMISS') {
      processReport.mutate({
        reportId: selectedId,
        request: { status: 'DISMISSED', resolutionNote: note },
      }, { onSuccess: () => { showToast('신고를 기각 처리했습니다.'); setProcessAction(null); setSelectedId(null); },
        onError: (error) => showToast(error.message) });
      return;
    }
    const target = TARGET_LABELS[detail.data.targetType];
    deleteTarget.mutate({ reportId: selectedId, request: { resolutionNote: note } }, {
        onSuccess: () => { showToast(`${target}을 삭제하고 신고를 처리했습니다.`); setProcessAction(null); setSelectedId(null); },
        onError: (error) => showToast(error.message),
      });
  };

  return <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <IconFlag size={21} color="#e11d48" />
      </View>
      <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_TITLE, color: '#111827' }}>신고 처리</Text>
    </View>
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
      {FILTERS.map((item) => <TouchableOpacity key={item.value} onPress={() => { setFilter(item.value); setPage(0); }} accessibilityRole="button" accessibilityState={{ selected: filter === item.value }} accessibilityLabel={`${item.label} 신고 필터`}
        style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 18, backgroundColor: filter === item.value ? '#e11d48' : '#fff', borderWidth: 1, borderColor: filter === item.value ? '#e11d48' : '#e5e7eb' }}>
        <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: filter === item.value ? '#fff' : '#4b5563' }}>{item.label}</Text>
      </TouchableOpacity>)}
    </View>

    {reports.isLoading ? <ActivityIndicator color="#e11d48" style={{ marginTop: 60 }} /> : reports.isError ?
      <TouchableOpacity onPress={() => reports.refetch()} style={{ padding: 32, alignItems: 'center' }}><Text style={{ color: '#dc2626', fontFamily: 'Pretendard-Medium', fontSize: FONT_SM }}>신고 목록을 불러오지 못했습니다. 다시 시도</Text></TouchableOpacity> :
      reports.data?.content.length === 0 ? <View style={{ paddingVertical: 70, alignItems: 'center' }}><IconFlag size={32} color="#cbd5e1" /><Text style={{ color: '#94a3b8', marginTop: 12, fontFamily: 'Pretendard-Medium', fontSize: FONT_SM }}>해당 상태의 신고가 없습니다.</Text></View> :
      <View style={{ gap: 10 }}>{reports.data?.content.map((report) => {
        const status = STATUS[report.status];
        return <TouchableOpacity key={report.reportId} onPress={() => setSelectedId(report.reportId)} activeOpacity={0.75} accessibilityRole="button" accessibilityLabel={`${TARGET_LABELS[report.targetType]} ${REASON_LABELS[report.reason]} 신고 상세 보기`}
          style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#eef0f3' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#475569', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>{TARGET_LABELS[report.targetType]}</Text>
            <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: status.color, backgroundColor: status.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 6 }}>{status.label}</Text>
            <Text style={{ marginLeft: 'auto', color: '#9ca3af', fontSize: FONT_XS, fontFamily: 'Pretendard-Regular' }}>{formatDate(report.createdAt)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}><View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#111827' }}>{REASON_LABELS[report.reason]}</Text>
            <Text style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, color: '#6b7280', marginTop: 6 }}>신고자 {report.reporterNickname} · 대상 {report.reportedUserNickname}</Text>
            <Text style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: '#9ca3af', marginTop: 4 }}>{TARGET_LABELS[report.targetType]} #{report.targetId} · 신고 #{report.reportId}</Text>
          </View><IconChevronRight size={20} color="#c4c8cf" /></View>
        </TouchableOpacity>;
      })}</View>}

    {!!reports.data && reports.data.totalPages > 1 && <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 18 }}>
      <TouchableOpacity disabled={reports.data.first} onPress={() => setPage((v) => v - 1)}><IconChevronLeft size={22} color={reports.data.first ? '#d1d5db' : '#374151'} /></TouchableOpacity>
      <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#4b5563' }}>{page + 1} / {reports.data.totalPages}</Text>
      <TouchableOpacity disabled={reports.data.last} onPress={() => setPage((v) => v + 1)}><IconChevronRight size={22} color={reports.data.last ? '#d1d5db' : '#374151'} /></TouchableOpacity>
    </View>}

    <Modal visible={selectedId !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeDetail}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View style={{ height: 58, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eef0f3', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 }}>
          <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#111827' }}>신고 상세</Text>
          <TouchableOpacity onPress={closeDetail} accessibilityRole="button" accessibilityLabel="신고 상세 닫기" style={{ marginLeft: 'auto', padding: 6 }}><IconX size={23} color="#374151" /></TouchableOpacity>
        </View>
        {detail.isLoading ? <ActivityIndicator color="#e11d48" style={{ marginTop: 80 }} /> : detail.isError || !detail.data ?
          <TouchableOpacity onPress={() => detail.refetch()} style={{ marginTop: 80, alignItems: 'center' }}><Text style={{ color: '#dc2626', fontFamily: 'Pretendard-Medium', fontSize: FONT_SM }}>상세 정보를 불러오지 못했습니다. 다시 시도</Text></TouchableOpacity> :
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#eef0f3' }}>
              <View style={{ flexDirection: 'row', gap: 7 }}><Tag text={TARGET_LABELS[detail.data.targetType]} /><Tag text={STATUS[detail.data.status].label} color={STATUS[detail.data.status].color} background={STATUS[detail.data.status].background} /></View>
              <Section label="신고 사유" value={REASON_LABELS[detail.data.reason]} />
              <Section label="상세 내용" value={detail.data.detail || '작성된 상세 내용이 없습니다.'} muted={!detail.data.detail} />
              <Section label="신고 대상 원문" value={detail.data.targetContentSnapshot || '저장된 원문이 없습니다.'} box />
              <Section label="신고자" value={`${detail.data.reporterNickname} (#${detail.data.reporterId})`} />
              <Section label="피신고자" value={`${detail.data.reportedUserNickname} (#${detail.data.reportedUserId})`} />
              <Section label="신고 일시" value={formatDate(detail.data.createdAt)} />
              {detail.data.status !== 'PENDING' && <><Section label="처리 담당자" value={detail.data.handledByNickname ? `${detail.data.handledByNickname} (#${detail.data.handledById})` : `#${detail.data.handledById}`} /><Section label="처리 일시" value={formatDate(detail.data.handledAt)} /><Section label="처리 메모" value={detail.data.resolutionNote || '-'} /></>}
            </View>
          </ScrollView>}
        {detail.data?.status === 'PENDING' && <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb', flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity disabled={processing} onPress={() => openProcessModal('DISMISS')} accessibilityRole="button" accessibilityLabel="신고 기각 처리" style={{ flex: 1, height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#475569' }}>신고 기각</Text></TouchableOpacity>
          <TouchableOpacity disabled={processing} onPress={() => openProcessModal('DELETE')} accessibilityRole="button" accessibilityLabel={`${TARGET_LABELS[detail.data.targetType]} 삭제 처리`} style={{ flex: 1.5, height: 50, borderRadius: 12, backgroundColor: '#e11d48', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#fff' }}>{TARGET_LABELS[detail.data.targetType]} 삭제</Text></TouchableOpacity>
        </View>}

        <Modal visible={processAction !== null} transparent animationType="fade" onRequestClose={closeProcessModal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: SCRIM, justifyContent: 'center', paddingHorizontal: 24 }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 20 }}>
              <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_LG, color: '#111827' }}>
                {processAction === 'DELETE' ? `${detail.data ? TARGET_LABELS[detail.data.targetType] : '콘텐츠'} 삭제` : '신고 기각'}
              </Text>
              <Text style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, lineHeight: 20, color: TEXT_SUB, marginTop: 8 }}>
                처리 메모를 남길 수 있습니다. 이 작업은 처리 후 되돌릴 수 없습니다.
              </Text>
              <TextInput
                value={resolutionNote}
                onChangeText={setResolutionNote}
                placeholder="처리 사유나 참고 내용을 입력해 주세요. (선택)"
                placeholderTextColor={TEXT_SUB}
                maxLength={1000}
                multiline
                editable={!processing}
                textAlignVertical="top"
                accessibilityLabel="신고 처리 메모"
                style={{ minHeight: 130, marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: CARD, fontFamily: 'Pretendard-Regular', fontSize: FONT_SM, lineHeight: 20, color: '#111827' }}
              />
              <Text style={{ alignSelf: 'flex-end', marginTop: 6, fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: TEXT_SUB }}>{resolutionNote.length}/1000</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity disabled={processing} onPress={closeProcessModal} accessibilityRole="button" accessibilityLabel="처리 취소" style={{ flex: 1, height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, alignItems: 'center', justifyContent: 'center', backgroundColor: CARD }}>
                  <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#475569' }}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={processing} onPress={handleProcess} accessibilityRole="button" accessibilityLabel={processAction === 'DELETE' ? '삭제 처리 확정' : '기각 처리 확정'} style={{ flex: 1, height: BUTTON_HEIGHT, borderRadius: BUTTON_RADIUS, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND, opacity: processing ? 0.5 : 1 }}>
                  {processing ? <ActivityIndicator color="#fff" /> : <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#fff' }}>{processAction === 'DELETE' ? '삭제 처리' : '기각 처리'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </Modal>
  </View>;
}

function Tag({ text, color = '#475569', background = '#f1f5f9' }: { text: string; color?: string; background?: string }) {
  return <Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color, backgroundColor: background, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6 }}>{text}</Text>;
}

function Section({ label, value, muted, box }: { label: string; value: string; muted?: boolean; box?: boolean }) {
  return <View style={{ marginTop: 22 }}><Text style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#64748b', marginBottom: 7 }}>{label}</Text><Text style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_MD, lineHeight: 23, color: muted ? '#94a3b8' : '#1f2937', ...(box ? { backgroundColor: '#f8fafc', padding: 14, borderRadius: 10 } : {}) }}>{value}</Text></View>;
}
