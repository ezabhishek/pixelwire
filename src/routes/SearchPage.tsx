import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { Search, SearchX } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArticleGrid } from '@/components/feed/ArticleGrid';
import { EmptyState, ErrorState, FeedNotice } from '@/components/feed/States';
import { PageContainer, PageHeader } from '@/components/layout/Page';
import { SEARCH_PATH } from '@/components/layout/SearchBar';
import { Spinner } from '@/components/ui/Spinner';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useSearch } from '@/hooks/useSearch';
import { dedupeById } from '@/lib/collections';
import { filterArticles } from '@/lib/search';
import { TAG_CATALOG } from '@/lib/tags';
import { useBookmarkedArticles } from '@/store/library';
import { usePreferences } from '@/store/preferences';
import type { FeedPage } from '@/types/article';

const SEARCH_DEBOUNCE_MS = 300;
const MAX_INSTANT_MATCHES = 40;
const SUGGESTED_TAGS = TAG_CATALOG.slice(0, 10);

/**
 * Two layers of results:
 * 1. Instant: posts already loaded in any feed, plus bookmarks, filtered on
 *    every keystroke with no network request.
 * 2. Remote: a debounced search against the sources, appended as it arrives.
 */
export function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = params.get('q') ?? '';
  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);
  const remote = useSearch(debounced);
  const enabledSources = usePreferences((state) => state.enabledSources);
  const bookmarks = useBookmarkedArticles();

  useDocumentTitle(trimmed ? `Search: ${trimmed}` : 'Search');

  const instant = useMemo(() => {
    if (!trimmed) return [];
    const cached = queryClient
      .getQueriesData<InfiniteData<FeedPage>>({ queryKey: ['feed'] })
      .flatMap(([, data]) => data?.pages.flatMap((page) => page.items) ?? []);
    const pool = dedupeById([...cached, ...bookmarks]).filter((article) => enabledSources.includes(article.source));
    return filterArticles(pool, trimmed).slice(0, MAX_INSTANT_MATCHES);
  }, [trimmed, bookmarks, enabledSources, queryClient]);

  const results = useMemo(() => dedupeById([...instant, ...remote.articles]), [instant, remote.articles]);
  const waitingForDebounce = trimmed !== debounced;
  const searching =
    (remote.isActive && (remote.isPending || remote.isRefetching)) || (waitingForDebounce && trimmed.length >= 2);

  if (!trimmed) {
    return (
      <PageContainer>
        <PageHeader title="Search" />
        <EmptyState
          icon={Search}
          title="Search DEV and Hacker News"
          description="Find posts by title, tag, author or site. Press / anywhere to jump to the search box."
          action={SUGGESTED_TAGS.map((tag) => (
            <button
              key={tag.slug}
              type="button"
              onClick={() => navigate(`${SEARCH_PATH}?q=${encodeURIComponent(tag.slug)}`, { replace: true })}
              className="inline-flex h-8 items-center rounded-md border border-line bg-surface px-3 text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              #{tag.slug}
            </button>
          ))}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Results for “${trimmed}”`}
        description={
          <span className="inline-flex items-center gap-2" aria-live="polite">
            {searching ? (
              <>
                <Spinner label="Searching" /> Searching… {results.length > 0 && `${results.length} so far`}
              </>
            ) : (
              `${results.length} ${results.length === 1 ? 'post' : 'posts'}`
            )}
          </span>
        }
      />
      {enabledSources.includes('devto') && /\s/.test(trimmed) && (
        <p className="-mt-2 mb-5 text-xs text-ink-subtle">
          DEV only searches by tag, so multi-word queries return DEV posts from your loaded feed only.
        </p>
      )}
      <FeedNotice sources={remote.failedSources} onRetry={remote.refetch} />

      {remote.isError && results.length === 0 ? (
        <ErrorState error={remote.error} onRetry={remote.refetch} />
      ) : (
        <ArticleGrid
          articles={results}
          isPending={results.length === 0 && searching}
          hasNextPage={remote.hasNextPage}
          isFetchingNextPage={remote.isFetchingNextPage}
          onLoadMore={remote.isActive ? remote.fetchNextPage : undefined}
          endMessage="That's every match."
          empty={
            <EmptyState
              icon={SearchX}
              title="No posts found"
              description={
                trimmed.length < 2
                  ? 'Type at least two characters to search the sources.'
                  : 'Try a shorter query, a tag name like “rust”, or turn on more sources in the sidebar.'
              }
            />
          }
        />
      )}
    </PageContainer>
  );
}
