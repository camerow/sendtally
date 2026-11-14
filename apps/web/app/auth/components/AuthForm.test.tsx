import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ClerkAPIResponseError } from "@clerk/react-router/errors";
import { t } from "@sendtally/features/i18n";
import { AuthForm } from "./AuthForm";
import type { AuthIntent } from "../types";

const analytics = vi.hoisted(() => ({ capture: vi.fn(), adsConversion: vi.fn() }));
vi.mock("../../lib/analytics", () => analytics);
vi.mock("react-router", () => ({ useNavigate: () => vi.fn() }));

type Failure = { message: string; longMessage: string } | null;

const clerk = vi.hoisted(() => ({
  loaded: true,
  setActive: vi.fn(),
  navigate: vi.fn(),
  // Production shape from clerk-js 6: empty query, every parameter in the hash.
  buildSignInUrl: () =>
    "https://accounts.sendtally.com/sign-in#/?redirect_url=https%3A%2F%2Fsendtally.com%2Fsign-in",
  client: {
    signIn: {} as Record<string, unknown>,
    signUp: { verifications: { externalAccount: { error: null as Failure } } },
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

const inTenMinutes = (): Date => new Date(Date.now() + 10 * 60_000);

const rateLimited = new ClerkAPIResponseError("Too many requests", {
  status: 429,
  data: [{ code: "too_many_requests", message: "Too many requests", long_message: "Slow down." }],
});

const denied = { message: "Access denied", longMessage: "You did not grant access." };

type SignInMock = Record<string, unknown> & { prepareSecondFactor: ReturnType<typeof vi.fn> };

// Clerk updates the client's sign-in object in place and returns it, after a network round
// trip, so the mock does too. The default is a sign-in that came back from Google.
function signInWith(fields: Record<string, unknown>): SignInMock {
  const signIn: SignInMock = {
    status: null,
    supportedSecondFactors: [emailFactor],
    firstFactorVerification: { strategy: "oauth_google", error: null },
    secondFactorVerification: { strategy: null, status: null, expireAt: null },
    prepareSecondFactor: vi.fn(async () => {
      await Promise.resolve();
      signIn.secondFactorVerification = {
        strategy: "email_code",
        status: "unverified",
        expireAt: inTenMinutes(),
      };
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
    clerk.client.signUp.verifications.externalAccount.error = null;
  });

  async function render(url: string, intent: AuthIntent = "sign-in"): Promise<void> {
    window.history.replaceState(null, "", url);
    await act(async () =>
      root.render(
        <StrictMode>
          <AuthForm intent={intent} />
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

  it("strips the callback marker so Back or a refresh never resumes again", async () => {
    signInWith({ status: "needs_client_trust" });
    await render("/sign-in?sso");
    expect(window.location.search).toBe("");
  });

  it("reuses a code that is still waiting to be entered", async () => {
    const signIn = signInWith({
      status: "needs_client_trust",
      secondFactorVerification: {
        strategy: "email_code",
        status: "unverified",
        expireAt: inTenMinutes(),
      },
    });
    await render("/sign-in?sso");
    expect(signIn.prepareSecondFactor).not.toHaveBeenCalled();
    expect(container.textContent).toContain(t("auth.checkInbox"));
  });

  it("shows the code step again after a reload while the code sent is still valid", async () => {
    const signIn = signInWith({
      status: "needs_client_trust",
      secondFactorVerification: {
        strategy: "email_code",
        status: "unverified",
        expireAt: inTenMinutes(),
      },
    });
    await render("/sign-in");
    expect(signIn.prepareSecondFactor).not.toHaveBeenCalled();
    expect(container.textContent).toContain(t("auth.checkInbox"));
  });

  it("emails a new code when the one sent earlier has expired", async () => {
    const signIn = signInWith({
      status: "needs_client_trust",
      secondFactorVerification: {
        strategy: "email_code",
        status: "expired",
        expireAt: new Date(Date.now() - 60_000),
      },
    });
    await render("/sign-in?sso");
    expect(signIn.prepareSecondFactor).toHaveBeenCalledOnce();
  });

  it("leaves an unfinished sign-in alone when the user did not just return from Google", async () => {
    const signIn = signInWith({ status: "needs_client_trust" });
    await render("/sign-in");
    expect(signIn.prepareSecondFactor).not.toHaveBeenCalled();
    expect(container.textContent).toContain(t("auth.continueWithGoogle"));
  });

  it("shows a cancelled Google sign-up instead of resuming an older password attempt", async () => {
    const signIn = signInWith({
      status: "needs_client_trust",
      firstFactorVerification: { strategy: "password", error: null },
    });
    clerk.client.signUp.verifications.externalAccount.error = denied;
    await render("/sign-up?sso", "sign-up");
    expect(signIn.prepareSecondFactor).not.toHaveBeenCalled();
    expect(container.textContent).toContain("You did not grant access.");
  });

  it("emails the code exactly once for a correct password from a new device", async () => {
    const signIn: SignInMock = signInWith({
      firstFactorVerification: { strategy: null, error: null },
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
    await render("/sign-in");
    await type("#bs-email", "climber@gmail.com");
    await click(t("auth.login"));
    await type("#bs-password", "correct horse");
    await click(t("common.signIn"));
    expect(signIn.prepareSecondFactor).toHaveBeenCalledOnce();
    expect(container.textContent).not.toContain(t("auth.wrongPassword"));
    expect(container.textContent).toContain(t("auth.checkInbox"));
  });

  it("sends a step this form cannot finish to that step on Clerk's hosted page", async () => {
    const signIn = signInWith({
      status: "needs_second_factor",
      supportedSecondFactors: [{ strategy: "totp" }],
    });
    await render("/sign-in?sso");
    expect(signIn.prepareSecondFactor).not.toHaveBeenCalled();
    expect(clerk.navigate).toHaveBeenCalledWith(
      "https://accounts.sendtally.com/sign-in#/factor-two?redirect_url=https%3A%2F%2Fsendtally.com%2Fsign-in"
    );
  });

  it("records a Google sign-in finished with the code as Google", async () => {
    const signIn: SignInMock = signInWith({
      status: "needs_client_trust",
      attemptSecondFactor: vi.fn(async () =>
        Object.assign(signIn, { status: "complete", createdSessionId: "sess_1" })
      ),
    });
    await render("/sign-in?sso");
    await type("#bs-code", "123456");
    await click(t("common.signIn"));
    expect(analytics.capture).toHaveBeenCalledWith("signin_completed", {
      method: "google_second_factor",
    });
  });

  it("explains a cancelled Google sign-in once, and clears it for a different email", async () => {
    signInWith({ firstFactorVerification: { strategy: "oauth_google", error: denied } });
    await render("/sign-in?sso");
    expect(container.textContent).toContain("You did not grant access.");
    await type("#bs-email", "x");
    await click(t("auth.login"));
    expect(container.textContent).not.toContain("You did not grant access.");
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
