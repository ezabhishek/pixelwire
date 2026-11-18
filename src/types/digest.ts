import type { Article } from './article';

/** One pick in the daily digest, written by the n8n workflow (n8n/code/build-digest.js). */
export interface DigestItem {
  rank: number;
  /** AI-written two-sentence summary. */
  summary: string;
  /** AI-written one-liner on why it matters; null when the editor model gave none. */
  why: string | null;
  /** Quality score 1-10 from the scoring model. */
  quality: number;
  article: Article;
}

export interface Digest {
  version: 1;
  /** yyyy-mm-dd in Asia/Kolkata. */
  date: string;
  generatedAt: string;
  intro: string;
  items: DigestItem[];
  stats: {
    fetched: number;
    shortlisted: number;
    published: number;
  };
  models: {
    score: string;
    summary: string;
    editor: string;
  };
}

export interface DigestIndex {
  /** Newest first. */
  dates: string[];
}
