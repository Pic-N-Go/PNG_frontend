import React from 'react';
import { Text, View } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { ProfileContestItem } from '@/types/community';
import { FONT_2XS, FONT_XS } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';
const SURFACE = '#f5f5f7';

interface Props {
  items: ProfileContestItem[];
}

function statusLabel(item: ProfileContestItem): string {
  if (item.status === 'active') return `진행중 · ${item.voteCount}표`;
  if (item.status === 'won') return `${item.voteCount}표 · 우승`;
  return `${item.voteCount}표`;
}

export default function ProfileContestsTab({ items }: Props) {
  return (
    <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(16), paddingBottom: normalize(24), gap: normalize(8) }}>
      {items.map((item) => {
        const isTop = item.rank === 1;
        return (
          <View key={item.id} className="flex-row" style={{ gap: normalize(12), padding: normalize(12), backgroundColor: SURFACE, borderRadius: normalize(14) }}>
            <View style={{ width: normalize(64), height: normalize(64), borderRadius: normalize(12), backgroundColor: item.gradient[0], position: 'relative' }}>
              <View
                className="absolute items-center justify-center"
                style={{ top: normalize(4), left: normalize(4), height: normalize(16), paddingHorizontal: normalize(5), borderRadius: normalize(8), backgroundColor: isTop ? ACCENT : 'rgba(0,0,0,0.4)' }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: '#fff' }}>
                  {item.rank}위
                </Text>
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#000', letterSpacing: -0.2 }}>
                {item.theme}
              </Text>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', letterSpacing: -0.1, marginTop: normalize(2) }}>
                {statusLabel(item)}
              </Text>
              {(item.status === 'active' || item.status === 'won') && (
                <View
                  className="flex-row items-center"
                  style={{
                    alignSelf: 'flex-start',
                    gap: normalize(4),
                    marginTop: normalize(6),
                    height: normalize(20),
                    paddingHorizontal: normalize(8),
                    borderRadius: normalize(10),
                    backgroundColor: item.status === 'won' ? ACCENT : 'rgba(227,27,89,0.08)',
                  }}
                >
                  {item.status === 'won' ? (
                    <Trophy size={normalize(9)} color="#fff" fill="#fff" strokeWidth={0} />
                  ) : (
                    <View style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: ACCENT }} />
                  )}
                  <Text
                    allowFontScaling={false}
                    style={{ fontFamily: 'Pretendard-SemiBold', fontSize: FONT_2XS, color: item.status === 'won' ? '#fff' : ACCENT, letterSpacing: 0.3 }}
                  >
                    {item.status === 'won' ? '우승' : '진행중'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
