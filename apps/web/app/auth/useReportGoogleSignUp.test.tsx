import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useReportGoogleSignUp } from "./useReportGoogleSignUp";

const analytics = vi.hoisted(() => ({ capture: vi.fn(), adsConversion: vi.fn() }));
vi.mock("../lib/analytics", () => analytics);

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

type User = Parameters<typeof useReportGoogleSignUp>[0];

function userWith(minutesOld: number, provider: string | null): User {
  return {
    id: `user_${minutesOld}_${provider ?? "email"}`,
    createdAt: new Date(Date.now() - minutesOld * 60_000),
    externalAccounts: provider === null ? [] : [{ provider }],
  } as unknown as User;
}

function Probe({ user }: { user: User }): null {
  useReportGoogleSignUp(user);
  return null;
}

describe("useReportGoogleSignUp", () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    localStorage.clear();
    analytics.capture.mockReset();
    analytics.adsConversion.mockReset();
  });

  function visit(user: User): void {
    act(() => root.render(<Probe user={user} />));
  }

  it("reports a just-created Google account once, across reloads", () => {
    const user = userWith(1, "google");
    visit(user);
    act(() => root.unmount());
    root = createRoot(container);
    visit(user);
    expect(analytics.capture).toHaveBeenCalledTimes(1);
    expect(analytics.capture).toHaveBeenCalledWith("signup_completed", { method: "google" });
    expect(analytics.adsConversion).toHaveBeenCalledTimes(1);
    expect(analytics.adsConversion).toHaveBeenCalledWith("signUp");
  });

  it.each([
    ["a returning Google account", userWith(60, "google")],
    ["a new email account, which the sign-up form reports", userWith(1, null)],
  ])("stays quiet for %s", (_, user) => {
    visit(user);
    expect(analytics.capture).not.toHaveBeenCalled();
    expect(analytics.adsConversion).not.toHaveBeenCalled();
  });
});
