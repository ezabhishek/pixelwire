import { cn } from '@/lib/cn';
import { getTagLabel } from '@/lib/tags';
import { usePreferences } from '@/store/preferences';

interface TagListProps {
  tags: readonly string[];
  max?: number;
  className?: string;
}

/** Tag chips; clicking one follows or unfollows that tag. */
export function TagList({ tags, max, className }: TagListProps) {
  const followed = usePreferences((state) => state.followedTags);
  const toggleTag = usePreferences((state) => state.toggleTag);
  const shown = max === undefined ? tags : tags.slice(0, max);
  const hidden = tags.length - shown.length;
  if (shown.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap items-center gap-1.5', className)} aria-label="Tags">
      {shown.map((tag) => {
        const on = followed.includes(tag);
        const label = getTagLabel(tag);
        return (
          <li key={tag}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => toggleTag(tag)}
              title={on ? `Unfollow ${label}` : `Follow ${label}`}
              className={cn(
                'inline-flex h-6 items-center rounded-md px-1.5 text-[0.7rem] font-medium transition-colors',
                on
                  ? 'bg-accent-soft text-accent hover:bg-accent/20'
                  : 'bg-surface-hover text-ink-muted hover:bg-surface-active hover:text-ink',
              )}
            >
              {label.startsWith('#') ? label : `#${label.toLowerCase().replace(/\s+/g, '')}`}
            </button>
          </li>
        );
      })}
      {hidden > 0 && <li className="text-[0.7rem] text-ink-subtle">+{hidden}</li>}
    </ul>
  );
}
