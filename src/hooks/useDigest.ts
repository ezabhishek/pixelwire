import { useQuery } from '@tanstack/react-query';
import { fetchDigest, fetchDigestIndex } from '@/api/digest';

const TEN_MINUTES = 10 * 60 * 1000;

/** `date` is yyyy-mm-dd, or undefined for the latest digest. Data is null when none exists. */
export function useDigest(date: string | undefined) {
  return useQuery({
    queryKey: ['digest', date ?? 'latest'],
    queryFn: ({ signal }) => fetchDigest(date, signal),
    staleTime: TEN_MINUTES,
  });
}

export function useDigestIndex() {
  return useQuery({
    queryKey: ['digest-index'],
    queryFn: ({ signal }) => fetchDigestIndex(signal),
    staleTime: TEN_MINUTES,
  });
}
