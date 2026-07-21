import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  IconEdit, 
  IconCopy, 
  IconUserPlus, 
  IconCalendarPlus, 
  IconTrash 
} from '@tabler/icons-react-native';
import BottomSheet from '@/components/common/BottomSheet';
import { normalize, normalizeFontSize } from '@/utils/normalize';
import { GRID_PADDING } from '@/constants/layout';

interface CourseMoreSheetProps {
  visible: boolean;
  onClose: () => void;
  courseName: string;
  onEditName: () => void;
  onDuplicate: () => void;
  onInvite: () => void;
  onAddToCalendar: () => void;
  onDelete: () => void;
}

export default function CourseMoreSheet({
  visible,
  onClose,
  courseName,
  onEditName,
  onDuplicate,
  onInvite,
  onAddToCalendar,
  onDelete
}: CourseMoreSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.handle} />
        <Text style={styles.title}>더보기</Text>
        <Text style={styles.subtitle}>{courseName}</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.item} onPress={() => { onClose(); onEditName(); }}>
          <View style={styles.iconBox}>
            <IconEdit size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.itemText}>이름 변경</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => { onClose(); onDuplicate(); }}>
          <View style={styles.iconBox}>
            <IconCopy size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.itemText}>복제</Text>
            <Text style={styles.itemDesc}>같은 스팟으로 새 계획 만들기</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => { onClose(); onInvite(); }}>
          <View style={styles.iconBox}>
            <IconUserPlus size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View style={[styles.textBox, { flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemText}>공동 편집자 초대</Text>
              <Text style={styles.itemDesc}>함께 갈 친구 추가</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>BETA</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={() => { onClose(); onAddToCalendar(); }}>
          <View style={styles.iconBox}>
            <IconCalendarPlus size={20} color="#333" strokeWidth={1.5} />
          </View>
          <View style={styles.textBox}>
            <Text style={styles.itemText}>캘린더에 추가</Text>
            <Text style={styles.itemDesc}>iOS 캘린더 · Google 캘린더</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.item, styles.deleteItem]} onPress={() => { onClose(); onDelete(); }}>
          <View style={[styles.iconBox, { backgroundColor: 'transparent' }]}>
            <IconTrash size={20} color="#E31B59" strokeWidth={1.5} />
          </View>
          <View style={styles.textBox}>
            <Text style={[styles.itemText, { color: '#E31B59' }]}>이 계획 전체 삭제</Text>
            <Text style={[styles.itemDesc, { color: '#E31B59', opacity: 0.7 }]}>{"스팟 개별 삭제는 '코스 편집'에서 · 되돌릴 수 없어요"}</Text>
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
  deleteItem: {
    backgroundColor: '#FFF0F3',
    marginTop: normalize(10),
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
