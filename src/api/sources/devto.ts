import { env } from '@/config/env';
import { dedupeById, interleave } from '@/lib/collections';
import { buildUrl, getJson } from '@/lib/http';
import { toTagSlug } from '@/lib/tags';
import { decodeEntities } from '@/lib/text';
import type { Article, ArticleComment, ArticleDetail, SourcePage } from '@/types/article';
import { PAGE_SIZE, type FeedParams, type SearchParams, type SourceAdapter } from '../types';

/** DEV only filters by one tag per request, so cap the fan-out. */
const MAX_TAG_REQUESTS = 4;
const POPULAR_WINDOW_DAYS = 7;
const MAX_COMMENTS = 10;

export interface DevtoUser {
  name: string;
  username: string;
  profile_image_90?: string | null;
}

export interface DevtoArticle {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  cover_image?: string | null;
  /** An array in list responses, a comma-separated string in detail responses. */
  tag_list?: string[] | string;
  tags?: string[] | string;
  reading_time_minutes?: number | null;
  public_reactions_count?: number;
  positive_reactions_count?: number;
  comments_count?: number;
  published_timestamp?: string;
  published_at?: string | null;
  user: DevtoUser;
}

export interface DevtoArticleDetail extends DevtoArticle {
  body_html?: string | null;
}

export interface DevtoComment {
  id_code: string;
  body_html: string;
  created_at: string;
  user: { name: string; username: string };
  children?: DevtoComment[];
}

function parseTags(value: string[] | string | undefined): string[] {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const slugs = list.map((tag) => toTagSlug(tag.trim())).filter((tag) => tag.length > 0);
  return [...new Set(slugs)];
}

export function normalizeDevtoArticle(raw: DevtoArticle): Article {
  const description = raw.description?.trim();
  const username = raw.user.username;
  return {
    id: `devto:${raw.id}`,
    source: 'devto',
    nativeId: String(raw.id),
    title: decodeEntities(raw.title.trim()),
    summary: description ? decodeEntities(description) : null,
    url: raw.url,
    domain: 'dev.to',
    discussionUrl: `${raw.url}#comments`,
    coverImage: raw.cover_image || null,
    tags: parseTags(raw.tag_list ?? raw.tags),
    author: {
      name: raw.user.name?.trim() || username,
      handle: username,
      avatarUrl: raw.user.profile_image_90 || undefined,
      profileUrl: `https://dev.to/${username}`,
    },
    publishedAt: raw.published_timestamp ?? raw.published_at ?? new Date(0).toISOString(),
    readingTimeMinutes: raw.reading_time_minutes ?? null,
    score: raw.public_reactions_count ?? raw.positive_reactions_count ?? 0,
    commentCount: raw.comments_count ?? 0,
  };
}

function countReplies(comment: DevtoComment): number {
  return (comment.children ?? []).reduce((total, child) => total + 1 + countReplies(child), 0);
}

export function normalizeDevtoComment(raw: DevtoComment): ArticleComment {
  return {
    id: raw.id_code,
    author: raw.user.name?.trim() || raw.user.username,
    html: raw.body_html,
    createdAt: raw.created_at,
    replyCount: countReplies(raw),
  };
}

async function fetchList(params: Record<string, string | number | undefined>, path: string, signal?: AbortSignal) {
  return getJson<DevtoArticle[]>(buildUrl(env.devtoApiBase, path, params), { signal });
}

async function fetchFeed({ page, mode, tags, signal }: FeedParams): Promise<SourcePage> {
  const devPage = page + 1;
  const top = mode === 'popular' ? POPULAR_WINDOW_DAYS : undefined;

  if (tags.length === 0) {
    const raw =
      mode === 'latest'
        ? await fetchList({ page: devPage, per_page: PAGE_SIZE }, '/articles/latest', signal)
        : await fetchList({ page: devPage, per_page: PAGE_SIZE, top }, '/articles', signal);
    return { items: raw.map(normalizeDevtoArticle), hasMore: raw.length >= PAGE_SIZE };
  }

  const selected = tags.slice(0, MAX_TAG_REQUESTS);
  const perTag = Math.max(8, Math.ceil(PAGE_SIZE / selected.length));
  const results = await Promise.allSettled(
    selected.map((tag) => fetchList({ page: devPage, per_page: perTag, tag, top }, '/articles', signal)),
  );

  const lists: DevtoArticle[][] = [];
  let firstError: unknown;
  for (const result of results) {
    if (result.status === 'fulfilled') lists.push(result.value);
    else firstError ??= result.reason;
  }
  if (lists.length === 0) throw firstError;

  const items = dedupeById(interleave(lists.map((list) => list.map(normalizeDevtoArticle))));
  return { items, hasMore: lists.some((list) => list.length >= perTag) };
}

/**
 * DEV's public API has no full-text search, so a single-word query is tried
 * as a tag ("rust" → #rust). Anything else returns nothing from DEV; the
 * client-side filter still covers DEV posts already loaded.
 */
async function search({ query, page, signal }: SearchParams): Promise<SourcePage> {
  const trimmed = query.trim();
  if (/\s/.test(trimmed)) return { items: [], hasMore: false };
  const slug = toTagSlug(trimmed);
  if (slug.length < 2) return { items: [], hasMore: false };
  const raw = await fetchList({ page: page + 1, per_page: PAGE_SIZE, tag: slug }, '/articles', signal);
  return { items: raw.map(normalizeDevtoArticle), hasMore: raw.length >= PAGE_SIZE };
}

async function fetchDetail(nativeId: string, signal?: AbortSignal): Promise<ArticleDetail> {
  const [article, comments] = await Promise.all([
    getJson<DevtoArticleDetail>(buildUrl(env.devtoApiBase, `/articles/${encodeURIComponent(nativeId)}`), { signal }),
    getJson<DevtoComment[]>(buildUrl(env.devtoApiBase, '/comments', { a_id: nativeId }), { signal }).catch(
      (): DevtoComment[] => [],
    ),
  ]);
  return {
    bodyHtml: article.body_html ?? null,
    comments: comments
      .filter((comment) => comment.body_html.trim().length > 0)
      .slice(0, MAX_COMMENTS)
      .map(normalizeDevtoComment),
  };
}

export const devtoAdapter: SourceAdapter = {
  id: 'devto',
  fetchFeed,
  search,
  fetchDetail,
};
