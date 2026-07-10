import React from 'react';
import { ScrollView, View } from 'react-native';
import { normalize } from '@/utils/normalize';

import ProfileHeader from './components/ProfileHeader';
import PhotoMapPreview from './components/PhotoMapPreview';
import RecentAlbums from './components/RecentAlbums';
import PhotogenicReport from './components/PhotogenicReport';
import WishlistPreview from './components/WishlistPreview';
import EquipmentSection from './components/EquipmentSection';

export default function MyPageScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f7' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <ProfileHeader />
        
        <View style={{ paddingTop: normalize(28) }}>
          <PhotoMapPreview />
          <RecentAlbums />
          <PhotogenicReport />
          <WishlistPreview />
          <EquipmentSection />
        </View>
      </ScrollView>
    </View>
  );
}
