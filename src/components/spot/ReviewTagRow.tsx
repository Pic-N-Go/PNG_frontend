import React from 'react';
import { Text, View } from 'react-native';
import { REVIEW_TAG_LABEL } from '@/constants/reviewTags';
import { FONT_XS } from '@/constants/layout';
import { normalize } from '@/utils/normalize';
import type { ReviewTagApi } from '@/types/spot';

interface Props {
  tags: ReviewTagApi[];
}

/**
 * 리뷰 카드의 태그 행. 스팟 상세 리뷰 목록과 마이페이지 내 리뷰 두 곳에서 쓴다.
 * 목업 리뷰 카드에는 없는 행이다 — 태그는 스팟 대표 태그 집계용이라 카드에 노출되지 않았는데,
 * 집계 조건(2회 이상·상위 3개)상 고른 태그가 어디에도 안 보이는 경우가 생겨 추가했다.
 */
export default function ReviewTagRow({ tags }: Props) {
  // 백엔드가 enum을 먼저 배포하면 라벨이 없는 값이 올 수 있다(목록 조회 API가 없어 동시 배포가 전제).
  // 걸러내지 않으면 "#undefined"가 그대로 노출된다.
  const known = tags.filter((tag) => REVIEW_TAG_LABEL[tag]);
  if (known.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(6), marginBottom: normalize(10) }}>
      {known.map((tag) => (
        <View
          key={tag}
          style={{
            height: normalize(24),
            paddingHorizontal: normalize(10),
            borderRadius: normalize(12),
            backgroundColor: '#F5F5F7',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Pretendard-Regular', fontSize: FONT_XS, color: 'rgba(0,0,0,0.45)', letterSpacing: -0.1 }}
          >
            {`#${REVIEW_TAG_LABEL[tag]}`}
          </Text>
        </View>
      ))}
    </View>
  );
}
