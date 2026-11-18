import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Article } from '@/types/article';
import { persistentStorage } from './storage';

/**
 * Bookmarks and upvotes live on this device. Each entry keeps a copy of the
 * article so the Bookmarks and Upvoted pages work without refetching.
 */
export interface SavedEntry {
  article: Article;
  savedAt: string;
}

export interface LibraryState {
  bookmarks: Record<string, SavedEntry>;
  upvotes: Record<string, SavedEntry>;
  toggleBookmark: (article: Article) => void;
  removeBookmark: (id: string) => void;
  clearBookmarks: () => void;
  toggleUpvote: (article: Article) => void;
}

function toggleEntry(map: Record<string, SavedEntry>, article: Article): Record<string, SavedEntry> {
  if (map[article.id]) {
    const { [article.id]: _removed, ...rest } = map;
    return rest;
  }
  return { ...map, [article.id]: { article, savedAt: new Date().toISOString() } };
}

function isEntryMap(value: unknown): value is Record<string, SavedEntry> {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as SavedEntry).savedAt === 'string' &&
      typeof (entry as SavedEntry).article?.id === 'string',
  );
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
      bookmarks: {},
      upvotes: {},
      toggleBookmark: (article) => set((state) => ({ bookmarks: toggleEntry(state.bookmarks, article) })),
      removeBookmark: (id) =>
        set((state) => {
          if (!state.bookmarks[id]) return state;
          const { [id]: _removed, ...rest } = state.bookmarks;
          return { bookmarks: rest };
        }),
      clearBookmarks: () => set({ bookmarks: {} }),
      toggleUpvote: (article) => set((state) => ({ upvotes: toggleEntry(state.upvotes, article) })),
    }),
    {
      name: 'pixel-wires:library',
      version: 1,
      storage: persistentStorage,
      partialize: (state) => ({ bookmarks: state.bookmarks, upvotes: state.upvotes }),
      merge: (persisted, current) => {
        const record = (persisted ?? {}) as Record<string, unknown>;
        return {
          ...current,
          bookmarks: isEntryMap(record.bookmarks) ? record.bookmarks : {},
          upvotes: isEntryMap(record.upvotes) ? record.upvotes : {},
        };
      },
    },
  ),
);

export function useIsBookmarked(id: string): boolean {
  return useLibrary((state) => id in state.bookmarks);
}

export function useIsUpvoted(id: string): boolean {
  return useLibrary((state) => id in state.upvotes);
}

function newestFirst(map: Record<string, SavedEntry>): Article[] {
  return Object.values(map)
    .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
    .map((entry) => entry.article);
}

export function useBookmarkedArticles(): Article[] {
  const bookmarks = useLibrary((state) => state.bookmarks);
  return useMemo(() => newestFirst(bookmarks), [bookmarks]);
}

export function useUpvotedArticles(): Article[] {
  const upvotes = useLibrary((state) => state.upvotes);
  return useMemo(() => newestFirst(upvotes), [upvotes]);
}

export function useBookmarkCount(): number {
  return useLibrary((state) => Object.keys(state.bookmarks).length);
}

/** The source's score plus this user's own vote. */
export function displayScore(article: Article, upvoted: boolean): number {
  return article.score + (upvoted ? 1 : 0);
}
