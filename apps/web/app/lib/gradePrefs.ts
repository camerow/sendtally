import React from "react";
import {
  DEFAULT_GRADE_PREFS,
  scaleOptionsFor,
  type Discipline,
  type GradePrefs,
  type GradeScale,
} from "@sendtally/features/log-session";

const KEY = "sendtally:grade-prefs";

const listeners = new Set<() => void>();
let current: GradePrefs = DEFAULT_GRADE_PREFS;
let serialized = JSON.stringify(DEFAULT_GRADE_PREFS);

function valid(discipline: Discipline, scale: unknown): scale is GradeScale {
  return scaleOptionsFor(discipline).some((s) => s === scale);
}

function parse(raw: string | null): GradePrefs {
  if (raw === null) return DEFAULT_GRADE_PREFS;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return DEFAULT_GRADE_PREFS;
    const { boulder, route } = value as Partial<Record<Discipline, unknown>>;
    return {
      boulder: valid("boulder", boulder) ? boulder : DEFAULT_GRADE_PREFS.boulder,
      route: valid("route", route) ? route : DEFAULT_GRADE_PREFS.route,
    };
  } catch {
    return DEFAULT_GRADE_PREFS;
  }
}

/** Referentially stable between changes, which is what useSyncExternalStore needs. */
function read(): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function snapshot(): GradePrefs {
  const next = JSON.stringify(parse(read()));
  if (next !== serialized) {
    serialized = next;
    current = JSON.parse(next) as GradePrefs;
  }
  return current;
}

const serverSnapshot = (): GradePrefs => DEFAULT_GRADE_PREFS;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setGradePref(discipline: Discipline, scale: GradeScale): void {
  const next = { ...snapshot(), [discipline]: scale };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return;
  }
  for (const listener of listeners) listener();
}

/**
 * Device-local: the scale you log in is a typing preference, not session data.
 * Grades already logged keep the scale they were entered in.
 */
export function useGradePrefs(): GradePrefs {
  return React.useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
