import { ArrowBigUp, Bookmark, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArticleGrid } from '@/components/feed/ArticleGrid';
import { EmptyState, PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/components/feed/States';
import { PageContainer, PageHeader } from '@/components/layout/Page';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';
import { useBookmarkedArticles, useLibrary, useUpvotedArticles } from '@/store/library';

const CONFIRM_WINDOW_MS = 4000;

function countLabel(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function BookmarksPage() {
  useDocumentTitle('Bookmarks');
  const articles = useBookmarkedArticles();
  const clearBookmarks = useLibrary((state) => state.clearBookmarks);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), CONFIRM_WINDOW_MS);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const onClear = () => {
    if (confirming) {
      clearBookmarks();
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Bookmarks"
        description={`${countLabel(articles.length, 'saved post')}, newest first. Saved in this browser.`}
        actions={
          articles.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className={cn(
                SECONDARY_BUTTON,
                confirming && 'border-danger/50 bg-danger-soft text-danger hover:border-danger hover:bg-danger-soft',
              )}
            >
              <Trash2 aria-hidden className="size-4" />
              {confirming ? 'Click again to remove all' : 'Remove all'}
            </button>
          )
        }
      />
      <ArticleGrid
        articles={articles}
        empty={
          <EmptyState
            icon={Bookmark}
            title="No bookmarks yet"
            description="Use the bookmark button on any post to save it here for later."
            action={
              <Link to="/" className={PRIMARY_BUTTON}>
                Browse the feed
              </Link>
            }
          />
        }
      />
    </PageContainer>
  );
}

export function UpvotedPage() {
  useDocumentTitle('Upvoted');
  const articles = useUpvotedArticles();
  return (
    <PageContainer>
      <PageHeader
        title="Upvoted"
        description={`${countLabel(articles.length, 'post')} you upvoted, newest vote first.`}
      />
      <ArticleGrid
        articles={articles}
        empty={
          <EmptyState
            icon={ArrowBigUp}
            title="No upvotes yet"
            description="Upvote posts you liked and they'll collect here."
            action={
              <Link to="/popular" className={PRIMARY_BUTTON}>
                See what's popular
              </Link>
            }
          />
        }
      />
    </PageContainer>
  );
}
