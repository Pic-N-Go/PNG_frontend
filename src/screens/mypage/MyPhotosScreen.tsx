import React, { useState, useMemo } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, StyleSheet, 
  Dimensions, Modal, StatusBar 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconChevronLeft, IconLayoutGrid, IconList, IconX, IconChevronRight } from '@tabler/icons-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { FONT_XS, FONT_SM, FONT_MD, FONT_LG } from '@/constants/layout';

// Types
type ViewMode = 'album' | 'grid';
type FilterType = 'all' | '야경' | '일출' | '일몰' | '낮';

interface AlbumData {
  id: string;
  year: number;
  title: string;
  loc: string;
  date: string;
  count: number;
  badge: FilterType;
  score: number;
  colors: string[];
}

interface PhotoData {
  id: string;
  section: string;
  spot: string;
  date: string;
  badge?: FilterType;
  colors: string[];
}

// Dummy Data
const MOCK_ALBUMS: AlbumData[] = [
  { id: '1', year: 2026, title: '광안리 일출', loc: '부산 · 광안리 해수욕장', date: '2026.03.28', count: 12, badge: '일출', score: 91, colors: ['#0f2027', '#2c5364'] },
  { id: '2', year: 2026, title: '진해 벚꽃', loc: '경남 · 경화역', date: '2026.04.02', count: 24, badge: '낮', score: 88, colors: ['#8b4a6b', '#f0c89a'] },
  { id: '3', year: 2026, title: '제주 사려니숲', loc: '제주 · 사려니숲길', date: '2026.04.15', count: 18, badge: '낮', score: 79, colors: ['#0a1a0f', '#4a8060'] },
  { id: '4', year: 2026, title: '경복궁 야간개장', loc: '서울 · 경복궁', date: '2026.03.08', count: 31, badge: '야경', score: 85, colors: ['#1a1530', '#b44a3a'] },
  { id: '5', year: 2026, title: '부산 감천문화마을', loc: '부산 · 사하구 감천동', date: '2026.02.14', count: 17, badge: '낮', score: 82, colors: ['#3a2a1a', '#c8804a'] },
  { id: '6', year: 2025, title: '영월 별마로천문대', loc: '강원 · 영월군', date: '2025.10.03', count: 22, badge: '야경', score: 94, colors: ['#020010', '#1a1545'] },
  { id: '7', year: 2025, title: '경주 불국사', loc: '경북 · 경주시', date: '2025.11.05', count: 18, badge: '낮', score: 87, colors: ['#5a3010', '#c87020'] },
];

const MOCK_PHOTOS: PhotoData[] = [
  // 2026.04
  { id: 'p1', section: '2026년 4월', spot: '제주 사려니숲', date: '2026.04.15', colors: ['#0a1a0f', '#4a8060'] },
  { id: 'p2', section: '2026년 4월', spot: '제주 사려니숲', date: '2026.04.15', colors: ['#1a3a2a', '#3a6a50'] },
  { id: 'p3', section: '2026년 4월', spot: '진해 경화역', date: '2026.04.02', badge: '낮', colors: ['#d4856a', '#e8a87c'] },
  // 2026.03
  { id: 'p4', section: '2026년 3월', spot: '광안리 해수욕장', date: '2026.03.28', badge: '일출', colors: ['#0f2027', '#2c5364'] },
  { id: 'p5', section: '2026년 3월', spot: '경복궁', date: '2026.03.08', badge: '야경', colors: ['#1a1530', '#b44a3a'] },
  { id: 'p6', section: '2026년 3월', spot: '경복궁', date: '2026.03.08', colors: ['#2d1b4e', '#8b4a6b'] },
  // 2025
  { id: 'p7', section: '2025년 10월', spot: '영월 별마로천문대', date: '2025.10.03', badge: '야경', colors: ['#020010', '#1a1545'] },
  { id: 'p8', section: '2025년 11월', spot: '경주 불국사', date: '2025.11.05', badge: '낮', colors: ['#5a3010', '#c87020'] },
];

const screenWidth = Dimensions.get('window').width;
const GRID_SPACING = 2;
const CELL_SIZE = (screenWidth - normalize(40) - (GRID_SPACING * 2)) / 3;

export default function MyPhotosScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [viewMode, setViewMode] = useState<ViewMode>('album');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Grouped Albums
  const groupedAlbums = useMemo(() => {
    return MOCK_ALBUMS.reduce((acc, curr) => {
      const y = curr.year.toString();
      if (!acc[y]) acc[y] = [];
      acc[y].push(curr);
      return acc;
    }, {} as Record<string, AlbumData[]>);
  }, []);

  // Grouped Photos
  const groupedPhotos = useMemo(() => {
    return MOCK_PHOTOS.reduce((acc, curr) => {
      if (!acc[curr.section]) acc[curr.section] = [];
      acc[curr.section].push(curr);
      return acc;
    }, {} as Record<string, PhotoData[]>);
  }, []);

  const filteredPhotos = useMemo(() => {
    return MOCK_PHOTOS.filter(p => activeFilter === 'all' || p.badge === activeFilter);
  }, [activeFilter]);

  const FILTERS: FilterType[] = ['all', '야경', '일출', '일몰', '낮'];

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setLightboxVisible(true);
  };

  const navLightbox = (dir: number) => {
    const next = currentPhotoIndex + dir;
    if (next >= 0 && next < filteredPhotos.length) {
      setCurrentPhotoIndex(next);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />
      
      {/* NavBar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <IconChevronLeft size={normalize(24)} color="rgba(0,0,0,0.65)" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>내 사진</Text>
        <View style={styles.viewToggleGroup}>
          <TouchableOpacity 
            style={[styles.viewToggleBtn, viewMode === 'album' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('album')}
          >
            <IconList size={16} color={viewMode === 'album' ? '#000' : 'rgba(0,0,0,0.3)'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewToggleBtn, viewMode === 'grid' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('grid')}
          >
            <IconLayoutGrid size={16} color={viewMode === 'grid' ? '#000' : 'rgba(0,0,0,0.3)'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: normalize(40) }}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNum}>142</Text>
            <Text style={styles.summaryLabel}>전체 사진</Text>
          </View>
          <View style={styles.summaryDiv} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNum}>7</Text>
            <Text style={styles.summaryLabel}>촬영 앨범</Text>
          </View>
          <View style={styles.summaryDiv} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryNum}>6</Text>
            <Text style={styles.summaryLabel}>방문 지역</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                  {f === 'all' ? '전체' : f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Album View */}
        {viewMode === 'album' && (
          <View style={{ paddingHorizontal: normalize(20) }}>
            {Object.keys(groupedAlbums).sort((a,b) => Number(b) - Number(a)).map(year => (
              <View key={year} style={{ marginBottom: normalize(20) }}>
                <Text style={styles.sectionTitle}>{year}년</Text>
                <View style={{ gap: normalize(10) }}>
                  {groupedAlbums[year].map(album => {
                    const isVisible = activeFilter === 'all' || album.badge === activeFilter;
                    return (
                      <TouchableOpacity 
                        key={album.id} 
                        style={[styles.albumItem, { opacity: isVisible ? 1 : 0.35 }]}
                        disabled={!isVisible}
                        activeOpacity={0.7}
                      >
                        <View style={styles.albumThumbWrap}>
                          <LinearGradient colors={album.colors as [string, string]} style={styles.albumThumb} />
                          <View style={styles.albumThumbStack} />
                        </View>
                        <View style={styles.albumInfo}>
                          <Text style={styles.albumName}>{album.title}</Text>
                          <Text style={styles.albumLoc}>{album.loc}</Text>
                          <View style={styles.albumMeta}>
                            <Text style={styles.albumCount}>{album.date} · {album.count}장</Text>
                            <View style={styles.albumBadge}><Text style={styles.albumBadgeText}>{album.badge}</Text></View>
                            <Text style={styles.albumScore}>{album.score}점</Text>
                          </View>
                        </View>
                        <IconChevronRight size={16} color="rgba(0,0,0,0.18)" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <View style={{ paddingHorizontal: normalize(20) }}>
            {Object.keys(groupedPhotos).map(section => (
              <View key={section} style={{ marginBottom: normalize(12) }}>
                <Text style={styles.sectionTitle}>{section}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_SPACING }}>
                  {groupedPhotos[section].map((photo, i) => {
                    const isVisible = activeFilter === 'all' || photo.badge === activeFilter;
                    const filteredIdx = filteredPhotos.findIndex(p => p.id === photo.id);
                    return (
                      <TouchableOpacity
                        key={photo.id}
                        activeOpacity={0.8}
                        disabled={!isVisible}
                        onPress={() => openLightbox(filteredIdx)}
                        style={[styles.photoCell, { opacity: isVisible ? 1 : 0.35 }]}
                      >
                        <LinearGradient colors={photo.colors as [string, string]} style={styles.photoInner} />
                        {photo.badge && (
                          <View style={styles.photoGridBadge}>
                            <Text style={styles.photoGridBadgeText}>{photo.badge}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Lightbox Modal */}
      <Modal visible={lightboxVisible} transparent animationType="fade" onRequestClose={() => setLightboxVisible(false)}>
        <View style={styles.lbContainer}>
          <StatusBar barStyle="light-content" />
          
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.lbHeader}>
            <TouchableOpacity onPress={() => setLightboxVisible(false)} style={styles.lbClose}>
              <IconX size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.lbCounter}>{currentPhotoIndex + 1} / {filteredPhotos.length}</Text>
          </LinearGradient>

          {/* Current Photo Gradient (Mocking image) */}
          <LinearGradient 
            colors={filteredPhotos[currentPhotoIndex]?.colors as [string, string] || ['#000', '#000']} 
            style={{ flex: 1 }} 
          />

          {/* Navigation Arrows */}
          {currentPhotoIndex > 0 && (
            <TouchableOpacity style={[styles.lbNav, styles.lbNavPrev]} onPress={() => navLightbox(-1)}>
              <IconChevronLeft size={20} color="#fff" />
            </TouchableOpacity>
          )}
          {currentPhotoIndex < filteredPhotos.length - 1 && (
            <TouchableOpacity style={[styles.lbNav, styles.lbNavNext]} onPress={() => navLightbox(1)}>
              <IconChevronRight size={20} color="#fff" />
            </TouchableOpacity>
          )}

          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.lbFooter}>
            <Text style={styles.lbSpot}>{filteredPhotos[currentPhotoIndex]?.spot}</Text>
            <View style={styles.lbFooterMeta}>
              <Text style={styles.lbDate}>{filteredPhotos[currentPhotoIndex]?.date}</Text>
              {filteredPhotos[currentPhotoIndex]?.badge && (
                <View style={styles.lbMetaBadge}>
                  <Text style={styles.lbMetaBadgeText}>{filteredPhotos[currentPhotoIndex]?.badge}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: normalize(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backBtn: { width: normalize(36), height: normalize(36), alignItems: 'center', justifyContent: 'center', marginLeft: -normalize(8) },
  navTitle: { fontSize: normalizeFontSize(18), fontWeight: '600', color: '#000' },
  viewToggleGroup: { flexDirection: 'row', backgroundColor: '#f8f8f9', borderRadius: normalize(8), padding: normalize(2), gap: normalize(2) },
  viewToggleBtn: { width: normalize(32), height: normalize(28), borderRadius: normalize(6), alignItems: 'center', justifyContent: 'center' },
  viewToggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  
  summaryCard: { flexDirection: 'row', marginHorizontal: normalize(20), marginTop: normalize(14), backgroundColor: '#f8f8f9', borderRadius: normalize(12), paddingVertical: normalize(16), alignItems: 'center' },
  summaryStat: { flex: 1, alignItems: 'center', gap: normalize(4) },
  summaryNum: { fontSize: normalizeFontSize(22), fontWeight: '600', color: '#000', lineHeight: normalizeFontSize(24) },
  summaryLabel: { fontSize: FONT_XS, color: 'rgba(0,0,0,0.38)' },
  summaryDiv: { width: 0.5, height: normalize(28), backgroundColor: 'rgba(0,0,0,0.08)' },

  filterWrapper: { paddingVertical: normalize(14) },
  filterContent: { paddingHorizontal: normalize(20), gap: normalize(8) },
  filterChip: { height: normalize(32), paddingHorizontal: normalize(14), borderRadius: normalize(16), backgroundColor: '#f8f8f9', alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { backgroundColor: '#e31b59' },
  filterText: { fontSize: FONT_SM, fontWeight: '500', color: 'rgba(0,0,0,0.5)' },
  filterTextActive: { color: '#fff' },

  sectionTitle: { fontSize: normalizeFontSize(12), fontWeight: '600', color: 'rgba(0,0,0,0.3)', marginBottom: normalize(10), marginTop: normalize(4) },
  
  albumItem: { flexDirection: 'row', alignItems: 'center', gap: normalize(14), padding: normalize(12), backgroundColor: '#f8f8f9', borderRadius: normalize(12) },
  albumThumbWrap: { width: normalize(72), height: normalize(72), borderRadius: normalize(10), position: 'relative' },
  albumThumb: { width: '100%', height: '100%', borderRadius: normalize(10), zIndex: 2 },
  albumThumbStack: { position: 'absolute', bottom: -4, right: -4, width: normalize(68), height: normalize(68), borderRadius: normalize(9), borderWidth: 2, borderColor: '#f8f8f9', backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1 },
  albumInfo: { flex: 1 },
  albumName: { fontSize: FONT_MD, fontWeight: '600', color: '#000', marginBottom: normalize(3) },
  albumLoc: { fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.38)', marginBottom: normalize(6) },
  albumMeta: { flexDirection: 'row', alignItems: 'center', gap: normalize(8) },
  albumCount: { fontSize: normalizeFontSize(12), color: 'rgba(0,0,0,0.4)' },
  albumBadge: { height: normalize(18), paddingHorizontal: normalize(7), borderRadius: normalize(9), backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center' },
  albumBadgeText: { fontSize: normalizeFontSize(10), fontWeight: '500', color: 'rgba(0,0,0,0.4)' },
  albumScore: { height: normalize(18), paddingHorizontal: normalize(7), borderRadius: normalize(9), backgroundColor: 'rgba(227,27,89,0.08)', justifyContent: 'center', overflow: 'hidden', color: '#e31b59', fontSize: normalizeFontSize(10), fontWeight: '600', textAlignVertical: 'center' },

  photoCell: { width: CELL_SIZE, height: CELL_SIZE, position: 'relative' },
  photoInner: { flex: 1 },
  photoGridBadge: { position: 'absolute', bottom: normalize(6), left: normalize(6), height: normalize(16), paddingHorizontal: normalize(6), borderRadius: normalize(8), backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center' },
  photoGridBadgeText: { fontSize: normalizeFontSize(9), fontWeight: '500', color: 'rgba(255,255,255,0.85)' },

  lbContainer: { flex: 1, backgroundColor: '#000' },
  lbHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: normalize(88), paddingTop: normalize(44), paddingHorizontal: normalize(16), flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  lbClose: { width: normalize(36), height: normalize(36), borderRadius: normalize(18), backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  lbCounter: { fontSize: FONT_SM, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  lbNav: { position: 'absolute', top: '50%', width: normalize(40), height: normalize(40), borderRadius: normalize(20), backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', zIndex: 10, marginTop: -normalize(20) },
  lbNavPrev: { left: normalize(14) },
  lbNavNext: { right: normalize(14) },
  lbFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: normalize(20), paddingTop: normalize(40), paddingBottom: normalize(36) },
  lbSpot: { fontSize: FONT_LG, fontWeight: '600', color: '#fff', marginBottom: normalize(4) },
  lbFooterMeta: { flexDirection: 'row', alignItems: 'center', gap: normalize(8) },
  lbDate: { fontSize: normalizeFontSize(12), color: 'rgba(255,255,255,0.5)' },
  lbMetaBadge: { height: normalize(18), paddingHorizontal: normalize(8), borderRadius: normalize(9), backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center' },
  lbMetaBadgeText: { fontSize: normalizeFontSize(10), fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
});
