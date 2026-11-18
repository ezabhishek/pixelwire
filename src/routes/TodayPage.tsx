import { ChevronLeft, ChevronRight, Cpu, Sparkles } from 'lucide-react';
import { useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isDigestDate } from '@/api/digest';
import { BookmarkButton, CommentsLink, OpenLink, UpvoteButton } from '@/components/feed/ArticleActions';
import { SourceBadge } from '@/components/feed/SourceBadge';
import { EmptyState, ErrorState, PRIMARY_BUTTON } from '@/components/feed/States';
import { TagList } from '@/components/feed/TagList';
import { PageContainer, PageHeader } from '@/components/layout/Page';
import { useDigest, useDigestIndex } from '@/hooks/useDigest';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import { NotFoundPage } from '@/routes/NotFoundPage';
import { usePreview } from '@/store/preview';
import type { Article } from '@/types/article';
import type { Digest, DigestItem } from '@/types/digest';

const longDate = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** Digest dates are calendar dates (yyyy-mm-dd), so format them in UTC to avoid shifting a day. */
function formatDigestDate(date: string): string {
  return longDate.format(new Date(`${date}T00:00:00Z`));
}

function DigestSkeleton() {
  return (
    <div aria-hidden className="space-y-4">
      <div className="skeleton h-24 w-full rounded-card" />
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="skeleton h-36 w-full rounded-card" />
      ))}
    </div>
  );
}

function DigestEntry({ item, onOpen }: { item: DigestItem; onOpen: (article: Article) => void }) {
  const { article } = item;
  return (
    <li className="group relative flex gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-colors hover:border-line-strong hover:bg-surface-raised sm:gap-5 sm:p-5">
      <span aria-hidden className="w-7 shrink-0 pt-0.5 text-right font-mono text-xl font-semibold text-ink-subtle sm:w-9 sm:text-2xl">
        {item.rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-subtle">
          <SourceBadge source={article.source} />
          {article.domain && <span className="truncate font-mono">{article.domain}</span>}
          <span aria-hidden>·</span>
          <time dateTime={article.publishedAt} title={formatDateTime(article.publishedAt)}>
            {formatRelativeTime(article.publishedAt)}
          </time>
        </div>
        <h2 className="mt-2 text-[1.05rem] font-semibold leading-snug text-ink">
          <span className="sr-only">{item.rank}. </span>
          <button
            type="button"
            onClick={() => onOpen(article)}
            className="text-left after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
          >
            {article.title}
          </button>
        </h2>
        {item.summary && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.summary}</p>}
        {item.why && (
          <p className="mt-2 text-sm leading-relaxed text-ink">
            <span className="font-semibold text-accent">Why it matters: </span>
            {item.why}
          </p>
        )}
        <TagList tags={article.tags} max={4} className="relative z-10 mt-3" />
        <div className="relative z-10 -mx-1 mt-3 flex items-center gap-0.5">
          <UpvoteButton article={article} />
          <CommentsLink article={article} />
          <span className="flex-1" />
          <BookmarkButton article={article} />
          <OpenLink article={article} />
        </div>
      </div>
    </li>
  );
}

function DateNav({ current, dates }: { current: string; dates: string[] }) {
  const index = dates.indexOf(current);
  const older = index === -1 ? undefined : dates[index + 1];
  const newer = index > 0 ? dates[index - 1] : undefined;
  const link = 'inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink';
  const disabled = 'pointer-events-none opacity-40';
  return (
    <nav aria-label="Digest dates" className="flex items-center gap-2">
      {older ? (
        <Link to={`/today/${older}`} className={link} title={formatDigestDate(older)}>
          <ChevronLeft aria-hidden className="size-4" /> Older
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(link, disabled)}>
          <ChevronLeft aria-hidden className="size-4" /> Older
        </span>
      )}
      {newer ? (
        <Link to={index === 1 ? '/today' : `/today/${newer}`} className={link} title={formatDigestDate(newer)}>
          Newer <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(link, disabled)}>
          Newer <ChevronRight aria-hidden className="size-4" />
        </span>
      )}
    </nav>
  );
}

function DigestView({ digest, dates }: { digest: Digest; dates: string[] }) {
  const openPreview = usePreview((state) => state.open);
  const articles = digest.items.map((item) => item.article);
  const onOpen = useCallback((article: Article) => openPreview(article, articles), [openPreview, articles]);

  return (
    <>
      <section aria-label="Introduction" className="mb-6 rounded-card border border-accent/25 bg-accent-soft p-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-accent">
          <Sparkles aria-hidden className="size-4" />
          {digest.items.length} picks from {digest.stats.fetched} posts
        </p>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">{digest.intro}</p>
      </section>

      <ol className="space-y-3" aria-label="Today's picks">
        {digest.items.map((item) => (
          <DigestEntry key={item.article.id} item={item} onOpen={onOpen} />
        ))}
      </ol>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <p className="flex max-w-2xl items-start gap-2 text-xs leading-relaxed text-ink-subtle">
          <Cpu aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Scored by {digest.models.score}, summarized by {digest.models.summary} and edited by {digest.models.editor}, running
            locally. Summaries are AI-written and can contain mistakes, so check the source before relying on them.
          </span>
        </p>
        <DateNav current={digest.date} dates={dates} />
      </footer>
    </>
  );
}

export function TodayPage() {
  const { date } = useParams<{ date?: string }>();
  const validDate = date === undefined || isDigestDate(date);
  const digest = useDigest(validDate ? date : undefined);
  const index = useDigestIndex();
  const data = digest.data;

  useDocumentTitle(!validDate ? 'Page not found' : date ? `Digest ${date}` : 'Today');

  if (!validDate) return <NotFoundPage />;

  const title = !date ? "Today's digest" : 'Daily digest';
  const description = data ? formatDigestDate(data.date) : date ? formatDigestDate(date) : 'Picked and summarized every morning at 7:00 IST.';

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title={title} description={description} />

      {digest.isPending ? (
        <DigestSkeleton />
      ) : digest.isError ? (
        <ErrorState error={digest.error} onRetry={() => void digest.refetch()} />
      ) : data ? (
        <DigestView digest={data} dates={index.data?.dates ?? [data.date]} />
      ) : (
        <EmptyState
          icon={Sparkles}
          title={date ? 'No digest for this day' : 'No digest yet'}
          description={
            date
              ? "The digest wasn't published that day."
              : 'A new digest of the best developer posts is published every morning at 7:00 IST.'
          }
          action={
            <Link to={date ? '/today' : '/'} className={PRIMARY_BUTTON}>
              {date ? 'Latest digest' : 'Browse the live feed'}
            </Link>
          }
        />
      )}
    </PageContainer>
  );
}
