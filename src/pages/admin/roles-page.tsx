import { useState } from 'react';
import { Plus, Trash2, ShieldCheck, UserCheck, Crown } from 'lucide-react';
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
import { useAdminRoles, useGrantAdmin, useRevokeAdmin } from '@/hooks/admin/useAdminRoles';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import type { AdminRoleResponse } from '@/types/models';

export function AdminRolesPage() {
  const { isSuperAdmin, email: currentEmail } = useAdminAuthStore();
  const { data: roles = [], isLoading } = useAdminRoles();
  const { mutate: grantAdmin, isPending: isGranting } = useGrantAdmin();
  const { mutate: revokeAdmin, isPending: isRevoking } = useRevokeAdmin();

  const [grantSheetOpen, setGrantSheetOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<AdminRoleResponse | null>(null);

  function handleGrant() {
    if (!newEmail.trim()) return;
    grantAdmin(newEmail.trim(), {
      onSuccess: () => { setGrantSheetOpen(false); setNewEmail(''); },
    });
  }

  // Show 403 message for non-super admins
  if (!isSuperAdmin) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{
          maxWidth: 480,
          padding: 32,
          borderRadius: 'var(--radius-card)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          textAlign: 'center',
        }}>
          <ShieldCheck size={40} style={{ color: 'var(--accent-bright)', margin: '0 auto 16px' }} />
          <h2 style={{ margin: '0 0 8px' }}>Super Admin Required</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
            Only the Super Admin can manage admin roles. Contact your administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 32px 60px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 16,
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Admin Roles
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>
            Manage Google-email-based admin access to this console
          </p>
        </div>
        <Button onClick={() => setGrantSheetOpen(true)}>
          <Plus size={15} style={{ marginRight: 6 }} /> Grant Access
        </Button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        {[
          { icon: Crown,     label: 'Super Admins', value: roles.filter((r) => r.role === 'super_admin').length, color: 'var(--accent-bright)' },
          { icon: UserCheck, label: 'Admins',       value: roles.filter((r) => r.role === 'admin').length, color: 'var(--consumer-accent)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div
            key={label}
            style={{
              padding: 20, borderRadius: 'var(--radius-card)',
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 14,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color,
            }}>
              <Icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
            </div>
          </div>
        ))}
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
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Granted By</TableHead>
              <TableHead>Added</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5].map((c) => (
                      <TableCell key={c}><Skeleton style={{ height: 16, width: '80%' }} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell style={{ fontFamily: 'monospace', fontSize: 13 }}>{role.email}</TableCell>
                    <TableCell>
                      {role.role === 'super_admin' ? (
                        <Badge variant="default" style={{ background: 'var(--accent-dim)', color: 'var(--accent-bright)', border: '1px solid var(--accent)44' }}>
                          <Crown size={10} style={{ marginRight: 4 }} /> Super Admin
                        </Badge>
                      ) : (
                        <Badge variant="default" style={{ background: 'var(--consumer-accent-dim)', color: 'var(--consumer-accent)', border: '1px solid var(--consumer-accent)44' }}>
                          Admin
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {role.granted_by}
                    </TableCell>
                    <TableCell style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {formatDistanceToNowStrict(new Date(role.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {role.email !== currentEmail && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(role)}
                          style={{ color: 'var(--error)', padding: '4px 8px' }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            }
            {!isLoading && roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
                  No admin accounts yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Grant Sheet */}
      <Sheet open={grantSheetOpen} onOpenChange={setGrantSheetOpen}>
        <SheetContent side="right" style={{ width: 380 }}>
          <SheetHeader>
            <SheetTitle>Grant Admin Access</SheetTitle>
          </SheetHeader>
          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Enter the Google account email of the team member you want to grant admin access to.
              They will be able to log in with their Google account immediately.
            </p>
            <div>
              <Label htmlFor="grant-email">Google Email Address</Label>
              <Input
                id="grant-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="colleague@company.com"
                onKeyDown={(e) => e.key === 'Enter' && handleGrant()}
                style={{ marginTop: 8 }}
              />
            </div>
            <Button onClick={handleGrant} disabled={isGranting || !newEmail.trim()} style={{ width: '100%' }}>
              {isGranting ? 'Granting…' : 'Grant Access'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Revoke Confirmation */}
      <Dialog open={Boolean(revokeTarget)} onOpenChange={(o) => { if (!o) setRevokeTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--error)' }}>Revoke Admin Access</DialogTitle>
          </DialogHeader>
          <p style={{ margin: '8px 0', fontSize: 14, color: 'var(--text-secondary)' }}>
            Remove admin access for <strong>{revokeTarget?.email}</strong>?
            They will no longer be able to sign into the admin console.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRevokeTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={isRevoking}
              onClick={() => {
                if (!revokeTarget) return;
                revokeAdmin(revokeTarget.email, { onSuccess: () => setRevokeTarget(null) });
              }}
            >
              {isRevoking ? 'Revoking…' : 'Revoke Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
