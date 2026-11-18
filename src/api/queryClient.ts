import { QueryClient } from '@tanstack/react-query';
import { HttpError } from '@/lib/http';

const MAX_RETRIES = 2;

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (error instanceof HttpError) return error.isRetryable;
  return false;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  });
}

export const queryKeys = {
  feed: (mode: string, sources: readonly string[], tags: readonly string[]) =>
    ['feed', mode, [...sources].sort(), [...tags].sort()] as const,
  search: (query: string, sources: readonly string[]) => ['search', query.trim().toLowerCase(), [...sources].sort()] as const,
  article: (id: string) => ['article', id] as const,
};
