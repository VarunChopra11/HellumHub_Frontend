import { adminApi } from '@/lib/axios';
import type {
  DeviceModelCreate,
  DeviceModelResponse,
  DeviceModelUpdate,
} from '@/types/models';

/**
 * GET /admin/device-models
 * List all device models in the catalog.
 */
export async function listDeviceModels(): Promise<DeviceModelResponse[]> {
  const { data } = await adminApi.get<DeviceModelResponse[]>('/admin/device-models');
  return data;
}

/**
 * POST /admin/device-models
 * Register a new device model.
 */
export async function createDeviceModel(payload: DeviceModelCreate): Promise<DeviceModelResponse> {
  const { data } = await adminApi.post<DeviceModelResponse>('/admin/device-models', payload);
  return data;
}

/**
 * GET /admin/device-models/{model_id}
 */
export async function getDeviceModel(modelId: string): Promise<DeviceModelResponse> {
  const { data } = await adminApi.get<DeviceModelResponse>(`/admin/device-models/${modelId}`);
  return data;
}

/**
 * PATCH /admin/device-models/{model_id}
 * Partially update a device model.
 */
export async function updateDeviceModel(
  modelId: string,
  payload: DeviceModelUpdate,
): Promise<DeviceModelResponse> {
  const { data } = await adminApi.patch<DeviceModelResponse>(
    `/admin/device-models/${modelId}`,
    payload,
  );
  return data;
}

/**
 * DELETE /admin/device-models/{model_id}
 * Returns 204 on success.
 */
export async function deleteDeviceModel(modelId: string): Promise<void> {
  await adminApi.delete(`/admin/device-models/${modelId}`);
}
