import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listInventory, adminDeleteDevice } from '@/api/admin/inventory';
import { queryKeys } from '@/hooks/queryKeys';

export function useInventory() {
  return useQuery({
    queryKey: queryKeys.inventory,
    queryFn: listInventory,
    staleTime: 20_000,
  });
}

export function useAdminDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mac: string) => adminDeleteDevice(mac),
    onMutate: (mac) => {
      const previous = qc.getQueryData(queryKeys.inventory);
      qc.setQueryData(queryKeys.inventory, (old: unknown) =>
        Array.isArray(old) ? old.filter((d: { mac: string }) => d.mac !== mac) : old,
      );
      return { previous };
    },
    onSuccess: (_data, mac) => {
      toast.success(`Device ${mac} deleted`);
    },
    onError: (_err, _mac, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.inventory, context.previous);
      toast.error('Failed to delete device');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventory });
    },
  });
}
