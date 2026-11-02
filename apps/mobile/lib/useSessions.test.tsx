import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import React from "react";
import {
  ApiError,
  type LogSessionInput,
  type SendtallyApi,
  type SessionLog,
  type SessionLogWithClimbs,
} from "@sendtally/api-client";
import { draftStorage, useLocalSessions } from "@sendtally/features/log-session";
import { OutboxProvider, queryOutbox, type Outbox } from "@sendtally/features/outbox";
import { queries } from "@sendtally/features/query";

const input: LogSessionInput = {
  name: "Crag day",
  date: "2026-11-02",
  climbs: [{ name: "Arete", grade: { scale: "v", value: 4 }, kind: "send" }],
};

const emptyLog: SessionLogWithClimbs = { sessions: [], hangSessions: [], activities: [] };

async function world() {
  let file: string | null = null;
  const storage = draftStorage({
    read: () => file,
    write: (next) => {
      file = next;
    },
    remove: () => {
      file = null;
    },
  });
  const server = {
    logSession: jest.fn(async () => ({})),
    updateLoggedSession: jest.fn(async () => ({})),
    deleteLoggedSession: jest.fn(async () => ({ deleted: true })),
    sessions: jest.fn(async () => emptyLog),
    sessionsWithClimbs: jest.fn(async () => emptyLog),
    session: jest.fn(async () => {
      throw new ApiError(404, "not found");
    }),
  };
  const api = server as unknown as SendtallyApi;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await client.prefetchQuery(queries.sessions(api));
  await client.prefetchQuery(queries.sessionsWithClimbs(api));
  onlineManager.setOnline(false);
  const refused = jest.fn();
  const outbox: Outbox = queryOutbox(storage, api, client, refused);
  let ids = 0;
  const newId = (): string => `id-${++ids}`;
  const wrapper = ({ children }: { children: React.ReactNode }): React.ReactElement => (
    <QueryClientProvider client={client}>
      <OutboxProvider outbox={outbox}>{children}</OutboxProvider>
    </QueryClientProvider>
  );
  const { result } = await renderHook(() => useLocalSessions(api, newId), { wrapper });
  const listed = (): string[] =>
    client
      .getQueryData<SessionLog>(queries.sessions(api).queryKey)!
      .sessions.map((s) => s.fingerprint);
  const stale = (): boolean =>
    client.getQueryState(queries.sessions(api).queryKey)?.isInvalidated === true;
  return { api, client, outbox, refused, result, server, listed, stale };
}

afterEach(() => {
  onlineManager.setOnline(true);
});

describe("sessions written on the phone first", () => {
  it("logs a session offline: scored, listed and open at once, with the log kept for later", async () => {
    const { api, client, outbox, result, server, listed } = await world();
    let fingerprint = "";
    await act(async () => {
      fingerprint = result.current.save(input);
    });
    expect(fingerprint).toBe("manual-id-1");
    expect(listed()).toEqual(["manual-id-1"]);
    expect(client.getQueryData(queries.session(api, fingerprint).queryKey)).toMatchObject({
      title: "Crag day",
      rpe_source: "computed",
    });
    expect(outbox.ops()).toMatchObject([
      { key: "session:manual-id-1", kind: "create", method: "logSession" },
    ]);
    expect(server.logSession).not.toHaveBeenCalled();
  });

  it("sends the log under the phone's fingerprint once online, then marks the lists to read again", async () => {
    const { outbox, result, server, stale } = await world();
    await act(async () => {
      result.current.save(input);
    });
    onlineManager.setOnline(true);
    await act(() => outbox.drain());
    expect(server.logSession).toHaveBeenCalledWith(input, "manual-id-1");
    expect(outbox.ops()).toEqual([]);
    expect(stale()).toBe(true);
  });

  it("never lets a refetch lay the server's older list over a session still to send", async () => {
    const { api, client, result, server, listed } = await world();
    await act(async () => {
      result.current.save(input);
    });
    onlineManager.setOnline(true);
    server.logSession.mockImplementation(() => new Promise(() => undefined));
    server.sessions.mockClear();
    await act(() => client.refetchQueries({ queryKey: queries.sessions(api).queryKey }));
    expect(server.sessions).not.toHaveBeenCalled();
    expect(listed()).toEqual(["manual-id-1"]);
  });

  it("edits a session not yet sent as a second op, sent after the first", async () => {
    const { outbox, result } = await world();
    await act(async () => {
      const fingerprint = result.current.save(input);
      result.current.save({ ...input, name: "Renamed" }, fingerprint);
    });
    expect(outbox.ops().map((o) => o.method)).toEqual(["logSession", "updateLoggedSession"]);
  });

  it("deletes a session that never left the phone without telling the server", async () => {
    const { outbox, result, server, listed } = await world();
    await act(async () => {
      result.current.remove(result.current.save(input));
    });
    expect(listed()).toEqual([]);
    expect(outbox.ops()).toEqual([]);
    onlineManager.setOnline(true);
    await act(() => outbox.drain());
    expect(server.logSession).not.toHaveBeenCalled();
    expect(server.deleteLoggedSession).not.toHaveBeenCalled();
  });

  it("drops a log the server refuses, says so, and marks the lists to read back from the server", async () => {
    const { outbox, refused, result, server, stale } = await world();
    await act(async () => {
      result.current.save(input);
    });
    server.logSession.mockRejectedValueOnce(new ApiError(400, "unknown climb"));
    onlineManager.setOnline(true);
    await act(() => outbox.drain());
    expect(refused).toHaveBeenCalledTimes(1);
    expect(outbox.ops()).toEqual([]);
    expect(stale()).toBe(true);
  });
});
