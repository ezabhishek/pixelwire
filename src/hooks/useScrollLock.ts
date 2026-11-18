import { useEffect } from 'react';

let lockCount = 0;
let saved = { overflow: '', paddingRight: '' };

/** Stop the page behind a modal from scrolling. Nested locks are counted. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const { body, documentElement } = document;
    if (lockCount === 0) {
      const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
      saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        body.style.overflow = saved.overflow;
        body.style.paddingRight = saved.paddingRight;
      }
    };
  }, [active]);
}
