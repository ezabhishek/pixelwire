import { SOURCES } from '@/config/sources';
import { cn } from '@/lib/cn';
import type { SourceId } from '@/types/article';

export function SourceBadge({ source, className }: { source: SourceId; className?: string }) {
  const meta = SOURCES[source];
  return (
    <span
      title={meta.name}
      className={cn(
        'inline-flex h-5 shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface-raised px-1.5',
        'text-[0.65rem] font-bold tracking-wide',
        meta.textClass,
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', meta.dotClass)} />
      {meta.shortName}
      <span className="sr-only"> ({meta.name})</span>
    </span>
  );
}
