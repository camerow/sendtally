import { describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import SsoCallback from "./sso-callback";

const callback = vi.hoisted(() => vi.fn((_props: Record<string, string>): null => null));
vi.mock("@clerk/react-router", () => ({ AuthenticateWithRedirectCallback: callback }));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

describe("SsoCallback", () => {
  it("returns every unfinished Google sign-in to our own forms", () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const root = createRoot(document.createElement("div"));
    act(() => root.render(<SsoCallback />));
    expect(callback.mock.calls[0]?.[0]).toEqual({
      signInUrl: "/sign-in?sso",
      secondFactorUrl: "/sign-in?sso",
      signUpUrl: "/sign-up?sso",
      signInForceRedirectUrl: "/app",
      signUpForceRedirectUrl: "/app",
    });
    act(() => root.unmount());
  });
});
