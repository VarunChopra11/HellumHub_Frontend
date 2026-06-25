import { adminApi } from '@/lib/axios';
import type { SmartHomeDeviceResponse } from '@/types/models';

/**
 * GET /admin/smarthome-devices
 * List all provisioned Smart Home devices across all users.
 */
export async function listInventory(): Promise<SmartHomeDeviceResponse[]> {
  const { data } = await adminApi.get<SmartHomeDeviceResponse[]>('/admin/smarthome-devices');
  return data;
}

/**
 * DELETE /admin/smarthome-devices/{mac}
 * Force-delete a provisioned device (admin override, bypasses ownership check).
 * Returns 204 on success.
 */
export async function adminDeleteDevice(mac: string): Promise<void> {
  await adminApi.delete(`/admin/smarthome-devices/${mac}`);
}
