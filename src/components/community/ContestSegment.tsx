import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import ContestActiveTab from '@/components/community/ContestActiveTab';
import ContestMyEntryTab from '@/components/community/ContestMyEntryTab';
import ContestPastTab from '@/components/community/ContestPastTab';
import SubmitEntrySheet from '@/components/community/SubmitEntrySheet';
import { ContestGoalInfo, ContestPastItem, ContestSubmission, ContestVoteEntry } from '@/types/community';
import { FONT_SM } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

type SubtabKey = 'active' | 'mine' | 'past';

const SUBTABS: { key: SubtabKey; label: string }[] = [
  { key: 'active', label: '진행중' },
  { key: 'mine', label: '내 출품' },
  { key: 'past', label: '지난' },
];

// ~/Desktop/handoff/golden-hour-contest.html("시안 1b") 기준 mock 데이터
const CONTEST_GOAL: ContestGoalInfo = {
  title: '골든아워',
  subtitle: '해 뜨거나 지는 시간의 빛을 담아보세요',
  label: 'WEEKLY CONTEST',
  daysLeft: 3,
  participants: 128,
  goal: 200,
};

const INITIAL_RANKING: ContestVoteEntry[] = [
  { id: '1', rank: 1, author: '@sunset_jk', place: '광안리 · 05:30', votes: 67, voted: false, gradient: ['#2b2338', '#7a3b4e', '#e0956d'] },
  { id: '2', rank: 2, author: '@minsoo', votes: 42, voted: false, gradient: ['#12242a', '#2f5a5e', '#7fa39a'] },
  { id: '3', rank: 3, author: '@yujin', votes: 31, voted: false, gradient: ['#2a1830', '#6b3a5e', '#c98b9c'] },
];

const INITIAL_SUBMISSIONS: ContestVoteEntry[] = [
  { id: '4', rank: 4, author: '@haneul', votes: 28, voted: false, gradient: ['#2b2a1c', '#6b6142', '#b5a173'] },
  { id: '5', rank: 5, author: '@jin_00', votes: 24, voted: false, gradient: ['#0f2a22', '#2f6a52', '#6fae8c'] },
  { id: '6', rank: 6, author: '@seoyeon', votes: 19, voted: false, gradient: ['#0d0b22', '#241f4a', '#4b4380'] },
  { id: '7', rank: 7, author: '@dawnlee', votes: 15, voted: false, gradient: ['#2a1030', '#8b4438', '#f0c89a'] },
];

const MY_SUBMISSION: ContestSubmission = {
  hasEntry: true,
  entry: {
    photoGradient: ['#2b2a1c', '#6b6142', '#b5a173'],
    caption: '도심 속 황금빛 노을, 빌딩 사이로 스며드는 빛',
    rank: 4,
    voteCount: 28,
    totalParticipants: 128,
    location: '서울 종로 세운상가',
    submittedAgoLabel: '2일 전 출품',
    votesToNextRank: 39,
  },
};

const PAST_ITEMS: ContestPastItem[] = [
  { id: 'p1', theme: '숲 산책', winnerHandle: '@forestday', voteCount: 89, agoLabel: '3주 전', participantCount: 65, gradient: ['#0a1a0f', '#4a8060', '#a8c090'] },
  { id: 'p2', theme: '밤하늘', winnerHandle: '@nightowl', voteCount: 124, agoLabel: '4주 전', participantCount: 142, gradient: ['#020010', '#1a1545', '#4a4080'] },
  { id: 'p3', theme: '골목의 낮', winnerHandle: '@sunny.walk', voteCount: 76, agoLabel: '5주 전', participantCount: 88, gradient: ['#1a1510', '#a08060', '#a08060'] },
  { id: 'p4', theme: '비 오는 날', winnerHandle: '@rainy.frame', voteCount: 103, agoLabel: '6주 전', participantCount: 118, gradient: ['#1a0f1e', '#c080a0', '#f0c89a'] },
  { id: 'p5', theme: '해변의 새벽', winnerHandle: '@me', voteCount: 91, agoLabel: '7주 전', participantCount: 96, gradient: ['#0f2027', '#2c5364', '#2c5364'], isMine: true },
  { id: 'p6', theme: '도시의 회색', winnerHandle: '@grey.lens', voteCount: 58, agoLabel: '8주 전', participantCount: 71, gradient: ['#2a2e35', '#6a7580', '#6a7580'] },
];

interface Props {
  onSelectPastItem: (item: ContestPastItem) => void;
}

export default function ContestSegment({ onSelectPastItem }: Props) {
  const [subtab, setSubtab] = useState<SubtabKey>('active');
  const [ranking, setRanking] = useState<ContestVoteEntry[]>(INITIAL_RANKING);
  const [submissions, setSubmissions] = useState<ContestVoteEntry[]>(INITIAL_SUBMISSIONS);
  const [votesLeft, setVotesLeft] = useState(3);
  const [submission, setSubmission] = useState<ContestSubmission>(MY_SUBMISSION);
  const [submitSheetVisible, setSubmitSheetVisible] = useState(false);

  // 낙관적 업데이트: 투표 즉시 voted/votes 반영, 확인 모달 없음(핸드오프 "시안 1b" 기준).
  // id가 ranking/submissions 어느 배열에 있든 매칭되는 항목만 갈아끼운다.
  const toggleVote = (id: string) => {
    let votesLeftDelta = 0;
    const apply = (item: ContestVoteEntry): ContestVoteEntry => {
      if (item.id !== id) return item;
      if (item.voted) {
        votesLeftDelta = 1;
        return { ...item, voted: false, votes: item.votes - 1 };
      }
      if (votesLeft <= 0) return item;
      votesLeftDelta = -1;
      return { ...item, voted: true, votes: item.votes + 1 };
    };
    setRanking((prev) => prev.map(apply));
    setSubmissions((prev) => prev.map(apply));
    setVotesLeft((v) => Math.max(0, Math.min(3, v + votesLeftDelta)));
  };

  return (
    <View style={{ flex: 1 }}>
      <View className="flex-row" style={{ paddingHorizontal: normalize(28), gap: normalize(20), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)' }}>
        {SUBTABS.map((tab) => {
          const isActive = tab.key === subtab;
          return (
            <Pressable key={tab.key} onPress={() => setSubtab(tab.key)} style={{ paddingVertical: normalize(10), borderBottomWidth: isActive ? 2 : 0, borderBottomColor: '#E31B59', marginBottom: -1 }}>
              <Text allowFontScaling={false} style={{ fontFamily: isActive ? 'Pretendard-SemiBold' : 'Pretendard-Medium', fontSize: FONT_SM, color: isActive ? '#000' : 'rgba(0,0,0,0.45)', letterSpacing: -0.2 }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {subtab === 'active' && (
        <ContestActiveTab
          contest={CONTEST_GOAL}
          ranking={ranking}
          submissions={submissions}
          totalCount={CONTEST_GOAL.participants}
          votesLeft={votesLeft}
          hasSubmitted={submission.hasEntry}
          onVote={toggleVote}
          onSubmit={() => setSubmitSheetVisible(true)}
          onSeeAll={() => {}}
        />
      )}
      {subtab === 'mine' && (
        <ContestMyEntryTab
          submission={submission}
          onUpdateCaption={(caption) =>
            setSubmission((prev) => (prev.entry ? { ...prev, entry: { ...prev.entry, caption } } : prev))
          }
          onWithdraw={() => setSubmission({ hasEntry: false })}
          onOpenSubmitSheet={() => setSubmitSheetVisible(true)}
        />
      )}
      {subtab === 'past' && <ContestPastTab items={PAST_ITEMS} onSelectItem={onSelectPastItem} />}

      <SubmitEntrySheet
        visible={submitSheetVisible}
        onClose={() => setSubmitSheetVisible(false)}
        onSubmit={(payload) => {
          setSubmission({
            hasEntry: true,
            entry: {
              photoGradient: payload.photoGradient,
              caption: payload.caption,
              rank: submissions.length + 4,
              voteCount: 0,
              totalParticipants: CONTEST_GOAL.participants,
              location: payload.location,
              submittedAgoLabel: '방금 출품',
              votesToNextRank: submissions[submissions.length - 1]?.votes ?? 0,
            },
          });
          setSubmitSheetVisible(false);
        }}
      />
    </View>
  );
}
