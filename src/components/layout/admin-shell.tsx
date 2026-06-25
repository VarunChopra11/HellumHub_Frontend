import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Radio,
  Server,
  ShieldCheck,
  Upload,
  Users,
  Cpu,
  Package,
  ChevronRight,
  LogOut,
  Settings,
  BarChart3,
  ListFilter,
} from 'lucide-react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Smart Home',
    icon: Radio,
    items: [
      { path: '/admin/inventory', label: 'Device Inventory', icon: Cpu },
      { path: '/admin/device-models', label: 'Device Models', icon: Package },
    ],
  },
  {
    label: 'OTA Firmware',
    icon: Upload,
    items: [
      { path: '/admin/ota/releases', label: 'Releases', icon: Server },
      { path: '/admin/ota/overrides', label: 'Overrides', icon: ListFilter },
      { path: '/admin/ota/devices', label: 'OTA Devices', icon: BarChart3 },
      { path: '/admin/ota/audit', label: 'Audit Log', icon: ShieldCheck },
    ],
  },
  {
    label: 'Access Control',
    icon: Users,
    items: [
      { path: '/admin/roles', label: 'Admin Roles', icon: Users, superAdminOnly: true },
    ],
  },
];

export function AdminShell() {
  const [expanded, setExpanded] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { email, isSuperAdmin, clearAdminAuth } = useAdminAuthStore();

  function signOut() {
    clearAdminAuth();
    navigate('/admin/login');
  }

  const sidebarWidth = expanded ? 240 : 64;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarWidth,
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width var(--transition-normal)',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
        {/* Logo + collapse toggle */}
        <div style={{
          padding: expanded ? '20px 20px 16px' : '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: expanded ? 'space-between' : 'center',
        }}>
          {expanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'linear-gradient(135deg, var(--accent) 0%, #5b21b6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Settings size={14} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                <span className="accent-gradient-text">Hellum</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> Admin</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4, borderRadius: 4,
              display: 'flex', alignItems: 'center',
              transition: 'color var(--transition-fast)',
            }}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            <ChevronRight
              size={16}
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-normal)' }}
            />
          </button>
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          {NAV_GROUPS.map((group) => {
            // Hide super-admin-only groups for regular admins
            const visibleItems = group.items.filter(
              (item) => !item.superAdminOnly || isSuperAdmin,
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label} style={{ marginBottom: 8 }}>
                {expanded && (
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                    color: 'var(--text-muted)', textTransform: 'uppercase',
                    padding: '8px 8px 4px',
                  }}>
                    {group.label}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const active = location.pathname.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={!expanded ? item.label : undefined}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: expanded ? 10 : 0,
                        justifyContent: expanded ? 'flex-start' : 'center',
                        padding: expanded ? '8px 10px' : '10px',
                        borderRadius: 8,
                        color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                        background: active ? 'var(--accent-dim)' : 'transparent',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: active ? 600 : 400,
                        transition: 'all var(--transition-fast)',
                        marginBottom: 2,
                        position: 'relative',
                      }}
                    >
                      <Icon size={16} style={{ flexShrink: 0 }} />
                      {expanded && item.label}
                      {active && (
                        <div style={{
                          position: 'absolute', left: 0, top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3, height: 16, background: 'var(--accent)',
                          borderRadius: '0 2px 2px 0',
                        }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User info + sign out */}
        <div style={{
          padding: '12px 8px',
          borderTop: '1px solid var(--border)',
        }}>
          {expanded && email && (
            <div style={{
              padding: '8px 10px',
              fontSize: 12,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: 4,
            }}>
              {isSuperAdmin && (
                <div style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--accent-bright)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2,
                }}>
                  Super Admin
                </div>
              )}
              {email}
            </div>
          )}
          <button
            onClick={signOut}
            title="Sign Out"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: expanded ? 10 : 0,
              justifyContent: expanded ? 'flex-start' : 'center',
              padding: expanded ? '8px 10px' : '10px',
              borderRadius: 8,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <LogOut size={16} />
            {expanded && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(8, 8, 16, 0.6)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
        }}>
          {/* breadcrumb / page title goes in each page */}
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Hellum IoT — Admin Console
          </span>
        </header>

        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
