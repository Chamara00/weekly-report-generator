import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserMenu } from '@/components/layout/user-menu';
import { Toaster } from '@/components/ui/sonner';
import { AssistantWidget } from '@/components/assistant/assistant-widget';
import { getAssistantStatus, getCurrentUser } from '@/lib/server-api';

/**
 * The signed-in shell: persistent sidebar from `md` up, drawer below it.
 *
 * The current user is fetched once here, on the server, and passed down. Every
 * page inside this group therefore renders with a known user and does not each
 * make its own /auth/me call.
 *
 * Middleware already redirects users without a cookie, but this catches the
 * case where the cookie exists and the token is rejected -- an expired or
 * revoked token means /auth/me 401s, and the only sensible answer is /login.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user;

  try {
    user = await getCurrentUser();
  } catch {
    // The cookie exists but the API rejected it (expired, revoked, or the user
    // was deleted/deactivated). Middleware cannot tell -- it only decodes the
    // token -- so the cookie must be cleared here or the two bounce forever.
    redirect('/api/auth/clear');
  }

  // Managers only, and only when a Gemini key is configured — otherwise the
  // widget would offer a feature that can only fail.
  const assistant =
    user.role === 'MANAGER' ? await getAssistantStatus() : { configured: false };

  return (
    <div className="bg-muted/20 min-h-svh">
      <header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4">
        <MobileNav role={user.role} />
        <Link href={user.role === 'MANAGER' ? '/manager' : '/dashboard'} className="font-semibold">
          Weekly Report Hub
        </Link>
        <div className="ml-auto">
          <UserMenu user={user} />
        </div>
      </header>

      <div className="flex">
        <aside className="bg-background sticky top-14 hidden h-[calc(100svh-3.5rem)] w-60 shrink-0 border-r p-3 md:block">
          <SidebarNav role={user.role} />
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      {assistant.configured ? <AssistantWidget /> : null}

      {/* Mounted once here so review actions and project CRUD can confirm
          themselves from anywhere in the signed-in app. */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
