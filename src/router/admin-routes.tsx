import { Navigate } from 'react-router-dom';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { AdminShell } from '@/components/layout/admin-shell';

/**
 * Protects all /admin/* routes (except /admin/login).
 * Renders the AdminShell when authenticated with a valid Google ID token.
 * Redirects to /admin/login when not authenticated.
 */
export function AdminRoutes() {
  const googleIdToken = useAdminAuthStore((s) => s.googleIdToken);

  if (!googleIdToken) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminShell />;
}
