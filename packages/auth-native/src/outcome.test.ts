import { describe, expect, it } from "vitest";
import { oauthOutcome } from "./outcome";

describe("oauthOutcome", () => {
  it("is a sign-up when the session came from a transferred sign-up", () => {
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
