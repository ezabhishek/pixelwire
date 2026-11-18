import type { FeedPage, SourceId } from '@/types/article';
import { combineSourcePages } from './combine';
import { adapters } from './sources';

export interface SearchPageRequest {
  query: string;
  page: number;
  sources: readonly SourceId[];
  signal?: AbortSignal;
}

export const MIN_SEARCH_LENGTH = 2;

export async function fetchSearchPage({ query, page, sources, signal }: SearchPageRequest): Promise<FeedPage> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_SEARCH_LENGTH) {
    return { page, items: [], hasMore: false, failedSources: [] };
  }
  const results = await Promise.allSettled(
    sources.map((source) => adapters[source].search({ query: trimmed, page, signal })),
  );
  return combineSourcePages(page, sources, results, 'interleave');
}
