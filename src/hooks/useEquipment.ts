import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { equipmentApi, EquipmentTypeApi } from '@/api/equipment';
import { useAuthStore } from '@/store/useAuthStore';

const equipmentKey = (token: string | null) => ['equipment', 'me', token ?? 'guest'] as const;

/** 내 장비 목록. 글쓰기 화면의 카메라·렌즈 프리셋과 마이페이지 장비 섹션이 함께 쓴다. */
export function useMyEquipments() {
  const token = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: equipmentKey(token),
    queryFn: () => equipmentApi.getMyEquipments(token!),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEquipment() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { equipmentType: EquipmentTypeApi; equipmentName: string }) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return equipmentApi.createEquipment(body, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment', 'me'] }),
  });
}

export function useDeleteEquipment() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (equipmentId: number) => {
      if (!token) throw new Error('로그인이 필요해요.');
      return equipmentApi.deleteEquipment(equipmentId, token);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment', 'me'] }),
  });
}
