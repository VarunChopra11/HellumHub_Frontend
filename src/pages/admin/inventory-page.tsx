import { useState } from 'react';
import { Trash2, Cpu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNowStrict } from 'date-fns';
import { useInventory, useAdminDeleteDevice } from '@/hooks/admin/useInventory';
import type { SmartHomeDeviceResponse } from '@/types/models';

export function InventoryPage() {
  const { data: devices = [], isLoading } = useInventory();
  const { mutate: deleteDevice, isPending: isDeleting } = useAdminDeleteDevice();

  const [deleteTarget, setDeleteTarget] = useState<SmartHomeDeviceResponse | null>(null);
  const [search, setSearch] = useState('');

  const filtered = devices.filter((d) => {
    const q = search.toLowerCase();
    return !q || d.mac.includes(q) || d.name.toLowerCase().includes(q) || d.device_model.includes(q);
  });

  return (
    <div style={{ padding: '32px 32px 60px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Device Inventory</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            All provisioned Smart Home devices across all consumer accounts
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{
            padding: '8px 16px', borderRadius: 8,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            fontSize: 13,
          }}>
            <span style={{ color: 'var(--text-muted)' }}>Total devices: </span>
            <span style={{ fontWeight: 700 }}>{devices.length}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 320, marginBottom: 20 }}>
        <Search size={14} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search MAC, name, model…"
          style={{ paddingLeft: 34, fontSize: 13 }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Endpoints</TableHead>
              <TableHead>Owner ID</TableHead>
              <TableHead>Provisioned</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                      <TableCell key={c}><Skeleton style={{ height: 14, width: '75%' }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filtered.map((device) => (
                  <TableRow key={device.id} style={{ transition: 'background var(--transition-fast)' }}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'var(--accent-dim)', border: '1px solid var(--accent)33',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--accent-bright)', flexShrink: 0,
                        }}>
                          <Cpu size={14} />
                        </div>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{device.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {device.mac.toUpperCase().match(/.{2}/g)?.join(':') || device.mac}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" style={{ fontSize: 11, background: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        {device.device_model}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {device.endpoints.map((ep) => (
                          <Badge
                            key={ep.id}
                            variant="default"
                            style={{
                              fontSize: 10,
                              background: ep.state ? 'rgba(34, 197, 94, 0.12)' : 'var(--accent-dim)',
                              color: ep.state ? 'var(--success)' : 'var(--accent-bright)',
                              border: `1px solid ${ep.state ? 'rgba(34, 197, 94, 0.3)' : 'var(--accent)33'}`,
                            }}
                          >
                            {ep.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {device.user_id.slice(-8)}…
                      </code>
                    </TableCell>
                    <TableCell style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDistanceToNowStrict(new Date(device.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(device)}
                        style={{ color: 'var(--error)', padding: '4px 8px' }}
                        title="Force delete device"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
            }
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                  {search ? `No devices matching "${search}"` : 'No provisioned devices found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--error)' }}>⚠️ Force Delete Device</DialogTitle>
          </DialogHeader>
          <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Permanently delete <strong>{deleteTarget?.name}</strong> (
              <code style={{ fontFamily: 'monospace', fontSize: 13 }}>{deleteTarget?.mac}</code>)?
            </p>
            <div style={{
              padding: 12, borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: 13, color: 'var(--error)', lineHeight: 1.5,
            }}>
              This is an admin override — it bypasses ownership checks and removes the device from the consumer's account immediately.
              The physical device will need to be re-provisioned.
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (!deleteTarget) return;
                deleteDevice(deleteTarget.mac, { onSuccess: () => setDeleteTarget(null) });
              }}
            >
              {isDeleting ? 'Deleting…' : 'Force Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
