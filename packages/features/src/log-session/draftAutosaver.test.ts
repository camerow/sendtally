import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDraftAutosaver } from "./draftAutosaver";
import { draftStorage, parseStoredDraft, type DraftStorage } from "./draftStore";
import { emptyDraft, newClimb } from "./transforms";
import type { LogSessionDraft } from "./types";

const NOW = new Date(2026, 8, 13, 19, 30);

function memory(): DraftStorage & { writes: number } {
  let value: string | null = null;
  const storage = draftStorage({
    read: () => value,
    write: (next) => {
      value = next;
      storage.writes += 1;
    },
    remove: () => {
      value = null;
    },
  }) as DraftStorage & { writes: number };
  storage.writes = 0;
  return storage;
}

const withClimb = (draft: LogSessionDraft): LogSessionDraft => ({
  ...draft,
  climbs: [...draft.climbs, newClimb(`climb-${draft.climbs.length + 1}`, "v")],
});

describe("draft autosaver", () => {
  beforeEach(() => vi.useFakeTimers({ now: NOW }));
  afterEach(() => vi.useRealTimers());

  it("writes an edit after the debounce, once", () => {
    const storage = memory();
    const saved = vi.fn();
    const saver = createDraftAutosaver(storage, 400, saved);
    const base = emptyDraft(NOW);
    saver.reset(base);

    saver.update(withClimb(base));
    saver.update(withClimb(withClimb(base)));
    expect(storage.writes).toBe(0);

    vi.advanceTimersByTime(400);
    expect(storage.writes).toBe(1);
    expect(parseStoredDraft(storage.read(), NOW)?.draft.climbs).toHaveLength(
      base.climbs.length + 2
    );
    expect(saved).toHaveBeenCalledTimes(1);
  });

  it("keeps an edit made right before the form goes away", () => {
    const storage = memory();
    const saver = createDraftAutosaver(storage, 400, () => {});
    const base = emptyDraft(NOW);
    saver.reset(base);

    saver.update(withClimb(base));
    saver.flush();
    expect(parseStoredDraft(storage.read(), NOW)?.draft.climbs).toHaveLength(
      base.climbs.length + 1
    );

    vi.advanceTimersByTime(400);
    expect(storage.writes).toBe(1);
  });

  it("never writes the untouched draft", () => {
    const storage = memory();
    const saver = createDraftAutosaver(storage, 400, () => {});
    const base = emptyDraft(NOW);
    saver.reset(base);

    saver.update({ ...base });
    vi.advanceTimersByTime(400);
    saver.flush();
    expect(storage.writes).toBe(0);
  });

  it("drops a pending edit that is undone before the debounce", () => {
    const storage = memory();
    const saver = createDraftAutosaver(storage, 400, () => {});
    const base = emptyDraft(NOW);
    saver.reset(base);

    saver.update(withClimb(base));
    saver.update(base);
    vi.advanceTimersByTime(400);
    saver.flush();
    expect(storage.writes).toBe(0);
  });

  it("reset takes a new baseline without writing it", () => {
    const storage = memory();
    const saver = createDraftAutosaver(storage, 400, () => {});
    const base = emptyDraft(NOW);
    saver.reset(base);

    saver.update(withClimb(base));
    saver.reset(withClimb(base));
    vi.advanceTimersByTime(400);
    saver.flush();
    expect(storage.writes).toBe(0);
  });

  it("stop ends saving, including a pending edit", () => {
    const storage = memory();
    const saver = createDraftAutosaver(storage, 400, () => {});
    const base = emptyDraft(NOW);
    saver.reset(base);

    saver.update(withClimb(base));
    saver.stop();
    vi.advanceTimersByTime(400);
    saver.flush();
    saver.update(withClimb(withClimb(base)));
    vi.advanceTimersByTime(400);
    expect(storage.writes).toBe(0);
  });
});
