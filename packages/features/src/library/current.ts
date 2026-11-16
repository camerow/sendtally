import type { BuiltInLibrary } from "@sendtally/api-client";

export const EMPTY_LIBRARY: BuiltInLibrary = { exercises: [], grips: [], workouts: [] };

let current: BuiltInLibrary = EMPTY_LIBRARY;

/**
 * The built-in library every name and picker reads, like the locale `t()` reads: set once it
 * loads, before any screen that shows a built-in renders, and again when it changes.
 */
export function setLibrary(library: BuiltInLibrary): void {
  current = library;
}

export const currentLibrary = (): BuiltInLibrary => current;
