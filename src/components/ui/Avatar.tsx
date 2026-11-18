import { useState } from 'react';
import { cn } from '@/lib/cn';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}` : name.slice(0, 2);
  return letters.toUpperCase() || '?';
}

export function Avatar({ name, src, size = 20, className }: { name: string; src?: string; size?: number; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const style = { width: size, height: size };

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className={cn('shrink-0 rounded-full bg-surface-hover object-cover', className)}
        style={style}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-secondary-soft font-semibold text-secondary',
        className,
      )}
      style={{ ...style, fontSize: Math.max(8, Math.round(size * 0.42)) }}
    >
      {initialsOf(name)}
    </span>
  );
}
