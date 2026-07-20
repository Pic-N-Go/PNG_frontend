import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { 
  IconLink, 
  IconPhoto, 
  IconFileDownload,
  IconMessageCircle, // Using as KaKao mock
  IconBrandInstagram,
  IconBrandFacebook,
  IconBrandX,
  IconDotsCircleHorizontal
} from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { GRID_PADDING } from '@/constants/layout';

interface CourseShareSheetProps {
  visible: boolean;
  onClose: () => void;
  courseName: string;
  spotCount: number;
  onCopyLink: () => void;
  onSaveImage: () => void;
  onExportPdf: () => void;
  onShareSocial: (platform: string) => void;
}

export default function CourseShareSheet({
  visible,
  onClose,
  courseName,
  spotCount,
  onCopyLink,
  onSaveImage,
  onExportPdf,
  onShareSocial
}: CourseShareSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.handle} />
        <Text style={styles.title}>공유하기</Text>
        <Text style={styles.subtitle}>{courseName} · 포토스팟 {spotCount}곳</Text>
      </View>

      <View style={styles.socialRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GRID_PADDING }}>
          <TouchableOpacity style={styles.socialBtn} onPress={() => { onClose(); onShareSocial('kakao'); }}>
            <View style={[styles.socialIconBox, { backgroundColor: '#FEE500' }]}>
              <IconMessageCircle size={28} color="#381E1F" strokeWidth={1.5} />
            </View>
            <Text style={styles.socialText}>카카오톡</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn} onPress={() => { onClose(); onShareSocial('instagram'); }}>
            <View style={[styles.socialIconBox, { backgroundColor: '#E1306C' }]}>
              <IconBrandInstagram size={28} color="#FFF" strokeWidth={1.5} />
            </View>
            <Text style={styles.socialText}>인스타 스토리</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn} onPress={() => { onClose(); onShareSocial('facebook'); }}>
            <View style={[styles.socialIconBox, { backgroundColor: '#1877F2' }]}>
              <IconBrandFacebook size={28} color="#FFF" strokeWidth={1.5} />
            </View>
            <Text style={styles.socialText}>페이스북</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn} onPress={() => { onClose(); onShareSocial('x'); }}>
            <View style={[styles.socialIconBox, { backgroundColor: '#1DA1F2' }]}>
              <IconBrandX size={28} color="#FFF" strokeWidth={1.5} />
            </View>
            <Text style={styles.socialText}>X (트위터)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialBtn} onPress={() => { onClose(); onShareSocial('more'); }}>
            <View style={[styles.socialIconBox, { backgroundColor: '#F0F0F0' }]}>
              <IconDotsCircleHorizontal size={28} color="#666" strokeWidth={1.5} />
            </View>
            <Text style={styles.socialText}>더보기</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.item} onPress={() => { onClose(); onCopyLink(); }}>
          <View style={styles.iconBox}>
            <IconLink size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.itemText}>링크 복사</Text>
            <Text style={styles.itemDesc}>png.travel/plan/abc123</Text>
          </View>
          <Text style={styles.rightActionText}>복사</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => { onClose(); onSaveImage(); }}>
          <View style={styles.iconBox}>
            <IconPhoto size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.itemText}>이미지로 저장</Text>
            <Text style={styles.itemDesc}>지도 + 일정표를 PNG 로</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => { onClose(); onExportPdf(); }}>
          <View style={styles.iconBox}>
            <IconFileDownload size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View style={[styles.textBox, { flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemText}>PDF 로 내보내기</Text>
              <Text style={styles.itemDesc}>인쇄용 상세 일정</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>BETA</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: normalize(12),
    paddingBottom: normalize(16),
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: normalize(20),
  },
  title: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: normalizeFontSize(20),
    color: '#000',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Pretendard-Regular',
    fontSize: normalizeFontSize(13),
    color: '#666',
    letterSpacing: -0.3,
  },
  socialRow: {
    paddingBottom: normalize(20),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: normalize(16),
  },
  socialBtn: {
    alignItems: 'center',
    marginRight: 20,
  },
  socialIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  socialText: {
    fontFamily: 'Pretendard-Regular',
    fontSize: normalizeFontSize(11),
    color: '#333',
  },
  content: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: normalize(40),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 16,
    padding: normalize(16),
    marginBottom: normalize(10),
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textBox: {
    flex: 1,
    justifyContent: 'center',
  },
  itemText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: normalizeFontSize(16),
    color: '#000',
    letterSpacing: -0.3,
  },
  itemDesc: {
    fontFamily: 'Pretendard-Regular',
    fontSize: normalizeFontSize(12),
    color: '#888',
    marginTop: 2,
    letterSpacing: -0.2,
  },
  rightActionText: {
    fontFamily: 'Pretendard-SemiBold',
    fontSize: normalizeFontSize(14),
    color: '#E31B59',
  },
  badge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: normalizeFontSize(10),
    fontFamily: 'Pretendard-Bold',
  }
});
