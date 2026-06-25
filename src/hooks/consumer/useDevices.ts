import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listDevices, requestBindingToken, renameDevice, deleteDevice } from '@/api/consumer/devices';
import { executeToggle } from '@/api/consumer/fulfillment';
import { useDeviceStore } from '@/stores/deviceStore';
import { queryKeys } from '@/hooks/queryKeys';

/**
 * Fetches all devices and syncs them into the Zustand deviceStore.
 */
export function useDevices() {
  const { setDevices, setLoading } = useDeviceStore();

  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: async () => {
      setLoading(true);
      try {
        const devices = await listDevices();
        setDevices(devices);
        return devices;
      } finally {
        setLoading(false);
      }
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Mutation: request a new MQTT Binding Token for BLE provisioning.
 */
export function useRequestBindingToken() {
  return useMutation({
    mutationFn: requestBindingToken,
    onError: () => {
      toast.error('Failed to generate binding token. Please try again.');
    },
  });
}

/**
 * Mutation: rename an owned device.
 * Invalidates the device list on success.
 */
export function useRenameDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mac, name }: { mac: string; name: string }) =>
      renameDevice(mac, name),
    onSuccess: (updatedDevice) => {
      // Update the specific device in the store directly
      const { setDevices } = useDeviceStore.getState();
      const current = useDeviceStore.getState().devices;
      setDevices(
        current.map((d) => (d.mac === updatedDevice.mac ? updatedDevice : d)),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      toast.success('Device renamed successfully');
    },
    onError: () => {
      toast.error('Failed to rename device. Please try again.');
    },
  });
}

/**
 * Mutation: delete (unbind) an owned device.
 * Removes the device from the store optimistically.
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient();
  const { setDevices } = useDeviceStore();

  return useMutation({
    mutationFn: (mac: string) => deleteDevice(mac),
    onMutate: (mac) => {
      // Optimistic removal
      const previous = useDeviceStore.getState().devices;
      setDevices(previous.filter((d) => d.mac !== mac));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      toast.success('Device removed from your account');
    },
    onError: (_err, _mac, context) => {
      // Roll back optimistic update
      if (context?.previous) setDevices(context.previous);
      toast.error('Failed to remove device. Please try again.');
    },
  });
}

/**
 * Mutation: toggle a device endpoint ON or OFF via the fulfillment API.
 * Applies an optimistic update immediately for a snappy UI, then confirms via API.
 */
export function useToggleEndpoint() {
  const { optimisticallyToggle, applyMqttStateUpdate } = useDeviceStore();

  return useMutation({
    mutationFn: ({ mac, endpointId, on }: { mac: string; endpointId: string; on: boolean }) =>
      executeToggle(mac, endpointId, on),

    onMutate: ({ mac, endpointId, on }) => {
      // Instant UI feedback before API response
      optimisticallyToggle(mac, endpointId, on);
    },

    onError: (_err, { mac, endpointId, on }) => {
      // Roll back optimistic update on failure
      applyMqttStateUpdate(mac, endpointId, !on);
      toast.error('Could not toggle device. Check your connection.');
    },
  });
}

/**
 * Poll GET /api/v1/devices until device count increases (used by AddDeviceWizard).
 * Returns a function that polls and resolves when a new device appears.
 */
export function usePollForNewDevice() {
  const { setDevices } = useDeviceStore();

  return async (expectedCount: number, timeoutMs = 120_000): Promise<boolean> => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const devices = await listDevices();
        if (devices.length >= expectedCount) {
          setDevices(devices);
          return true;
        }
      } catch {
        // Swallow errors during polling — keep trying
      }
    }
    return false;
  };
}
