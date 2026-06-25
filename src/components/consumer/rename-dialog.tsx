import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRenameDevice } from '@/hooks/consumer/useDevices';
import type { SmartHomeDeviceResponse } from '@/types/models';

interface RenameDialogProps {
  device: SmartHomeDeviceResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameDialog({ device, open, onOpenChange }: RenameDialogProps) {
  const [name, setName] = useState(device?.name ?? '');
  const { mutate: rename, isPending } = useRenameDevice();

  function handleSave() {
    if (!device || !name.trim()) return;
    rename(
      { mac: device.mac, name: name.trim() },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  // Reset name when dialog opens
  function handleOpenChange(newOpen: boolean) {
    if (newOpen && device) setName(device.name);
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Device</DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
          <div>
            <Label htmlFor="device-name">Device Name</Label>
            <Input
              id="device-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Living Room Lights"
              maxLength={128}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              style={{ marginTop: 8 }}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
              {name.length}/128 characters
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim() || name.trim() === device?.name}
          >
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
