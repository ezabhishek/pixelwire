import type { Article } from '@/types/article';
import { SOURCES } from '@/config/sources';

/** Split a query into lowercase words, dropping a leading '#' on tag words. */
export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^#/, ''))
    .filter((token) => token.length > 0);
}

function haystack(article: Article): string {
  return [
    article.title,
    article.summary ?? '',
    article.tags.join(' '),
    article.author.name,
    article.author.handle ?? '',
    article.domain ?? '',
    SOURCES[article.source].name,
  ]
    .join(' ')
    .toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Matches the token at the start of a word, so "rust" finds "rust-lang" but not "trusted". */
function wordStartPattern(token: string): RegExp {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}`);
}

/** True when every word of the query starts a word somewhere in the article. */
export function matchesQuery(article: Article, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true;
  const text = haystack(article);
  return tokens.every((token) => wordStartPattern(token).test(text));
}

/** Instant client-side filter over already-loaded articles. */
export function filterArticles(articles: readonly Article[], query: string): Article[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [...articles];
  return articles.filter((article) => matchesQuery(article, tokens));
}

/** Keep only articles carrying at least one of the given tags. */
export function filterByTags(articles: readonly Article[], tags: readonly string[]): Article[] {
  if (tags.length === 0) return [...articles];
  const wanted = new Set(tags);
  return articles.filter((article) => article.tags.some((tag) => wanted.has(tag)));
}
