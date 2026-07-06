import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { IconArchive, IconCheck, IconChevronLeft, IconClock, IconFolder, IconPlus, IconStar } from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { BUTTON_RADIUS, GRID_PADDING } from '@/constants/layout';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import type { BookmarkCollection } from '@/types/spot';

export const MOCK_BOOKMARK_COLLECTIONS: BookmarkCollection[] = [
  { id: 'my-favorites', name: '내 즐겨찾기', count: 12, iconBg: '#FFF0F3', iconColor: '#E31B59' },
  { id: 'want-to-go', name: '가고싶어요', count: 8, iconBg: '#E8F3FF', iconColor: '#0071E3' },
  { id: 'travel-candidates', name: '여행 후보지', count: 5, iconBg: '#F3F0FF', iconColor: '#7C3AED' },
];

const COLLECTION_ICONS: Record<string, React.ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  'my-favorites': IconStar,
  'want-to-go': IconClock,
  'travel-candidates': IconArchive,
};

// 새로 만드는 컬렉션은 전용 아이콘이 없어 폴더 아이콘으로 통일
const DEFAULT_COLLECTION_ICON = IconFolder;

// 목업에 없던 기능 — 커스텀 컬러 피커 대신 앱 기존 팔레트에서 고르는 방식으로 단순화
const COLLECTION_COLOR_PALETTE: { color: string; bg: string }[] = [
  { color: '#E31B59', bg: '#FFF0F3' },
  { color: '#0071E3', bg: '#E8F3FF' },
  { color: '#7C3AED', bg: '#F3F0FF' },
  { color: '#34C759', bg: '#E8F5EB' },
  { color: '#FF9F0A', bg: '#FFF3E0' },
];

const MAX_COLLECTIONS = 10;

interface Props {
  visible: boolean;
  onClose: () => void;
  isSaved: boolean;
  spotName: string;
  savedCollectionName: string;
  onConfirm: (collectionId: string, collectionName: string) => void;
  onRemove: () => void;
  onViewFavorites: () => void;
}

export default function BookmarkSheet({
  visible,
  onClose,
  isSaved,
  spotName,
  savedCollectionName,
  onConfirm,
  onRemove,
  onViewFavorites,
}: Props) {
  const [collections, setCollections] = useState<BookmarkCollection[]>(MOCK_BOOKMARK_COLLECTIONS);
  const [selectedId, setSelectedId] = useState(MOCK_BOOKMARK_COLLECTIONS[0].id);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLLECTION_COLOR_PALETTE[0].color);

  function handleConfirm() {
    const collection = collections.find((c) => c.id === selectedId);
    if (!collection) return;
    onConfirm(collection.id, collection.name);
  }

  function handleCreateCollection() {
    const name = newName.trim();
    if (!name) return;
    const swatch = COLLECTION_COLOR_PALETTE.find((c) => c.color === newColor) ?? COLLECTION_COLOR_PALETTE[0];
    const newCollection: BookmarkCollection = {
      id: `custom-${Date.now()}`,
      name,
      count: 0,
      iconBg: swatch.bg,
      iconColor: swatch.color,
    };
    setCollections((prev) => [...prev, newCollection]);
    setSelectedId(newCollection.id);
    setNewName('');
    setNewColor(COLLECTION_COLOR_PALETTE[0].color);
    setCreating(false);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {isSaved ? (
        <>
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
              즐겨찾기
            </Text>
          </View>
          <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(16) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(12), marginBottom: normalize(20) }}>
              <View style={{ width: normalize(56), height: normalize(56), borderRadius: normalize(12), backgroundColor: '#F5F5F7' }} />
              <View>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(15), color: '#000' }}>{spotName}</Text>
                <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginTop: normalize(2) }}>
                  {`${savedCollectionName}에 저장됨`}
                </Text>
              </View>
            </View>
            <View style={{ gap: normalize(8) }}>
              <Pressable onPress={onViewFavorites} style={{ height: normalize(48), borderRadius: normalize(24), backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: '#000' }}>즐겨찾기 보기</Text>
              </Pressable>
              <Pressable onPress={onRemove} style={{ height: normalize(48), borderRadius: normalize(24), backgroundColor: '#F5F5F7', alignItems: 'center', justifyContent: 'center' }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: '#E31B59' }}>즐겨찾기 제거</Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : creating ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(4), paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
            <Pressable onPress={() => setCreating(false)} hitSlop={8} style={{ width: normalize(32), height: normalize(32), alignItems: 'center', justifyContent: 'center', marginLeft: normalize(-6) }}>
              <IconChevronLeft size={normalize(18)} color="#000" strokeWidth={2} />
            </Pressable>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
              새 컬렉션 만들기
            </Text>
          </View>
          <View style={{ paddingHorizontal: GRID_PADDING }}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="컬렉션 이름"
              placeholderTextColor="rgba(0,0,0,0.3)"
              autoFocus
              style={{
                height: normalize(48),
                borderRadius: normalize(12),
                backgroundColor: '#F5F5F7',
                paddingHorizontal: normalize(14),
                fontSize: normalizeFontSize(15),
                color: '#000',
                marginBottom: normalize(20),
              }}
            />
            <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.45)', marginBottom: normalize(10) }}>
              색상 선택
            </Text>
            <View style={{ flexDirection: 'row', gap: normalize(12), marginBottom: normalize(24) }}>
              {COLLECTION_COLOR_PALETTE.map((swatch) => {
                const isSelected = newColor === swatch.color;
                return (
                  <Pressable
                    key={swatch.color}
                    onPress={() => setNewColor(swatch.color)}
                    style={{
                      width: normalize(44),
                      height: normalize(44),
                      borderRadius: normalize(22),
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: swatch.color,
                    }}
                  >
                    <View
                      style={{
                        width: normalize(34),
                        height: normalize(34),
                        borderRadius: normalize(17),
                        backgroundColor: swatch.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && <IconCheck size={normalize(16)} color={swatch.color} strokeWidth={2.5} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={{ paddingHorizontal: GRID_PADDING, paddingBottom: normalize(12) }}>
            <Pressable
              onPress={handleCreateCollection}
              disabled={!newName.trim()}
              style={{
                width: '100%',
                height: normalize(52),
                borderRadius: BUTTON_RADIUS,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: newName.trim() ? '#E31B59' : 'rgba(0,0,0,0.08)',
              }}
            >
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: newName.trim() ? '#fff' : 'rgba(0,0,0,0.25)' }}>
                만들기
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(16), paddingBottom: normalize(12) }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(18), color: '#000', letterSpacing: -0.35 }}>
              즐겨찾기에 추가
            </Text>
          </View>
          <View style={{ paddingHorizontal: GRID_PADDING }}>
            {collections.map((collection) => {
              const Icon = COLLECTION_ICONS[collection.id] ?? DEFAULT_COLLECTION_ICON;
              const isSelected = selectedId === collection.id;
              return (
                <Pressable
                  key={collection.id}
                  onPress={() => setSelectedId(collection.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: normalize(12),
                    padding: normalize(12),
                    borderRadius: normalize(14),
                    backgroundColor: isSelected ? 'rgba(227,27,89,0.04)' : 'transparent',
                    marginBottom: normalize(4),
                  }}
                >
                  <View style={{ width: normalize(40), height: normalize(40), borderRadius: normalize(12), backgroundColor: collection.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={normalize(20)} color={collection.iconColor} strokeWidth={2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-Medium', fontSize: normalizeFontSize(14), color: '#000' }}>{collection.name}</Text>
                    <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)', marginTop: normalize(1) }}>{`스팟 ${collection.count}개`}</Text>
                  </View>
                  <View
                    style={{
                      width: normalize(22),
                      height: normalize(22),
                      borderRadius: normalize(11),
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? '#E31B59' : 'transparent',
                      borderWidth: isSelected ? 0 : 1.2,
                      borderColor: 'rgba(0,0,0,0.15)',
                    }}
                  >
                    {isSelected && <IconCheck size={normalize(11)} color="#fff" strokeWidth={2.5} />}
                  </View>
                </Pressable>
              );
            })}
            {collections.length < MAX_COLLECTIONS ? (
              <Pressable onPress={() => setCreating(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: normalize(8), paddingVertical: normalize(14) }}>
                <IconPlus size={normalize(18)} color="rgba(0,0,0,0.6)" strokeWidth={2} />
                <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(14), color: 'rgba(0,0,0,0.6)' }}>새 컬렉션 만들기</Text>
              </Pressable>
            ) : (
              <Text allowFontScaling={false} style={{ fontSize: normalizeFontSize(13), color: 'rgba(0,0,0,0.35)', paddingVertical: normalize(14) }}>
                {`컬렉션은 최대 ${MAX_COLLECTIONS}개까지 만들 수 있어요`}
              </Text>
            )}
          </View>
          <View style={{ paddingHorizontal: GRID_PADDING, paddingTop: normalize(8), paddingBottom: normalize(12) }}>
            <Pressable onPress={handleConfirm} style={{ width: '100%', height: normalize(52), borderRadius: BUTTON_RADIUS, backgroundColor: '#E31B59', alignItems: 'center', justifyContent: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Pretendard-SemiBold', fontSize: normalizeFontSize(16), color: '#fff' }}>추가하기</Text>
            </Pressable>
          </View>
        </>
      )}
    </BottomSheet>
  );
}
