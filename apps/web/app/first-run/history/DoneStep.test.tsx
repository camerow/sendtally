import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SendtallyApi } from "@sendtally/api-client";
import type { Wizard } from "@sendtally/features/settings";
import { DoneStep } from "./DoneStep";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const api = vi.hoisted(
  () =>
    new Proxy(
      {},
      { get: (_, key) => (key === "then" ? undefined : () => new Promise(() => {})) }
    ) as SendtallyApi
);

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => api }));
vi.mock("../../live-session/useStartLiveSession", () => ({ useStartLive: () => vi.fn() }));

const wizard = {
  path: "history",
  step: "H6",
  canGoBack: false,
  position: { n: 5, total: 5 },
  memory: { way: "by_hand", existingLog: "none", days: [], membershipShown: false },
  choose: vi.fn(),
  answerLog: vi.fn(),
  setWay: vi.fn(),
  setDays: vi.fn(),
  next: vi.fn(),
  back: vi.fn(),
  skip: vi.fn(),
  leave: vi.fn(),
  complete: vi.fn(),
  capture: vi.fn(),
} satisfies Wizard;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("H6", () => {
  it("closes to the log, as Open my log does", () => {
    act(() =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <DoneStep wizard={wizard} api={api} />
          </MemoryRouter>
        </QueryClientProvider>
      )
    );
    act(() => host.querySelector<HTMLButtonElement>('button[aria-label="Close"]')?.click());
    expect(wizard.complete).toHaveBeenCalledTimes(1);
    expect(wizard.complete).toHaveBeenCalledWith("later", "log");
  });
});
