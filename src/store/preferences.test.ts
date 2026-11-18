import { describe, expect, it } from 'vitest';
import { MAX_FOLLOWED_TAGS, sanitizePreferences } from './preferences';

describe('sanitizePreferences', () => {
  it('returns defaults for garbage', () => {
    expect(sanitizePreferences(null)).toEqual({
      sidebarCollapsed: false,
      enabledSources: ['devto', 'hackernews'],
      followedTags: [],
    });
  });

  it('drops unknown sources and restores all when none remain', () => {
    expect(sanitizePreferences({ enabledSources: ['reddit'] }).enabledSources).toEqual(['devto', 'hackernews']);
    expect(sanitizePreferences({ enabledSources: ['hackernews', 'hackernews', 'x'] }).enabledSources).toEqual([
      'hackernews',
    ]);
  });

  it('slugs, dedupes and caps followed tags', () => {
    const many = Array.from({ length: 20 }, (_, index) => `tag${index}`);
    expect(sanitizePreferences({ followedTags: ['Rust', 'rust', 42, '!!'] }).followedTags).toEqual(['rust']);
    expect(sanitizePreferences({ followedTags: many }).followedTags).toHaveLength(MAX_FOLLOWED_TAGS);
  });

  it('keeps a valid collapsed flag', () => {
    expect(sanitizePreferences({ sidebarCollapsed: true }).sidebarCollapsed).toBe(true);
    expect(sanitizePreferences({ sidebarCollapsed: 'yes' }).sidebarCollapsed).toBe(false);
  });
});
