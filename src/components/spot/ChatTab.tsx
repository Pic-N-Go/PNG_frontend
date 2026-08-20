import React, { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { IconPhoto, IconSend } from '@tabler/icons-react-native';
import InitialAvatar from '@/components/common/InitialAvatar';
import { BRAND, BRAND_TINT, CARD, HAIRLINE } from '@/constants/colors';
import {
  COMPACT_CONTROL_HEIGHT,
  COMPACT_CONTROL_RADIUS,
  FONT_2XS,
  FONT_MD,
  FONT_SM,
  FONT_XS,
  GRID_PADDING,
  HAIRLINE_WIDTH,
} from '@/constants/layout';
import { useChat } from '@/hooks/useChat';
import type { ChatConnectionStatus, ChatMessageResponse } from '@/types/chat';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const AVATAR_COLORS = ['#0071e3', '#2c5364', '#c9705a', '#8e44ad', '#2e8b57'];
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

interface Props {
  spotId: number;
  spotName: string;
  // 입력창 포커스 여부 변경 시 알림 — 상위에서 SpotInfoHeader를 접어 메시지 영역을 확보하는 데 사용
  onFocusChange?: (focused: boolean) => void;
}

function parseCreatedAt(createdAt: string): Date | null {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(createdAt: string): string {
  const date = parseCreatedAt(createdAt);
  if (!date) return createdAt;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDate(createdAt: string): string {
  const date = parseCreatedAt(createdAt);
  if (!date) return '';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}요일`;
}

function formatTime(createdAt: string): string {
  const date = parseCreatedAt(createdAt);
  if (!date) return '';
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function avatarInitial(nickname: string): string {
  return nickname.trim().slice(0, 2).toUpperCase();
}

function avatarColor(senderId: number): string {
  return AVATAR_COLORS[Math.abs(senderId) % AVATAR_COLORS.length];
}

function connectionMeta(status: ChatConnectionStatus, participantCount: number): string {
  if (status === 'connected') return `현재 ${participantCount}명 참여 중`;
  if (status === 'connecting') return '채팅방에 연결 중';
  if (status === 'reconnecting') return '채팅방에 다시 연결 중';
  if (status === 'error') return '채팅 연결을 확인해 주세요';
  return '채팅 연결 대기 중';
}

function DateDivider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), marginVertical: normalize(4) }}>
      <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)' }} />
      <Text className="font-normal" allowFontScaling={false} style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.3)', letterSpacing: -0.1 }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)' }} />
    </View>
  );
}

function MessageBubble({
  message,
  isMe,
}: {
  message: ChatMessageResponse;
  isMe: boolean;
}) {
  return (
    <View style={{ flexDirection: isMe ? 'row-reverse' : 'row', gap: normalize(8), alignItems: 'flex-end' }}>
      {!isMe && (
        <InitialAvatar
          initial={avatarInitial(message.senderNickname)}
          backgroundColor={avatarColor(message.senderId)}
          size={normalize(30)}
          fontSize={FONT_XS}
        />
      )}
      <View style={{ maxWidth: normalize(240), alignItems: isMe ? 'flex-end' : 'flex-start', gap: normalize(4) }}>
        {!isMe && (
          <Text className="font-normal" allowFontScaling={false} style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)', paddingHorizontal: normalize(4) }}>
            {message.senderNickname}
          </Text>
        )}
        <View
          style={{
            paddingHorizontal: normalize(14),
            paddingVertical: normalize(10),
            borderRadius: normalize(18),
            backgroundColor: isMe ? BRAND : CARD,
            borderBottomRightRadius: isMe ? normalize(6) : normalize(18),
            borderBottomLeftRadius: isMe ? normalize(18) : normalize(6),
          }}
        >
          <Text className="font-normal" allowFontScaling={false} style={{ fontSize: normalizeFontSize(14), lineHeight: normalizeFontSize(14) * 1.45, letterSpacing: -0.15, color: isMe ? '#fff' : '#000' }}>
            {message.content}
          </Text>
        </View>
        <Text className="font-normal" allowFontScaling={false} style={{ fontSize: FONT_2XS, color: 'rgba(0,0,0,0.25)', paddingHorizontal: normalize(4) }}>
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export default function ChatTab({ spotId, spotName, onFocusChange }: Props) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const {
    messages,
    participantCount,
    connectionStatus,
    connectionError,
    isSending,
    isLoading,
    isHistoryError,
    currentUserId,
    sendMessage,
    refetch,
  } = useChat(spotId);

  const canSend =
    connectionStatus === 'connected' && !isSending && input.trim().length > 0;

  const renderedMessages = useMemo(
    () => messages.map((message, index) => {
      const previous = messages[index - 1];
      const showDate = !previous || dateKey(previous.createdAt) !== dateKey(message.createdAt);

      return (
        <Fragment key={message.id}>
          {showDate && <DateDivider label={formatDate(message.createdAt)} />}
          {index === 0 && (
            <Text
              className="font-normal"
              allowFontScaling={false}
              style={{ alignSelf: 'center', fontSize: FONT_XS, color: 'rgba(0,0,0,0.3)', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: normalize(10), paddingHorizontal: normalize(14), paddingVertical: normalize(6) }}
            >
              {spotName} 채팅방에 입장했습니다
            </Text>
          )}
          <MessageBubble message={message} isMe={message.senderId === currentUserId} />
        </Fragment>
      );
    }),
    [currentUserId, messages, spotName],
  );

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [messages.length]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    if (sendMessage(text)) setInput('');
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(14), paddingBottom: normalize(12), borderBottomWidth: HAIRLINE_WIDTH, borderBottomColor: HAIRLINE }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_MD, color: '#000', letterSpacing: -0.2 }}>
          {spotName} 채팅방
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(6), marginTop: normalize(2) }}>
          <View
            style={{
              width: normalize(6),
              height: normalize(6),
              borderRadius: normalize(3),
              backgroundColor: connectionStatus === 'connected' ? '#34c759' : '#B3B3B3',
            }}
          />
          <Text className="font-normal" allowFontScaling={false} style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.35)' }}>
            {connectionMeta(connectionStatus, participantCount)}
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: normalize(16), paddingVertical: normalize(12), gap: normalize(12) }}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading && messages.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={BRAND} />
          </View>
        ) : messages.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: normalize(10) }}>
            <Text className="font-normal" allowFontScaling={false} style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.35)' }}>
              아직 등록된 메시지가 없어요.
            </Text>
            {isHistoryError && (
              <Pressable onPress={() => void refetch()} hitSlop={8}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: BRAND }}>
                  다시 불러오기
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          renderedMessages
        )}

        {messages.length > 0 && isHistoryError && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: normalize(10),
              paddingHorizontal: normalize(12),
              paddingVertical: normalize(10),
              backgroundColor: BRAND_TINT,
              borderRadius: normalize(10),
            }}
          >
            <Text
              className="font-normal"
              allowFontScaling={false}
              style={{ flex: 1, fontSize: FONT_XS, color: 'rgba(0,0,0,0.5)' }}
            >
              일부 채팅 정보를 불러오지 못했어요.
            </Text>
            <Pressable onPress={() => void refetch()} hitSlop={8}>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: BRAND }}
              >
                다시 시도
              </Text>
            </Pressable>
          </View>
        )}

        {!!connectionError && (
          <Text className="font-normal" allowFontScaling={false} style={{ alignSelf: 'center', fontSize: FONT_XS, color: BRAND, textAlign: 'center' }}>
            {connectionError}
          </Text>
        )}
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), paddingHorizontal: normalize(16), paddingTop: normalize(10), paddingBottom: normalize(16), borderTopWidth: HAIRLINE_WIDTH, borderTopColor: HAIRLINE }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: normalize(8), backgroundColor: CARD, borderRadius: COMPACT_CONTROL_RADIUS, paddingHorizontal: normalize(14), height: COMPACT_CONTROL_HEIGHT }}>
          <IconPhoto size={normalize(20)} color="#B3B3B3" strokeWidth={2} opacity={0.55} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={connectionStatus === 'connected' ? '메시지 입력...' : '채팅 연결 중...'}
            placeholderTextColor="rgba(0,0,0,0.3)"
            maxLength={1000}
            editable={connectionStatus === 'connected'}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
            style={{ flex: 1, fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.15 }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="메시지 전송"
          disabled={!canSend}
          onPress={handleSend}
          style={{ width: COMPACT_CONTROL_HEIGHT, height: COMPACT_CONTROL_HEIGHT, borderRadius: COMPACT_CONTROL_RADIUS, backgroundColor: BRAND, opacity: canSend ? 1 : 0.4, alignItems: 'center', justifyContent: 'center' }}
        >
          <IconSend size={normalize(18)} color="#fff" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}
