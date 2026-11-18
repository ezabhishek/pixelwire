import type { SourceId } from '@/types/article';
import type { SourceAdapter } from '../types';
import { devtoAdapter } from './devto';
import { hackerNewsAdapter } from './hackernews';

/** Add a source: write an adapter, register it here and in config/sources.ts. */
export const adapters: Record<SourceId, SourceAdapter> = {
  devto: devtoAdapter,
  hackernews: hackerNewsAdapter,
};
