import type { LogSessionDraft } from "./types";

/**
 * Device-local rescue for the one form long enough to lose: a session takes the whole
 * climbing session to fill in. Nothing reaches the server until the session is logged.
 */
export type DraftStorage = {
  read: () => string | null;
  write: (value: string) => boolean;
  remove: () => void;
  subscribe: (listener: () => void) => () => void;
};

export type DraftStorageIo = {
  read: () => string | null;
  write: (value: string) => void;
  remove: () => void;
};

export const DRAFT_TTL_MS = 5 * 24 * 60 * 60 * 1000;

export type StoredSessionDraft = { draft: LogSessionDraft; savedAt: Date };

/** A storage with no quota, no permission and no other tab is not one worth failing over. */
export function draftStorage(io: DraftStorageIo): DraftStorage {
  const listeners = new Set<() => void>();
  const notify = (): void => listeners.forEach((listener) => listener());
  return {
    read: () => {
      try {
        return io.read();
      } catch {
        return null;
      }
    },
    write: (value) => {
      try {
        io.write(value);
      } catch {
        return false;
      }
      notify();
      return true;
    },
    remove: () => {
      try {
        io.remove();
      } catch {
        return;
      }
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function isDraft(value: unknown): value is LogSessionDraft {
  if (typeof value !== "object" || value === null) return false;
  const { date, startTime, endTime, climbs } = value as Record<string, unknown>;
  return (
    typeof date === "string" &&
    typeof startTime === "string" &&
    typeof endTime === "string" &&
    Array.isArray(climbs)
  );
}

export function parseStoredDraft(raw: string | null, now: Date): StoredSessionDraft | null {
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const { draft, savedAt } = parsed as Record<string, unknown>;
  const at = typeof savedAt === "string" ? new Date(savedAt) : new Date(Number.NaN);
  if (!isDraft(draft) || Number.isNaN(at.getTime())) return null;
  if (now.getTime() - at.getTime() > DRAFT_TTL_MS) return null;
  return { draft, savedAt: at };
}

export function writeStoredDraft(
  storage: DraftStorage,
  draft: LogSessionDraft,
  now: Date
): Date | null {
  return storage.write(JSON.stringify({ draft, savedAt: now.toISOString() })) ? now : null;
}
