import type { LoaderFunctionArgs } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { requireApi } from "../lib/api.server";
import { loader } from "./app";

vi.mock("../lib/api.server", () => ({ requireApi: vi.fn() }));

const load = (path: string, status: () => Promise<unknown>): Promise<unknown> => {
  vi.mocked(requireApi).mockResolvedValue({ status } as unknown as Awaited<
    ReturnType<typeof requireApi>
  >);
  const args = {
    request: new Request(`http://localhost${path}`),
    context: { get: () => ({ env: { API_URL: "http://api" } }) },
    params: {},
  } as unknown as LoaderFunctionArgs;
  return loader(args);
};

afterEach(() => vi.useRealTimers());

describe("the app shell loader", () => {
  it("renders the app when the first-run status request fails", async () => {
    await expect(load("/app", () => Promise.reject(new Error("down")))).resolves.toEqual({
      apiUrl: "http://api",
    });
  });

  it("renders the app when the first-run status request hangs", async () => {
    vi.useFakeTimers();
    const pending = load("/app", () => new Promise(() => undefined));
    await vi.advanceTimersByTimeAsync(5000);
    await expect(pending).resolves.toEqual({ apiUrl: "http://api" });
  });

  it("still sends an account due first run there", async () => {
    await expect(load("/app", () => Promise.resolve({ firstRun: true }))).rejects.toMatchObject({
      status: 302,
    });
  });
});
