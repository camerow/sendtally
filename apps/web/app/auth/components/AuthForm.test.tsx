import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
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
  client: { signIn: {} as Record<string, unknown> },
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
    analytics.capture.mockReset();
  });

  async function render(): Promise<void> {
    await act(async () => root.render(<AuthForm intent="sign-in" />));
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

  it("emails the code for a Google sign-in that comes back needing a second factor", async () => {
    const prepareSecondFactor = vi.fn().mockResolvedValue({});
    clerk.client.signIn = {
      status: "needs_client_trust",
      supportedSecondFactors: [emailFactor],
      prepareSecondFactor,
    };
    await render();
    expect(prepareSecondFactor).toHaveBeenCalledWith({
      strategy: "email_code",
      emailAddressId: "idn_1",
    });
    expect(analytics.capture).toHaveBeenCalledWith("auth_code_sent", { mode: "second-factor" });
    expect(container.textContent).toContain(t("auth.checkInbox"));
    expect(container.textContent).toContain("c***@gmail.com");
  });

  it("asks a correct password from a new device for a code instead of rejecting it", async () => {
    const prepareSecondFactor = vi.fn().mockResolvedValue({});
    clerk.client.signIn = {
      status: null,
      prepareSecondFactor,
      create: vi.fn().mockResolvedValue({ supportedFirstFactors: [{ strategy: "password" }] }),
      attemptFirstFactor: vi.fn().mockResolvedValue({
        status: "needs_client_trust",
        supportedSecondFactors: [emailFactor],
      }),
    };
    await render();
    await type("#bs-email", "climber@gmail.com");
    await click(t("auth.login"));
    await type("#bs-password", "correct horse");
    await click(t("common.signIn"));
    expect(prepareSecondFactor).toHaveBeenCalledOnce();
    expect(container.textContent).not.toContain(t("auth.wrongPassword"));
    expect(container.textContent).toContain(t("auth.checkInbox"));
  });

  it("resends the code and shows Clerk's refusal when it is rate limited", async () => {
    const prepareSecondFactor = vi.fn().mockResolvedValueOnce({}).mockRejectedValue(rateLimited);
    clerk.client.signIn = {
      status: "needs_second_factor",
      supportedSecondFactors: [emailFactor],
      prepareSecondFactor,
    };
    await render();
    await click(t("auth.resendCode"));
    expect(prepareSecondFactor).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("Slow down.");
  });
});
