'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { SelectField } from '@/components/shared/select-field';
import { formatDate } from '@/lib/format';
import {
  ApiError,
  deleteUser,
  setUserActive,
  updateUserRole,
} from '@/lib/client-api';
import type { AuthUser, ManagedUser, Role } from '@/lib/types';

// The user list with inline role assignment.
export function UsersTable({
  users,
  currentUser,
}: {
  users: ManagedUser[];
  currentUser: AuthUser;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setError('');
    setBusyId(id);
    try {
      await action();
      toast.success(success);
      router.refresh();
    } catch (caught) {
      // Surfaces the API's own message: "last active manager", "has filed 6 report(s)", and so on.
      setError(caught instanceof ApiError ? caught.message : 'Something went wrong.');
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<ManagedUser>[] = [
    {
      key: 'name',
      header: 'Name',
      cell: (user) => (
        <div>
          <p className="font-medium">
            {user.name}
            {user.id === currentUser.id ? (
              <span className="text-muted-foreground font-normal"> (you)</span>
            ) : null}
          </p>
          <p className="text-muted-foreground text-xs">{user.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (user) => (
        <SelectField
          id={`role-${user.id}`}
          value={user.role}
          className="w-40"
          disabled={busyId === user.id || user.id === currentUser.id}
          options={[
            { value: 'TEAM_MEMBER', label: 'Team member' },
            { value: 'MANAGER', label: 'Manager' },
          ]}
          onChange={(value) =>
            run(
              user.id,
              () => updateUserRole(user.id, value as Role),
              `${user.name} is now a ${value === 'MANAGER' ? 'manager' : 'team member'}`,
            )
          }
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (user) =>
        user.isActive ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground border-dashed">
            Deactivated
          </Badge>
        ),
    },
    {
      key: 'reports',
      header: 'Reports',
      hideOnMobile: true,
      cell: (user) => <span className="tabular-nums">{user._count.reports}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      hideOnMobile: true,
      cell: (user) => (
        <span className="text-muted-foreground text-sm">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (user) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busyId === user.id || user.id === currentUser.id}
            onClick={() =>
              run(
                user.id,
                () => setUserActive(user.id, !user.isActive),
                user.isActive ? `${user.name} deactivated` : `${user.name} restored`,
              )
            }
          >
            {user.isActive ? 'Deactivate' : 'Restore'}
          </Button>

          <ConfirmDialog
            trigger={
              <Button
                variant="destructive"
                size="sm"
                disabled={busyId === user.id || user.id === currentUser.id}
              >
                Delete
              </Button>
            }
            title={`Delete ${user.name}?`}
            description={
              user._count.reports > 0
                ? `${user.name} has filed ${user._count.reports} report(s). The server will refuse this — deactivate instead so their reporting history survives.`
                : 'This account has no reports and can be removed permanently.'
            }
            confirmLabel="Delete"
            destructive
            onConfirm={() =>
              run(user.id, () => deleteUser(user.id), `${user.name} deleted`)
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <DataTable
        columns={columns}
        rows={users}
        getRowId={(user) => user.id}
        mobileCard={(user) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{user.name}</span>
              <Badge variant="outline">{user.role === 'MANAGER' ? 'Manager' : 'Member'}</Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {user.email} · {user._count.reports} reports ·{' '}
              {user.isActive ? 'active' : 'deactivated'}
            </p>
          </div>
        )}
        emptyState={<EmptyState title="No users match this filter" />}
      />
    </div>
  );
}
