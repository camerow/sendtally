import { describe, expect, it, vi } from "vitest";
import {
  DRAFT_TTL_MS,
  draftStorage,
  parseStoredDraft,
  writeStoredDraft,
  type DraftStorage,
} from "./draftStore";
import { emptyDraft } from "./transforms";

function memory(initial: string | null = null): DraftStorage {
  let value = initial;
  return draftStorage({
    read: () => value,
    write: (next) => {
      value = next;
    },
    remove: () => {
      value = null;
    },
  });
}

const NOW = new Date(2026, 7, 26, 20, 2);

describe("session draft store", () => {
  it("round-trips a draft", () => {
    const storage = memory();
    const draft = emptyDraft(NOW);
    writeStoredDraft(storage, draft, NOW);
    expect(parseStoredDraft(storage.read(), NOW)).toEqual({ draft, savedAt: NOW });
  });

  it("reads nothing when the device has no draft", () => {
    expect(parseStoredDraft(memory().read(), NOW)).toBeNull();
  });

  it("drops a draft older than the time to live", () => {
    const storage = memory();
    writeStoredDraft(storage, emptyDraft(NOW), NOW);
    const later = new Date(NOW.getTime() + DRAFT_TTL_MS + 1);
    expect(parseStoredDraft(storage.read(), later)).toBeNull();
  });

  it("keeps a draft still inside the time to live", () => {
    const storage = memory();
    writeStoredDraft(storage, emptyDraft(NOW), NOW);
    const later = new Date(NOW.getTime() + DRAFT_TTL_MS - 1);
    expect(parseStoredDraft(storage.read(), later)).not.toBeNull();
  });

  it("reads nothing back from anything that is not a draft", () => {
    for (const raw of ["not json", "null", '{"draft":{},"savedAt":"2026-08-26T00:00:00.000Z"}']) {
      expect(parseStoredDraft(raw, NOW)).toBeNull();
    }
  });

  it("tells subscribers when the draft changes", () => {
    const storage = memory();
    const listener = vi.fn();
    const unsubscribe = storage.subscribe(listener);
    writeStoredDraft(storage, emptyDraft(NOW), NOW);
    storage.remove();
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    storage.remove();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("survives storage that refuses to answer", () => {
    const broken = draftStorage({
      read: () => {
        throw new Error("blocked");
      },
      write: () => {
        throw new Error("full");
      },
      remove: () => {
        throw new Error("blocked");
      },
    });
    expect(broken.read()).toBeNull();
    expect(writeStoredDraft(broken, emptyDraft(NOW), NOW)).toBeNull();
    expect(() => broken.remove()).not.toThrow();
  });
});
