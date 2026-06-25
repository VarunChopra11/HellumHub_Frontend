import { adminApi } from '@/lib/axios';
import type { AdminRoleGrantRequest, AdminRoleResponse } from '@/types/models';

/**
 * GET /admin/roles
 * List all granted admin accounts. Super Admin only.
 */
export async function listAdmins(): Promise<AdminRoleResponse[]> {
  const { data } = await adminApi.get<AdminRoleResponse[]>('/admin/roles');
  return data;
}

/**
 * POST /admin/roles
 * Grant admin access to a Google email address. Super Admin only.
 */
export async function grantAdmin(email: string): Promise<AdminRoleResponse> {
  const body: AdminRoleGrantRequest = { email };
  const { data } = await adminApi.post<AdminRoleResponse>('/admin/roles', body);
  return data;
}

/**
 * DELETE /admin/roles/{email}
 * Revoke admin access. Super Admin only.
 * Returns 204 on success.
 */
export async function revokeAdmin(email: string): Promise<void> {
  await adminApi.delete(`/admin/roles/${encodeURIComponent(email)}`);
}
