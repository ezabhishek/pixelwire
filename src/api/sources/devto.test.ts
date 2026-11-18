import { describe, expect, it } from 'vitest';
import { normalizeDevtoArticle, normalizeDevtoComment, type DevtoArticle } from './devto';

const base: DevtoArticle = {
  id: 42,
  title: '  Building a CLI in Rust &amp; Go  ',
  description: 'A tour of argument parsing &#8212; with examples.',
  url: 'https://dev.to/jane/building-a-cli-1abc',
  cover_image: 'https://media.dev.to/cover.png',
  tag_list: ['rust', 'Go', 'cli'],
  reading_time_minutes: 6,
  public_reactions_count: 120,
  positive_reactions_count: 110,
  comments_count: 9,
  published_timestamp: '2026-11-18T10:00:00Z',
  user: { name: 'Jane Doe', username: 'jane', profile_image_90: 'https://media.dev.to/jane.png' },
};

describe('normalizeDevtoArticle', () => {
  it('maps every field into the shared Article shape', () => {
    expect(normalizeDevtoArticle(base)).toEqual({
      id: 'devto:42',
      source: 'devto',
      nativeId: '42',
      title: 'Building a CLI in Rust & Go',
      summary: 'A tour of argument parsing — with examples.',
      url: 'https://dev.to/jane/building-a-cli-1abc',
      domain: 'dev.to',
      discussionUrl: 'https://dev.to/jane/building-a-cli-1abc#comments',
      coverImage: 'https://media.dev.to/cover.png',
      tags: ['rust', 'go', 'cli'],
      author: {
        name: 'Jane Doe',
        handle: 'jane',
        avatarUrl: 'https://media.dev.to/jane.png',
        profileUrl: 'https://dev.to/jane',
      },
      publishedAt: '2026-11-18T10:00:00Z',
      readingTimeMinutes: 6,
      score: 120,
      commentCount: 9,
    });
  });

  it('parses the comma-separated tag string used by the detail endpoint', () => {
    const article = normalizeDevtoArticle({ ...base, tag_list: 'webdev, javascript,  ,react' });
    expect(article.tags).toEqual(['webdev', 'javascript', 'react']);
  });

  it('falls back sensibly when optional fields are missing', () => {
    const article = normalizeDevtoArticle({
      ...base,
      description: '   ',
      cover_image: null,
      tag_list: undefined,
      reading_time_minutes: null,
      public_reactions_count: undefined,
      positive_reactions_count: 7,
      comments_count: undefined,
      published_timestamp: undefined,
      published_at: '2026-01-01T00:00:00Z',
      user: { name: '', username: 'anon' },
    });
    expect(article.summary).toBeNull();
    expect(article.coverImage).toBeNull();
    expect(article.tags).toEqual([]);
    expect(article.readingTimeMinutes).toBeNull();
    expect(article.score).toBe(7);
    expect(article.commentCount).toBe(0);
    expect(article.publishedAt).toBe('2026-01-01T00:00:00Z');
    expect(article.author.name).toBe('anon');
    expect(article.author.avatarUrl).toBeUndefined();
  });
});

describe('normalizeDevtoComment', () => {
  it('counts nested replies', () => {
    const comment = normalizeDevtoComment({
      id_code: 'c1',
      body_html: '<p>Nice</p>',
      created_at: '2026-11-18T11:00:00Z',
      user: { name: 'Sam', username: 'sam' },
      children: [
        {
          id_code: 'c2',
          body_html: '<p>Agreed</p>',
          created_at: '2026-11-18T11:05:00Z',
          user: { name: '', username: 'lee' },
          children: [
            { id_code: 'c3', body_html: '<p>+1</p>', created_at: '2026-11-18T11:06:00Z', user: { name: 'A', username: 'a' } },
          ],
        },
      ],
    });
    expect(comment).toEqual({
      id: 'c1',
      author: 'Sam',
      html: '<p>Nice</p>',
      createdAt: '2026-11-18T11:00:00Z',
      replyCount: 2,
    });
  });
});
