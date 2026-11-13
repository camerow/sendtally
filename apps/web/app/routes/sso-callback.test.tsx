import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import SsoCallback from "./sso-callback";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("react-router", () => ({ useNavigate: () => navigate }));

const clerk = vi.hoisted(() => ({ loaded: true, handleRedirectCallback: vi.fn() }));
vi.mock("@clerk/react-router", () => ({ useClerk: () => clerk }));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

describe("SsoCallback", () => {
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
    navigate.mockReset();
  });

  it("returns every unfinished sign-in to our own forms", async () => {
    clerk.handleRedirectCallback.mockResolvedValue(undefined);
    await act(async () => root.render(<SsoCallback />));
    expect(clerk.handleRedirectCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        signInUrl: "/sign-in?sso",
        secondFactorUrl: "/sign-in?sso",
        signUpUrl: "/sign-up?sso",
      })
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it("sends the user to sign in when Clerk's callback throws instead of leaving a spinner", async () => {
    clerk.handleRedirectCallback.mockRejectedValue(new Error("unhandled status"));
    await act(async () => root.render(<SsoCallback />));
    expect(navigate).toHaveBeenCalledWith("/sign-in?sso");
  });
});
