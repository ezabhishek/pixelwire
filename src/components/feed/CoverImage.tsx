import { useState } from 'react';
import { SOURCES } from '@/config/sources';
import { cn } from '@/lib/cn';
import type { Article } from '@/types/article';

const FALLBACK_GRADIENTS = [
  'from-accent/25 via-surface-raised to-secondary/20',
  'from-secondary/25 via-surface-raised to-accent/15',
  'from-upvote/20 via-surface-raised to-secondary/15',
  'from-bookmark/15 via-surface-raised to-accent/20',
  'from-source-hackernews/20 via-surface-raised to-secondary/15',
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

const DOT_GRID = {
  backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.07) 1px, transparent 1px)',
  backgroundSize: '14px 14px',
};

/**
 * The post's cover, or a generated placeholder (HN stories never have one,
 * and remote images can fail). The placeholder colors are stable per post.
 */
export function CoverImage({ article, className }: { article: Article; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = article.coverImage;

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className={cn('aspect-[2/1] w-full rounded-xl bg-surface-hover object-cover', className)}
      />
    );
  }

  const gradient = FALLBACK_GRADIENTS[hashString(article.id) % FALLBACK_GRADIENTS.length];
  const label = article.domain ?? SOURCES[article.source].name;

  return (
    <div
      aria-hidden
      className={cn(
        'relative flex aspect-[2/1] w-full items-end overflow-hidden rounded-xl border border-line bg-linear-to-br p-3',
        gradient,
        className,
      )}
    >
      <div className="absolute inset-0" style={DOT_GRID} />
      <span className="relative max-w-full truncate rounded-md bg-canvas/70 px-2 py-1 font-mono text-[0.7rem] text-ink-muted backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}
