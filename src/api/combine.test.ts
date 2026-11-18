import { describe, expect, it } from 'vitest';
import type { Article, SourcePage } from '@/types/article';
import { combineSourcePages } from './combine';

function article(id: string, source: Article['source'], publishedAt: string): Article {
  return {
    id,
    source,
    nativeId: id,
    title: id,
    summary: null,
    url: `https://example.com/${id}`,
    domain: 'example.com',
    discussionUrl: `https://example.com/${id}`,
    coverImage: null,
    tags: [],
    author: { name: 'a' },
    publishedAt,
    readingTimeMinutes: null,
    score: 0,
    commentCount: 0,
  };
}

const dev: SourcePage = {
  items: [article('d1', 'devto', '2026-11-18T08:00:00Z'), article('d2', 'devto', '2026-11-18T06:00:00Z')],
  hasMore: false,
};
const hn: SourcePage = {
  items: [article('h1', 'hackernews', '2026-11-18T09:00:00Z'), article('h2', 'hackernews', '2026-11-18T07:00:00Z')],
  hasMore: true,
};

describe('combineSourcePages', () => {
  it('sorts newest first for the date strategy', () => {
    const page = combineSourcePages(
      0,
      ['devto', 'hackernews'],
      [
        { status: 'fulfilled', value: dev },
        { status: 'fulfilled', value: hn },
      ],
      'date',
    );
    expect(page.items.map((item) => item.id)).toEqual(['h1', 'd1', 'h2', 'd2']);
    expect(page.hasMore).toBe(true);
    expect(page.failedSources).toEqual([]);
  });

  it('alternates sources for the interleave strategy', () => {
    const page = combineSourcePages(
      1,
      ['devto', 'hackernews'],
      [
        { status: 'fulfilled', value: dev },
        { status: 'fulfilled', value: hn },
      ],
      'interleave',
    );
    expect(page.page).toBe(1);
    expect(page.items.map((item) => item.id)).toEqual(['d1', 'h1', 'd2', 'h2']);
  });

  it('keeps working sources when one fails', () => {
    const page = combineSourcePages(
      0,
      ['devto', 'hackernews'],
      [
        { status: 'rejected', reason: new Error('DEV down') },
        { status: 'fulfilled', value: hn },
      ],
      'date',
    );
    expect(page.items.map((item) => item.id)).toEqual(['h1', 'h2']);
    expect(page.failedSources).toEqual(['devto']);
  });

  it('throws the first error when every source fails', () => {
    expect(() =>
      combineSourcePages(
        0,
        ['devto', 'hackernews'],
        [
          { status: 'rejected', reason: new Error('first') },
          { status: 'rejected', reason: new Error('second') },
        ],
        'date',
      ),
    ).toThrow('first');
  });

  it('removes duplicates', () => {
    const page = combineSourcePages(
      0,
      ['devto', 'hackernews'],
      [
        { status: 'fulfilled', value: dev },
        { status: 'fulfilled', value: { items: [dev.items[0]!], hasMore: false } },
      ],
      'interleave',
    );
    expect(page.items.map((item) => item.id)).toEqual(['d1', 'd2']);
  });
});
