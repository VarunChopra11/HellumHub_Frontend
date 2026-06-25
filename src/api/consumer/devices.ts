import { consumerApi } from '@/lib/axios';
import type {
  BindingTokenResponse,
  DeviceRenameRequest,
  SmartHomeDeviceResponse,
} from '@/types/models';

/**
 * GET /api/v1/devices
 * Returns all Smart Home devices owned by the authenticated consumer.
 */
export async function listDevices(): Promise<SmartHomeDeviceResponse[]> {
  const { data } = await consumerApi.get<SmartHomeDeviceResponse[]>('/api/v1/devices');
  return data;
}

/**
 * POST /api/v1/devices/binding-token
 * Requests a one-time binding token for the MQTT provisioning flow.
 * Token expires in `expires_in` seconds (default 600 = 10 min).
 */
export async function requestBindingToken(): Promise<BindingTokenResponse> {
  const { data } = await consumerApi.post<BindingTokenResponse>('/api/v1/devices/binding-token');
  return data;
}

/**
 * PATCH /api/v1/devices/{mac}
 * Rename an owned device.
 */
export async function renameDevice(
  mac: string,
  name: string,
): Promise<SmartHomeDeviceResponse> {
  const body: DeviceRenameRequest = { name };
  const { data } = await consumerApi.patch<SmartHomeDeviceResponse>(
    `/api/v1/devices/${mac}`,
    body,
  );
  return data;
}

/**
 * DELETE /api/v1/devices/{mac}
 * Release ownership of a provisioned device (removes it from account).
 * Returns 204 on success.
 */
export async function deleteDevice(mac: string): Promise<void> {
  await consumerApi.delete(`/api/v1/devices/${mac}`);
}
