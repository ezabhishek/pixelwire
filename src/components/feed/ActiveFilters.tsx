import { X } from 'lucide-react';
import { SOURCE_IDS, SOURCES } from '@/config/sources';
import { getTagLabel } from '@/lib/tags';
import { usePreferences } from '@/store/preferences';

export function ActiveFilters() {
  const tags = usePreferences((state) => state.followedTags);
  const sources = usePreferences((state) => state.enabledSources);
  const toggleTag = usePreferences((state) => state.toggleTag);
  const clearTags = usePreferences((state) => state.clearTags);
  const enableAllSources = usePreferences((state) => state.enableAllSources);

  const allSources = sources.length === SOURCE_IDS.length;
  if (tags.length === 0 && allSources) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters" role="group">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-ink-subtle">Filtered by</span>
      {!allSources &&
        sources.map((id) => (
          <span
            key={id}
            className="inline-flex h-7 items-center rounded-md border border-line bg-surface-raised px-2 text-xs font-medium text-ink-muted"
          >
            {SOURCES[id].name} only
          </span>
        ))}
      {tags.map((tag) => {
        const label = getTagLabel(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            aria-label={`Remove ${label} filter`}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-accent/40 bg-accent-soft pl-2 pr-1.5 text-xs font-medium text-accent transition-colors hover:border-accent"
          >
            {label}
            <X aria-hidden className="size-3.5" />
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => {
          clearTags();
          enableAllSources();
        }}
        className="ml-1 text-xs font-medium text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
