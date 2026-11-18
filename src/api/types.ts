import type { ArticleDetail, FeedMode, SourceId, SourcePage } from '@/types/article';

export interface FeedParams {
  /** Zero-based page index shared by every source. */
  page: number;
  mode: FeedMode;
  /** Followed tag slugs; empty means "everything". */
  tags: readonly string[];
  signal?: AbortSignal;
}

export interface SearchParams {
  query: string;
  page: number;
  signal?: AbortSignal;
}

/** Everything the app needs from one news source. */
export interface SourceAdapter {
  id: SourceId;
  fetchFeed(params: FeedParams): Promise<SourcePage>;
  search(params: SearchParams): Promise<SourcePage>;
  /** Returns raw (unsanitized) HTML; `api/detail.ts` sanitizes it. */
  fetchDetail(nativeId: string, signal?: AbortSignal): Promise<ArticleDetail>;
}

export const PAGE_SIZE = 20;
