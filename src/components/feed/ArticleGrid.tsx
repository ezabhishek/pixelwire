import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { usePreview } from '@/store/preview';
import type { Article } from '@/types/article';
import { ArticleCard } from './ArticleCard';
import { CardSkeleton } from './CardSkeleton';
import { SECONDARY_BUTTON } from './States';

const SKELETON_COUNT = 12;

export const GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,18.5rem),1fr))] gap-4 sm:gap-5';

interface ArticleGridProps {
  articles: Article[];
  isPending?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  empty: ReactNode;
  /** Shown under the last card when every page has loaded. */
  endMessage?: string;
}

export function ArticleGrid({
  articles,
  isPending = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  empty,
  endMessage = "You're all caught up.",
}: ArticleGridProps) {
  const openPreview = usePreview((state) => state.open);
  // Read through a ref so cards keep a stable onOpen and skip re-rendering when a page is appended.
  const articlesRef = useRef(articles);
  useLayoutEffect(() => {
    articlesRef.current = articles;
  }, [articles]);

  const onOpen = useCallback((article: Article) => openPreview(article, articlesRef.current), [openPreview]);

  const sentinelRef = useInfiniteScroll({
    enabled: Boolean(onLoadMore) && hasNextPage && !isFetchingNextPage && !isPending,
    onLoadMore: () => onLoadMore?.(),
  });

  if (isPending) {
    return (
      <div className={GRID_CLASS} aria-busy="true" aria-label="Loading posts">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (articles.length === 0) return <>{empty}</>;

  return (
    <>
      <div className={GRID_CLASS}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} onOpen={onOpen} />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 4 }, (_, index) => <CardSkeleton key={`more-${index}`} />)}
      </div>

      {onLoadMore && (
        <div className="flex min-h-20 items-center justify-center py-8 text-sm text-ink-subtle">
          <div ref={sentinelRef} aria-hidden className="h-px w-px" />
          {isFetchingNextPage ? (
            <Spinner label="Loading more posts" />
          ) : hasNextPage ? (
            <button type="button" onClick={onLoadMore} className={SECONDARY_BUTTON}>
              Load more
            </button>
          ) : (
            <p>{endMessage}</p>
          )}
        </div>
      )}
    </>
  );
}
