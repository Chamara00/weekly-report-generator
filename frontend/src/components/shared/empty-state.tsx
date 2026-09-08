import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Optional call to action, e.g. "Create your first report". */
  action?: ReactNode;
  icon?: ReactNode;
}

/** Shown wherever a list legitimately has no rows -- never a blank panel. */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      {icon ? <div className="text-muted-foreground mb-3">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
