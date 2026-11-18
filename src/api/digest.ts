import { isSourceId } from '@/config/sources';
import { HttpError } from '@/lib/http';
import type { Article } from '@/types/article';
import type { Digest, DigestIndex, DigestItem } from '@/types/digest';

/**
 * The digest files are static JSON in public/digest/, committed daily by the
 * n8n workflow. They are validated here anyway: they are produced by a
 * language model pipeline, and every URL ends up in an href.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDigestDate(value: string): boolean {
  return DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null && !Array.isArray(value);
const str = (value: unknown): string | null => (typeof value === 'string' && value.trim().length > 0 ? value : null);
const num = (value: unknown, fallback = 0): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
const httpUrl = (value: unknown): string | null => {
  const url = str(value);
  return url && /^https?:\/\//i.test(url) ? url : null;
};

export function parseArticle(value: unknown): Article | null {
  if (!isObject(value)) return null;
  const id = str(value.id);
  const nativeId = str(value.nativeId);
  const title = str(value.title);
  const url = httpUrl(value.url);
  const discussionUrl = httpUrl(value.discussionUrl);
  const publishedAt = str(value.publishedAt);
  if (!id || !nativeId || !title || !url || !discussionUrl || !publishedAt || !isSourceId(value.source)) return null;

  const author = isObject(value.author) ? value.author : {};
  const tags = Array.isArray(value.tags) ? value.tags.filter((tag): tag is string => typeof tag === 'string') : [];

  return {
    id,
    source: value.source,
    nativeId,
    title,
    summary: str(value.summary),
    url,
    domain: str(value.domain),
    discussionUrl,
    coverImage: httpUrl(value.coverImage),
    tags,
    author: {
      name: str(author.name) ?? 'unknown',
      handle: str(author.handle) ?? undefined,
      avatarUrl: httpUrl(author.avatarUrl) ?? undefined,
      profileUrl: httpUrl(author.profileUrl) ?? undefined,
    },
    publishedAt,
    readingTimeMinutes: typeof value.readingTimeMinutes === 'number' ? value.readingTimeMinutes : null,
    score: num(value.score),
    commentCount: num(value.commentCount),
  };
}

function parseItem(value: unknown): DigestItem | null {
  if (!isObject(value)) return null;
  const article = parseArticle(value.article);
  if (!article) return null;
  return {
    rank: num(value.rank),
    summary: str(value.summary) ?? article.summary ?? '',
    why: str(value.why),
    quality: num(value.quality),
    article,
  };
}

/** Returns null when the document is not a usable digest. Invalid items are skipped. */
export function parseDigest(value: unknown): Digest | null {
  if (!isObject(value) || value.version !== 1) return null;
  const date = str(value.date);
  if (!date || !isDigestDate(date) || !Array.isArray(value.items)) return null;

  const items = value.items
    .map(parseItem)
    .filter((item): item is DigestItem => item !== null)
    .sort((a, b) => a.rank - b.rank)
    .map((item, index) => ({ ...item, rank: index + 1 }));
  if (items.length === 0) return null;

  const stats = isObject(value.stats) ? value.stats : {};
  const models = isObject(value.models) ? value.models : {};

  return {
    version: 1,
    date,
    generatedAt: str(value.generatedAt) ?? `${date}T00:00:00Z`,
    intro: str(value.intro) ?? '',
    items,
    stats: {
      fetched: num(stats.fetched, items.length),
      shortlisted: num(stats.shortlisted, items.length),
      published: items.length,
    },
    models: {
      score: str(models.score) ?? 'unknown',
      summary: str(models.summary) ?? 'unknown',
      editor: str(models.editor) ?? 'unknown',
    },
  };
}

export function parseDigestIndex(value: unknown): DigestIndex {
  if (!isObject(value) || !Array.isArray(value.dates)) return { dates: [] };
  const dates = value.dates.filter((date): date is string => typeof date === 'string' && isDigestDate(date));
  return { dates: [...new Set(dates)].sort().reverse() };
}

/**
 * Fetch a file from /digest/. Resolves to null when it doesn't exist yet;
 * a missing file can come back as a 404 or (on a dev server) as the SPA's
 * HTML fallback, so anything that isn't JSON counts as missing.
 */
async function fetchDigestJson(file: string, signal?: AbortSignal): Promise<unknown | null> {
  const url = `/digest/${file}`;
  let response: Response;
  try {
    response = await fetch(url, { signal, headers: { Accept: 'application/json' }, cache: 'no-cache' });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new HttpError("Couldn't reach the site", 0, url);
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new HttpError(`Request failed with status ${response.status}`, response.status, url);
  if (!(response.headers.get('content-type') ?? '').includes('json')) return null;
  try {
    return await response.json();
  } catch {
    throw new HttpError('The digest file is not valid JSON', response.status, url);
  }
}

/** `date` is yyyy-mm-dd, or omitted for the latest digest. */
export async function fetchDigest(date: string | undefined, signal?: AbortSignal): Promise<Digest | null> {
  const raw = await fetchDigestJson(date ? `${date}.json` : 'latest.json', signal);
  return raw === null ? null : parseDigest(raw);
}

export async function fetchDigestIndex(signal?: AbortSignal): Promise<DigestIndex> {
  return parseDigestIndex(await fetchDigestJson('index.json', signal));
}
