import { create } from 'zustand';
import type { SmartHomeDeviceResponse } from '@/types/models';

interface DeviceState {
  devices: SmartHomeDeviceResponse[];
  isLoading: boolean;

  setDevices: (devices: SmartHomeDeviceResponse[]) => void;
  setLoading: (loading: boolean) => void;

  /**
   * Called by the MQTT listener when a state message arrives on
   * `smarthome/device/<mac>/state`. Immediately updates the endpoint state
   * in the store without requiring an HTTP round-trip.
   *
   * @param mac - The 12-char lowercase hex MAC address from the MQTT topic
   * @param endpointId - The endpoint id from payload.device, e.g. "light1"
   * @param state - true = ON, false = OFF
   */
  applyMqttStateUpdate: (mac: string, endpointId: string, state: boolean) => void;

  /**
   * Optimistically update a single endpoint state (called immediately when
   * the user taps a toggle, before the fulfillment API response).
   */
  optimisticallyToggle: (mac: string, endpointId: string, state: boolean) => void;
}

const updateEndpointState = (
  devices: SmartHomeDeviceResponse[],
  mac: string,
  endpointId: string,
  state: boolean,
): SmartHomeDeviceResponse[] =>
  devices.map((device) => {
    if (device.mac !== mac) return device;
    return {
      ...device,
      endpoints: device.endpoints.map((ep) =>
        ep.id === endpointId ? { ...ep, state } : ep,
      ),
    };
  });

export const useDeviceStore = create<DeviceState>()((set) => ({
  devices: [],
  isLoading: false,

  setDevices: (devices) => set({ devices }),
  setLoading: (isLoading) => set({ isLoading }),

  applyMqttStateUpdate: (mac, endpointId, state) =>
    set((prev) => ({
      devices: updateEndpointState(prev.devices, mac, endpointId, state),
    })),

  optimisticallyToggle: (mac, endpointId, state) =>
    set((prev) => ({
      devices: updateEndpointState(prev.devices, mac, endpointId, state),
    })),
}));
