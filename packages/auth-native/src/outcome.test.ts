import { describe, expect, it } from "vitest";
import { oauthOutcome, ssoFailure } from "./outcome";

describe("oauthOutcome", () => {
  it("is a sign-up when Clerk transferred an unknown Google or Apple identity to a sign-up", () => {
    expect(
      oauthOutcome({ createdSessionId: "sess_1", signUp: { createdSessionId: "sess_1" } })
    ).toBe("signed-up");
  });

  it("is a sign-in when the session came from the sign-in", () => {
    expect(oauthOutcome({ createdSessionId: "sess_1", signUp: { createdSessionId: null } })).toBe(
      "signed-in"
    );
    expect(oauthOutcome({ createdSessionId: "sess_1" })).toBe("signed-in");
  });

  it("ignores a sign-up left over from an earlier attempt", () => {
    expect(
      oauthOutcome({ createdSessionId: "sess_2", signUp: { createdSessionId: "sess_1" } })
    ).toBe("signed-in");
  });
});

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
