import { describe, expect, it } from 'vitest';
import { normalizeHnComment, normalizeHnHit, type HnHit } from './hackernews';

const hit: HnHit = {
  objectID: '50549017',
  title: 'Show HN: A tiny Postgres extension written in Rust',
  url: 'https://www.example.com/post',
  author: 'pg_fan',
  points: 230,
  num_comments: 87,
  created_at: '2026-11-18T09:30:00Z',
};

describe('normalizeHnHit', () => {
  it('maps a link story', () => {
    const article = normalizeHnHit(hit);
    expect(article).not.toBeNull();
    expect(article).toMatchObject({
      id: 'hackernews:50549017',
      source: 'hackernews',
      nativeId: '50549017',
      url: 'https://www.example.com/post',
      domain: 'example.com',
      discussionUrl: 'https://news.ycombinator.com/item?id=50549017',
      coverImage: null,
      score: 230,
      commentCount: 87,
      readingTimeMinutes: null,
      summary: null,
      author: { name: 'pg_fan', handle: 'pg_fan', profileUrl: 'https://news.ycombinator.com/user?id=pg_fan' },
    });
    expect(article?.tags).toEqual(expect.arrayContaining(['rust', 'database']));
  });

  it('links text posts to the discussion and builds a plain-text summary', () => {
    const article = normalizeHnHit({
      ...hit,
      title: 'Ask HN: How do you review AI-written code?',
      url: null,
      story_text: '<p>We&#x27;ve started using LLMs.<p>What works &amp; what doesn&#x27;t?',
    });
    expect(article?.url).toBe('https://news.ycombinator.com/item?id=50549017');
    expect(article?.domain).toBe('news.ycombinator.com');
    expect(article?.summary).toBe("We've started using LLMs. What works & what doesn't?");
    expect(article?.tags).toContain('ai');
  });

  it('drops deleted stories with no title', () => {
    expect(normalizeHnHit({ ...hit, title: null })).toBeNull();
    expect(normalizeHnHit({ ...hit, title: '   ' })).toBeNull();
  });

  it('treats missing counts as zero', () => {
    const article = normalizeHnHit({ ...hit, points: null, num_comments: undefined });
    expect(article?.score).toBe(0);
    expect(article?.commentCount).toBe(0);
  });
});

describe('normalizeHnComment', () => {
  it('skips deleted comments and counts live replies', () => {
    expect(
      normalizeHnComment({ id: 1, type: 'comment', author: null, text: null, created_at: '2026-11-18T10:00:00Z', children: [] }),
    ).toBeNull();

    const comment = normalizeHnComment({
      id: 2,
      type: 'comment',
      author: 'dang',
      text: '<p>Hello</p>',
      created_at: '2026-11-18T10:00:00Z',
      children: [
        { id: 3, type: 'comment', author: 'x', text: 'reply', created_at: '2026-11-18T10:01:00Z', children: [] },
        { id: 4, type: 'comment', author: null, text: null, created_at: '2026-11-18T10:02:00Z', children: [] },
      ],
    });
    expect(comment).toEqual({ id: '2', author: 'dang', html: '<p>Hello</p>', createdAt: '2026-11-18T10:00:00Z', replyCount: 1 });
  });
});
