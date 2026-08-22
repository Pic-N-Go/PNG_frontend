import React from 'react';
import { ScrollView, View } from 'react-native';
import { normalize } from '@/utils/normalize';

import ProfileHeader from './components/ProfileHeader';
import PhotoMapPreview from './components/PhotoMapPreview';
import BookmarkedSpots from './components/BookmarkedSpots';
import SpotAlertPreview from './components/SpotAlertPreview';
import EquipmentSection from './components/EquipmentSection';

export default function MyPageScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <ProfileHeader />

        <View style={{ paddingTop: normalize(28) }}>
          <PhotoMapPreview />
          <BookmarkedSpots />
          <SpotAlertPreview />
          <EquipmentSection />
        </View>
      </ScrollView>
    </View>
  );
}
