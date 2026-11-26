import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import type { Entitlements } from "@sendtally/api-client";
import type { Wizard } from "@sendtally/features/settings";
import { ENTITLEMENTS, hangingApi, seededClient } from "../../billing/testBilling";
import { DoneStep } from "./DoneStep";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../../lib/useAppApi", async () => {
  const { hangingApi: api } = await import("../../billing/testBilling");
  return { useAppApi: () => api };
});

const wizard = {
  path: "plan",
  step: "P7",
  canGoBack: false,
  position: { n: 2, total: 2 },
  memory: { way: null, existingLog: null },
  choose: vi.fn(),
  answerLog: vi.fn(),
  setWay: vi.fn(),
  open: vi.fn(),
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
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

const settled = (): void => void vi.advanceTimersByTime(600);

const finish = vi.fn();

function Path(): React.ReactElement {
  return <output>{useLocation().pathname}</output>;
}

const path = (): string | null | undefined => host.querySelector("output")?.textContent;

const show = (entitlements: Entitlements): void =>
  act(() =>
    root.render(
      <QueryClientProvider client={seededClient(entitlements)}>
        <MemoryRouter>
          <DoneStep wizard={wizard} api={hangingApi} finish={finish} />
          <Path />
        </MemoryRouter>
      </QueryClientProvider>
    )
  );

const done = (): void =>
  act(() => [...host.querySelectorAll("button")].find((b) => b.textContent === "Done")?.click());

describe("P7", () => {
  it("explains the trial and what members get, with no price and no x, and lands on the plan", () => {
    show(ENTITLEMENTS.trial);
    expect(host.textContent).toContain("14 days free.");
    expect(host.textContent).toContain("Always free");
    expect(host.textContent).toMatch(/these need a membership\./);
    expect(host.querySelector('button[aria-label="Close"]')).toBeNull();
    expect(host.textContent).not.toMatch(/\$|Yearly|Monthly/);
    const cards = host.querySelector('[role="region"][aria-label="Members get…"]');
    expect(cards?.getAttribute("tabindex")).toBe("0");
    expect(cards?.querySelector("a, button")).toBeNull();
    const join = [...host.querySelectorAll("a")].find((a) => a.textContent === "Become a member");
    expect(join?.getAttribute("href")).toBe("/app/membership?source=onboarding");
    settled();
    done();
    expect(wizard.complete).toHaveBeenCalledWith("later", "plan");
  });

  it("finishes the walk where Become a member goes, without the wizard's own routing", () => {
    show(ENTITLEMENTS.trial);
    const join = [...host.querySelectorAll("a")].find((a) => a.textContent === "Become a member");
    settled();
    act(() => join?.click());
    expect(finish).toHaveBeenCalledExactlyOnceWith("later", "plan");
    expect(wizard.complete).not.toHaveBeenCalled();
  });

  it("does not follow Become a member on a tap as it opens, where the step before had its Continue", () => {
    show(ENTITLEMENTS.trial);
    const join = [...host.querySelectorAll("a")].find((a) => a.textContent === "Become a member");
    act(() => join?.click());
    expect(path()).toBe("/");
    expect(finish).not.toHaveBeenCalled();
    settled();
    act(() => join?.click());
    expect(path()).toBe("/app/membership");
    expect(finish).toHaveBeenCalledExactlyOnceWith("later", "plan");
  });

  it("drops the trial panel once the trial is over", () => {
    show(ENTITLEMENTS.pastTrial);
    expect(host.textContent).toContain("These need a membership.");
    expect(host.textContent).not.toContain("14 days free.");
  });

  it("shows a member the week and Done", () => {
    show(ENTITLEMENTS.member);
    expect(host.textContent).toContain("Your week");
    expect(host.textContent).not.toContain("Members get…");
    settled();
    done();
    expect(wizard.complete).toHaveBeenCalledWith("member", "plan");
  });

  it("ignores a tap as it opens, the second of a double tap on the step before, then takes one", () => {
    show(ENTITLEMENTS.member);
    done();
    expect(wizard.complete).not.toHaveBeenCalled();
    settled();
    done();
    done();
    expect(wizard.complete).toHaveBeenCalledExactlyOnceWith("member", "plan");
  });
});
