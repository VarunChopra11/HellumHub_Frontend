import { useState } from 'react';
import { Plus, RefreshCw, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeviceCard } from '@/components/consumer/device-card';
import { RenameDialog } from '@/components/consumer/rename-dialog';
import { AddDeviceWizard } from '@/components/consumer/add-device-wizard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useDevices, useDeleteDevice } from '@/hooks/consumer/useDevices';
import { useDeviceStore } from '@/stores/deviceStore';
import { useAuthStore } from '@/stores/authStore';
import type { SmartHomeDeviceResponse } from '@/types/models';

export function ConsumerDashboardPage() {
  const { user } = useAuthStore();
  const devices = useDeviceStore((s) => s.devices);
  const { isLoading, refetch, isFetching } = useDevices();
  const { mutate: deleteDevice, isPending: isDeleting } = useDeleteDevice();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [renameDevice, setRenameDevice] = useState<SmartHomeDeviceResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SmartHomeDeviceResponse | null>(null);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div style={{ padding: '32px 32px 60px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>
            {greeting()},&nbsp;
            <span className="consumer-gradient-text">{firstName}</span>
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--text-muted)' }}>
            {devices.length === 0
              ? 'Add your first device to get started'
              : `${devices.length} device${devices.length !== 1 ? 's' : ''} · ${devices.reduce((a, d) => a + d.endpoints.filter((e) => e.state).length, 0)} endpoints active`
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh devices"
            style={{ padding: '6px 10px' }}
          >
            <RefreshCw size={15} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          </Button>
          <Button onClick={() => setWizardOpen(true)}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Add Device
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && devices.length === 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20,
        }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shimmer"
              style={{ height: 200, borderRadius: 'var(--radius-card)' }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && devices.length === 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
          gap: 20,
          textAlign: 'center',
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--consumer-gradient-dim)',
            border: '2px solid var(--consumer-accent)33',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={32} style={{ color: 'var(--consumer-accent)' }} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>No devices yet</h2>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--text-muted)', maxWidth: 400 }}>
              Add your first Hellum smart device by clicking the button below.
              Have your device's Factory PIN ready.
            </p>
          </div>
          <Button onClick={() => setWizardOpen(true)} style={{ marginTop: 8 }}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Add Your First Device
          </Button>
        </div>
      )}

      {/* Device grid */}
      {devices.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20,
        }}>
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onRename={setRenameDevice}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Add Device Wizard */}
      <AddDeviceWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* Rename Dialog */}
      <RenameDialog
        device={renameDevice}
        open={Boolean(renameDevice)}
        onOpenChange={(open) => { if (!open) setRenameDevice(null); }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--error)' }}>
              Remove Device
            </DialogTitle>
          </DialogHeader>

          <div style={{ padding: '8px 0' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to remove{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget?.name}</strong>?
              This will unbind the device from your account. You will need to re-provision it to use it again.
            </p>

            <div style={{
              marginTop: 16, padding: 12, borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: 13, color: 'var(--error)',
            }}>
              ⚠️ This action cannot be undone.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (!deleteTarget) return;
                deleteDevice(deleteTarget.mac, {
                  onSuccess: () => setDeleteTarget(null),
                });
              }}
            >
              {isDeleting ? 'Removing…' : 'Remove Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
