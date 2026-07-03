import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';

export default function HomeScreen() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ marginBottom: 20 }}>홈 화면 (개발 중)</Text>
      <TouchableOpacity 
        onPress={clearAuth}
        style={{ padding: 15, backgroundColor: '#E31B59', borderRadius: 8 }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>강제 로그아웃 (토큰 초기화)</Text>
      </TouchableOpacity>
    </View>
  );
}
