import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in' };

// Reads ?expired=1 on the SERVER and passes it down.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; expired?: string }>;
}) {
  const { reason, expired } = await searchParams;
  const notice =
    reason === 'role'
      ? 'Your role was updated. Please sign in again to continue.'
      : reason === 'expired' || expired === '1'
        ? 'Your session has ended. Please sign in again.'
        : null;

  return <LoginForm notice={notice} />;
}
