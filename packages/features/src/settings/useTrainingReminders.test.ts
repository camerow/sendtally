import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ConnectionStatus, SendtallyApi } from "@sendtally/api-client";
import { queries } from "../query";
import { DEFAULT_GRADE_SCALES } from "./transforms";
import { saveTrainingReminders } from "./useTrainingReminders";

const status: ConnectionStatus = {
  gradeScales: DEFAULT_GRADE_SCALES,
  role: "user",
  trainingMode: true,
  trainingReminders: { enabled: false, time: "08:00", promptSeen: false },
  strava: null,
};

function setup(write: () => Promise<unknown>): {
  client: QueryClient;
  api: SendtallyApi;
  read: () => ConnectionStatus | undefined;
} {
  const client = new QueryClient();
  const api = { status: vi.fn(), setTrainingReminders: vi.fn(write) } as unknown as SendtallyApi;
  const { queryKey } = queries.status(api);
  client.setQueryData(queryKey, status);
  return { client, api, read: () => client.getQueryData(queryKey) };
}

describe("saveTrainingReminders", () => {
  it("merges the change before the server answers", async () => {
    let resolve: (value: unknown) => void = () => undefined;
    const { client, api, read } = setup(() => new Promise((r) => (resolve = r)));
    const saving = saveTrainingReminders(client, api, { time: "18:30" });
    await vi.waitFor(() =>
      expect(read()?.trainingReminders).toEqual({
        enabled: false,
        time: "18:30",
        promptSeen: false,
      })
    );
    resolve({});
    await saving;
    expect(api.setTrainingReminders).toHaveBeenCalledWith({ time: "18:30" });
  });

  it("puts the old settings back and rejects when the save fails", async () => {
    const { client, api, read } = setup(() => Promise.reject(new Error("offline")));
    await expect(saveTrainingReminders(client, api, { enabled: true })).rejects.toThrow("offline");
    expect(read()?.trainingReminders.enabled).toBe(false);
  });
});
