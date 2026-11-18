import { RefreshCw, TriangleAlert, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { SOURCES } from '@/config/sources';
import { cn } from '@/lib/cn';
import { describeError } from '@/lib/errors';
import type { SourceId } from '@/types/article';

const BUTTON =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface-raised px-3.5 text-sm font-medium text-ink transition-colors hover:border-line-strong hover:bg-surface-hover';

export const PRIMARY_BUTTON =
  'inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-semibold text-ink-inverse transition-colors hover:bg-accent-hover';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-card border border-dashed border-line px-6 py-16 text-center',
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-surface-raised text-ink-muted">
        <Icon aria-hidden className="size-6" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-ink">{title}</h2>
      {description && <div className="mt-1.5 max-w-md text-sm text-ink-muted">{description}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-card border border-danger/30 bg-danger-soft px-6 py-14 text-center',
        className,
      )}
    >
      <TriangleAlert aria-hidden className="size-7 text-danger" />
      <h2 className="mt-3 text-base font-semibold text-ink">Couldn't load posts</h2>
      <p className="mt-1.5 max-w-md text-sm text-ink-muted">{describeError(error)}</p>
      <button type="button" onClick={onRetry} className={cn(BUTTON, 'mt-5')}>
        <RefreshCw aria-hidden className="size-4" />
        Try again
      </button>
    </div>
  );
}

export function FeedNotice({ sources, onRetry }: { sources: readonly SourceId[]; onRetry: () => void }) {
  if (sources.length === 0) return null;
  const names = sources.map((id) => SOURCES[id].name).join(' and ');
  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-bookmark/30 bg-bookmark-soft px-4 py-3 text-sm text-ink"
    >
      <TriangleAlert aria-hidden className="size-4 shrink-0 text-bookmark" />
      <p className="min-w-0 flex-1">Couldn't load {names} just now. Showing posts from your other sources.</p>
      <button type="button" onClick={onRetry} className="font-medium text-bookmark hover:underline">
        Retry
      </button>
    </div>
  );
}

export { BUTTON as SECONDARY_BUTTON };
