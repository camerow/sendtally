import React from "react";
import { sectionAnchorId } from "./anchors";

/**
 * Reports which section heading is currently pinned at the top of the list, so
 * the scope bar and jump rail can mark where the reader is. The headings are
 * sticky, so an IntersectionObserver would report every heading above the fold
 * as visible; instead the current section is the last one that has reached its
 * sticky offset.
 */
export function useVisibleSection(keys: string[]): string | null {
  const [visible, setVisible] = React.useState<string | null>(keys[0] ?? null);
  const signature = keys.join(",");

  React.useEffect(() => {
    const ordered = signature === "" ? [] : signature.split(",");
    if (ordered.length === 0) return;

    let frame = 0;
    const measure = (): void => {
      frame = 0;
      let current = ordered[0] ?? null;
      for (const key of ordered) {
        const node = document.getElementById(sectionAnchorId(key));
        if (node === null) continue;
        const pinnedAt = Number.parseFloat(window.getComputedStyle(node).top);
        const offset = Number.isFinite(pinnedAt) ? pinnedAt : 0;
        if (node.getBoundingClientRect().top <= offset + 1) current = key;
      }
      setVisible(current);
    };

    const schedule = (): void => {
      if (frame === 0) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame !== 0) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [signature]);

  return visible;
}
