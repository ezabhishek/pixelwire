import { formatDateTime, formatRelativeTime } from '@/lib/format';
import type { ArticleComment } from '@/types/article';

/** `html` is already sanitized by the data layer (api/detail.ts). */
export function CommentList({ comments }: { comments: readonly ArticleComment[] }) {
  return (
    <ul className="space-y-3">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-xl border border-line bg-surface-raised p-4">
          <div className="flex items-center gap-2 text-xs text-ink-subtle">
            <span className="font-semibold text-ink-muted">{comment.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)}>
              {formatRelativeTime(comment.createdAt)}
            </time>
          </div>
          <div className="article-prose mt-2 text-sm" dangerouslySetInnerHTML={{ __html: comment.html }} />
          {comment.replyCount > 0 && (
            <p className="mt-2 text-xs text-ink-subtle">
              {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
