import { useEffect, useRef } from 'react';
import { isTypingTarget } from '@/lib/dom';

/** A single-key shortcut that is ignored while typing or with modifier keys held. */
export function useHotkey(key: string, handler: (event: KeyboardEvent) => void, enabled = true): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      handlerRef.current(event);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, enabled]);
}
