import { useState } from 'react';
import {
  Lightbulb, Fan, Plug, ToggleRight, Zap, Wifi, WifiOff,
  MoreHorizontal, Pencil, Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import type { SmartHomeDeviceResponse, EndpointResponse } from '@/types/models';
import { useToggleEndpoint } from '@/hooks/consumer/useDevices';

// ─── Google Home type → Lucide icon mapping ───────────────────────────────────

function EndpointIcon({ googleType, size = 18 }: { googleType: string; size?: number }) {
  const type = googleType.toLowerCase();
  if (type.includes('light')) return <Lightbulb size={size} />;
  if (type.includes('fan')) return <Fan size={size} />;
  if (type.includes('outlet') || type.includes('plug')) return <Plug size={size} />;
  if (type.includes('switch')) return <ToggleRight size={size} />;
  return <Zap size={size} />;
}

// ─── Endpoint toggle row ───────────────────────────────────────────────────────

function EndpointRow({
  endpoint,
  mac,
  disabled,
}: {
  endpoint: EndpointResponse;
  mac: string;
  disabled?: boolean;
}) {
  const { mutate: toggle, isPending } = useToggleEndpoint();

  function handleToggle(checked: boolean) {
    toggle({ mac, endpointId: endpoint.id, on: checked });
  }

  return (
    <div
      className={endpoint.state ? 'endpoint-on' : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* State indicator dot */}
        <div
          className="state-dot"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: endpoint.state ? 'var(--state-on)' : 'var(--state-off)',
            boxShadow: endpoint.state ? '0 0 6px var(--state-on)' : 'none',
            transition: 'all var(--transition-fast)',
            flexShrink: 0,
          }}
        />
        <div style={{
          color: endpoint.state ? 'var(--text-primary)' : 'var(--text-secondary)',
          transition: 'color var(--transition-fast)',
        }}>
          <EndpointIcon googleType={endpoint.google_type} size={15} />
        </div>
        <span style={{
          fontSize: 14,
          fontWeight: 500,
          color: endpoint.state ? 'var(--text-primary)' : 'var(--text-secondary)',
          transition: 'color var(--transition-fast)',
        }}>
          {endpoint.name}
        </span>
      </div>

      <Switch
        checked={endpoint.state}
        onCheckedChange={handleToggle}
        disabled={disabled || isPending}
        aria-label={`Toggle ${endpoint.name}`}
      />
    </div>
  );
}

// ─── Device Card ──────────────────────────────────────────────────────────────

interface DeviceCardProps {
  device: SmartHomeDeviceResponse;
  onRename?: (device: SmartHomeDeviceResponse) => void;
  onDelete?: (device: SmartHomeDeviceResponse) => void;
}

export function DeviceCard({ device, onRename, onDelete }: DeviceCardProps) {
  const hasEndpoints = device.endpoints.length > 0;
  const anyOn = device.endpoints.some((ep) => ep.state);

  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${anyOn ? 'rgba(124, 58, 237, 0.3)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-card)',
        padding: '20px',
        boxShadow: anyOn ? 'var(--shadow-accent)' : 'var(--shadow-card)',
        transition: 'all var(--transition-normal)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow when any endpoint is ON */}
      {anyOn && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 2,
          background: 'var(--consumer-gradient)',
          borderRadius: '12px 12px 0 0',
        }} />
      )}

      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Device icon with state glow */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: anyOn ? 'var(--consumer-gradient-dim)' : 'var(--accent-dim)',
            border: `1px solid ${anyOn ? 'var(--consumer-accent)' : 'var(--accent)'}22`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-normal)',
            flexShrink: 0,
          }}>
            {hasEndpoints
              ? <EndpointIcon googleType={device.endpoints[0].google_type} size={20} />
              : <Wifi size={20} />
            }
          </div>

          <div>
            <h3 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.2,
            }}>
              {device.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <WifiOff size={11} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {device.device_model}
              </span>
              <span style={{ color: 'var(--border)', fontSize: 11 }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {device.mac.toUpperCase().match(/.{2}/g)?.join(':') || device.mac}
              </span>
            </div>
          </div>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              padding: 6, borderRadius: 6,
              display: 'flex', alignItems: 'center',
              transition: 'all var(--transition-fast)',
            }}>
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRename?.(device)}>
              <Pencil size={13} style={{ marginRight: 8 }} /> Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(device)}
              style={{ color: 'var(--error)' }}
            >
              <Trash2 size={13} style={{ marginRight: 8 }} /> Remove Device
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Endpoints */}
      {hasEndpoints ? (
        <div>
          {device.endpoints.map((ep, i) => (
            <EndpointRow
              key={ep.id}
              endpoint={ep}
              mac={device.mac}
            />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '16px 0',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}>
          No endpoints configured
        </div>
      )}

      {/* Endpoint count footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {device.endpoints.filter((e) => e.state).length}/{device.endpoints.length} active
        </span>
      </div>
    </div>
  );
}
