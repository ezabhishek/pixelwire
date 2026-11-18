import { Inbox, RefreshCw } from 'lucide-react';
import { ActiveFilters } from '@/components/feed/ActiveFilters';
import { ArticleGrid } from '@/components/feed/ArticleGrid';
import { EmptyState, ErrorState, FeedNotice, SECONDARY_BUTTON } from '@/components/feed/States';
import { PageContainer, PageHeader } from '@/components/layout/Page';
import { IconButton } from '@/components/ui/IconButton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useFeed } from '@/hooks/useFeed';
import { cn } from '@/lib/cn';
import { usePreferences } from '@/store/preferences';
import type { FeedMode } from '@/types/article';

const COPY: Record<FeedMode, { title: string; description: string }> = {
  latest: { title: 'My feed', description: 'The newest posts from your sources and tags.' },
  popular: { title: 'Popular', description: 'The most upvoted posts of the past week.' },
};

export function FeedPage({ mode }: { mode: FeedMode }) {
  const copy = COPY[mode];
  useDocumentTitle(copy.title);
  const feed = useFeed(mode);
  const hasTags = usePreferences((state) => state.followedTags.length > 0);
  const clearTags = usePreferences((state) => state.clearTags);

  const showError = feed.isError && feed.articles.length === 0;

  return (
    <PageContainer>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <IconButton label="Refresh feed" onClick={feed.refetch} disabled={feed.isPending || feed.isRefetching}>
            <RefreshCw aria-hidden className={cn('size-[1.1rem]', feed.isRefetching && 'animate-spin')} />
          </IconButton>
        }
      />
      <ActiveFilters />
      <FeedNotice sources={feed.failedSources} onRetry={feed.refetch} />

      {showError ? (
        <ErrorState error={feed.error} onRetry={feed.refetch} />
      ) : (
        <ArticleGrid
          articles={feed.articles}
          isPending={feed.isPending}
          hasNextPage={feed.hasNextPage}
          isFetchingNextPage={feed.isFetchingNextPage}
          onLoadMore={feed.fetchNextPage}
          empty={
            <EmptyState
              icon={Inbox}
              title={hasTags ? 'No posts match your tags' : 'Nothing here yet'}
              description={
                hasTags
                  ? 'None of your sources have recent posts for the tags you follow. Follow more tags or clear them.'
                  : 'Your sources returned no posts. Try refreshing in a moment.'
              }
              action={
                hasTags ? (
                  <button type="button" onClick={clearTags} className={SECONDARY_BUTTON}>
                    Clear tags
                  </button>
                ) : (
                  <button type="button" onClick={feed.refetch} className={SECONDARY_BUTTON}>
                    Refresh
                  </button>
                )
              }
            />
          }
        />
      )}
    </PageContainer>
  );
}
