import { ChevronLeft, ChevronRight, ExternalLink, MessageSquare, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookmarkButton, UpvoteButton } from '@/components/feed/ArticleActions';
import { CoverImage } from '@/components/feed/CoverImage';
import { SourceBadge } from '@/components/feed/SourceBadge';
import { ErrorState, PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/components/feed/States';
import { TagList } from '@/components/feed/TagList';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { Kbd } from '@/components/ui/Kbd';
import { SOURCES } from '@/config/sources';
import { useArticleDetail } from '@/hooks/useArticleDetail';
import { useScrollLock } from '@/hooks/useScrollLock';
import { cn } from '@/lib/cn';
import { isTypingTarget, trapFocus } from '@/lib/dom';
import { formatDate, formatDateTime, formatReadingTime } from '@/lib/format';
import { usePreview } from '@/store/preview';
import type { Article } from '@/types/article';
import { CommentList } from './CommentList';

export function ArticlePreview() {
  const article = usePreview((state) => state.article);
  return article ? <PreviewDialog article={article} /> : null;
}

function BodySkeleton() {
  return (
    <div aria-hidden className="mt-6 space-y-2.5">
      {['w-full', 'w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3'].map((width, index) => (
        <div key={index} className={cn('skeleton h-3.5', width)} />
      ))}
    </div>
  );
}

function PreviewDialog({ article }: { article: Article }) {
  const close = usePreview((state) => state.close);
  const step = usePreview((state) => state.step);
  const sequence = usePreview((state) => state.sequence);
  const detail = useArticleDetail(article);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const index = sequence.findIndex((item) => item.id === article.id);
  const hasPrev = index > 0;
  const hasNext = index !== -1 && index < sequence.length - 1;
  const source = SOURCES[article.source];
  const readingTime = formatReadingTime(article.readingTimeMinutes);

  useScrollLock(true);

  // Focus the dialog on open, give focus back to the card on close.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => previous?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [article.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'Tab') {
        trapFocus(event, panelRef.current);
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      if (event.key === 'ArrowRight' || event.key === 'j') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowLeft' || event.key === 'k') {
        event.preventDefault();
        step(-1);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [close, step]);

  const bodyHtml = detail.data?.bodyHtml ?? null;
  const comments = detail.data?.comments ?? [];

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-overlay backdrop-blur-[2px]" onClick={close} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        className={cn(
          'absolute inset-x-0 bottom-0 flex h-[92dvh] animate-sheet-in flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-drawer',
          'md:inset-y-0 md:left-auto md:right-0 md:h-full md:w-[min(46rem,100%)] md:animate-drawer-in md:rounded-none md:border-y-0 md:border-r-0',
        )}
      >
        <div aria-hidden className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line-strong md:hidden" />

        <div className="flex shrink-0 items-center gap-1 border-b border-line px-2 py-2 sm:px-3">
          <IconButton ref={closeRef} label="Close preview (Esc)" onClick={close}>
            <X aria-hidden className="size-5" />
          </IconButton>
          {index !== -1 && sequence.length > 1 && (
            <>
              <IconButton label="Previous post (←)" onClick={() => step(-1)} disabled={!hasPrev}>
                <ChevronLeft aria-hidden className="size-5" />
              </IconButton>
              <IconButton label="Next post (→)" onClick={() => step(1)} disabled={!hasNext}>
                <ChevronRight aria-hidden className="size-5" />
              </IconButton>
              <span className="ml-1 hidden text-xs tabular-nums text-ink-subtle sm:inline">
                {index + 1} / {sequence.length}
              </span>
            </>
          )}
          <div className="ml-auto flex items-center gap-1">
            <UpvoteButton article={article} />
            <BookmarkButton article={article} withLabel />
            <a href={article.url} target="_blank" rel="noopener noreferrer" className={cn(PRIMARY_BUTTON, 'ml-1 h-8 px-3')}>
              <span className="hidden sm:inline">Read article</span>
              <span className="sm:hidden">Read</span>
              <ExternalLink aria-hidden className="size-3.5" />
            </a>
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <article className="mx-auto max-w-2xl px-5 pb-12 pt-6 sm:px-8">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-subtle">
              <SourceBadge source={article.source} />
              <Avatar name={article.author.name} src={article.author.avatarUrl} size={20} />
              {article.author.profileUrl ? (
                <a
                  href={article.author.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-ink-muted hover:text-ink"
                >
                  {article.author.name}
                </a>
              ) : (
                <span className="font-medium text-ink-muted">{article.author.name}</span>
              )}
              <span aria-hidden>·</span>
              <time dateTime={article.publishedAt} title={formatDateTime(article.publishedAt)}>
                {formatDate(article.publishedAt)}
              </time>
              {readingTime && (
                <>
                  <span aria-hidden>·</span>
                  <span>{readingTime}</span>
                </>
              )}
            </div>

            <h2 id="preview-title" className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-[1.75rem]">
              {article.title}
            </h2>

            {article.domain && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-mono text-xs text-ink-subtle hover:text-accent"
              >
                {article.domain}
              </a>
            )}

            <TagList tags={article.tags} className="mt-4" />

            {article.coverImage && <CoverImage article={article} className="mt-6" />}

            {detail.isPending ? (
              <>
                {article.summary && <p className="mt-6 text-[0.95rem] leading-relaxed text-ink-muted">{article.summary}</p>}
                <BodySkeleton />
              </>
            ) : detail.isError ? (
              <ErrorState error={detail.error} onRetry={() => void detail.refetch()} className="mt-6 py-10" />
            ) : bodyHtml ? (
              <div className="article-prose mt-6" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            ) : (
              <div className="mt-6 rounded-xl border border-line bg-surface-raised p-5">
                {article.summary && <p className="mb-3 text-[0.95rem] leading-relaxed text-ink-muted">{article.summary}</p>}
                <p className="text-sm text-ink-muted">
                  This post links to <span className="font-mono text-ink">{article.domain ?? 'an external site'}</span>.
                  Open it to read the full story.
                </p>
                <a href={article.url} target="_blank" rel="noopener noreferrer" className={cn(SECONDARY_BUTTON, 'mt-4')}>
                  Open {article.domain ?? 'article'}
                  <ExternalLink aria-hidden className="size-3.5" />
                </a>
              </div>
            )}

            <section aria-labelledby="preview-comments" className="mt-10 border-t border-line pt-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 id="preview-comments" className="flex items-center gap-2 text-base font-semibold text-ink">
                  <MessageSquare aria-hidden className="size-4 text-ink-subtle" />
                  Discussion
                  <span className="text-sm font-normal text-ink-subtle tabular-nums">{article.commentCount}</span>
                </h3>
                <a
                  href={article.discussionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-accent hover:text-accent-hover"
                >
                  Open on {source.name}
                </a>
              </div>
              {detail.isPending ? (
                <div aria-hidden className="space-y-3">
                  <div className="skeleton h-20 w-full rounded-xl" />
                  <div className="skeleton h-16 w-full rounded-xl" />
                </div>
              ) : comments.length > 0 ? (
                <>
                  <CommentList comments={comments} />
                  {article.commentCount > comments.length && (
                    <a
                      href={article.discussionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(SECONDARY_BUTTON, 'mt-4 w-full justify-center')}
                    >
                      Read all {article.commentCount} comments on {source.name}
                    </a>
                  )}
                </>
              ) : detail.isError ? null : (
                <p className="text-sm text-ink-subtle">No comments yet. Start the conversation on {source.name}.</p>
              )}
            </section>

            <p className="mt-10 hidden items-center gap-2 text-xs text-ink-subtle md:flex">
              <Kbd>←</Kbd>
              <Kbd>→</Kbd> switch posts
              <span aria-hidden className="mx-1">
                ·
              </span>
              <Kbd>Esc</Kbd> close
            </p>
          </article>
        </div>
      </div>
    </div>,
    document.body,
  );
}
