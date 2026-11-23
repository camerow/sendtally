import { describe, expect, it } from "vitest";
import { ssoFailure } from "./outcome";

describe("ssoFailure", () => {
  it("is a cancel when the person closed Google's sheet or declined the iOS prompt", () => {
    expect(ssoFailure({ authSessionResult: { type: "cancel" } })).toEqual({ reason: "cancelled" });
    expect(ssoFailure({ authSessionResult: { type: "dismiss" } })).toEqual({ reason: "cancelled" });
  });

  it("carries Clerk's verification error when Google came back without a session", () => {
    expect(
      ssoFailure({
        authSessionResult: { type: "success" },
        signIn: {
          firstFactorVerification: {
            error: { code: "external_account_exists", longMessage: "Use another method." },
          },
        },
      })
    ).toEqual({
      reason: "incomplete",
      code: "external_account_exists",
      message: "Use another method.",
    });
  });

  it("names a browser that never opened", () => {
    expect(ssoFailure({ authSessionResult: { type: "locked" } })).toEqual({
      reason: "incomplete",
      code: "locked",
      message: undefined,
    });
  });
});
