import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Wifi, Zap, Shield } from 'lucide-react';
import { useGoogleSignIn } from '@/hooks/consumer/useAuth';
import { useAuthStore } from '@/stores/authStore';

const FEATURES = [
  { icon: Zap,     title: 'Instant Control',    desc: 'Toggle your switches from anywhere in the world' },
  { icon: Wifi,    title: 'Real-Time Sync',      desc: 'Physical switches update instantly via MQTT' },
  { icon: Shield,  title: 'Google Secured',      desc: 'Sign in with your Google account — no passwords' },
];

export function ConsumerLoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { mutate: signIn, isPending, isError } = useGoogleSignIn();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate('/app/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) return;
    signIn(response.credential, {
      onSuccess: () => navigate('/app/dashboard', { replace: true }),
    });
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background orbs */}
      <div className="bg-orb bg-orb-purple" />
      <div className="bg-orb bg-orb-cyan" />

      {/* Left panel — branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 80px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 60 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'var(--consumer-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-consumer)',
          }}>
            <Wifi size={24} color="white" />
          </div>
          <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
            <span className="consumer-gradient-text">hellum</span>
          </span>
        </div>

        <h1 style={{
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          margin: '0 0 16px',
          maxWidth: 480,
        }}>
          Your home,
          <br />
          <span className="consumer-gradient-text">intelligently</span>
          <br />
          connected.
        </h1>

        <p style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 60px',
          maxWidth: 400,
        }}>
          Control every switch in your home from one beautiful dashboard. Real-time updates as things happen.
        </p>

        {/* Feature chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'var(--consumer-accent-dim)',
                border: '1px solid var(--consumer-accent)33',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--consumer-accent)',
              }}>
                <Icon size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — sign-in card */}
      <div style={{
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 380,
        }}>
          {/* Glass card */}
          <div className="glass-card" style={{ padding: 40 }}>
            <h2 style={{
              margin: '0 0 8px',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}>
              Welcome back
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: 14, color: 'var(--text-muted)' }}>
              Sign in to manage your smart home
            </p>

            {isPending ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 12, padding: 20, color: 'var(--text-secondary)',
              }}>
                <div style={{
                  width: 20, height: 20, border: '2px solid var(--accent)',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Signing you in…
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {}}
                  theme="filled_black"
                  size="large"
                  shape="rectangular"
                  width="300"
                  text="continue_with"
                />
              </div>
            )}

            {isError && (
              <div style={{
                marginTop: 16, padding: 12, borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: 13, color: 'var(--error)', textAlign: 'center',
              }}>
                Sign-in failed. Please try again.
              </div>
            )}

            <p style={{
              margin: '24px 0 0',
              fontSize: 12,
              color: 'var(--text-muted)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              By signing in, you agree to Hellum's Terms of Service and Privacy Policy.
            </p>
          </div>

          {/* Admin link */}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Are you staff?{' '}
            <a href="/admin/login" style={{ color: 'var(--accent-bright)', textDecoration: 'none' }}>
              Admin Console →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
