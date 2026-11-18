import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Kbd } from '@/components/ui/Kbd';
import { useHotkey } from '@/hooks/useHotkey';
import { cn } from '@/lib/cn';

export const SEARCH_PATH = '/search';

/**
 * The query lives in the URL (/search?q=...), so results are shareable and
 * Back works. Each keystroke updates the URL; the first one pushes a history
 * entry, later ones replace it. Clearing returns to the page search started from.
 */
export function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const returnTo = useRef('/');

  const onSearchPage = location.pathname === SEARCH_PATH;
  const urlQuery = onSearchPage ? (params.get('q') ?? '') : '';
  const [value, setValue] = useState(urlQuery);

  useEffect(() => {
    if (!onSearchPage) returnTo.current = `${location.pathname}${location.search}`;
  }, [onSearchPage, location.pathname, location.search]);

  // Follow URL changes made elsewhere: Back/Forward, tag suggestions.
  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  useHotkey('/', (event) => {
    event.preventDefault();
    inputRef.current?.focus();
    inputRef.current?.select();
  });

  const update = (next: string) => {
    setValue(next);
    if (next.length === 0) {
      if (onSearchPage) navigate(returnTo.current, { replace: true });
      return;
    }
    navigate({ pathname: SEARCH_PATH, search: `?q=${encodeURIComponent(next)}` }, { replace: onSearchPage });
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => update(event.target.value);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (value) update('');
      inputRef.current?.blur();
    }
  };

  return (
    <form
      role="search"
      className={cn('relative w-full max-w-xl', className)}
      onSubmit={(event) => {
        event.preventDefault();
        inputRef.current?.blur();
      }}
    >
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Search posts, tags, authors…"
        aria-label="Search posts"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className={cn(
          'h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-12 text-sm text-ink',
          'placeholder:text-ink-subtle transition-colors',
          'hover:border-line-strong focus:border-accent focus:bg-surface-raised focus-visible:outline-none',
        )}
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
        {value ? (
          <button
            type="button"
            onClick={() => {
              update('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            title="Clear search"
            className="inline-flex size-7 items-center justify-center rounded-md text-ink-subtle hover:bg-surface-hover hover:text-ink"
          >
            <X aria-hidden className="size-4" />
          </button>
        ) : (
          <Kbd className="hidden sm:inline-flex">/</Kbd>
        )}
      </div>
    </form>
  );
}
