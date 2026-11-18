import { byPublishedDesc, dedupeById, interleave } from '@/lib/collections';
import type { Article, FeedPage, SourceId, SourcePage } from '@/types/article';

/**
 * - `date`: newest first across all sources (Latest).
 * - `interleave`: alternate sources, keeping each source's own ranking
 *   (Popular, Search). DEV reactions and HN points are not comparable, so
 *   sorting by raw score would bury one source.
 */
export type MergeStrategy = 'date' | 'interleave';

/**
 * Merge one page from each source. A failed source is reported in
 * `failedSources` and the others still render; only when every source fails
 * is the first error thrown.
 */
export function combineSourcePages(
  page: number,
  sources: readonly SourceId[],
  results: ReadonlyArray<PromiseSettledResult<SourcePage>>,
  strategy: MergeStrategy,
): FeedPage {
  const lists: Article[][] = [];
  const failedSources: SourceId[] = [];
  let hasMore = false;
  let firstError: unknown;

  results.forEach((result, index) => {
    const source = sources[index];
    if (source === undefined) return;
    if (result.status === 'fulfilled') {
      lists.push(result.value.items);
      hasMore ||= result.value.hasMore;
    } else {
      failedSources.push(source);
      firstError ??= result.reason;
    }
  });

  if (lists.length === 0 && failedSources.length > 0) throw firstError;

  const merged = strategy === 'date' ? lists.flat().sort(byPublishedDesc) : interleave(lists);
  return { page, items: dedupeById(merged), hasMore, failedSources };
}
