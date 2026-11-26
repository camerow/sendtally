import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { SendtallyApi } from "@sendtally/api-client";
import type { Wizard } from "@sendtally/features/settings";
import { KeepStep } from "./KeepStep";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function inTrial(): QueryClient {
  const client = new QueryClient();
  client.setQueryData(["entitlements"], {
    membership: { active: false, web: false, store: null },
    trial: { endsAt: new Date(2099, 3, 9, 12).toISOString() },
  });
  return client;
}

const api = vi.hoisted(
  () =>
    new Proxy(
      {},
      { get: (_, key) => (key === "then" ? undefined : () => new Promise(() => {})) }
    ) as SendtallyApi
);

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => api }));
vi.mock("../useMember", () => ({ useMember: () => false }));
vi.mock("../../billing/components/MembershipCheckout", () => ({ MembershipCheckout: () => null }));

const wizard = {
  path: "plan",
  step: "P6",
  canGoBack: true,
  position: { n: 6, total: 6 },
  memory: { way: null, existingLog: null, days: [], membershipShown: true },
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

describe("P6", () => {
  it("tells a user inside the trial when it ends, as H5 does", () => {
    act(() =>
      root.render(
        <QueryClientProvider client={inTrial()}>
          <MemoryRouter>
            <KeepStep wizard={wizard} api={api} />
          </MemoryRouter>
        </QueryClientProvider>
      )
    );
    expect(host.textContent).toContain("Free trial · ends Apr 9");
  });
});
