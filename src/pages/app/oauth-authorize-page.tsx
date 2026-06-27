import { useSearchParams } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Wifi, Zap, Shield } from 'lucide-react';

const FEATURES = [
  { icon: Zap,     title: 'Instant Control',    desc: 'Toggle your switches from anywhere in the world' },
  { icon: Wifi,    title: 'Real-Time Sync',      desc: 'Physical switches update instantly via MQTT' },
  { icon: Shield,  title: 'Google Secured',      desc: 'Sign in with your Google account — no passwords' },
];

export function OAuthAuthorizePage() {
  const [searchParams] = useSearchParams();

  function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) return;

    // Google Home OAuth standard query parameters
    const clientId = searchParams.get('client_id');
    const redirectUri = searchParams.get('redirect_uri');
    const state = searchParams.get('state');
    const responseType = searchParams.get('response_type');

    if (!clientId || !redirectUri || !state || !responseType) {
      console.error('Missing required OAuth parameters');
      return;
    }

    // Construct the backend URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL as string;
    const url = new URL(`${baseUrl}/oauth/authorize`);
    
    // Pass the standard OAuth params PLUS the new google_id_token
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('response_type', responseType);
    url.searchParams.set('google_id_token', response.credential);

    // Redirect the browser window to the backend which will issue the code and redirect to Google Home
    window.location.href = url.toString();
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
          Link to
          <br />
          <span className="consumer-gradient-text">Google Home</span>
        </h1>

        <p style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: '0 0 60px',
          maxWidth: 400,
        }}>
          Sign in to securely link your Hellum smart devices with Google Assistant.
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
              Link Account
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: 14, color: 'var(--text-muted)' }}>
              Sign in to authorize Google Home
            </p>

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

            <p style={{
              margin: '24px 0 0',
              fontSize: 12,
              color: 'var(--text-muted)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              By signing in, you agree to securely link your Hellum account to Google Home.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
