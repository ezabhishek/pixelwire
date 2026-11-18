import { describe, expect, it } from 'vitest';
import type { Article } from '@/types/article';
import { interleave } from './collections';
import { formatCompactNumber, formatReadingTime, formatRelativeTime } from './format';
import { buildUrl, HttpError, retryDelayMs } from './http';
import { filterArticles, filterByTags, tokenize } from './search';
import { hnTermsForTags, inferTags, toTagSlug } from './tags';
import { decodeEntities, getDomain, stripHtml, truncate } from './text';

describe('text', () => {
  it('decodes numeric, hex and named entities', () => {
    expect(decodeEntities('Tom &amp; Jerry &#8212; &#x27;hi&#x27; &unknown;')).toBe("Tom & Jerry — 'hi' &unknown;");
  });
  it('strips tags into one line', () => {
    expect(stripHtml('<p>One</p><p>Two<br>three</p>')).toBe('One Two three');
  });
  it('truncates on a word boundary', () => {
    expect(truncate('the quick brown fox jumps', 16)).toBe('the quick brown…');
    expect(truncate('short', 16)).toBe('short');
  });
  it('extracts the domain', () => {
    expect(getDomain('https://www.github.com/a/b')).toBe('github.com');
    expect(getDomain('not a url')).toBeNull();
  });
});

describe('format', () => {
  const now = Date.parse('2026-11-18T12:00:00Z');
  it('formats relative times', () => {
    expect(formatRelativeTime('2026-11-18T11:59:30Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-11-18T10:00:00Z', now)).toBe(
      new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' }).format(-2, 'hour'),
    );
    expect(formatRelativeTime('garbage', now)).toBe('');
  });
  it('formats numbers and reading time', () => {
    expect(formatCompactNumber(1234)).toBe('1.2K');
    expect(formatReadingTime(4.4)).toBe('4 min read');
    expect(formatReadingTime(0)).toBeNull();
    expect(formatReadingTime(null)).toBeNull();
  });
});

describe('http', () => {
  it('builds URLs and skips empty params', () => {
    expect(buildUrl('https://api.test/v1', 'items', { a: 1, b: '', c: undefined, d: 'x y' })).toBe(
      'https://api.test/v1/items?a=1&d=x+y',
    );
  });
  it('flags retryable errors', () => {
    expect(new HttpError('x', 503, 'u').isRetryable).toBe(true);
    expect(new HttpError('x', 429, 'u').isRetryable).toBe(true);
    expect(new HttpError('x', 0, 'u').isRetryable).toBe(true);
    expect(new HttpError('x', 404, 'u').isRetryable).toBe(false);
  });
  it('waits for Retry-After, capped, or backs off', () => {
    expect(retryDelayMs('1', 0)).toBe(1000);
    expect(retryDelayMs('60', 0)).toBe(3000);
    expect(retryDelayMs(null, 0)).toBe(600);
    expect(retryDelayMs('soon', 1)).toBe(1200);
  });
});

describe('tags', () => {
  it('infers tags from titles without false positives on common words', () => {
    expect(inferTags('Why we rewrote our Postgres proxy in Rust')).toEqual(['rust', 'database']);
    expect(inferTags('Let us go for a walk')).toEqual([]);
    expect(inferTags('Claude and GPT-5 compared')).toEqual(['ai']);
  });
  it('maps followed tags to HN search terms', () => {
    expect(hnTermsForTags(['rust', 'ai', 'customtag'])).toEqual(['Rust', 'AI', 'LLM', 'customtag']);
  });
  it('slugs input', () => {
    expect(toTagSlug('Node.js!')).toBe('nodejs');
  });
});

describe('collections', () => {
  it('interleaves uneven lists', () => {
    expect(interleave<number | string>([[1, 2, 3], ['a']])).toEqual([1, 'a', 2, 3]);
  });
});

describe('search', () => {
  const make = (id: string, title: string, tags: string[]): Article => ({
    id,
    source: 'devto',
    nativeId: id,
    title,
    summary: null,
    url: 'https://dev.to/x',
    domain: 'dev.to',
    discussionUrl: 'https://dev.to/x',
    coverImage: null,
    tags,
    author: { name: 'Ada Lovelace', handle: 'ada' },
    publishedAt: '2026-11-18T00:00:00Z',
    readingTimeMinutes: null,
    score: 0,
    commentCount: 0,
  });
  const items = [make('1', 'Async Rust explained', ['rust']), make('2', 'CSS grid tricks', ['css'])];

  it('tokenizes and strips hash prefixes', () => {
    expect(tokenize('  #Rust   async ')).toEqual(['rust', 'async']);
  });
  it('requires every token to match', () => {
    expect(filterArticles(items, 'rust async').map((a) => a.id)).toEqual(['1']);
    expect(filterArticles(items, 'ada').map((a) => a.id)).toEqual(['1', '2']);
    expect(filterArticles(items, 'rust css')).toEqual([]);
    expect(filterArticles(items, '   ')).toHaveLength(2);
  });
  it('matches at word starts only', () => {
    const trusted = [make('3', 'Becoming a trusted member', ['trusted']), make('4', 'Notes on rust-lang', [])];
    expect(filterArticles(trusted, 'rust').map((a) => a.id)).toEqual(['4']);
    expect(filterArticles(trusted, 'trust').map((a) => a.id)).toEqual(['3']);
    expect(filterArticles(trusted, 'c++').map((a) => a.id)).toEqual([]);
  });
  it('filters by any matching tag', () => {
    expect(filterByTags(items, ['css', 'go']).map((a) => a.id)).toEqual(['2']);
    expect(filterByTags(items, [])).toHaveLength(2);
  });
});
