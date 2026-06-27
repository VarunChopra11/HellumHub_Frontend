import { useEffect, useRef, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Key,
  Bluetooth,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Smartphone,
} from 'lucide-react';
import { useRequestBindingToken } from '@/hooks/consumer/useDevices';
import { usePollForNewDevice } from '@/hooks/consumer/useDevices';
import { useDeviceStore } from '@/stores/deviceStore';
import { ESPProvisioner, Security1 } from 'esp-ble-prov';

type Step = 'token' | 'ble' | 'wifi' | 'confirm';

const STEP_INFO: Record<Step, { title: string; subtitle: string; icon: React.ElementType }> = {
  token:   { title: 'Preparing Binding Token', subtitle: 'Generating a secure pairing code for your device', icon: Key },
  ble:     { title: 'Connect via Bluetooth',  subtitle: 'Scan for your device and enter the 9-character PIN', icon: Bluetooth },
  wifi:    { title: 'Wi-Fi Credentials',       subtitle: 'Your device will use these to connect to the internet', icon: Wifi },
  confirm: { title: 'Binding in Progress',     subtitle: 'Your device is connecting and registering with Hellum', icon: CheckCircle2 },
};

interface AddDeviceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDeviceWizard({ open, onOpenChange }: AddDeviceWizardProps) {
  const [step, setStep] = useState<Step>('token');
  const [bindingToken, setBindingToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [pin, setPin] = useState('');
  const [ssid, setSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [bleDevice, setBleDevice] = useState<BluetoothDevice | null>(null);
  const [provisioner, setProvisioner] = useState<ESPProvisioner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bleConnecting, setBleConnecting] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<'idle' | 'polling' | 'timeout'>('idle');

  const { mutate: fetchToken, isPending: tokenPending } = useRequestBindingToken();
  const pollForDevice = usePollForNewDevice();
  const currentDeviceCount = useDeviceStore((s) => s.devices.length);
  const currentCountRef = useRef(currentDeviceCount);
  currentCountRef.current = currentDeviceCount;

  // Countdown timer
  useEffect(() => {
    if (step !== 'token' && step !== 'ble' && step !== 'wifi') return;
    if (!tokenExpiresAt) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((tokenExpiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [tokenExpiresAt, step]);

  // Auto-fetch token when wizard opens
  useEffect(() => {
    if (!open) return;
    reset();
    getToken();
  }, [open]);

  function reset() {
    setStep('token');
    setBindingToken(null);
    setPin('');
    setSsid('');
    setWifiPassword('');
    setBleDevice(null);
    setProvisioner(null);
    setError(null);
    setBleConnecting(false);
    setSending(false);
    setSuccess(false);
    setPollingStatus('idle');
  }

  function getToken() {
    fetchToken(undefined, {
      onSuccess: (data) => {
        setBindingToken(data.binding_token);
        setTokenExpiresAt(Date.now() + data.expires_in * 1000);
        setTimeLeft(data.expires_in);
        setStep('ble');
      },
      onError: () => setError('Could not generate binding token. Please try again.'),
    });
  }

  // ─── Web Bluetooth ────────────────────────────────────────────────────────

  const isIosSafari =
    /iP(hone|ad|od)/.test(navigator.userAgent) &&
    /WebKit/.test(navigator.userAgent) &&
    !/CriOS/.test(navigator.userAgent);

  async function connectBLE() {
    if (!('bluetooth' in navigator)) {
      setError('Web Bluetooth is not supported in this browser. Please use Chrome on Android or Desktop.');
      return;
    }
    setError(null);
    setBleConnecting(true);
    try {
      const prov = new ESPProvisioner({
        serviceUUID: '0000ff01-0000-1000-8000-00805f9b34fb'
      });
      const device = await prov.connect({
        filters: [{ namePrefix: 'PROV_' }],
      });

      setProvisioner(prov);
      setBleDevice(device);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bluetooth connection failed';
      if (!msg.includes('User cancelled')) {
        setError(msg);
      }
    } finally {
      setBleConnecting(false);
    }
  }

  async function sendProvisioningPayload() {
    if (!provisioner || !bindingToken) return;
    setError(null);
    setSending(true);

    try {
      // 1. Establish Secure Curve25519 Session using the PIN
      provisioner.security = new Security1({ pop: pin });
      await provisioner.establishSession();

      // 2. Send the binding_token to the custom-data endpoint securely
      const encoder = new TextEncoder();
      await provisioner.writeValueToEndpoint('custom-data', encoder.encode(bindingToken));

      // 3. Send the Wi-Fi credentials via the secure config endpoint
      await provisioner.sendCredentials({ 
        ssid: encoder.encode(ssid.trim()), 
        passphrase: encoder.encode(wifiPassword)
      });
      setStep('confirm');
      startPolling();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send credentials to device');
    } finally {
      setSending(false);
    }
  }

  async function startPolling() {
    setPollingStatus('polling');
    const expectedCount = currentCountRef.current + 1;
    const found = await pollForDevice(expectedCount, 120_000);
    if (found) {
      setSuccess(true);
      setPollingStatus('idle');
    } else {
      setPollingStatus('timeout');
    }
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const stepInfo = STEP_INFO[step];
  const StepIcon = stepInfo.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        style={{ width: 420, maxWidth: '100vw', display: 'flex', flexDirection: 'column', gap: 0 }}
      >
        <SheetHeader style={{ paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {/* Progress steps */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {(['token', 'ble', 'wifi', 'confirm'] as Step[]).map((s, i) => (
              <div
                key={s}
                style={{
                  height: 3,
                  flex: 1,
                  borderRadius: 2,
                  background: (['token', 'ble', 'wifi', 'confirm'] as Step[]).indexOf(step) >= i
                    ? 'var(--consumer-gradient)'
                    : 'var(--border)',
                  transition: 'background var(--transition-normal)',
                }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--consumer-gradient-dim)',
              border: '1px solid var(--consumer-accent)33',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--consumer-accent)',
            }}>
              <StepIcon size={20} />
            </div>
            <div>
              <SheetTitle style={{ fontSize: 16, marginBottom: 2 }}>{stepInfo.title}</SheetTitle>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{stepInfo.subtitle}</p>
            </div>
          </div>
        </SheetHeader>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
          {/* ── Step: Generating token (loading) ── */}
          {step === 'token' && tokenPending && (
            <div style={{ textAlign: 'center', paddingTop: 40, color: 'var(--text-secondary)' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ margin: 0 }}>Generating binding token…</p>
            </div>
          )}

          {/* ── Step: BLE Connection ── */}
          {step === 'ble' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* iOS warning */}
              {isIosSafari && (
                <div style={{
                  padding: 16, borderRadius: 10,
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex', gap: 10,
                }}>
                  <AlertTriangle size={18} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: 'var(--warning)' }}>
                      iOS Safari Not Supported
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Web Bluetooth is not available on iOS Safari. Please use Chrome on an Android phone or desktop to add devices.
                    </p>
                  </div>
                </div>
              )}

              {/* Token expiry timer */}
              {bindingToken && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}>
                  <Clock size={14} style={{ color: timeLeft < 60 ? 'var(--error)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Token expires in</span>
                  <span style={{
                    fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
                    color: timeLeft < 60 ? 'var(--error)' : 'var(--text-primary)',
                    marginLeft: 'auto',
                  }}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {/* Instructions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { n: 1, text: 'Power on your Hellum device — the LED will blink blue' },
                  { n: 2, text: 'Click "Scan for Device" and select PROV_XXXXXX from the list' },
                  { n: 3, text: 'Enter the 9-character Connection PIN printed on the device label' },
                ].map(({ n, text }) => (
                  <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--accent-dim)', border: '1px solid var(--accent)44',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: 'var(--accent-bright)',
                    }}>
                      {n}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</p>
                  </div>
                ))}
              </div>

              {!bleDevice && (
                <Button
                  onClick={connectBLE}
                  disabled={bleConnecting || isIosSafari}
                  style={{ width: '100%' }}
                >
                  {bleConnecting
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />Connecting…</>
                    : <><Bluetooth size={16} style={{ marginRight: 8 }} />Scan for Device</>
                  }
                </Button>
              )}

              {bleDevice && (
                <>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)',
                  }}>
                    <Bluetooth size={14} style={{ color: 'var(--success)' }} />
                    <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>
                      Connected: {bleDevice.name}
                    </span>
                  </div>

                  <div>
                    <Label htmlFor="device-pin">Connection PIN (9 characters)</Label>
                    <Input
                      id="device-pin"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.toUpperCase().slice(0, 9))}
                      placeholder="e.g. HELLUM123"
                      maxLength={9}
                      style={{ marginTop: 8, fontFamily: 'monospace', letterSpacing: '0.15em', fontSize: 15 }}
                    />
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Found on the label on the back of your device
                    </p>
                  </div>

                  <Button
                    onClick={() => setStep('wifi')}
                    disabled={pin.length !== 9}
                    style={{ width: '100%' }}
                  >
                    Continue
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── Step: Wi-Fi credentials ── */}
          {step === 'wifi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)',
              }}>
                <Smartphone size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: 13, color: 'var(--success)' }}>
                  Device authenticated with PIN {pin}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Enter the Wi-Fi credentials for your home network. The device will use these to connect to the internet and register with Hellum.
              </p>

              <div>
                <Label htmlFor="wifi-ssid">Network Name (SSID)</Label>
                <Input
                  id="wifi-ssid"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="e.g. MyHomeNetwork"
                  style={{ marginTop: 8 }}
                />
              </div>

              <div>
                <Label htmlFor="wifi-pass">Password</Label>
                <Input
                  id="wifi-pass"
                  type="password"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="Wi-Fi password"
                  style={{ marginTop: 8 }}
                />
              </div>

              <div style={{
                padding: 12, borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
              }}>
                🔒 Your password is sent directly to the device over Bluetooth and is never stored on our servers.
              </div>

              <Button
                onClick={sendProvisioningPayload}
                disabled={!ssid.trim() || sending}
                style={{ width: '100%' }}
              >
                {sending
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />Sending…</>
                  : <><Wifi size={16} style={{ marginRight: 8 }} />Provision Device</>
                }
              </Button>
            </div>
          )}

          {/* ── Step: Confirmation / polling ── */}
          {step === 'confirm' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, paddingTop: 20, textAlign: 'center' }}>
              {success ? (
                <>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: '2px solid var(--success)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 32px rgba(34, 197, 94, 0.3)',
                  }}>
                    <CheckCircle2 size={36} style={{ color: 'var(--success)' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Device Added!</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                      Your device has been successfully registered and is now visible in your dashboard.
                    </p>
                  </div>
                  <Button onClick={() => onOpenChange(false)} style={{ width: 200 }}>
                    Go to Dashboard
                  </Button>
                </>
              ) : pollingStatus === 'timeout' ? (
                <>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '2px solid var(--warning)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <AlertTriangle size={36} style={{ color: 'var(--warning)' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Timed Out</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                      The device didn't appear within 2 minutes. Check that the Wi-Fi credentials were correct and try again.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => { reset(); getToken(); }}>Try Again</Button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'var(--consumer-gradient-dim)',
                    border: '2px solid var(--consumer-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'pulse-on 2s ease-in-out infinite',
                  }}>
                    <Loader2 size={36} style={{ color: 'var(--consumer-accent)', animation: 'spin 1.5s linear infinite' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700 }}>Waiting for Device</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                      Your device is connecting to Wi-Fi and registering with Hellum.
                      This can take up to 30 seconds.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div style={{
              marginTop: 16, padding: 12, borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <AlertTriangle size={14} style={{ color: 'var(--error)', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 13, color: 'var(--error)' }}>{error}</span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
