'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthCard } from '@/components/auth/auth-card';
import { FormField } from '@/components/auth/form-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { homePathForRole } from '@/lib/auth-cookie';
import type { AuthUser } from '@/lib/api';

export function LoginForm({ expired = false }: { expired?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Posts to our own Route Handler, not to Nest: the handler is what can set an httpOnly cookie.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { user?: AuthUser; message?: string };

      if (!response.ok || !payload.user) {
        setFormError(payload.message ?? 'Unable to sign in');
        return;
      }

      router.push(homePathForRole(payload.user.role));
      router.refresh();
    } catch {
      setFormError('Unable to reach the server. Is the API running?');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Sign in"
      description="Weekly Report Hub"
      footerText="No account yet?"
      footerLinkText="Create one"
      footerHref="/register"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {expired && !formError ? (
          <Alert>
            <AlertDescription>
              Your session has ended. Please sign in again.
            </AlertDescription>
          </Alert>
        ) : null}

        {formError ? (
          <Alert variant="destructive">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          disabled={submitting}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          disabled={submitting}
        />

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  );
}
