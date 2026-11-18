import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/api/queryClient';
import { fetchSearchPage, MIN_SEARCH_LENGTH } from '@/api/search';
import { usePreferences } from '@/store/preferences';
import { flattenPages, type PagedArticles } from './useFeed';

/** Remote search across enabled sources. Pass an already-debounced query. */
export function useSearch(query: string): PagedArticles & { isActive: boolean } {
  const sources = usePreferences((state) => state.enabledSources);
  const trimmed = query.trim();
  const isActive = trimmed.length >= MIN_SEARCH_LENGTH;

  const result = useInfiniteQuery({
    queryKey: queryKeys.search(trimmed, sources),
    queryFn: ({ pageParam, signal }) => fetchSearchPage({ query: trimmed, page: pageParam, sources, signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: isActive,
    staleTime: 5 * 60 * 1000,
  });

  const { data, fetchNextPage, refetch } = result;
  const articles = useMemo(() => flattenPages(data?.pages), [data]);

  return {
    isActive,
    articles,
    failedSources: data?.pages.at(-1)?.failedSources ?? [],
    isPending: isActive && result.isPending,
    isError: result.isError,
    error: result.error,
    isFetchingNextPage: result.isFetchingNextPage,
    isRefetching: result.isRefetching,
    hasNextPage: result.hasNextPage,
    fetchNextPage: () => {
      void fetchNextPage();
    },
    refetch: () => {
      void refetch();
    },
  };
}
