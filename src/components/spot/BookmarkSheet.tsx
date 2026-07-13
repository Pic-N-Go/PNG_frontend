import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
import { normalize, normalizeFontSize } from '@/utils/normalize';

const ACCENT = '#E31B59';

// 컬렉션 색 팔레트 (s = 강조색, t = 연한 틴트)
type ColorKey = 'pink' | 'blue' | 'purple' | 'green' | 'orange';
const PAL: Record<ColorKey, { s: string; t: string }> = {
  pink: { s: '#E31B59', t: '#FDE8EF' },
  blue: { s: '#2E7BF6', t: '#E4EEFD' },
  purple: { s: '#7C4DFF', t: '#EEE9FE' },
  green: { s: '#16A34A', t: '#E7F6EC' },
  orange: { s: '#E8890B', t: '#FCEBD5' },
};
const COLOR_KEYS: ColorKey[] = ['pink', 'blue', 'purple', 'green', 'orange'];

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

function CollectionIcon({ name, size, color }: { name: IconKey; size: number; color: string }) {
  const Cmp = ICON_MAP[name] ?? IconBookmark;
  return <Cmp size={size} color={color} strokeWidth={2} />;
}

interface Collection {
  id: string;
  name: string;
  count: number;
  color: ColorKey;
  icon: IconKey;
  selected: boolean;
}

// UI 목업 — 북마크는 아직 실 API 미연동(스펙상 후속), 로컬 상태로 동작
const INITIAL_COLLECTIONS: Collection[] = [
  { id: 'my-favorites', name: '내 즐겨찾기', count: 12, color: 'pink', icon: 'star', selected: true },
  { id: 'want-to-go', name: '가고싶어요', count: 8, color: 'blue', icon: 'clock', selected: false },
  { id: 'travel-candidates', name: '여행 후보지', count: 5, color: 'purple', icon: 'archive', selected: false },
];

const MAX_CONTENT_LEN = 20;
// 시트는 창 높이의 80%까지 → 핸들+헤더+CTA 예약분(약 180)을 뺀 값으로 스크롤 영역을 제한해
// 작은 기기(iPhone SE 등)에서도 하단 CTA가 화면 밖으로 밀리지 않게 한다.
const SCROLL_MAX = Dimensions.get('window').height * 0.8 - normalize(180);

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 추가 완료 — 선택된 컬렉션 이름들 (화면에서 토스트/북마크 상태 처리) */
  onAdd: (collectionNames: string[]) => void;
}

function CollectionRow({ item, onToggle }: { item: Collection; onToggle: () => void }) {
  const p = PAL[item.color];
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
        backgroundColor: item.selected ? p.t : '#fff',
        borderWidth: 1,
        borderColor: item.selected ? `${p.s}33` : 'transparent',
      }}
    >
      <View style={{ width: normalize(46), height: normalize(46), borderRadius: normalize(13), backgroundColor: p.t, alignItems: 'center', justifyContent: 'center' }}>
        <CollectionIcon name={item.icon} size={normalize(23)} color={p.s} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: '#1F1E1D' }}>{item.name}</Text>
        <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Regular', fontSize: normalizeFontSize(12), color: '#A39E98', marginTop: normalize(2) }}>{`스팟 ${item.count}개`}</Text>
      </View>
      <View
        style={{
          width: normalize(26),
          height: normalize(26),
          borderRadius: normalize(13),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: item.selected ? p.s : 'transparent',
          borderWidth: item.selected ? 0 : 2,
          borderColor: '#D8D4CF',
        }}
      >
        {item.selected && <IconCheck size={normalize(16)} color="#fff" strokeWidth={3} />}
      </View>
    </Pressable>
  );
}

export default function BookmarkSheet({ visible, onClose, onAdd }: Props) {
  const [view, setView] = useState<'list' | 'create'>('list');
  // 선택/생성 상태는 화면에 머무는 동안만 유지되는 목업(실 API 후속). 시트를 닫았다 열면 선택이 그대로 보임(=소속).
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const nextId = useRef(1);
  const [name, setName] = useState('');
  const [colorKey, setColorKey] = useState<ColorKey>('pink');
  const [iconKey, setIconKey] = useState<IconKey>('star');

  const cur = PAL[colorKey];
  const selected = collections.filter((c) => c.selected);
  const canAdd = selected.length > 0;
  const canCreate = name.trim().length > 0;

  function resetForm() {
    setName('');
    setColorKey('pink');
    setIconKey('star');
  }

  function handleClose() {
    setView('list');
    resetForm();
    onClose();
  }

  function toggle(id: string) {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));
  }

  function handleCreate() {
    if (!canCreate) return;
    const item: Collection = {
      id: `custom-${nextId.current++}`,
      name: name.trim(),
      count: 0,
      color: colorKey,
      icon: iconKey,
      selected: true,
    };
    setCollections((prev) => [...prev, item]);
    resetForm();
    setView('list');
  }

  function handleAdd() {
    if (!canAdd) return;
    onAdd(selected.map((c) => c.name));
  }

  const pillLabelColor = (enabled: boolean) => (enabled ? '#fff' : '#B5B0AA');
  const pillBg = (enabled: boolean) => (enabled ? ACCENT : '#EFEDEA');

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      {view === 'list' ? (
        <View>
          <View style={{ paddingHorizontal: normalize(24), paddingBottom: normalize(6) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), letterSpacing: -0.35, color: '#1F1E1D' }}>
              즐겨찾기에 추가
            </Text>
          </View>

          <ScrollView style={{ maxHeight: SCROLL_MAX }} contentContainerStyle={{ paddingHorizontal: normalize(16), paddingTop: normalize(8), paddingBottom: normalize(4), gap: normalize(4) }}>
            {collections.map((c) => (
              <CollectionRow key={c.id} item={c} onToggle={() => toggle(c.id)} />
            ))}

            <Pressable onPress={() => setView('create')} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(14), paddingVertical: normalize(13), paddingHorizontal: normalize(14), borderRadius: normalize(16) }}>
              <View style={{ width: normalize(46), height: normalize(46), borderRadius: normalize(13), borderWidth: 1.5, borderColor: '#C9C4BE', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
                <IconPlus size={normalize(22)} color="#8B8680" strokeWidth={2} />
              </View>
              <Text allowFontScaling={false} style={{ flex: 1, fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(14), color: '#37352F' }}>새 컬렉션 만들기</Text>
              <IconChevronRight size={normalize(20)} color="#C4BFB9" strokeWidth={2} />
            </Pressable>
          </ScrollView>

          <View style={{ paddingHorizontal: normalize(20), paddingTop: normalize(12), paddingBottom: normalize(12), borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }}>
            <Pressable onPress={handleAdd} disabled={!canAdd} style={{ height: normalize(54), borderRadius: normalize(27), alignItems: 'center', justifyContent: 'center', backgroundColor: pillBg(canAdd) }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: pillLabelColor(canAdd) }}>
                {canAdd ? `${selected.length}개 컬렉션에 추가` : '컬렉션을 선택하세요'}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(10), paddingHorizontal: normalize(20), paddingBottom: normalize(8) }}>
            <Pressable onPress={() => { resetForm(); setView('list'); }} hitSlop={8} style={{ padding: normalize(4) }}>
              <IconChevronLeft size={normalize(24)} color="#37352F" strokeWidth={2} />
            </Pressable>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), letterSpacing: -0.35, color: '#1F1E1D' }}>
              새 컬렉션 만들기
            </Text>
          </View>

          <ScrollView style={{ maxHeight: SCROLL_MAX }} contentContainerStyle={{ paddingHorizontal: normalize(24), paddingTop: normalize(8), paddingBottom: normalize(8) }}>
            {/* 이름 + 실시간 미리보기 타일 */}
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

            {/* 색상 선택 */}
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

            {/* 아이콘 선택 */}
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
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(15), color: pillLabelColor(canCreate) }}>만들기</Text>
            </Pressable>
          </View>
        </View>
      )}
    </BottomSheet>
  );
}
