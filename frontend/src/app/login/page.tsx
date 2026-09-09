import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in' };

// Reads ?expired=1 on the SERVER and passes it down.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const { expired } = await searchParams;

  return <LoginForm expired={expired === '1'} />;
}
