import type { FeedMode, FeedPage, SourceId } from '@/types/article';
import { combineSourcePages } from './combine';
import { adapters } from './sources';

export interface FeedPageRequest {
  page: number;
  mode: FeedMode;
  sources: readonly SourceId[];
  tags: readonly string[];
  signal?: AbortSignal;
}

export async function fetchFeedPage({ page, mode, sources, tags, signal }: FeedPageRequest): Promise<FeedPage> {
  const results = await Promise.allSettled(
    sources.map((source) => adapters[source].fetchFeed({ page, mode, tags, signal })),
  );
  return combineSourcePages(page, sources, results, mode === 'latest' ? 'date' : 'interleave');
}
