import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isSourceId, SOURCE_IDS } from '@/config/sources';
import { toTagSlug } from '@/lib/tags';
import type { SourceId } from '@/types/article';
import { persistentStorage } from './storage';

export const MAX_FOLLOWED_TAGS = 12;

export interface PreferencesState {
  sidebarCollapsed: boolean;
  enabledSources: SourceId[];
  followedTags: string[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  /** Turning off the last enabled source is ignored. */
  toggleSource: (source: SourceId) => void;
  setOnlySource: (source: SourceId) => void;
  enableAllSources: () => void;
  toggleTag: (slug: string) => void;
  clearTags: () => void;
}

type PersistedPreferences = Pick<PreferencesState, 'sidebarCollapsed' | 'enabledSources' | 'followedTags'>;

const DEFAULTS: PersistedPreferences = {
  sidebarCollapsed: false,
  enabledSources: [...SOURCE_IDS],
  followedTags: [],
};

/** Drop anything invalid that an older version or a hand-edited store left behind. */
export function sanitizePreferences(value: unknown): PersistedPreferences {
  if (typeof value !== 'object' || value === null) return { ...DEFAULTS, enabledSources: [...DEFAULTS.enabledSources] };
  const record = value as Record<string, unknown>;

  const sources = Array.isArray(record.enabledSources) ? record.enabledSources.filter(isSourceId) : [];
  const tags = Array.isArray(record.followedTags)
    ? record.followedTags
        .filter((tag): tag is string => typeof tag === 'string')
        .map(toTagSlug)
        .filter((tag) => tag.length > 0)
    : [];

  return {
    sidebarCollapsed: typeof record.sidebarCollapsed === 'boolean' ? record.sidebarCollapsed : DEFAULTS.sidebarCollapsed,
    enabledSources: sources.length > 0 ? [...new Set(sources)] : [...SOURCE_IDS],
    followedTags: [...new Set(tags)].slice(0, MAX_FOLLOWED_TAGS),
  };
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      enabledSources: [...DEFAULTS.enabledSources],

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSource: (source) =>
        set((state) => {
          const enabled = state.enabledSources.includes(source);
          if (enabled && state.enabledSources.length === 1) return state;
          return {
            enabledSources: enabled
              ? state.enabledSources.filter((id) => id !== source)
              : SOURCE_IDS.filter((id) => id === source || state.enabledSources.includes(id)),
          };
        }),
      setOnlySource: (source) => set({ enabledSources: [source] }),
      enableAllSources: () => set({ enabledSources: [...SOURCE_IDS] }),

      toggleTag: (slug) =>
        set((state) => {
          const tag = toTagSlug(slug);
          if (!tag) return state;
          if (state.followedTags.includes(tag)) {
            return { followedTags: state.followedTags.filter((existing) => existing !== tag) };
          }
          if (state.followedTags.length >= MAX_FOLLOWED_TAGS) return state;
          return { followedTags: [...state.followedTags, tag] };
        }),
      clearTags: () => set({ followedTags: [] }),
    }),
    {
      name: 'pixel-wires:preferences',
      version: 1,
      storage: persistentStorage,
      partialize: (state): PersistedPreferences => ({
        sidebarCollapsed: state.sidebarCollapsed,
        enabledSources: state.enabledSources,
        followedTags: state.followedTags,
      }),
      migrate: (persisted) => sanitizePreferences(persisted),
      merge: (persisted, current) => ({ ...current, ...sanitizePreferences(persisted) }),
    },
  ),
);
