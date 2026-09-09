import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserMenu } from '@/components/layout/user-menu';
import { Toaster } from '@/components/ui/sonner';
import { AssistantWidget } from '@/components/assistant/assistant-widget';
import { getAssistantStatus, getCurrentUser } from '@/lib/server-api';

// The signed-in shell: persistent sidebar from `md` up, drawer below it.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user;

  try {
    user = await getCurrentUser();
  } catch {
    // Cookie exists but the API rejected it (expired, revoked, user gone) — clear it, or we loop.
    redirect('/api/auth/clear');
  }

  // Managers only, and only when a Gemini key is configured; otherwise the widget stays hidden.
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

      {/* Mounted once so any page in the signed-in app can raise a toast. */}
      <Toaster position="top-right" richColors />
    </div>
  );
}
