import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface AuthCardProps {
  title: string;
  description: string;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
  children: ReactNode;
}

// Shared chrome for the login and register screens.
export function AuthCard({
  title,
  description,
  footerText,
  footerLinkText,
  footerHref,
  children,
}: AuthCardProps) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footerText}{' '}
            <Link href={footerHref} className="font-medium underline underline-offset-4">
              {footerLinkText}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
