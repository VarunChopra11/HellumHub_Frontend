import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

// Route guards
import { ConsumerRoutes } from '@/router/consumer-routes';
import { AdminRoutes } from '@/router/admin-routes';

// Consumer pages
import { ConsumerLoginPage } from '@/pages/app/login-page';
import { ConsumerDashboardPage } from '@/pages/app/dashboard-page';
import { OAuthAuthorizePage } from '@/pages/app/oauth-authorize-page';

// Admin pages
import { AdminLoginPage } from '@/pages/admin/admin-login-page';
import { AdminRolesPage } from '@/pages/admin/roles-page';
import { DeviceModelsPage } from '@/pages/admin/device-models-page';
import { InventoryPage } from '@/pages/admin/inventory-page';

// Migrated OTA pages
import { ReleasesPage } from '@/pages/releases-page';
import { ReleaseDetailPage } from '@/pages/release-detail-page';
import { DevicesPage } from '@/pages/devices-page';
import { OverridesPage } from '@/pages/overrides-page';
import { AuditPage } from '@/pages/audit-page';

// Legacy admin auth redirect handler
import { setUnauthorizedHandler } from '@/api/client';

export default function App() {
  const navigate = useNavigate();

  // Wire the legacy fetch client's unauthorized handler to navigate to admin login
  useEffect(() => {
    setUnauthorizedHandler(() => {
      navigate('/admin/login', { replace: true });
    });
  }, [navigate]);

  return (
    <Routes>
      {/* Root redirect */}
      <Route index element={<Navigate to="/app" replace />} />

      {/* ─── Consumer Portal (/app) ─────────────────────────────────────── */}
      <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />
      <Route path="/app/login" element={<ConsumerLoginPage />} />
      <Route path="/app" element={<ConsumerRoutes />}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<ConsumerDashboardPage />} />
        {/* Catch-all within /app */}
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Route>

      {/* ─── Admin Console (/admin) ──────────────────────────────────────── */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminRoutes />}>
        <Route index element={<Navigate to="/admin/inventory" replace />} />

        {/* Smart Home management */}
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="device-models" element={<DeviceModelsPage />} />

        {/* RBAC */}
        <Route path="roles" element={<AdminRolesPage />} />

        {/* OTA (migrated from old flat routes) */}
        <Route path="ota/releases" element={<ReleasesPage />} />
        <Route path="ota/releases/:releaseId" element={<ReleaseDetailPage />} />
        <Route path="ota/devices" element={<DevicesPage />} />
        <Route path="ota/overrides" element={<OverridesPage />} />
        <Route path="ota/audit" element={<AuditPage />} />

        {/* Catch-all within /admin */}
        <Route path="*" element={<Navigate to="/admin/inventory" replace />} />
      </Route>

      {/* Global catch-all */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
