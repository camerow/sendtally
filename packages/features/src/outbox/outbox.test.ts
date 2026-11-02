import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@sendtally/api-client";
import { draftStorage, type DraftStorage } from "../log-session/draftStore";
import { createOutbox, OUTBOX_RETRY_MS, type OutboxEntry, type OutboxOp } from "./outbox";

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

type Server = {
  calls: string[];
  online: boolean;
  /** The next request fails with this. */
  failNext: (error: unknown) => void;
  /** Requests wait until `release`: the way to have one in flight. */
  hold: () => void;
  release: () => void;
  dropped: Array<[string, unknown]>;
  settled: unknown[][];
};

function setup(storage: DraftStorage = memory()) {
  const server: Server = {
    calls: [],
    online: true,
    failNext: (error) => {
      failure = error;
    },
    hold: () => {
      held = new Promise((resolve) => {
        gate = resolve;
      });
    },
    release: () => gate?.(),
    dropped: [],
    settled: [],
  };
  let failure: unknown = null;
  let gate: (() => void) | null = null;
  let held: Promise<void> = Promise.resolve();
  const outbox = createOutbox(storage, {
    run: async (op: OutboxOp) => {
      server.calls.push(`${op.method} ${JSON.stringify(op.args)}`);
      await held;
      if (failure !== null) {
        const error = failure;
        failure = null;
        throw error;
      }
    },
    isOnline: () => server.online,
    dropped: (op, error) => server.dropped.push([op.key, error]),
    settled: (holds) => server.settled.push(holds),
  });
  return { outbox, server, storage };
}

const save = (key: string, value: unknown, kind: OutboxEntry["kind"] = "update"): OutboxEntry => ({
  key,
  kind,
  method: "save",
  args: [key, value],
  holds: [["rows", key]],
});

const remove = (key: string): OutboxEntry => ({
  key,
  kind: "delete",
  method: "remove",
  args: [key],
  holds: [["rows", key]],
});

afterEach(() => {
  vi.useRealTimers();
});

describe("outbox", () => {
  it("saves an op to disk before it returns, and sends ops in order", async () => {
    const { outbox, server, storage } = setup();
    server.hold();
    outbox.add(save("a", 1));
    outbox.add(save("b", 2));
    expect(JSON.parse(storage.read() ?? "[]")).toHaveLength(2);
    server.release();
    await outbox.drain();
    expect(server.calls).toEqual(['save ["a",1]', 'save ["b",2]']);
    expect(storage.read()).toBeNull();
  });

  it("keeps ops while offline and sends them once a drain finds the network", async () => {
    const { outbox, server } = setup();
    server.online = false;
    outbox.add(save("a", 1));
    await outbox.drain();
    expect(server.calls).toEqual([]);
    server.online = true;
    await outbox.drain();
    expect(server.calls).toEqual(['save ["a",1]']);
  });

  it("outlives the process: a new outbox over the same file sends what was left", async () => {
    const storage = memory();
    const first = setup(storage);
    first.server.online = false;
    first.outbox.add(save("a", 1));
    const second = setup(storage);
    await second.outbox.drain();
    expect(second.server.calls).toEqual(['save ["a",1]']);
  });

  it("keeps an op the network failed and tries again after a back-off", async () => {
    vi.useFakeTimers();
    const { outbox, server } = setup();
    server.failNext(new TypeError("Network request failed"));
    outbox.add(save("a", 1));
    await outbox.drain();
    expect(outbox.ops()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MS[0] ?? 0);
    expect(server.calls).toEqual(['save ["a",1]', 'save ["a",1]']);
    expect(outbox.ops()).toEqual([]);
  });

  it("treats a 5xx like the network, and waits on a 401 for the next drain", async () => {
    vi.useFakeTimers();
    const { outbox, server } = setup();
    server.failNext(new ApiError(401, "not signed in"));
    outbox.add(save("a", 1));
    await outbox.drain();
    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MS.at(-1) ?? 0);
    expect(server.calls).toHaveLength(1);
    server.failNext(new ApiError(503, "unavailable"));
    await outbox.drain();
    expect(outbox.ops()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(OUTBOX_RETRY_MS[0] ?? 0);
    expect(outbox.ops()).toEqual([]);
  });

  it("drops an op the server refuses, says so, and carries on with the rest", async () => {
    const { outbox, server } = setup();
    server.hold();
    const gone = new ApiError(404, "not found");
    outbox.add(save("a", 1));
    outbox.add(save("b", 2));
    server.failNext(gone);
    server.release();
    await outbox.drain();
    expect(server.dropped).toEqual([["a", gone]]);
    expect(server.calls).toEqual(['save ["a",1]', 'save ["b",2]']);
    expect(outbox.ops()).toEqual([]);
  });

  it("sends only the latest of back-to-back saves to one row, never touching one in flight", async () => {
    const { outbox, server } = setup();
    server.hold();
    outbox.add(save("a", 1));
    outbox.add(save("a", 2));
    outbox.add(save("a", 3));
    server.release();
    await outbox.drain();
    expect(server.calls).toEqual(['save ["a",1]', 'save ["a",3]']);
  });

  it("keeps a coalesced save a create, so the row is still created", () => {
    const { outbox, server } = setup();
    server.online = false;
    outbox.add(save("a", 1, "create"));
    outbox.add(save("a", 2));
    expect(outbox.ops()).toMatchObject([{ kind: "create", args: ["a", 2] }]);
  });

  it("does not coalesce saves with another row's op between them", () => {
    const { outbox, server } = setup();
    server.online = false;
    outbox.add(save("a", 1));
    outbox.add(save("b", 1));
    outbox.add(save("a", 2));
    expect(outbox.ops().map((o) => o.args)).toEqual([
      ["a", 1],
      ["b", 1],
      ["a", 2],
    ]);
  });

  it("cancels a create that never left with its delete, and the row's edits with it", async () => {
    const { outbox, server } = setup();
    server.online = false;
    outbox.add(save("a", 1, "create"));
    outbox.add(save("b", 1));
    outbox.add(save("a", 2));
    outbox.add(remove("a"));
    server.online = true;
    await outbox.drain();
    expect(server.calls).toEqual(['save ["b",1]']);
  });

  it("sends a delete after a create already in flight", async () => {
    const { outbox, server } = setup();
    server.hold();
    outbox.add(save("a", 1, "create"));
    outbox.add(remove("a"));
    server.release();
    await outbox.drain();
    expect(server.calls).toEqual(['save ["a",1]', 'remove ["a"]']);
  });

  it("holds the reads its ops patched, and hands them back once the queue is empty", async () => {
    const { outbox, server } = setup();
    server.online = false;
    outbox.add(save("a", 1));
    expect(outbox.holds(["rows", "a"])).toBe(true);
    expect(outbox.holds(["rows", "b"])).toBe(false);
    server.online = true;
    await outbox.drain();
    expect(outbox.holds(["rows", "a"])).toBe(false);
    expect(server.settled).toEqual([[["rows", "a"]]]);
  });
});
