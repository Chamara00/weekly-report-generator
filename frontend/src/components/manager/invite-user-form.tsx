'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/shared/select-field';
import { ApiError, ValidationError, inviteUser } from '@/lib/client-api';
import type { Role } from '@/lib/types';

// Creates an account on someone's behalf and shows the temporary password once.
export function InviteUserForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('TEAM_MEMBER');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [issued, setIssued] = useState<{ email: string; password: string } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (!name.trim()) return setError('Enter a name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');

    setPending(true);
    try {
      const result = await inviteUser({ name: name.trim(), email: email.trim(), role });
      setIssued({ email: result.user.email, password: result.temporaryPassword });
      toast.success(`Account created for ${result.user.name}`);
      setName('');
      setEmail('');
      setRole('TEAM_MEMBER');
      router.refresh();
    } catch (caught) {
      if (caught instanceof ValidationError) setError(caught.messages.join(', '));
      else if (caught instanceof ApiError) setError(caught.message);
      else setError('Could not reach the server.');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invite someone</CardTitle>
        <CardDescription>
          Creates the account immediately and issues a temporary password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {issued ? (
          <Alert>
            <AlertDescription>
              <p className="font-medium">Account created — copy this password now.</p>
              <p className="mt-1 text-sm">
                {issued.email} ·{' '}
                <code className="bg-muted rounded px-1.5 py-0.5 font-mono">
                  {issued.password}
                </code>
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                It is stored only as a bcrypt hash and cannot be shown again.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="invite-name">Name</Label>
            <Input
              id="invite-name"
              value={name}
              disabled={pending}
              placeholder="Jordan Reyes"
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              disabled={pending}
              placeholder="jordan@example.com"
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <SelectField
            id="invite-role"
            label="Role"
            value={role}
            disabled={pending}
            className="sm:w-40"
            options={[
              { value: 'TEAM_MEMBER', label: 'Team member' },
              { value: 'MANAGER', label: 'Manager' },
            ]}
            onChange={(value) => setRole(value as Role)}
          />

          <div className="flex items-end">
            <Button type="submit" disabled={pending}>
              {pending ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
