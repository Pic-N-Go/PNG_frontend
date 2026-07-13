import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import {
  IconArchive,
  IconBookmark,
  IconCamera,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconFlag,
  IconHeart,
  IconMapPin,
  IconMountain,
  IconPlus,
  IconSparkles,
  IconStar,
} from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { toErrorMessage } from '@/api/auth';
import { useBookmarkCollections, useCreateBookmarkCollection, useSyncSpotBookmarks } from '@/hooks/useSpot';
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';

type ColorKey = 'pink' | 'blue' | 'purple' | 'green' | 'orange';
const PAL: Record<ColorKey, { s: string; t: string }> = {
  pink: { s: '#E31B59', t: '#FDE8EF' },
  blue: { s: '#2E7BF6', t: '#E4EEFD' },
  purple: { s: '#7C4DFF', t: '#EEE9FE' },
  green: { s: '#16A34A', t: '#E7F6EC' },
  orange: { s: '#E8890B', t: '#FCEBD5' },
};
const COLOR_KEYS: ColorKey[] = ['pink', 'blue', 'purple', 'green', 'orange'];
const palOf = (key: string) => PAL[key as ColorKey] ?? PAL.pink;

type IconKey = 'star' | 'heart' | 'bookmark' | 'map-pin' | 'camera' | 'flag' | 'sparkles' | 'mountain' | 'clock' | 'archive';
const ICON_MAP: Record<IconKey, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  star: IconStar,
  heart: IconHeart,
  bookmark: IconBookmark,
  'map-pin': IconMapPin,
  camera: IconCamera,
  flag: IconFlag,
  sparkles: IconSparkles,
  mountain: IconMountain,
  clock: IconClock,
  archive: IconArchive,
};
const ICON_SET: IconKey[] = ['star', 'heart', 'bookmark', 'map-pin', 'camera', 'flag', 'sparkles', 'mountain'];

function CollectionIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const Cmp = ICON_MAP[name as IconKey] ?? IconBookmark;
  return <Cmp size={size} color={color} strokeWidth={2} />;
}

const MAX_CONTENT_LEN = 20;
const MAX_COLLECTIONS = 5;
// 시트는 창 높이의 80%까지 → 핸들+헤더+CTA 예약분(약 180)을 뺀 값으로 스크롤 영역을 제한.
const SCROLL_MAX = Dimensions.get('window').height * 0.8 - normalize(180);

interface Props {
  visible: boolean;
  spotId: string;
  onClose: () => void;
  /** 저장 완료 — 저장된 컬렉션 수 (화면 토스트용) */
  onSaved?: (count: number) => void;
}

function CollectionRow({ name, count, color, icon, selected, onToggle }: { name: string; count: number; color: string; icon: string; selected: boolean; onToggle: () => void }) {
  const p = palOf(color);
  return (
    <Pressable
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: normalize(14),
        paddingVertical: normalize(13),
        paddingHorizontal: normalize(14),
        borderRadius: normalize(16),
        backgroundColor: selected ? p.t : '#fff',
        borderWidth: 1,
        borderColor: selected ? `${p.s}33` : 'transparent',
      }}
    >
      <View style={{ width: normalize(46), height: normalize(46), borderRadius: normalize(13), backgroundColor: p.t, alignItems: 'center', justifyContent: 'center' }}>
        <CollectionIcon name={icon} size={normalize(23)} color={p.s} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: '#1F1E1D' }}>{name}</Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: '#A39E98', marginTop: normalize(2) }}>{`스팟 ${count}개`}</Text>
      </View>
      <View
        style={{
          width: normalize(26),
          height: normalize(26),
          borderRadius: normalize(13),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? p.s : 'transparent',
          borderWidth: selected ? 0 : 2,
          borderColor: '#D8D4CF',
        }}
      >
        {selected && <IconCheck size={normalize(16)} color="#fff" strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

export default function BookmarkSheet({ visible, spotId, onClose, onSaved }: Props) {
  const { data: collections, isLoading, isError } = useBookmarkCollections(spotId);
  const createCollection = useCreateBookmarkCollection();
  const syncBookmarks = useSyncSpotBookmarks(spotId);

  const [view, setView] = useState<'list' | 'create'>('list');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [initial, setInitial] = useState<Set<number>>(new Set()); // 열릴 때의 서버 소속(변경 여부 판정용)
  const [name, setName] = useState('');
  const [colorKey, setColorKey] = useState<ColorKey>('pink');
  const [iconKey, setIconKey] = useState<IconKey>('star');
  const inited = useRef(false);

  // 시트 열릴 때 서버 소속(contains)으로 선택 초기화(1회). 닫히면 상태 리셋.
  useEffect(() => {
    if (!visible) {
      setView('list');
      setName('');
      setColorKey('pink');
      setIconKey('star');
      setSelected(new Set());
      setInitial(new Set());
      inited.current = false;
      return;
    }
    if (collections && !inited.current) {
      const init = new Set(collections.filter((c) => c.contains).map((c) => c.id));
      setSelected(init);
      setInitial(init);
      inited.current = true;
    }
  }, [visible, collections]);

  const cur = PAL[colorKey];
  const trimmedName = name.trim();
  const isDuplicateName = (collections ?? []).some((c) => c.name === trimmedName);
  // 선택이 서버 소속과 달라졌을 때만 저장 가능(빈 집합=전체 해제 포함)
  const isDirty = selected.size !== initial.size || [...selected].some((id) => !initial.has(id));
  const canAdd = isDirty && !syncBookmarks.isPending;
  const ctaLabel = !isDirty
    ? selected.size === 0
      ? '컬렉션을 선택하세요'
      : '변경 없음'
    : selected.size === 0
      ? '즐겨찾기에서 제거'
      : `${selected.size}개 컬렉션에 추가`;
  const canCreate = trimmedName.length > 0 && !isDuplicateName && !createCollection.isPending;
  const canCreateMore = (collections?.length ?? 0) < MAX_COLLECTIONS;

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCreate() {
    if (!canCreate) return;
    createCollection.mutate(
      { name: name.trim(), color: colorKey, icon: iconKey },
      {
        onSuccess: (created) => {
          setSelected((prev) => new Set(prev).add(created.id));
          setName('');
          setColorKey('pink');
          setIconKey('star');
          setView('list');
        },
      },
    );
  }

  function handleAdd() {
    if (!canAdd) return;
    syncBookmarks.mutate([...selected], {
      onSuccess: () => {
        onSaved?.(selected.size);
        onClose();
      },
    });
  }

  const pillLabelColor = (enabled: boolean) => (enabled ? '#fff' : '#B5B0AA');
  const pillBg = (enabled: boolean) => (enabled ? ACCENT : '#EFEDEA');

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {view === 'list' ? (
        <View>
          <View style={{ paddingHorizontal: normalize(24), paddingBottom: normalize(6) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), letterSpacing: -0.35, color: '#1F1E1D' }}>
              즐겨찾기에 추가
            </Text>
          </View>

          {isLoading || !collections ? (
            <View style={{ height: normalize(200), alignItems: 'center', justifyContent: 'center' }}>
              {isError ? (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.4)' }}>컬렉션을 불러오지 못했어요.</Text>
              ) : (
                <ActivityIndicator color={ACCENT} />
              )}
            </View>
          ) : (
            <ScrollView style={{ maxHeight: SCROLL_MAX }} contentContainerStyle={{ paddingHorizontal: normalize(16), paddingTop: normalize(8), paddingBottom: normalize(4), gap: normalize(4) }}>
              {collections.map((c) => (
                <CollectionRow key={c.id} name={c.name} count={c.spotCount} color={c.color} icon={c.icon} selected={selected.has(c.id)} onToggle={() => toggle(c.id)} />
              ))}

              {canCreateMore ? (
                <Pressable onPress={() => setView('create')} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(14), paddingVertical: normalize(13), paddingHorizontal: normalize(14), borderRadius: normalize(16) }}>
                  <View style={{ width: normalize(46), height: normalize(46), borderRadius: normalize(13), borderWidth: 1.5, borderColor: '#C9C4BE', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
                    <IconPlus size={normalize(22)} color="#8B8680" strokeWidth={2} />
                  </View>
                  <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#37352F' }}>새 컬렉션 만들기</Text>
                  <IconChevronRight size={normalize(20)} color="#C4BFB9" strokeWidth={2} />
                </Pressable>
              ) : (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12.5), color: '#A39E98', paddingVertical: normalize(14), paddingHorizontal: normalize(14) }}>
                  {`컬렉션은 최대 ${MAX_COLLECTIONS}개까지 만들 수 있어요`}
                </Text>
              )}
            </ScrollView>
          )}

          <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(12), paddingBottom: normalize(12), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
            <Pressable onPress={handleAdd} disabled={!canAdd} style={{ height: normalize(54), borderRadius: normalize(27), alignItems: 'center', justifyContent: 'center', backgroundColor: pillBg(canAdd) }}>
              {syncBookmarks.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: pillLabelColor(canAdd) }}>
                  {ctaLabel}
                </Text>
              )}
            </Pressable>
            {syncBookmarks.isError && (
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12.5), color: '#FF453A', marginTop: normalize(8), textAlign: 'center' }}>
                {toErrorMessage(syncBookmarks.error, '저장에 실패했어요.')}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), paddingHorizontal: normalize(20), paddingBottom: normalize(8) }}>
            <Pressable onPress={() => { setName(''); setColorKey('pink'); setIconKey('star'); setView('list'); }} hitSlop={8} style={{ padding: normalize(4) }}>
              <IconChevronLeft size={normalize(24)} color="#37352F" strokeWidth={2} />
            </Pressable>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), letterSpacing: -0.35, color: '#1F1E1D' }}>
              새 컬렉션 만들기
            </Text>
          </View>

          <ScrollView style={{ maxHeight: SCROLL_MAX }} contentContainerStyle={{ paddingHorizontal: normalize(24), paddingTop: normalize(8), paddingBottom: normalize(8) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), backgroundColor: '#F5F5F7', borderRadius: normalize(14), paddingVertical: normalize(10), paddingRight: normalize(14), paddingLeft: normalize(10), marginTop: normalize(4) }}>
              <View style={{ width: normalize(48), height: normalize(48), borderRadius: normalize(13), backgroundColor: cur.t, alignItems: 'center', justifyContent: 'center' }}>
                <CollectionIcon name={iconKey} size={normalize(24)} color={cur.s} />
              </View>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="컬렉션 이름"
                placeholderTextColor="#A39E98"
                maxLength={MAX_CONTENT_LEN}
                allowFontScaling={false}
                style={{ flex: 1, minWidth: 0, paddingVertical: normalize(8), fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(15), color: '#1F1E1D' }}
              />
            </View>

            {isDuplicateName && (
              <Text allowFontScaling={false} style={{ marginTop: normalize(8), fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12.5), color: '#FF453A', letterSpacing: -0.2 }}>
                이미 같은 이름의 컬렉션이 있어요
              </Text>
            )}
            <Text allowFontScaling={false} style={{ marginTop: normalize(22), fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(13), color: '#8B8680' }}>색상 선택</Text>
            <View style={{ flexDirection: 'row', gap: normalize(14), marginTop: normalize(12) }}>
              {COLOR_KEYS.map((k) => {
                const p = PAL[k];
                const sel = k === colorKey;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setColorKey(k)}
                    style={{ width: normalize(54), height: normalize(54), borderRadius: normalize(27), backgroundColor: p.t, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: sel ? p.s : 'transparent' }}
                  >
                    {sel && <IconCheck size={normalize(20)} color={p.s} strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>

            <Text allowFontScaling={false} style={{ marginTop: normalize(24), fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(13), color: '#8B8680' }}>아이콘 선택</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: normalize(12), marginTop: normalize(12) }}>
              {ICON_SET.map((nm) => {
                const sel = nm === iconKey;
                return (
                  <Pressable
                    key={nm}
                    onPress={() => setIconKey(nm)}
                    style={{ width: '22%', height: normalize(56), borderRadius: normalize(15), alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? cur.t : '#F3F1EF', borderWidth: 1.5, borderColor: sel ? cur.s : 'transparent' }}
                  >
                    <CollectionIcon name={nm} size={normalize(24)} color={sel ? cur.s : '#A39E98'} />
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(12), paddingBottom: normalize(12), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
            <Pressable onPress={handleCreate} disabled={!canCreate} style={{ height: normalize(54), borderRadius: normalize(27), alignItems: 'center', justifyContent: 'center', backgroundColor: pillBg(canCreate) }}>
              {createCollection.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: pillLabelColor(canCreate) }}>만들기</Text>
              )}
            </Pressable>
            {createCollection.isError && (
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12.5), color: '#FF453A', marginTop: normalize(8), textAlign: 'center' }}>
                {toErrorMessage(createCollection.error, '컬렉션 생성에 실패했어요.')}
              </Text>
            )}
          </View>
        </View>
      )}
    </BottomSheet>
  );
}
