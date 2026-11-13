import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ClerkAPIResponseError } from "@clerk/react-router/errors";
import { t } from "@sendtally/features/i18n";
import { AuthForm } from "./AuthForm";

const analytics = vi.hoisted(() => ({ capture: vi.fn(), adsConversion: vi.fn() }));
vi.mock("../../lib/analytics", () => analytics);
vi.mock("react-router", () => ({ useNavigate: () => vi.fn() }));

const clerk = vi.hoisted(() => ({
  loaded: true,
  setActive: vi.fn(),
  navigate: vi.fn(),
  buildSignInUrl: () => "https://accounts.sendtally.com/sign-in",
  client: {
    signIn: {} as Record<string, unknown>,
    signUp: { verifications: { externalAccount: { error: null } } },
  },
}));
vi.mock("@clerk/react-router", () => ({ useClerk: () => clerk }));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

const emailFactor = {
  strategy: "email_code",
  emailAddressId: "idn_1",
  safeIdentifier: "c***@gmail.com",
};

const rateLimited = new ClerkAPIResponseError("Too many requests", {
  status: 429,
  data: [{ code: "too_many_requests", message: "Too many requests", long_message: "Slow down." }],
});

type SignInMock = Record<string, unknown> & { prepareSecondFactor: ReturnType<typeof vi.fn> };

// Clerk updates the client's sign-in object in place and returns it, so the mock does too.
function signInWith(fields: Record<string, unknown>): SignInMock {
  const signIn: SignInMock = {
    status: null,
    supportedSecondFactors: [emailFactor],
    firstFactorVerification: { strategy: null, error: null },
    secondFactorVerification: { strategy: null },
    prepareSecondFactor: vi.fn(async () => {
      await Promise.resolve();
      signIn.secondFactorVerification = { strategy: "email_code" };
      return signIn;
    }),
    ...fields,
  };
  clerk.client.signIn = signIn;
  return signIn;
}

describe("AuthForm", () => {
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
    window.history.replaceState(null, "", "/");
    analytics.capture.mockReset();
    clerk.navigate.mockReset();
  });

  async function render(url = "/sign-in"): Promise<void> {
    window.history.replaceState(null, "", url);
    await act(async () =>
      root.render(
        <StrictMode>
          <AuthForm intent="sign-in" />
        </StrictMode>
      )
    );
  }

  function button(label: string): HTMLButtonElement {
    const found = [...container.querySelectorAll("button")].find((b) => b.textContent === label);
    if (found === undefined) throw new Error(`no button "${label}"`);
    return found;
  }

  async function click(label: string): Promise<void> {
    await act(async () => button(label).click());
  }

  async function type(selector: string, value: string): Promise<void> {
    const input = container.querySelector<HTMLInputElement>(selector);
    if (input === null) throw new Error(`no input ${selector}`);
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    await act(async () => {
      setValue?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it("emails the code once for a Google sign-in that returns needing a second factor", async () => {
    const signIn = signInWith({ status: "needs_client_trust" });
    await render("/sign-in?sso");
    expect(signIn.prepareSecondFactor).toHaveBeenCalledOnce();
    expect(signIn.prepareSecondFactor).toHaveBeenCalledWith({
      strategy: "email_code",
      emailAddressId: "idn_1",
    });
    expect(analytics.capture).toHaveBeenCalledWith("auth_code_sent", { mode: "second-factor" });
    expect(container.textContent).toContain(t("auth.checkInbox"));
    expect(container.textContent).toContain("c***@gmail.com");
  });

  it("reuses the code already sent when the code step is reloaded", async () => {
    const signIn = signInWith({
      status: "needs_client_trust",
      secondFactorVerification: { strategy: "email_code" },
    });
    await render("/sign-in?sso");
    expect(signIn.prepareSecondFactor).not.toHaveBeenCalled();
    expect(container.textContent).toContain(t("auth.checkInbox"));
  });

  it("leaves an old unfinished sign-in alone when the user did not just return from Google", async () => {
    const signIn = signInWith({ status: "needs_client_trust" });
    await render("/sign-in");
    expect(signIn.prepareSecondFactor).not.toHaveBeenCalled();
    expect(container.textContent).toContain(t("auth.continueWithGoogle"));
  });

  it("emails the code exactly once for a correct password from a new device", async () => {
    const signIn: SignInMock = signInWith({
      create: vi.fn(async () =>
        Object.assign(signIn, {
          status: "needs_first_factor",
          supportedFirstFactors: [{ strategy: "password" }],
        })
      ),
      attemptFirstFactor: vi.fn(async () =>
        Object.assign(signIn, {
          status: "needs_client_trust",
          firstFactorVerification: { strategy: "password", error: null },
        })
      ),
    });
    await render("/sign-in?sso");
    await type("#bs-email", "climber@gmail.com");
    await click(t("auth.login"));
    await type("#bs-password", "correct horse");
    await click(t("common.signIn"));
    expect(signIn.prepareSecondFactor).toHaveBeenCalledOnce();
    expect(container.textContent).not.toContain(t("auth.wrongPassword"));
    expect(container.textContent).toContain(t("auth.checkInbox"));
  });

  it("sends a step this form cannot finish to Clerk's hosted page for it", async () => {
    const signIn = signInWith({
      status: "needs_second_factor",
      supportedSecondFactors: [{ strategy: "totp" }],
    });
    await render("/sign-in?sso");
    expect(signIn.prepareSecondFactor).not.toHaveBeenCalled();
    expect(clerk.navigate).toHaveBeenCalledWith(
      "https://accounts.sendtally.com/sign-in#/factor-two"
    );
  });

  it("records a Google sign-in finished with the code as Google", async () => {
    const signIn: SignInMock = signInWith({
      status: "needs_client_trust",
      attemptSecondFactor: vi.fn(async () =>
        Object.assign(signIn, {
          status: "complete",
          createdSessionId: "sess_1",
          firstFactorVerification: { strategy: "oauth_google", error: null },
        })
      ),
    });
    await render("/sign-in?sso");
    await type("#bs-code", "123456");
    await click(t("common.signIn"));
    expect(analytics.capture).toHaveBeenCalledWith("signin_completed", {
      method: "google_second_factor",
    });
  });

  it("explains a Google sign-in that was cancelled", async () => {
    signInWith({
      firstFactorVerification: {
        strategy: "oauth_google",
        error: { message: "Access denied", longMessage: "You did not grant access." },
      },
    });
    await render("/sign-in?sso");
    expect(container.textContent).toContain("You did not grant access.");
  });

  it("resends the code on request and shows Clerk's refusal when it is rate limited", async () => {
    const signIn = signInWith({ status: "needs_second_factor" });
    await render("/sign-in?sso");
    signIn.prepareSecondFactor.mockRejectedValueOnce(rateLimited);
    await click(t("auth.resendCode"));
    expect(signIn.prepareSecondFactor).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("Slow down.");
  });
});
