import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyPageScreen({ navigation }: any) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f7', justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' }}>프로필(MY) 탭 임시 화면</Text>
      
      <TouchableOpacity 
        style={{ backgroundColor: '#E31B59', padding: 16, borderRadius: 12, alignItems: 'center' }}
        onPress={() => navigation.navigate('TravelTab', { screen: 'Wishlist' })}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>위시리스트 화면 보기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
