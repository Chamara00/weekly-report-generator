import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in' };

/**
 * Reads ?expired=1 on the SERVER and passes it down, so the "your session has
 * ended" notice is in the first HTML response rather than appearing after
 * hydration. /api/auth/clear sets that param when it ends a dead session.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;

  return <LoginForm expired={expired === '1'} />;
}
