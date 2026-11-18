import { Check, Hash, Plus } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { cn } from '@/lib/cn';
import { getTagLabel, isKnownTag, TAG_CATALOG, toTagSlug } from '@/lib/tags';
import { MAX_FOLLOWED_TAGS, usePreferences } from '@/store/preferences';

export function TagFilter() {
  const followed = usePreferences((state) => state.followedTags);
  const toggleTag = usePreferences((state) => state.toggleTag);
  const clearTags = usePreferences((state) => state.clearTags);
  const [draft, setDraft] = useState('');
  const inputId = useId();

  const atLimit = followed.length >= MAX_FOLLOWED_TAGS;
  const customTags = followed.filter((tag) => !isKnownTag(tag));
  const allTags = [...TAG_CATALOG.map((tag) => tag.slug), ...customTags];

  const addCustom = (event: FormEvent) => {
    event.preventDefault();
    const slug = toTagSlug(draft);
    if (slug && !followed.includes(slug) && !atLimit) toggleTag(slug);
    setDraft('');
  };

  return (
    <div className="px-1">
      <div className="mb-2 flex items-center justify-between px-2 text-xs text-ink-subtle">
        <span>{followed.length > 0 ? `${followed.length} followed` : 'Follow tags to filter your feed'}</span>
        {followed.length > 0 && (
          <button type="button" onClick={clearTags} className="font-medium text-ink-muted hover:text-ink">
            Clear
          </button>
        )}
      </div>

      <ul className="flex flex-wrap gap-1.5 px-1" aria-label="Tags">
        {allTags.map((slug) => {
          const on = followed.includes(slug);
          const disabled = !on && atLimit;
          return (
            <li key={slug}>
              <button
                type="button"
                aria-pressed={on}
                disabled={disabled}
                onClick={() => toggleTag(slug)}
                title={disabled ? `You can follow up to ${MAX_FOLLOWED_TAGS} tags` : on ? 'Unfollow' : 'Follow'}
                className={cn(
                  'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors',
                  on
                    ? 'border-accent/40 bg-accent-soft text-accent hover:border-accent'
                    : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {on ? <Check aria-hidden className="size-3" /> : <Hash aria-hidden className="size-3 opacity-60" />}
                {getTagLabel(slug).replace(/^#/, '')}
              </button>
            </li>
          );
        })}
      </ul>

      <form onSubmit={addCustom} className="mt-3 flex items-center gap-1.5 px-1">
        <label htmlFor={inputId} className="sr-only">
          Follow another tag
        </label>
        <input
          id={inputId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a tag, e.g. svelte"
          disabled={atLimit}
          autoComplete="off"
          spellCheck={false}
          className="h-8 min-w-0 flex-1 rounded-md border border-line bg-surface px-2.5 text-xs text-ink placeholder:text-ink-subtle focus:border-accent focus-visible:outline-none disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={atLimit || toTagSlug(draft).length === 0}
          aria-label="Follow tag"
          title="Follow tag"
          className="inline-flex size-8 items-center justify-center rounded-md border border-line text-ink-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-40"
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </form>
    </div>
  );
}
