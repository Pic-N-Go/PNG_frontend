import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { IconPhoto, IconSend } from '@tabler/icons-react-native';
import InitialAvatar from '@/components/common/InitialAvatar';
import { GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { ChatEntry } from '@/types/spot';

// TODO: API 연동 — 아래 MOCK_CHAT_ENTRIES와 handleSend의 로컬 append를 실제 채팅 API/웹소켓으로 교체
// - 메시지 목록 조회: 스팟별 채팅방 메시지 히스토리 API 필요 (participant 수 "현재 12명 참여 중"도 실시간 값으로 교체)
// - 메시지 전송: handleSend가 로컬 state에만 append하는 부분을 실제 전송 API/소켓 emit으로 교체
// - 참고: docs/ai/specs/feature/spot-detail-ui/spot-detail-screen-ui.md의 "실시간 채팅(웹소켓 등)" Out of Scope 항목
export const MOCK_CHAT_ENTRIES: ChatEntry[] = [
  { id: 'd1', type: 'date', text: '2026년 5월 12일 월요일' },
  { id: 's1', type: 'system', text: '포토스팟 채팅방에 입장했습니다' },
  { id: 'm1', type: 'message', senderName: '김준혁', avatarInitial: 'JK', avatarColor: '#2c5364', text: '오늘 일출 정말 대박이에요 🌅 황금빛이 딱 광안대교 위에 걸렸어요', time: '6:42' },
  { id: 'm2', type: 'message', senderName: '이수연', avatarInitial: 'SY', avatarColor: '#c9705a', text: '혼잡도는 어때요? 지금 출발하려고요', time: '6:48' },
  { id: 'm3', type: 'message', senderName: '김준혁', avatarInitial: 'JK', avatarColor: '#2c5364', isImage: true, time: '6:51' },
  { id: 'm4', type: 'message', senderName: '김준혁', avatarInitial: 'JK', avatarColor: '#2c5364', text: '지금은 꽤 한산해요! 30명 정도? 이른 아침이라 좋아요', time: '6:52' },
  { id: 'm5', type: 'message', isMe: true, text: '저도 지금 출발해요! 삼각대 챙겨가는 거 맞죠?', time: '6:55' },
  { id: 'm6', type: 'message', senderName: '이수연', avatarInitial: 'SY', avatarColor: '#c9705a', text: '필수예요! 특히 일출 촬영에는 꼭 있어야 해요 ☀️', time: '6:57' },
  { id: 'm7', type: 'message', isMe: true, text: '감사해요 😊 광각 렌즈도 챙겨갈게요', time: '6:58' },
  { id: 'd2', type: 'date', text: '방금' },
  { id: 'm8', type: 'message', senderName: '박민준', avatarInitial: 'MJ', avatarColor: '#0071e3', text: '지금 미세먼지 정말 좋아요. 오늘 포토제닉 지수 87점이래요!', time: '7:02' },
];

export default function ChatTab() {
  const [entries, setEntries] = useState<ChatEntry[]>(MOCK_CHAT_ENTRIES);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // 채팅 탭 진입 시 + 메시지 추가될 때마다 맨 아래로 스크롤 (목업 동작과 동일)
  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [entries.length]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    setEntries((prev) => [...prev, { id: `me-${prev.length}`, type: 'message', isMe: true, text, time }]);
    setInput('');
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14), paddingBottom: normalize(12), borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: '#000', letterSpacing: -0.2 }}>
          광안리 해수욕장 채팅방
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), marginTop: normalize(2) }}>
          <View style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: '#34c759' }} />
          <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.35)' }}>현재 12명 참여 중</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: normalize(16), paddingVertical: normalize(12), gap: normalize(12) }}
      >
        {entries.map((entry) => {
          if (entry.type === 'date') {
            return (
              <View key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), marginVertical: normalize(4) }}>
                <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)' }} />
                <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}>{entry.text}</Text>
                <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)' }} />
              </View>
            );
          }
          if (entry.type === 'system') {
            return (
              <Text
                key={entry.id}
                allowFontScaling={false}
                style={{ alignSelf: 'center', fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.3)', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: normalize(10), paddingHorizontal: normalize(14), paddingVertical: normalize(6) }}
              >
                {entry.text}
              </Text>
            );
          }
          const isMe = !!entry.isMe;
          return (
            <View key={entry.id} style={{ flexDirection: isMe ? 'row-reverse' : 'row', gap: normalize(8), alignItems: 'flex-end' }}>
              {!isMe && <InitialAvatar initial={entry.avatarInitial ?? ''} backgroundColor={entry.avatarColor ?? '#999'} size={normalize(30)} fontSize={normalizeFontSize(11)} />}
              <View style={{ maxWidth: normalize(240), alignItems: isMe ? 'flex-end' : 'flex-start', gap: normalize(4) }}>
                {!isMe && (
                  <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(11), color: 'rgba(0,0,0,0.35)', paddingHorizontal: normalize(4) }}>
                    {entry.senderName}
                  </Text>
                )}
                {entry.isImage ? (
                  <View style={{ width: normalize(180), height: normalize(130), borderRadius: normalize(14), backgroundColor: '#8da9c4', alignItems: 'center', justifyContent: 'center' }}>
                    <IconPhoto size={normalize(32)} color="#D6E2EA" strokeWidth={1.5} />
                  </View>
                ) : (
                  <View
                    style={{
                      paddingHorizontal: normalize(14),
                      paddingVertical: normalize(10),
                      borderRadius: normalize(18),
                      backgroundColor: isMe ? '#E31B59' : '#F5F5F7',
                      borderBottomRightRadius: isMe ? normalize(6) : normalize(18),
                      borderBottomLeftRadius: isMe ? normalize(18) : normalize(6),
                    }}
                  >
                    <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(14) * 1.45, letterSpacing: -0.15, color: isMe ? '#fff' : '#000' }}>
                      {entry.text}
                    </Text>
                  </View>
                )}
                <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(10), color: 'rgba(0,0,0,0.25)', paddingHorizontal: normalize(4) }}>
                  {entry.time}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), paddingHorizontal: normalize(16), paddingTop: normalize(10), paddingBottom: normalize(16), borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: normalize(8), backgroundColor: '#F5F5F7', borderRadius: normalize(22), paddingHorizontal: normalize(14), height: normalize(44) }}>
          <IconPhoto size={normalize(20)} color="#B3B3B3" strokeWidth={2} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="메시지 입력..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            onSubmitEditing={handleSend}
            style={{ flex: 1, fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.15 }}
          />
        </View>
        <Pressable
          onPress={handleSend}
          style={{ width: normalize(44), height: normalize(44), borderRadius: normalize(22), backgroundColor: '#E31B59', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconSend size={normalize(18)} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
