import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Chip from '@/components/common/Chip';
import { GRID_PADDING } from '@/constants/layout';
import { normalize } from '@/utils/normalize';

const PHOTO_COLORS = [
  '#c9d6df', '#8da9c4', '#6b8cae', '#4a7c8a', '#a8c5da',
  '#7bafc6', '#5d99b3', '#3d8ba3', '#b8d4e0', '#9ec3d4',
  '#7ab0c8', '#558fa8', '#d0e4ec', '#a2c7d8', '#6fa0bc',
  '#4d8aa6', '#c4dce8', '#8fbfd3', '#64a8c0', '#3a8299',
  '#d5e8f0', '#afd3e4', '#85bdd5', '#5aa7c3', '#2e7a97',
  '#e0eff5', '#bad8e8', '#90c5da', '#66afcc', '#3a95be',
];
const PHOTOS_PER_PAGE = 18;
const PHOTO_TOTAL = 247;
const FILTERS = ['전체', '일출', '야경', '인물', '풍경'];

interface Props {
  loadMoreSignal: number;
}

export default function PhotoGridTab({ loadMoreSignal }: Props) {
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  function loadMore() {
    if (loadingRef.current || loadedCount >= PHOTO_TOTAL) return;
    loadingRef.current = true;
    setLoading(true);
    setTimeout(() => {
      setLoadedCount((prev) => Math.min(PHOTO_TOTAL, prev + PHOTOS_PER_PAGE));
      setLoading(false);
      loadingRef.current = false;
    }, 600);
  }

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loadMoreSignal > 0) loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMoreSignal]);

  // mock 단계라 필터는 실제로 사진 종류를 바꾸지 않고 그리드만 초기화 후 재로드함 (API 연동 시 필터별 조회로 교체)
  // loadMore()는 클로저에 갇힌 이전 loadedCount를 참조하므로 여기서 직접 재로드 (247장 다 본 뒤 필터 전환 시 재로드 안 되는 버그 방지)
  function handleFilterPress(filter: string) {
    setActiveFilter(filter);
    setLoadedCount(0);
    loadingRef.current = true;
    setLoading(true);
    setTimeout(() => {
      setLoadedCount(Math.min(PHOTO_TOTAL, PHOTOS_PER_PAGE));
      setLoading(false);
      loadingRef.current = false;
    }, 600);
  }

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: normalize(8), paddingHorizontal: normalize(16), paddingTop: normalize(16) }}>
        {FILTERS.map((filter) => (
          <Chip key={filter} label={filter} selected={activeFilter === filter} onPress={() => handleFilterPress(filter)} variant="dark" height={normalize(32)} />
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingTop: normalize(16) }}>
        {Array.from({ length: loadedCount }).map((_, i) => (
          <View key={i} style={{ width: '33.333%', aspectRatio: 1, padding: 1 }}>
            <View style={{ flex: 1, backgroundColor: PHOTO_COLORS[i % PHOTO_COLORS.length] }} />
          </View>
        ))}
      </View>

      {loading && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: normalize(6), paddingVertical: normalize(20) }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: normalize(6), height: normalize(6), borderRadius: normalize(3), backgroundColor: 'rgba(0,0,0,0.15)' }} />
          ))}
        </View>
      )}

      <View style={{ height: GRID_PADDING }} />
    </View>
  );
}
