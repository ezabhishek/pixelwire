import { useEffect, useRef, useState } from 'react';

interface InfiniteScrollOptions {
  /** False while a page is loading or when there are no more pages. */
  enabled: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

/**
 * Returns a ref callback for a sentinel element placed after the list. When
 * it comes within `rootMargin` of the viewport, `onLoadMore` runs. The
 * observer is rebuilt each time `enabled` turns true again, so a sentinel
 * that is still visible after a short page loads the next one too.
 */
export function useInfiniteScroll({ enabled, onLoadMore, rootMargin = '900px 0px' }: InfiniteScrollOptions) {
  const callback = useRef(onLoadMore);
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    callback.current = onLoadMore;
  });

  useEffect(() => {
    if (!node || !enabled || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) callback.current();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, enabled, rootMargin]);

  return setNode;
}
