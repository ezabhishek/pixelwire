import type { SourceId } from '@/types/article';

export interface SourceMeta {
  id: SourceId;
  name: string;
  shortName: string;
  description: string;
  homepage: string;
  /** Tailwind text color class for the badge. */
  textClass: string;
  /** Tailwind background class for the badge dot. */
  dotClass: string;
}

export const SOURCE_IDS: readonly SourceId[] = ['devto', 'hackernews'];

export const SOURCES: Record<SourceId, SourceMeta> = {
  devto: {
    id: 'devto',
    name: 'DEV Community',
    shortName: 'DEV',
    description: 'Articles and tutorials written by developers.',
    homepage: 'https://dev.to',
    textClass: 'text-source-devto',
    dotClass: 'bg-source-devto',
  },
  hackernews: {
    id: 'hackernews',
    name: 'Hacker News',
    shortName: 'HN',
    description: 'Links and discussion from news.ycombinator.com.',
    homepage: 'https://news.ycombinator.com',
    textClass: 'text-source-hackernews',
    dotClass: 'bg-source-hackernews',
  },
};

export function isSourceId(value: unknown): value is SourceId {
  return typeof value === 'string' && (SOURCE_IDS as readonly string[]).includes(value);
}
