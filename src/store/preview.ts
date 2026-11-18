import { create } from 'zustand';
import type { Article } from '@/types/article';

/** Which article the preview drawer shows. Not persisted. */
export interface PreviewState {
  article: Article | null;
  /** The ordered list the drawer can step through with next/previous. */
  sequence: Article[];
  open: (article: Article, sequence?: Article[]) => void;
  close: () => void;
  step: (direction: 1 | -1) => void;
}

export const usePreview = create<PreviewState>()((set) => ({
  article: null,
  sequence: [],
  open: (article, sequence) => set((state) => ({ article, sequence: sequence ?? state.sequence })),
  close: () => set({ article: null }),
  step: (direction) =>
    set((state) => {
      if (!state.article) return state;
      const currentId = state.article.id;
      const index = state.sequence.findIndex((item) => item.id === currentId);
      if (index === -1) return state;
      const next = state.sequence[index + direction];
      return next ? { article: next } : state;
    }),
}));
