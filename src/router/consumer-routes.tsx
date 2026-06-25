import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ConsumerShell } from '@/components/layout/consumer-shell';

/**
 * Protects all /app/* routes.
 * Renders the ConsumerShell (with MQTT connection) when authenticated.
 * Redirects to /app/login when not authenticated.
 */
export function ConsumerRoutes() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/app/login" replace />;
  }

  return <ConsumerShell />;
}
