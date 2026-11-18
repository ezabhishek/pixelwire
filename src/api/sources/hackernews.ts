import { env } from '@/config/env';
import { buildUrl, getJson } from '@/lib/http';
import { hnTermsForTags, inferTags } from '@/lib/tags';
import { decodeEntities, getDomain, stripHtml, truncate } from '@/lib/text';
import type { Article, ArticleComment, ArticleDetail, SourcePage } from '@/types/article';
import { PAGE_SIZE, type FeedParams, type SearchParams, type SourceAdapter } from '../types';

const POPULAR_WINDOW_SECONDS = 7 * 24 * 60 * 60;
/** Hides brand-new submissions nobody has voted on yet from "Latest". */
const LATEST_MIN_POINTS = 3;
const SUMMARY_LENGTH = 280;
const MAX_COMMENTS = 10;

export interface HnHit {
  objectID: string;
  title?: string | null;
  url?: string | null;
  author: string;
  points?: number | null;
  num_comments?: number | null;
  created_at: string;
  story_text?: string | null;
  _tags?: string[];
}

export interface HnSearchResponse {
  hits: HnHit[];
  page: number;
  nbPages: number;
}

export interface HnItem {
  id: number;
  type: string;
  author: string | null;
  text: string | null;
  created_at: string;
  children: HnItem[];
}

export function hnItemUrl(id: string): string {
  return `https://news.ycombinator.com/item?id=${encodeURIComponent(id)}`;
}

/** Returns null for hits with no title (deleted or dead stories). */
export function normalizeHnHit(hit: HnHit): Article | null {
  const title = hit.title?.trim();
  if (!title) return null;
  const discussionUrl = hnItemUrl(hit.objectID);
  const externalUrl = hit.url?.trim() || null;
  const summaryText = hit.story_text ? stripHtml(hit.story_text) : '';
  const summary = summaryText ? truncate(summaryText, SUMMARY_LENGTH) : null;
  const decodedTitle = decodeEntities(title);

  return {
    id: `hackernews:${hit.objectID}`,
    source: 'hackernews',
    nativeId: hit.objectID,
    title: decodedTitle,
    summary,
    url: externalUrl ?? discussionUrl,
    domain: externalUrl ? getDomain(externalUrl) : 'news.ycombinator.com',
    discussionUrl,
    coverImage: null,
    tags: inferTags(`${decodedTitle} ${summaryText}`),
    author: {
      name: hit.author,
      handle: hit.author,
      profileUrl: `https://news.ycombinator.com/user?id=${encodeURIComponent(hit.author)}`,
    },
    publishedAt: hit.created_at,
    readingTimeMinutes: null,
    score: hit.points ?? 0,
    commentCount: hit.num_comments ?? 0,
  };
}

function countReplies(item: HnItem): number {
  return item.children.reduce((total, child) => total + (child.text ? 1 : 0) + countReplies(child), 0);
}

export function normalizeHnComment(item: HnItem): ArticleComment | null {
  if (!item.text || !item.author) return null;
  return {
    id: String(item.id),
    author: item.author,
    html: item.text,
    createdAt: item.created_at,
    replyCount: countReplies(item),
  };
}

function toPage(response: HnSearchResponse): SourcePage {
  const items = response.hits.map(normalizeHnHit).filter((item): item is Article => item !== null);
  return { items, hasMore: response.page < response.nbPages - 1 };
}

/** Rounded to the hour so consecutive pages use the same time window. */
function popularSince(): number {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.floor((nowSeconds - POPULAR_WINDOW_SECONDS) / 3600) * 3600;
}

async function fetchFeed({ page, mode, tags, signal }: FeedParams): Promise<SourcePage> {
  const path = mode === 'latest' ? '/search_by_date' : '/search';
  const numericFilters = mode === 'latest' ? `points>=${LATEST_MIN_POINTS}` : `created_at_i>${popularSince()}`;
  const terms = hnTermsForTags(tags).join(' ');

  const url = buildUrl(env.hnApiBase, path, {
    tags: 'story',
    page,
    hitsPerPage: PAGE_SIZE,
    numericFilters,
    query: terms || undefined,
    // Every term optional → a story matching any one followed tag is kept.
    optionalWords: terms || undefined,
    restrictSearchableAttributes: terms ? 'title' : undefined,
  });
  return toPage(await getJson<HnSearchResponse>(url, { signal }));
}

async function search({ query, page, signal }: SearchParams): Promise<SourcePage> {
  const url = buildUrl(env.hnApiBase, '/search', {
    query: query.trim(),
    tags: 'story',
    page,
    hitsPerPage: PAGE_SIZE,
  });
  return toPage(await getJson<HnSearchResponse>(url, { signal }));
}

async function fetchDetail(nativeId: string, signal?: AbortSignal): Promise<ArticleDetail> {
  const item = await getJson<HnItem>(buildUrl(env.hnApiBase, `/items/${encodeURIComponent(nativeId)}`), { signal });
  const comments = item.children
    .map(normalizeHnComment)
    .filter((comment): comment is ArticleComment => comment !== null)
    .slice(0, MAX_COMMENTS);
  return { bodyHtml: item.text, comments };
}

export const hackerNewsAdapter: SourceAdapter = {
  id: 'hackernews',
  fetchFeed,
  search,
  fetchDetail,
};
