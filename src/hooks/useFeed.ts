import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchFeedPage } from '@/api/feed';
import { queryKeys } from '@/api/queryClient';
import { dedupeById } from '@/lib/collections';
import { usePreferences } from '@/store/preferences';
import type { Article, FeedMode, FeedPage, SourceId } from '@/types/article';

export interface PagedArticles {
  articles: Article[];
  /** Sources that failed on the most recent page. */
  failedSources: SourceId[];
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  isFetchingNextPage: boolean;
  isRefetching: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

export function flattenPages(pages: readonly FeedPage[] | undefined): Article[] {
  return dedupeById(pages?.flatMap((page) => page.items) ?? []);
}

export function useFeed(mode: FeedMode): PagedArticles {
  const sources = usePreferences((state) => state.enabledSources);
  const tags = usePreferences((state) => state.followedTags);

  const query = useInfiniteQuery({
    queryKey: queryKeys.feed(mode, sources, tags),
    queryFn: ({ pageParam, signal }) => fetchFeedPage({ page: pageParam, mode, sources, tags, signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

  const { data, fetchNextPage, refetch } = query;
  const articles = useMemo(() => flattenPages(data?.pages), [data]);
  const failedSources = data?.pages.at(-1)?.failedSources ?? [];

  return {
    articles,
    failedSources,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    isFetchingNextPage: query.isFetchingNextPage,
    isRefetching: query.isRefetching,
    hasNextPage: query.hasNextPage,
    fetchNextPage: () => {
      void fetchNextPage();
    },
    refetch: () => {
      void refetch();
    },
  };
}
