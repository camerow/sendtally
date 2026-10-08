import { useClerk, useSSO, useSignIn, useSignInWithApple, useSignUp } from "@clerk/clerk-expo";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import React from "react";
import { t } from "@sendtally/features/i18n";
import { copyFor, swapFor } from "./copy";
import { errorCode, errorMessage } from "./errors";
import type { Phase, SignInFlow, SignInFlowOptions } from "./types";

WebBrowser.maybeCompleteAuthSession();

type SecondFactor = { strategy: string; emailAddressId?: string };

export function useSignInFlow({ intent, onSignedIn }: SignInFlowOptions): SignInFlow {
  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const clerk = useClerk();
  const { startSSOFlow } = useSSO();
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>({ name: "email" });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Clerk creates the session server-side before the browser sheet hands back to the
  // app, so a dropped hand-off (iOS in particular) leaves the client signed in while the
  // screen still shows the form. The next tap then fails with "already signed in".
  // Adopting whatever session the client already carries turns both into a sign-in.
  async function adoptExistingSession(): Promise<boolean> {
    await clerk.client.reload();
    const session = clerk.client.signedInSessions[0];
    if (session === undefined) return false;
    await clerk.setActive({ session: session.id });
    onSignedIn();
    return true;
  }

  async function continueWithGoogle(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      // The redirect needs a path. A bare "sendtally://" is not hierarchical, so Clerk's
      // callback comes back as "sendtally:?...&rotating_token_nonce=<nonce>%23" and the
      // nonce parses with a trailing "#", which Clerk rejects as signed out.
      const result = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: makeRedirectUri({ path: "sso-callback" }),
      });
      if (result.createdSessionId !== null && result.setActive !== undefined) {
        await result.setActive({ session: result.createdSessionId });
        onSignedIn();
        return;
      }
      if (await adoptExistingSession()) return;
      setError(t("auth.googleIncomplete"));
    } catch (err) {
      if (errorCode(err) === "session_exists" && (await adoptExistingSession())) return;
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  async function continueWithApple(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      const result = await startAppleAuthenticationFlow();
      if (result.createdSessionId !== null && result.setActive !== undefined) {
        await result.setActive({ session: result.createdSessionId });
        onSignedIn();
        return;
      }
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  // Clerk answers a challenged credential with "needs_second_factor" instead of throwing,
  // so treating every non-complete status as a bad credential told store reviewers their
  // correct password was wrong. Device Trust raises this on any unrecognised device.
  async function startSecondFactor(factors: SecondFactor[] | null): Promise<boolean> {
    const factor = factors?.find((f) => f.strategy === "email_code");
    if (!signInLoaded || factor?.emailAddressId === undefined) return false;
    await signIn.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId: factor.emailAddressId,
    });
    setPhase({ name: "code", mode: "second-factor" });
    return true;
  }

  function emailCodeFactor(): { emailAddressId: string } | undefined {
    if (!signInLoaded) return undefined;
    const factor = signIn.supportedFirstFactors?.find((f) => f.strategy === "email_code");
    return factor !== undefined && "emailAddressId" in factor ? factor : undefined;
  }

  async function prepareEmailCode(): Promise<boolean> {
    const factor = emailCodeFactor();
    if (!signInLoaded || factor === undefined) return false;
    await signIn.prepareFirstFactor({
      strategy: "email_code",
      emailAddressId: factor.emailAddressId,
    });
    setPhase({ name: "code", mode: "sign-in" });
    return true;
  }

  async function sendEmailCodeInstead(): Promise<void> {
    setError(null);
    setBusy(true);
    try {
      if (!(await prepareEmailCode())) setError(t("auth.emailCodeDisabled"));
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  async function sendCode(): Promise<void> {
    if (!signInLoaded || !signUpLoaded) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError(t("auth.invalidEmail"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const attempt = await signIn.create({ identifier: email });
      if (attempt.supportedFirstFactors?.some((f) => f.strategy === "password")) {
        setPhase({ name: "password" });
        setBusy(false);
        return;
      }
      if (!(await prepareEmailCode())) {
        setError(t("auth.emailCodeDisabled"));
        setBusy(false);
        return;
      }
    } catch (signInErr) {
      if (errorCode(signInErr) === "session_exists" && (await adoptExistingSession())) return;
      if (errorCode(signInErr) !== "form_identifier_not_found") {
        setError(errorMessage(signInErr));
        setBusy(false);
        return;
      }
      if (intent === "sign-in") {
        setError(t("auth.noAccount"));
        setBusy(false);
        return;
      }
      try {
        await signUp.create({ emailAddress: email });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPhase({ name: "code", mode: "sign-up" });
      } catch (signUpErr) {
        setError(errorMessage(signUpErr));
      }
    }
    setBusy(false);
  }

  async function verifyCode(): Promise<void> {
    if (!signInLoaded || !signUpLoaded || phase.name !== "code") return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError(t("auth.invalidCode"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (phase.mode === "second-factor") {
        const result = await signIn.attemptSecondFactor({
          strategy: "email_code",
          code: code.trim(),
        });
        if (result.status === "complete" && setActive !== undefined) {
          await setActive({ session: result.createdSessionId });
          onSignedIn();
          return;
        }
      } else if (phase.mode === "sign-in") {
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code: code.trim(),
        });
        if (result.status === "complete" && setActive !== undefined) {
          await setActive({ session: result.createdSessionId });
          onSignedIn();
          return;
        }
        if (
          result.status === "needs_second_factor" &&
          (await startSecondFactor(result.supportedSecondFactors))
        ) {
          setCode("");
          setBusy(false);
          return;
        }
      } else {
        const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (result.status === "complete" && result.createdSessionId !== null) {
          await clerk.setActive({ session: result.createdSessionId });
          onSignedIn();
          return;
        }
      }
      setError(t("auth.codeFailed"));
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  async function signInWithPassword(): Promise<void> {
    if (!signInLoaded || phase.name !== "password") return;
    if (password === "") {
      setError(t("auth.enterPassword"));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await signIn.attemptFirstFactor({ strategy: "password", password });
      if (result.status === "complete" && setActive !== undefined) {
        await setActive({ session: result.createdSessionId });
        onSignedIn();
        return;
      }
      if (
        result.status === "needs_second_factor" &&
        (await startSecondFactor(result.supportedSecondFactors))
      ) {
        setBusy(false);
        return;
      }
      setError(t("auth.wrongPassword"));
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  // Resending a second-factor code re-prepares that factor. Falling back to sendCode would
  // restart from the identifier and drop the reviewer back on the password form.
  async function resendCode(): Promise<void> {
    if (phase.name !== "code" || phase.mode === "sign-up") {
      await sendCode();
      return;
    }
    if (!signInLoaded) return;
    setError(null);
    setBusy(true);
    try {
      const resent =
        phase.mode === "second-factor"
          ? await startSecondFactor(signIn.supportedSecondFactors)
          : await prepareEmailCode();
      if (!resent) setError(t("auth.resendFailed"));
    } catch (err) {
      setError(errorMessage(err));
    }
    setBusy(false);
  }

  function backToEmail(): void {
    setPhase({ name: "email" });
    setCode("");
    setPassword("");
    setError(null);
  }

  function clearingError(set: (value: string) => void): (value: string) => void {
    return (value) => {
      set(value);
      setError(null);
    };
  }

  return {
    phase,
    email,
    setEmail: clearingError(setEmail),
    code,
    setCode: clearingError(setCode),
    password,
    setPassword: clearingError(setPassword),
    error,
    busy,
    canSendEmailCodeInstead: phase.name === "password" && emailCodeFactor() !== undefined,
    copy: copyFor(intent, phase, email),
    swap: swapFor(intent),
    submit:
      phase.name === "code"
        ? verifyCode
        : phase.name === "password"
          ? signInWithPassword
          : sendCode,
    sendCode,
    verifyCode,
    signInWithPassword,
    resendCode,
    sendEmailCodeInstead,
    continueWithGoogle,
    continueWithApple,
    backToEmail,
  };
}
