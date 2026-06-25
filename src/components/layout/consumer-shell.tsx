import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  LogOut,
  Settings,
  Wifi,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { mqttClient } from '@/lib/mqtt';
import { useEffect } from 'react';

const NAV_ITEMS = [
  { path: '/app/dashboard', label: 'Home', icon: Home },
];

export function ConsumerShell() {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Connect MQTT when the consumer shell mounts
  useEffect(() => {
    mqttClient.connect();
    return () => mqttClient.disconnect();
  }, []);

  function signOut() {
    mqttClient.disconnect();
    clearAuth();
    qc.clear();
    navigate('/app/login');
  }

  const initials = user?.display_name
    ? user.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Ambient background orbs */}
      <div className="bg-orb bg-orb-purple" />
      <div className="bg-orb bg-orb-cyan" />

      {/* Top Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '64px',
        background: 'rgba(8, 8, 16, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--consumer-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Wifi size={16} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>
            <span className="consumer-gradient-text">hellum</span>
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: '4px' }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? 'var(--consumer-accent)' : 'var(--text-secondary)',
                  background: active ? 'var(--consumer-accent-dim)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 4px',
              borderRadius: 999,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: 14,
              transition: 'all var(--transition-fast)',
            }}>
              {/* Avatar circle */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--consumer-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.display_name || user?.email || 'Account'}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" style={{ minWidth: 180 }}>
            <DropdownMenuItem disabled style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/app/settings" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={14} /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={signOut}
              style={{ color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <LogOut size={14} /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Page Content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
      }}>
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
