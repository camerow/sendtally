import React from "react";

const NARROW = "(max-width: 767px)";

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(NARROW);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useIsNarrow(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    () => false
  );
}
