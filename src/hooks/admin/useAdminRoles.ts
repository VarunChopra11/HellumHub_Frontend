import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { listAdmins, grantAdmin, revokeAdmin } from '@/api/admin/roles';
import { queryKeys } from '@/hooks/queryKeys';

export function useAdminRoles() {
  return useQuery({
    queryKey: queryKeys.adminRoles,
    queryFn: listAdmins,
    staleTime: 30_000,
  });
}

export function useGrantAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => grantAdmin(email),
    onSuccess: (newRole) => {
      qc.invalidateQueries({ queryKey: queryKeys.adminRoles });
      toast.success(`Admin access granted to ${newRole.email}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to grant admin access');
    },
  });
}

export function useRevokeAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => revokeAdmin(email),
    onSuccess: (_data, email) => {
      qc.setQueryData(queryKeys.adminRoles, (old: ReturnType<typeof listAdmins> extends Promise<infer T> ? T : never) =>
        Array.isArray(old) ? old.filter((r) => r.email !== email) : old,
      );
      toast.success(`Admin access revoked`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to revoke admin access');
    },
  });
}
