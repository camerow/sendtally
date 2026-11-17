import type { LoaderFunctionArgs } from "react-router";
import { expect, it, vi } from "vitest";
import { requireApi } from "../lib/api.server";
import { loader } from "./app._index";

vi.mock("../lib/api.server", () => ({ requireApi: vi.fn() }));

it("loads the log without the status, which only drives the Strava card", async () => {
  vi.mocked(requireApi).mockResolvedValue({
    status: () => Promise.reject(new Error("down")),
    sessions: () =>
      Promise.resolve({ sessions: [], hangSessions: [], hangParts: [], activities: [] }),
    entries: () => Promise.resolve({ entries: [] }),
  } as unknown as Awaited<ReturnType<typeof requireApi>>);
  const args = { request: new Request("http://localhost/app") } as unknown as LoaderFunctionArgs;
  await expect(loader(args)).resolves.toMatchObject({ status: null, sessions: [] });
});
