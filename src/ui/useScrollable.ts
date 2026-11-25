// Whether an element's content is taller than the element, so it scrolls (M35 / M36): the
// summary and the replay draw a line above their buttons only then.

import type { RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';

/**
 * `scroller` is the element that scrolls; `content` are elements whose size changes what is in
 * it (a resize of either is observed). `deps` re-check after a render that can change the height
 * without resizing them (e.g. a section opened outside `content`).
 */
export function useScrollable(
  scroller: RefObject<HTMLElement | null>,
  content: readonly RefObject<HTMLElement | null>[],
  deps: readonly unknown[] = [],
): boolean {
  const [scrollable, setScrollable] = useState(false);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    for (const ref of content) if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
    // The refs are stable; `deps` are the caller's re-check triggers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return scrollable;
}
