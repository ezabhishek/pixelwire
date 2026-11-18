import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[120rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8', className)}>{children}</div>;
}

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3 sm:items-end sm:gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
