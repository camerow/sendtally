import { describe, expect, it } from "vitest";
import { t } from "@sendtally/features/i18n";
import { copyFor, swapFor } from "./copy";

const email = "a@b.co";

describe("copyFor", () => {
  it("uses the intent on the email phase", () => {
    expect(copyFor("sign-in", { name: "email" }, email).submitLabel).toBe(t("auth.login"));
    expect(copyFor("sign-up", { name: "email" }, email).submitLabel).toBe(t("auth.continue"));
  });

  it("names the account action for a sign-up code", () => {
    const signUp = copyFor("sign-up", { name: "code", mode: "sign-up" }, email);
    const signIn = copyFor("sign-up", { name: "code", mode: "sign-in" }, email);
    expect(signUp.submitLabel).not.toBe(signIn.submitLabel);
    expect(signIn.body).toContain(email);
  });

  it("explains a second-factor code differently from a first-factor one", () => {
    const second = copyFor("sign-in", { name: "code", mode: "second-factor" }, email);
    const first = copyFor("sign-in", { name: "code", mode: "sign-in" }, email);
    expect(second.body).not.toBe(first.body);
    expect(second.title).toBe(first.title);
  });

  it("shows the sign-in heading on the password phase whatever the intent", () => {
    expect(copyFor("sign-up", { name: "password" }, email).title).toBe(
      copyFor("sign-in", { name: "email" }, email).title
    );
  });
});

describe("swapFor", () => {
  it("points at the other intent", () => {
    expect(swapFor("sign-in").to).toBe("sign-up");
    expect(swapFor("sign-up").to).toBe("sign-in");
  });
});
