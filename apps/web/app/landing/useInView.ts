import React from "react";

export type InViewState = "idle" | "armed" | "in";

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isOnScreen(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}

export function useInView<T extends HTMLElement>(
  mode: "in-view" | "mount" | "off" = "in-view"
): [React.RefObject<T | null>, InViewState] {
  const ref = React.useRef<T>(null);
  const [state, setState] = React.useState<InViewState>("idle");

  React.useEffect(() => {
    const el = ref.current;
    if (el === null || mode === "off" || prefersReducedMotion()) return;
    if (mode === "mount" || !isOnScreen(el)) {
      setState("armed");
    } else {
      return;
    }
    if (mode === "mount") {
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setState("in")));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("in");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  return [ref, state];
}

export function inViewClass(base: string, state: InViewState): string {
  if (state === "armed") return `${base} ${base}--armed`;
  if (state === "in") return `${base} ${base}--armed ${base}--in`;
  return base;
}
