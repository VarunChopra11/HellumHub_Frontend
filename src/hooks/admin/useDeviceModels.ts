import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  listDeviceModels,
  createDeviceModel,
  updateDeviceModel,
  deleteDeviceModel,
} from '@/api/admin/deviceModels';
import type { DeviceModelCreate, DeviceModelUpdate } from '@/types/models';
import { queryKeys } from '@/hooks/queryKeys';

export function useDeviceModels() {
  return useQuery({
    queryKey: queryKeys.deviceModels,
    queryFn: listDeviceModels,
    staleTime: 60_000,
  });
}

export function useCreateDeviceModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeviceModelCreate) => createDeviceModel(payload),
    onSuccess: (model) => {
      qc.invalidateQueries({ queryKey: queryKeys.deviceModels });
      toast.success(`Device model "${model.display_name}" created`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create device model');
    },
  });
}

export function useUpdateDeviceModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ modelId, payload }: { modelId: string; payload: DeviceModelUpdate }) =>
      updateDeviceModel(modelId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deviceModels });
      toast.success('Device model updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update device model');
    },
  });
}

export function useDeleteDeviceModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) => deleteDeviceModel(modelId),
    onMutate: (modelId) => {
      const previous = qc.getQueryData(queryKeys.deviceModels);
      qc.setQueryData(queryKeys.deviceModels, (old: unknown) =>
        Array.isArray(old) ? old.filter((m: { model_id: string }) => m.model_id !== modelId) : old,
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success('Device model deleted');
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.deviceModels, context.previous);
      toast.error('Failed to delete device model');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deviceModels });
    },
  });
}
