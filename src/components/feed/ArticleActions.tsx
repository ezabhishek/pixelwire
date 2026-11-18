import { ArrowBigUp, Bookmark, ExternalLink, MessageSquare } from 'lucide-react';
import { SOURCES } from '@/config/sources';
import { cn } from '@/lib/cn';
import { formatCompactNumber } from '@/lib/format';
import { displayScore, useIsBookmarked, useIsUpvoted, useLibrary } from '@/store/library';
import type { Article } from '@/types/article';

const ACTION_BASE =
  'inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[0.8rem] font-medium tabular-nums transition-colors';

export function UpvoteButton({ article, className }: { article: Article; className?: string }) {
  const upvoted = useIsUpvoted(article.id);
  const toggleUpvote = useLibrary((state) => state.toggleUpvote);
  const score = formatCompactNumber(displayScore(article, upvoted));
  return (
    <button
      type="button"
      aria-pressed={upvoted}
      aria-label={`${upvoted ? 'Remove upvote' : 'Upvote'} (${score})`}
      title={upvoted ? 'Remove upvote' : 'Upvote'}
      onClick={() => toggleUpvote(article)}
      className={cn(
        ACTION_BASE,
        upvoted ? 'bg-upvote-soft text-upvote' : 'text-ink-muted hover:bg-upvote-soft hover:text-upvote',
        className,
      )}
    >
      <ArrowBigUp aria-hidden className={cn('size-5', upvoted && 'animate-pop fill-current')} />
      <span aria-hidden>{score}</span>
    </button>
  );
}

export function BookmarkButton({ article, className, withLabel = false }: { article: Article; className?: string; withLabel?: boolean }) {
  const bookmarked = useIsBookmarked(article.id);
  const toggleBookmark = useLibrary((state) => state.toggleBookmark);
  const label = bookmarked ? 'Remove bookmark' : 'Bookmark';
  return (
    <button
      type="button"
      aria-pressed={bookmarked}
      aria-label={label}
      title={label}
      onClick={() => toggleBookmark(article)}
      className={cn(
        ACTION_BASE,
        bookmarked ? 'bg-bookmark-soft text-bookmark' : 'text-ink-muted hover:bg-bookmark-soft hover:text-bookmark',
        className,
      )}
    >
      <Bookmark aria-hidden className={cn('size-[1.05rem]', bookmarked && 'animate-pop fill-current')} />
      {withLabel && <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>}
    </button>
  );
}

export function CommentsLink({ article, className }: { article: Article; className?: string }) {
  const count = formatCompactNumber(article.commentCount);
  return (
    <a
      href={article.discussionUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${count} comments on ${SOURCES[article.source].name}`}
      title={`Discussion on ${SOURCES[article.source].name}`}
      className={cn(ACTION_BASE, 'text-ink-muted hover:bg-surface-hover hover:text-ink', className)}
    >
      <MessageSquare aria-hidden className="size-[1.05rem]" />
      <span aria-hidden>{count}</span>
    </a>
  );
}

export function OpenLink({ article, className }: { article: Article; className?: string }) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open "${article.title}" in a new tab`}
      title="Open article"
      className={cn(ACTION_BASE, 'text-ink-muted hover:bg-surface-hover hover:text-ink', className)}
    >
      <ExternalLink aria-hidden className="size-[1.05rem]" />
    </a>
  );
}
