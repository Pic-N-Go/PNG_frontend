import React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { IconChevronLeft, IconSearch } from '@tabler/icons-react-native';
import { MyPageStackParamList } from '@/navigation/stacks/MyPageStack';
import { normalize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG } from '@/constants/layout';

type Props = NativeStackScreenProps<MyPageStackParamList, 'OpenSourceLicenses'>;

const TEXT2 = 'rgba(0,0,0,0.5)';
const BODY = 'rgba(0,0,0,0.7)';

const TOTAL = 42;

interface Lib { name: string; owner: string; version: string; license: string }
const LIBS: Lib[] = [
  { name: 'react-native', owner: 'Meta Platforms, Inc.', version: '0.74.1', license: 'MIT' },
  { name: '@react-navigation/native', owner: 'React Navigation', version: '6.1.17', license: 'MIT' },
  { name: '@tabler/icons-react-native', owner: 'Paweł Kuna', version: '3.5.0', license: 'MIT' },
  { name: 'react-native-maps', owner: 'react-native-maps', version: '1.14.0', license: 'MIT' },
  { name: 'react-native-reanimated', owner: 'Software Mansion', version: '3.10.0', license: 'MIT' },
  { name: 'pretendard', owner: 'orioncactus', version: '1.3.9', license: 'OFL-1.1' },
  { name: 'axios', owner: 'Matt Zabriskie', version: '1.7.2', license: 'MIT' },
  { name: 'zustand', owner: 'Poimandres', version: '4.5.2', license: 'MIT' },
];

export default function OpenSourceLicensesScreen({ navigation }: Props) {
  const [query, setQuery] = React.useState('');

  const q = query.trim().toLowerCase();
  const filtered = q ? LIBS.filter((l) => l.name.toLowerCase().includes(q)) : LIBS;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Nav */}
      <View className="flex-row items-center border-b border-black/5" style={{ height: normalize(52), paddingHorizontal: normalize(12) }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} className="items-center justify-center" style={{ width: normalize(40), height: normalize(40) }}>
          <IconChevronLeft size={normalize(22)} color="#000" strokeWidth={2} />
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-black tracking-tight" style={{ fontSize: FONT_LG, marginRight: normalize(40) }}>오픈소스 라이선스</Text>
      </View>

      {/* 검색 */}
      <View style={{ paddingHorizontal: normalize(24), paddingTop: normalize(12), paddingBottom: normalize(8) }}>
        <View className="flex-row items-center bg-[#f5f5f7]" style={{ gap: normalize(8), height: normalize(40), paddingHorizontal: normalize(14), borderRadius: normalize(12) }}>
          <IconSearch size={normalize(16)} color="rgba(0,0,0,0.48)" strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="라이브러리 검색"
            placeholderTextColor="rgba(0,0,0,0.48)"
            className="flex-1 p-0 text-black"
            style={{ fontSize: FONT_SM }}
          />
        </View>
      </View>

      {/* 카운트 */}
      <View className="flex-row items-center justify-between" style={{ paddingHorizontal: normalize(24), paddingTop: normalize(6), paddingBottom: normalize(10) }}>
        <Text style={{ fontSize: FONT_XS, color: TEXT2 }}>{q ? `검색 결과 ${filtered.length}개` : `총 ${TOTAL}개 라이브러리`}</Text>
        {!q && <Text style={{ fontSize: FONT_XS, color: TEXT2 }}>이름순 ↓</Text>}
      </View>

      {/* 리스트 */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: normalize(24), paddingBottom: normalize(24) }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {filtered.length === 0 ? (
          <Text className="text-center" style={{ fontSize: FONT_SM, color: 'rgba(0,0,0,0.28)', paddingTop: normalize(60) }}>검색 결과가 없어요</Text>
        ) : (
          <>
            {filtered.map((l, i) => (
              <View
                key={l.name}
                className={`flex-row items-center justify-between ${i < filtered.length - 1 ? 'border-b border-black/5' : ''}`}
                style={{ gap: normalize(10), paddingVertical: normalize(14), paddingHorizontal: normalize(4) }}
              >
                <View className="shrink" style={{ gap: normalize(2) }}>
                  <Text className="font-semibold text-black" style={{ fontSize: FONT_MD }}>{l.name}</Text>
                  <Text style={{ fontSize: FONT_XS, color: TEXT2 }}>{l.owner} · {l.version}</Text>
                </View>
                <View className="bg-[#f5f5f7]" style={{ paddingHorizontal: normalize(10), paddingVertical: normalize(4), borderRadius: normalize(9999) }}>
                  <Text className="font-semibold" style={{ fontSize: FONT_SM, color: BODY }}>{l.license}</Text>
                </View>
              </View>
            ))}
            {!q && (
              <Text className="text-center" style={{ fontSize: FONT_XS, color: 'rgba(0,0,0,0.4)', paddingTop: normalize(16) }}>
                — 이하 {TOTAL - LIBS.length}개 —
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
