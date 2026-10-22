import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ConnectionStatus, SendtallyApi } from "@sendtally/api-client";
import { queries } from "../query";
import { DEFAULT_GRADE_SCALES } from "./transforms";
import { setTrainingMode } from "./useTrainingMode";

const status: ConnectionStatus = {
  gradeScales: DEFAULT_GRADE_SCALES,
  role: "user",
  trainingMode: false,
  trainingReminders: { enabled: false, time: "08:00", promptSeen: false },
  strava: null,
};

function setup(write: () => Promise<{ trainingMode: boolean }>): {
  client: QueryClient;
  api: SendtallyApi;
  read: () => ConnectionStatus | undefined;
} {
  const client = new QueryClient();
  const api = { status: vi.fn(), setTrainingMode: vi.fn(write) } as unknown as SendtallyApi;
  const { queryKey } = queries.status(api);
  client.setQueryData(queryKey, status);
  return { client, api, read: () => client.getQueryData(queryKey) };
}

describe("setTrainingMode", () => {
  it("shows the new value before the server answers", async () => {
    let resolve: (value: { trainingMode: boolean }) => void = () => undefined;
    const { client, api, read } = setup(() => new Promise((r) => (resolve = r)));
    const saving = setTrainingMode(client, api, true);
    await vi.waitFor(() => expect(read()?.trainingMode).toBe(true));
    resolve({ trainingMode: true });
    await saving;
    expect(api.setTrainingMode).toHaveBeenCalledWith(true);
    expect(read()?.trainingMode).toBe(true);
  });

  it("puts the old value back and rejects when the save fails", async () => {
    const { client, api, read } = setup(() => Promise.reject(new Error("offline")));
    await expect(setTrainingMode(client, api, true)).rejects.toThrow("offline");
    expect(read()?.trainingMode).toBe(false);
  });
});
