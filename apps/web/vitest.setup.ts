import { loadTestLibrary } from "@sendtally/features/library/testing";

loadTestLibrary();

// jsdom has no matchMedia; pages that ask for the phone layout read wide.
if (typeof window !== "undefined" && window.matchMedia === undefined)
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
