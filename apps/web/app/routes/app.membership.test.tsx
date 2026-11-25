import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Entitlements } from "@sendtally/api-client";
import { ENTITLEMENTS, seededClient } from "../billing/testBilling";
import MembershipRoute from "./app.membership";

import type * as T_router from "react-router";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const loaded = vi.hoisted(() => ({ membership: null as unknown }));
const capture = vi.hoisted(() => vi.fn());

vi.mock("react-router", async (actual) => ({
  ...(await actual<typeof T_router>()),
  useLoaderData: () => loaded,
}));
vi.mock("../lib/analytics", () => ({ capture }));
vi.mock("../lib/useAppApi", async () => {
  const { hangingApi: api } = await import("../billing/testBilling");
  return { useAppApi: () => api };
});
vi.mock("../billing/components/MembershipCheckout", () => ({
  SUBSCRIBED_PARAM: "subscribed",
  MembershipCheckout: () => <span>checkout</span>,
}));
vi.mock("../billing/components/WebMembershipStrip", () => ({
  useWebMembershipItem: () => null,
  webMembershipStatus: () => ({ endsOn: null, line: "" }),
  WebMembershipStrip: () => null,
}));

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const show = (entitlements: Entitlements, url: string): void => {
  loaded.membership = entitlements.membership;
  act(() =>
    root.render(
      <QueryClientProvider client={seededClient(entitlements)}>
        <MemoryRouter initialEntries={[url]}>
          <MembershipRoute />
        </MemoryRouter>
      </QueryClientProvider>
    )
  );
};

describe("/app/membership", () => {
  it("shows a trial account what members get over the checkout, and counts the paywall once", () => {
    show(ENTITLEMENTS.trial, "/app/membership?source=workout");
    expect(host.textContent).toContain("and posting to Strava are free, and always will be.");
    expect(host.textContent).toContain("Members get…");
    expect(host.textContent).toMatch(/After .+ these need a membership\./);
    expect(host.textContent).toContain("checkout");
    expect(host.textContent).not.toContain("Want to support this app?");
    expect(host.textContent).not.toContain("Your training is open.");
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("paywall_shown", { source: "workout" });
  });

  it("tells an account past its trial these need a membership, and counts nothing without a source", () => {
    show(ENTITLEMENTS.pastTrial, "/app/membership");
    expect(host.textContent).toContain("These need a membership.");
    expect(capture).not.toHaveBeenCalled();
  });

  it("keeps a member's gold panel and counts no paywall", () => {
    show(ENTITLEMENTS.member, "/app/membership?source=onboarding");
    expect(host.textContent).toContain("Your training is open.");
    expect(host.textContent).not.toContain("Members get…");
    expect(capture).not.toHaveBeenCalled();
  });
});
