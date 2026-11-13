import React from "react";

/** An element's width, kept current as it resizes. */
export function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const box = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = box.current;
    if (el === null) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [box, width];
}
