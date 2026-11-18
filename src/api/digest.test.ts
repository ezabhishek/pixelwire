import { describe, expect, it } from 'vitest';
import { isDigestDate, parseArticle, parseDigest, parseDigestIndex } from './digest';

const article = {
  id: 'hackernews:1',
  source: 'hackernews',
  nativeId: '1',
  title: 'Unauthenticated RCE in a web server',
  summary: null,
  url: 'https://example.com/post',
  domain: 'example.com',
  discussionUrl: 'https://news.ycombinator.com/item?id=1',
  coverImage: null,
  tags: ['security'],
  author: { name: 'pg', handle: 'pg', profileUrl: 'https://news.ycombinator.com/user?id=pg' },
  publishedAt: '2026-11-19T01:00:00Z',
  readingTimeMinutes: null,
  score: 300,
  commentCount: 120,
};

const digest = {
  version: 1,
  date: '2026-11-19',
  generatedAt: '2026-11-19T01:33:00Z',
  intro: 'Security day.',
  items: [
    { rank: 2, summary: 'Second.', why: null, quality: 8, article: { ...article, id: 'hackernews:2', nativeId: '2' } },
    { rank: 1, summary: 'First.', why: 'Patch now.', quality: 9, article },
  ],
  stats: { fetched: 60, shortlisted: 20, published: 2 },
  models: { score: 'qwen3.5:4b', summary: 'qwen3:8b', editor: 'gemma4:12b' },
};

describe('parseDigest', () => {
  it('accepts a valid digest and orders items by rank', () => {
    const parsed = parseDigest(digest);
    expect(parsed?.items.map((item) => item.article.id)).toEqual(['hackernews:1', 'hackernews:2']);
    expect(parsed?.items[0]?.why).toBe('Patch now.');
    expect(parsed?.items[1]?.why).toBeNull();
    expect(parsed?.models.editor).toBe('gemma4:12b');
  });

  it('rejects wrong versions, bad dates and empty item lists', () => {
    expect(parseDigest({ ...digest, version: 2 })).toBeNull();
    expect(parseDigest({ ...digest, date: '19-11-2026' })).toBeNull();
    expect(parseDigest({ ...digest, items: [] })).toBeNull();
    expect(parseDigest('nope')).toBeNull();
  });

  it('skips invalid items and renumbers the rest', () => {
    const parsed = parseDigest({ ...digest, items: [{ rank: 1, article: { title: 'no id' } }, digest.items[0]] });
    expect(parsed?.items).toHaveLength(1);
    expect(parsed?.items[0]?.rank).toBe(1);
  });
});

describe('parseArticle', () => {
  it('refuses non-http links so nothing unsafe reaches an href', () => {
    expect(parseArticle({ ...article, url: 'javascript:alert(1)' })).toBeNull();
    expect(parseArticle({ ...article, coverImage: 'data:image/png;base64,AAA' })?.coverImage).toBeNull();
    expect(parseArticle({ ...article, author: { name: 'x', profileUrl: 'javascript:void(0)' } })?.author.profileUrl).toBeUndefined();
  });

  it('refuses unknown sources', () => {
    expect(parseArticle({ ...article, source: 'reddit' })).toBeNull();
  });
});

describe('parseDigestIndex', () => {
  it('keeps valid dates, newest first, without duplicates', () => {
    expect(parseDigestIndex({ dates: ['2026-11-18', 'bad', '2026-11-19', '2026-11-18'] })).toEqual({
      dates: ['2026-11-19', '2026-11-18'],
    });
    expect(parseDigestIndex(null)).toEqual({ dates: [] });
  });

  it('validates date strings', () => {
    expect(isDigestDate('2026-11-19')).toBe(true);
    expect(isDigestDate('2026-13-40')).toBe(false);
  });
});
