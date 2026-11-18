import { sanitizeHtml } from '@/lib/sanitize';
import type { Article, ArticleComment, ArticleDetail } from '@/types/article';
import { adapters } from './sources';

/** Full body and top comments for the preview drawer, sanitized for rendering. */
export async function fetchArticleDetail(article: Article, signal?: AbortSignal): Promise<ArticleDetail> {
  const raw = await adapters[article.source].fetchDetail(article.nativeId, signal);
  const comments = raw.comments
    .map((comment): ArticleComment | null => {
      const html = sanitizeHtml(comment.html);
      return html ? { ...comment, html } : null;
    })
    .filter((comment): comment is ArticleComment => comment !== null);
  return { bodyHtml: sanitizeHtml(raw.bodyHtml), comments };
}
