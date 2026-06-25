import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNowStrict } from 'date-fns';
import {
  useDeviceModels,
  useCreateDeviceModel,
  useUpdateDeviceModel,
  useDeleteDeviceModel,
} from '@/hooks/admin/useDeviceModels';
import type { DeviceModelCreate, DeviceModelResponse, EndpointDefinition } from '@/types/models';

const GOOGLE_TYPES = [
  'action.devices.types.LIGHT',
  'action.devices.types.SWITCH',
  'action.devices.types.OUTLET',
  'action.devices.types.FAN',
  'action.devices.types.THERMOSTAT',
  'action.devices.types.SCENE',
];

const EMPTY_ENDPOINT: EndpointDefinition = { id: '', name: '', google_type: GOOGLE_TYPES[1] };

function EndpointEditor({
  endpoints,
  onChange,
}: {
  endpoints: EndpointDefinition[];
  onChange: (eps: EndpointDefinition[]) => void;
}) {
  function updateEp(i: number, partial: Partial<EndpointDefinition>) {
    const next = endpoints.map((ep, idx) => (idx === i ? { ...ep, ...partial } : ep));
    onChange(next);
  }

  function removeEp(i: number) {
    onChange(endpoints.filter((_, idx) => idx !== i));
  }

  function addEp() {
    onChange([...endpoints, { ...EMPTY_ENDPOINT }]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {endpoints.map((ep, i) => (
        <div
          key={i}
          style={{
            padding: 12, borderRadius: 8,
            background: 'var(--bg-page)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Endpoint {i + 1}
            </span>
            <button
              onClick={() => removeEp(i)}
              disabled={endpoints.length === 1}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
            >
              <X size={14} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label style={{ fontSize: 11 }}>ID (MQTT key)</Label>
              <Input
                value={ep.id}
                onChange={(e) => updateEp(i, { id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="light1"
                style={{ marginTop: 4, fontSize: 12, fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <Label style={{ fontSize: 11 }}>Display Name</Label>
              <Input
                value={ep.name}
                onChange={(e) => updateEp(i, { name: e.target.value })}
                placeholder="Light 1"
                style={{ marginTop: 4, fontSize: 12 }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label style={{ fontSize: 11 }}>Google Home Type</Label>
              <select
                value={ep.google_type}
                onChange={(e) => updateEp(i, { google_type: e.target.value })}
                style={{
                  display: 'block', width: '100%', marginTop: 4,
                  padding: '6px 10px', borderRadius: 6, fontSize: 11,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', cursor: 'pointer',
                }}
              >
                {GOOGLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('action.devices.types.', '')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={addEp} style={{ border: '1px dashed var(--border)', width: '100%' }}>
        <Plus size={13} style={{ marginRight: 6 }} /> Add Endpoint
      </Button>
    </div>
  );
}

function ModelForm({
  initial,
  onSubmit,
  isPending,
}: {
  initial?: DeviceModelResponse | null;
  onSubmit: (data: DeviceModelCreate) => void;
  isPending: boolean;
}) {
  const [modelId, setModelId] = useState(initial?.model_id ?? '');
  const [displayName, setDisplayName] = useState(initial?.display_name ?? '');
  const [manufacturer, setManufacturer] = useState(initial?.manufacturer ?? 'Hellum');
  const [hwVersion, setHwVersion] = useState(initial?.hw_version ?? '1.0');
  const [endpoints, setEndpoints] = useState<EndpointDefinition[]>(
    initial?.endpoints ?? [{ ...EMPTY_ENDPOINT }],
  );

  function handleSubmit() {
    onSubmit({ model_id: modelId, display_name: displayName, manufacturer, hw_version: hwVersion, endpoints });
  }

  const isValid = modelId.trim() && displayName.trim() && endpoints.every((e) => e.id && e.name);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
      <div>
        <Label htmlFor="model-id">Model ID (slug)</Label>
        <Input
          id="model-id"
          value={modelId}
          onChange={(e) => setModelId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="4-switch-board"
          readOnly={Boolean(initial)}
          style={{ marginTop: 8, fontFamily: 'monospace' }}
        />
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
          URL-safe slug: lowercase letters, numbers, and hyphens only
        </p>
      </div>
      <div>
        <Label>Display Name</Label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="4-Switch Board" style={{ marginTop: 8 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <Label>Manufacturer</Label>
          <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} style={{ marginTop: 8 }} />
        </div>
        <div>
          <Label>HW Version</Label>
          <Input value={hwVersion} onChange={(e) => setHwVersion(e.target.value)} placeholder="1.0" style={{ marginTop: 8 }} />
        </div>
      </div>
      <div>
        <Label style={{ display: 'block', marginBottom: 8 }}>Endpoints</Label>
        <EndpointEditor endpoints={endpoints} onChange={setEndpoints} />
      </div>
      <Button onClick={handleSubmit} disabled={isPending || !isValid} style={{ width: '100%' }}>
        {isPending ? 'Saving…' : initial ? 'Update Model' : 'Create Model'}
      </Button>
    </div>
  );
}

export function DeviceModelsPage() {
  const { data: models = [], isLoading } = useDeviceModels();
  const { mutate: createModel, isPending: isCreating } = useCreateDeviceModel();
  const { mutate: updateModel, isPending: isUpdating } = useUpdateDeviceModel();
  const { mutate: deleteModel } = useDeleteDeviceModel();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DeviceModelResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeviceModelResponse | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div style={{ padding: '32px 32px 60px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Device Models</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Define hardware models and their dynamic endpoint schemas
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={15} style={{ marginRight: 6 }} /> New Model
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} style={{ height: 120, borderRadius: 12 }} />)}
        </div>
      )}

      {/* Model cards */}
      {!isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {models.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <Package size={40} style={{ margin: '0 auto 16px' }} />
              <p style={{ margin: 0, fontSize: 15 }}>No device models yet. Create one to start provisioning devices.</p>
            </div>
          )}
          {models.map((model) => {
            const expanded = expandedId === model.id;
            return (
              <div
                key={model.id}
                style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-card)', overflow: 'hidden',
                  transition: 'border-color var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', cursor: 'pointer',
                  }}
                  onClick={() => setExpandedId(expanded ? null : model.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'var(--accent-dim)', border: '1px solid var(--accent)33',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent-bright)', flexShrink: 0,
                    }}>
                      <Package size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{model.display_name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                        <code style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-page)', padding: '1px 6px', borderRadius: 4 }}>
                          {model.model_id}
                        </code>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{model.manufacturer}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>v{model.hw_version}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>·</span>
                        <Badge variant="default" style={{ fontSize: 10, background: 'var(--accent-dim)', color: 'var(--accent-bright)', border: '1px solid var(--accent)33' }}>
                          {model.endpoints.length} endpoint{model.endpoints.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Button
                      variant="ghost" size="sm"
                      onClick={(e) => { e.stopPropagation(); setEditTarget(model); }}
                      style={{ padding: '4px 8px' }}
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(model); }}
                      style={{ padding: '4px 8px', color: 'var(--error)' }}
                    >
                      <Trash2 size={13} />
                    </Button>
                    {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>

                {expanded && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, paddingTop: 16 }}>
                      {model.endpoints.map((ep) => (
                        <div key={ep.id} style={{
                          padding: '10px 14px', borderRadius: 8,
                          background: 'var(--bg-page)', border: '1px solid var(--border)',
                        }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{ep.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{ep.id}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                            {ep.google_type.replace('action.devices.types.', '')}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                      Created {formatDistanceToNowStrict(new Date(model.created_at), { addSuffix: true })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right" style={{ width: 460, overflowY: 'auto' }}>
          <SheetHeader style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <SheetTitle>New Device Model</SheetTitle>
          </SheetHeader>
          <div style={{ paddingTop: 20 }}>
            <ModelForm
              onSubmit={(data) => createModel(data, { onSuccess: () => setCreateOpen(false) })}
              isPending={isCreating}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={Boolean(editTarget)} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <SheetContent side="right" style={{ width: 460, overflowY: 'auto' }}>
          <SheetHeader style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <SheetTitle>Edit Model</SheetTitle>
          </SheetHeader>
          <div style={{ paddingTop: 20 }}>
            {editTarget && (
              <ModelForm
                initial={editTarget}
                onSubmit={(data) => updateModel(
                  { modelId: editTarget.model_id, payload: { display_name: data.display_name, manufacturer: data.manufacturer, hw_version: data.hw_version, endpoints: data.endpoints } },
                  { onSuccess: () => setEditTarget(null) },
                )}
                isPending={isUpdating}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--error)' }}>Delete Device Model</DialogTitle>
          </DialogHeader>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0' }}>
            Delete <strong>{deleteTarget?.display_name}</strong>?
            Existing provisioned devices using this model retain their endpoint definitions — only the catalog entry is removed.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return;
                deleteModel(deleteTarget.model_id, { onSuccess: () => setDeleteTarget(null) });
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
