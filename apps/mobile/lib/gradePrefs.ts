import React from "react";
import * as SecureStore from "expo-secure-store";
import {
  DEFAULT_GRADE_PREFS,
  scaleOptionsFor,
  type Discipline,
  type GradePrefs,
  type GradeScale,
} from "@sendtally/features/log-session";

const KEY = "grade-prefs";

let current: GradePrefs = DEFAULT_GRADE_PREFS;
let loaded = false;
const listeners = new Set<() => void>();

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

function publish(next: GradePrefs): void {
  current = next;
  for (const listener of listeners) listener();
}

export async function setGradePref(discipline: Discipline, scale: GradeScale): Promise<void> {
  const next = { ...current, [discipline]: scale };
  publish(next);
  await SecureStore.setItemAsync(KEY, JSON.stringify(next));
}

/**
 * Device-local: the scale you log in is a typing preference, not session data. Grades already
 * logged keep the scale they were entered in, so nothing on the server depends on this.
 */
export function useGradePrefs(): GradePrefs {
  const prefs = React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current
  );

  React.useEffect(() => {
    if (loaded) return;
    loaded = true;
    void SecureStore.getItemAsync(KEY).then((raw) => publish(parse(raw)));
  }, []);

  return prefs;
}
