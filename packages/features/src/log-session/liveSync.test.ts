import { describe, expect, it, vi } from "vitest";
import { draftStorage, parseStoredDraft, writeStoredDraft, type DraftStorage } from "./draftStore";
import { localDate, withQuickClimb } from "./liveSession";
import { createLiveSync, type LiveSyncApi, type LiveSyncStatus } from "./liveSync";

const NOW = new Date();

function memory(): DraftStorage {
  let value: string | null = null;
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

type Fake = LiveSyncApi & {
  calls: string[];
  failNext: () => void;
  /** Requests wait until `release` - the way to have one in flight. */
  hold: () => void;
  release: () => void;
};

function fakeApi(): Fake {
  let fail = false;
  let gate: (() => void) | null = null;
  let held: Promise<void> = Promise.resolve();
  const guard = async (): Promise<void> => {
    await held;
    if (fail) {
      fail = false;
      throw new Error("offline");
    }
  };
  const session = { fingerprint: "manual-1" } as Awaited<
    ReturnType<LiveSyncApi["logSession"]>
  >["session"];
  const api: Fake = {
    calls: [],
    failNext: () => {
      fail = true;
    },
    hold: () => {
      held = new Promise((resolve) => {
        gate = resolve;
      });
    },
    release: () => gate?.(),
    logSession: async (input) => {
      api.calls.push(`POST ${input.climbs.length}`);
      await guard();
      return { session };
    },
    updateLoggedSession: async (fingerprint, input) => {
      api.calls.push(`PUT ${fingerprint} ${input.climbs.length}`);
      await guard();
      return { session };
    },
    deleteLoggedSession: async (fingerprint) => {
      api.calls.push(`DELETE ${fingerprint}`);
      await guard();
      return { deleted: true };
    },
  };
  return api;
}

const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 5));

function setup(): {
  api: Fake;
  storage: DraftStorage;
  statuses: LiveSyncStatus[];
  sync: ReturnType<typeof createLiveSync>;
  log: (count: number) => void;
} {
  const api = fakeApi();
  const storage = memory();
  const statuses: LiveSyncStatus[] = [];
  const sync = createLiveSync(api, storage, (s) => statuses.push(s), 0);
  const log = (count: number): void => {
    let draft = parseStoredDraft(storage.read(), NOW)?.draft ?? null;
    for (let i = 0; i < count; i += 1) draft = withQuickClimb(draft, NOW).draft;
    if (draft !== null)
      writeStoredDraft(storage, draft, NOW, parseStoredDraft(storage.read(), NOW)?.fingerprint);
    sync.changed();
  };
  return { api, storage, statuses, sync, log };
}

describe("live sync", () => {
  it("posts the first save and puts the rest, keeping the fingerprint in the file", async () => {
    const { api, storage, statuses, log } = setup();
    log(1);
    await settle();
    expect(parseStoredDraft(storage.read(), NOW)?.fingerprint).toBe("manual-1");
    log(1);
    await settle();
    expect(api.calls).toEqual(["POST 1", "PUT manual-1 2"]);
    expect(statuses).toEqual(["saving", "idle", "saving", "idle"]);
  });

  it("sends an unscored body without times or a location", async () => {
    const api = fakeApi();
    const spy = vi.spyOn(api, "logSession");
    const storage = memory();
    const sync = createLiveSync(api, storage, () => {}, 0);
    writeStoredDraft(storage, withQuickClimb(null, NOW).draft, NOW);
    sync.changed();
    await settle();
    expect(spy.mock.calls[0]?.[0]).toMatchObject({ unscored: true, date: localDate(NOW) });
    expect(spy.mock.calls[0]?.[0]).not.toHaveProperty("startTime");
    expect(spy.mock.calls[0]?.[0]).not.toHaveProperty("location");
  });

  it("coalesces edits made during a request into one more request", async () => {
    const { api, log } = setup();
    log(1);
    await settle();
    api.hold();
    log(1);
    await settle();
    log(1);
    log(1);
    api.release();
    await settle();
    expect(api.calls).toEqual(["POST 1", "PUT manual-1 2", "PUT manual-1 4"]);
  });

  it("keeps the file on failure and retries on the next change or foreground", async () => {
    const { api, storage, statuses, sync, log } = setup();
    api.failNext();
    log(1);
    await settle();
    expect(statuses.at(-1)).toBe("failed");
    expect(parseStoredDraft(storage.read(), NOW)?.fingerprint).toBeUndefined();
    sync.retry();
    await settle();
    expect(api.calls).toEqual(["POST 1", "POST 1"]);
    expect(statuses.at(-1)).toBe("idle");
    sync.retry();
    await settle();
    expect(api.calls).toHaveLength(2);
  });

  it("deletes the server session when the last climb goes", async () => {
    const { api, storage, sync, log } = setup();
    log(1);
    await settle();
    sync.remove("manual-1");
    storage.remove();
    await settle();
    expect(api.calls).toEqual(["POST 1", "DELETE manual-1"]);
  });

  it("deletes a session whose draft was discarded while the first save was in flight", async () => {
    const { api, storage, log } = setup();
    api.hold();
    log(1);
    await settle();
    storage.remove();
    api.release();
    await settle();
    expect(api.calls).toEqual(["POST 1", "DELETE manual-1"]);
  });
});
