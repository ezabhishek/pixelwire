import { memo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { formatDateTime, formatReadingTime, formatRelativeTime } from '@/lib/format';
import type { Article } from '@/types/article';
import { BookmarkButton, CommentsLink, OpenLink, UpvoteButton } from './ArticleActions';
import { CoverImage } from './CoverImage';
import { SourceBadge } from './SourceBadge';
import { TagList } from './TagList';

interface ArticleCardProps {
  article: Article;
  onOpen: (article: Article) => void;
}

/**
 * The title button is stretched over the whole card (its ::after covers it),
 * so a click anywhere opens the preview. Tags and actions sit above it
 * (relative z-10) and keep their own behavior.
 */
export const ArticleCard = memo(function ArticleCard({ article, onOpen }: ArticleCardProps) {
  const readingTime = formatReadingTime(article.readingTimeMinutes);

  return (
    <article
      className="group relative flex flex-col rounded-card border border-line bg-surface p-4 shadow-card transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface-raised hover:shadow-card-hover"
    >
      <header className="flex min-w-0 items-center gap-2 text-xs text-ink-subtle">
        <SourceBadge source={article.source} />
        <Avatar name={article.author.name} src={article.author.avatarUrl} size={18} />
        <span className="min-w-0 truncate text-ink-muted">{article.author.name}</span>
        <span aria-hidden>·</span>
        <time dateTime={article.publishedAt} title={formatDateTime(article.publishedAt)} className="shrink-0">
          {formatRelativeTime(article.publishedAt)}
        </time>
      </header>

      <h2 className="mt-3 text-[1.02rem] font-semibold leading-snug text-ink">
        <button
          type="button"
          onClick={() => onOpen(article)}
          className="line-clamp-3 text-left after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
        >
          {article.title}
        </button>
      </h2>

      <div className="mt-2 flex items-center gap-2 text-xs text-ink-subtle">
        {readingTime && <span>{readingTime}</span>}
        {readingTime && article.domain && article.source !== 'devto' && <span aria-hidden>·</span>}
        {article.domain && article.source !== 'devto' && <span className="truncate font-mono">{article.domain}</span>}
      </div>

      <TagList tags={article.tags} max={3} className="relative z-10 mt-3" />

      <div className="mt-auto pt-4">
        <CoverImage article={article} />
      </div>

      <footer className="relative z-10 -mx-1 mt-3 flex items-center gap-0.5">
        <UpvoteButton article={article} />
        <CommentsLink article={article} />
        <span className="flex-1" />
        <BookmarkButton article={article} />
        <OpenLink article={article} />
      </footer>
    </article>
  );
});
