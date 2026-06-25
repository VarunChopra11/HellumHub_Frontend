import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Settings, ShieldCheck, Server } from 'lucide-react';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { listAdmins } from '@/api/admin/roles';
import { adminApi } from '@/lib/axios';
import { toast } from 'sonner';

const ADMIN_FEATURES = [
  { icon: Server,      label: 'OTA Firmware',    desc: 'Manage releases, rollouts, and device overrides' },
  { icon: ShieldCheck, label: 'RBAC Controls',   desc: 'Grant and revoke Google-email-based admin access' },
  { icon: Settings,    label: 'Device Catalog',  desc: 'Define hardware models and endpoint schemas' },
];

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { googleIdToken, setAdminAuth } = useAdminAuthStore();

  // Already authenticated — redirect to admin home
  useEffect(() => {
    if (googleIdToken) navigate('/admin/inventory', { replace: true });
  }, [googleIdToken, navigate]);

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) return;

    const token = response.credential;

    // Decode email from the JWT payload (middle segment, base64)
    let email = '';
    let displayName: string | null = null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      email = payload.email ?? '';
      displayName = payload.name ?? null;
    } catch {
      toast.error('Could not read Google token. Please try again.');
      return;
    }

    // Temporarily set the token to make the adminApi request
    // Store it and then check /admin/roles to determine super admin status
    useAdminAuthStore.getState().setAdminAuth({
      googleIdToken: token,
      email,
      displayName,
      isSuperAdmin: false, // will be updated below
    });

    try {
      // Try GET /admin/roles — only super admins can call it
      await listAdmins();
      // If 200, user is super admin
      setAdminAuth({ googleIdToken: token, email, displayName, isSuperAdmin: true });
      navigate('/admin/inventory', { replace: true });
    } catch (err: unknown) {
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status === 403) {
        // Regular admin — authorized but not super admin
        setAdminAuth({ googleIdToken: token, email, displayName, isSuperAdmin: false });
        navigate('/admin/inventory', { replace: true });
      } else if (status === 401) {
        useAdminAuthStore.getState().clearAdminAuth();
        toast.error('Your Google account is not authorized for admin access.');
      } else {
        useAdminAuthStore.getState().clearAdminAuth();
        toast.error('Authentication failed. Please try again.');
      }
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-page)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle background gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%',
        maxWidth: 900,
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 60,
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Left — features */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent) 0%, #5b21b6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-accent)',
            }}>
              <Settings size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>
                <span className="accent-gradient-text">Hellum</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> Admin</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Internal Console
              </div>
            </div>
          </div>

          <h1 style={{
            fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em',
            lineHeight: 1.1, margin: '0 0 16px',
          }}>
            Manage your IoT
            <br />
            <span className="accent-gradient-text">infrastructure</span>
          </h1>

          <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 40px' }}>
            Staff portal for OTA firmware, smart home device management, and access control.
            Authentication is restricted to authorized Google accounts only.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {ADMIN_FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'var(--accent-dim)', border: '1px solid var(--accent)33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-bright)',
                }}>
                  <Icon size={14} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — sign-in card */}
        <div className="glass-card" style={{ padding: 40 }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Staff Sign In</h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
              Only authorized Google accounts can access this console.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google Sign-In failed. Please try again.')}
              theme="filled_black"
              size="large"
              shape="rectangular"
              width="280"
              text="signin_with"
            />
          </div>

          <div style={{
            padding: 12, borderRadius: 8,
            background: 'rgba(124, 58, 237, 0.08)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
          }}>
            🔒 Access is controlled via Google account email. Contact your Super Admin if you need access.
          </div>
        </div>
      </div>
    </div>
  );
}
