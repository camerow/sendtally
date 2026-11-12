import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import { useReportGoogleSignUp } from "./useReportGoogleSignUp";

const analytics = vi.hoisted(() => ({ capture: vi.fn(), adsConversion: vi.fn() }));
vi.mock("../lib/analytics", () => analytics);

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

function Probe(): React.ReactElement {
  useReportGoogleSignUp();
  return <output>{useLocation().search}</output>;
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
    analytics.capture.mockReset();
    analytics.adsConversion.mockReset();
  });

  function visit(url: string): void {
    act(() =>
      root.render(
        <MemoryRouter initialEntries={[url]}>
          <Probe />
        </MemoryRouter>
      )
    );
  }

  it("reports a new Google account once and clears the marker", () => {
    visit("/app?signup=google&tab=log");
    expect(analytics.capture).toHaveBeenCalledTimes(1);
    expect(analytics.capture).toHaveBeenCalledWith("signup_completed", { method: "google" });
    expect(analytics.adsConversion).toHaveBeenCalledTimes(1);
    expect(analytics.adsConversion).toHaveBeenCalledWith("signUp");
    expect(container.querySelector("output")?.textContent).toBe("?tab=log");
  });

  it("stays quiet for a returning sign-in", () => {
    visit("/app");
    expect(analytics.capture).not.toHaveBeenCalled();
    expect(analytics.adsConversion).not.toHaveBeenCalled();
  });
});
