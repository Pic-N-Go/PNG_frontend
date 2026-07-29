import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SpotDetailScreen from '@/screens/spot/SpotDetailScreen';
import ReviewWriteScreen from '@/screens/spot/ReviewWriteScreen';
import PhotoDetailScreen from '@/screens/spot/PhotoDetailScreen';
import type { ReviewPhotoDTO, TimePeriodApi } from '@/types/spot';

/** 수정 모드로 진입할 때 넘기는 원본값. 네비게이션 파라미터라 직렬화 가능한 값만 담는다. */
export interface ReviewEditSeed {
  reviewId: number;
  rating: number;
  content: string;
  /** 서버가 null로 줄 수 있다. 그때는 폼에서 미선택 상태로 두고 사용자가 다시 고르게 한다. */
  timePeriod: TimePeriodApi | null;
  /** yyyy-MM-dd. 서버에서 null로 올 수 있어 그때는 오늘로 채운다. */
  visitedAt: string | null;
  /** 서버가 ", "로 합쳐 보관하는 값을 그대로 넘긴다. */
  equipmentInfo: string | null;
  /** 기존 사진. 삭제는 photoId로 지정하므로 url만으로는 부족하다. */
  photos: ReviewPhotoDTO[];
}

export type SpotStackParamList = {
  SpotDetail: { spotId: string };
  ReviewWrite: { spotId: string; edit?: ReviewEditSeed };
  PhotoDetail: { photoId: string; spotId: string };
};

const Stack = createNativeStackNavigator<SpotStackParamList>();

export default function SpotStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SpotDetail" component={SpotDetailScreen} />
      <Stack.Screen name="ReviewWrite" component={ReviewWriteScreen} />
      <Stack.Screen name="PhotoDetail" component={PhotoDetailScreen} />
    </Stack.Navigator>
  );
}
