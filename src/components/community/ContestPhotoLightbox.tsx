import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThumbsUp, User, X } from 'lucide-react-native';
import { ContestPhotoEntry } from '@/types/community';
import { FONT_2XS, FONT_SM, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';
/** 라이트박스 순위 뱃지는 항상 기본(금색) 그라디언트 — 순위색 구분은 포디움 카드에서만 적용 */
const RANK_BADGE_GRADIENT: [string, string] = ['#f0c89a', '#d4856a'];

function getInitials(handle: string): string {
  const clean = handle.replace(/^@/, '');
  return clean.slice(0, 2).toUpperCase();
}

interface Props {
  entry: ContestPhotoEntry | null;
  isVoted: boolean;
  onClose: () => void;
  onVotePress: () => void;
}

export default function ContestPhotoLightbox({ entry, isVoted, onClose, onVotePress }: Props) {
  return (
    <Modal visible={entry != null} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', paddingHorizontal: normalize(20) }}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: normalize(60),
            right: normalize(20),
            width: normalize(36),
            height: normalize(36),
            borderRadius: normalize(18),
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <X size={normalize(18)} color="#fff" strokeWidth={2} />
        </Pressable>

        {entry && (
          <View style={{ backgroundColor: '#111', borderRadius: normalize(20), overflow: 'hidden' }}>
            <View style={{ position: 'relative', width: '100%', aspectRatio: 3 / 2 }}>
              <LinearGradient colors={entry.gradient} style={{ position: 'absolute', inset: 0 }} />
              <View style={{ position: 'absolute', top: normalize(14), left: normalize(14), flexDirection: 'row', alignItems: 'center', gap: normalize(6) }}>
                <LinearGradient
                  colors={RANK_BADGE_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: normalize(26), height: normalize(26), borderRadius: normalize(13), alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', letterSpacing: -0.2 }}>
                    {entry.rank}
                  </Text>
                </LinearGradient>

                {!isVoted && (
                  <View
                    style={{
                      height: normalize(22),
                      paddingHorizontal: normalize(9),
                      borderRadius: normalize(11),
                      backgroundColor: 'rgba(0,0,0,0.45)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', letterSpacing: 0.3 }}>
                      현재 {entry.rank}위
                    </Text>
                  </View>
                )}

                {isVoted && (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: normalize(4),
                      height: normalize(22),
                      paddingHorizontal: normalize(9),
                      borderRadius: normalize(11),
                      backgroundColor: ACCENT,
                    }}
                  >
                    <ThumbsUp size={normalize(10)} color="#fff" fill="#fff" strokeWidth={1.8} />
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_XS, color: '#fff', letterSpacing: -0.1 }}>
                      내 투표
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={{ paddingTop: normalize(16), paddingHorizontal: normalize(18), paddingBottom: normalize(14) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), marginBottom: normalize(12) }}>
                <View
                  style={{
                    width: normalize(32),
                    height: normalize(32),
                    borderRadius: normalize(16),
                    backgroundColor: entry.gradient[0],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: 'rgba(255,255,255,0.85)', letterSpacing: -0.1 }}>
                    {getInitials(entry.author.handle)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#fff', letterSpacing: -0.2 }}>
                    {entry.author.handle}
                  </Text>
                  <Text allowFontScaling={false} numberOfLines={1} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(255,255,255,0.5)', letterSpacing: -0.1, marginTop: normalize(1) }}>
                    {entry.captionMeta}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(5),
                    height: normalize(28),
                    paddingHorizontal: normalize(11),
                    borderRadius: normalize(14),
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <ThumbsUp size={normalize(12)} color="#fff" strokeWidth={1.8} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', letterSpacing: -0.1 }}>
                    {entry.voteCount}표
                  </Text>
                </View>
              </View>

              {entry.caption && (
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Pretendard-Regular',
                    fontStyle: 'italic',
                    fontSize: FONT_SM,
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: FONT_SM * 1.55,
                    letterSpacing: -0.15,
                    marginBottom: normalize(14),
                  }}
                >
                  {entry.caption}
                </Text>
              )}

              <View style={{ flexDirection: 'row', gap: normalize(8) }}>
                <Pressable
                  onPress={onVotePress}
                  style={{
                    flex: 1,
                    height: normalize(44),
                    borderRadius: normalize(22),
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: normalize(5),
                    backgroundColor: isVoted ? 'rgba(255,255,255,0.1)' : ACCENT,
                    borderWidth: isVoted ? 1.5 : 0,
                    borderColor: ACCENT,
                  }}
                >
                  <ThumbsUp size={normalize(13)} color={isVoted ? ACCENT : '#fff'} fill={isVoted ? ACCENT : 'none'} strokeWidth={1.8} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: isVoted ? ACCENT : '#fff', letterSpacing: -0.2 }}>
                    {isVoted ? '투표 취소' : '투표하기'}
                  </Text>
                </Pressable>

                <Pressable
                  style={{
                    height: normalize(44),
                    paddingHorizontal: normalize(16),
                    borderRadius: normalize(22),
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(5),
                  }}
                >
                  <User size={normalize(13)} color="#fff" strokeWidth={1.8} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_SM, color: '#fff', letterSpacing: -0.2 }}>
                    프로필
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
