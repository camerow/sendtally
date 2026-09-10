import { useClerk } from "@clerk/react-router";
import { isClerkAPIResponseError } from "@clerk/react-router/errors";
import React from "react";
import { useNavigate } from "react-router";
import type { EmailCodeFactor } from "@clerk/types";
import { AuthShell, StepBody, StepCard, StepTitle } from "./AuthShell";
import { capture } from "../../lib/analytics";
import { PRIVACY_PATH, TERMS_PATH } from "../../legal/constants";
import type { AuthIntent } from "../types";

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  color: "var(--bs-gunmetal)",
  background: "#F7F6F3",
  border: "1px solid rgba(64,63,76,0.12)",
  borderRadius: "var(--radius-control)",
  padding: "13px 15px",
  outline: "none",
};

const azureButton: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 15,
  color: "var(--bs-white)",
  background: "var(--bs-azure-ink)",
  border: "none",
  borderRadius: "var(--radius-control)",
  padding: "13px 15px",
  cursor: "pointer",
};

const oauthButton: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 15,
  color: "var(--bs-gunmetal)",
  background: "var(--bs-white)",
  border: "1px solid rgba(64,63,76,0.18)",
  borderRadius: "var(--radius-control)",
  padding: "12px 15px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
};

const linkButton: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "rgba(64,63,76,0.6)",
  background: "none",
  border: "none",
  cursor: "pointer",
  textDecoration: "underline",
};

const stepLabel: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "var(--text-label-accent)",
};

const errorText: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text-label-accent)",
};

const footnote: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "rgba(64,63,76,0.58)",
};

const COPY: Record<
  AuthIntent,
  {
    step: string;
    title: string;
    body: string;
    swapPrompt: string;
    swapLabel: string;
    swapTo: string;
  }
> = {
  "sign-in": {
    step: "SIGN IN",
    title: "Welcome back.",
    body: "No password. Enter the email you signed up with and we send a one-time code.",
    swapPrompt: "First time here?",
    swapLabel: "Create an account",
    swapTo: "/sign-up",
  },
  "sign-up": {
    step: "STEP 1 OF 2 · ACCOUNT",
    title: "Create your account.",
    body: "No password. Enter your email and we send a one-time code. Logging sessions and Strava sync are free.",
    swapPrompt: "Already have an account?",
    swapLabel: "Sign in",
    swapTo: "/sign-in",
  },
};

function clerkErrorMessage(err: unknown): string {
  if (isClerkAPIResponseError(err)) {
    const first = err.errors[0];
    if (first !== undefined) return first.longMessage ?? first.message;
  }
  return "Something went wrong. Try again.";
}

type Phase = { name: "email" } | { name: "code"; mode: AuthIntent };

function funnel(intent: AuthIntent): "signup" | "signin" {
  return intent === "sign-up" ? "signup" : "signin";
}

function GoogleMark(): React.ReactElement {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.55c0-1.64-.15-3.22-.42-4.73H24v8.95h11.83c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.57-9.47 6.57-16.38z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

const dividerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.45)",
};

const dividerRule: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: "rgba(64,63,76,0.12)",
};

function SwapLink({ intent }: { intent: AuthIntent }): React.ReactElement {
  const copy = COPY[intent];
  return (
    <span style={footnote}>
      {copy.swapPrompt}{" "}
      <a href={copy.swapTo} style={{ color: "var(--text-link)" }}>
        {copy.swapLabel}
      </a>
    </span>
  );
}

function LegalConsent(): React.ReactElement {
  return (
    <span style={{ ...footnote, lineHeight: 1.6 }}>
      By continuing you agree to the{" "}
      <a href={TERMS_PATH} style={{ color: "var(--text-link)" }}>
        terms of service
      </a>{" "}
      and the{" "}
      <a href={PRIVACY_PATH} style={{ color: "var(--text-link)" }}>
        privacy policy
      </a>
      .
    </span>
  );
}

export function AuthForm({ intent }: { intent: AuthIntent }): React.ReactElement {
  const clerk = useClerk();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>({ name: "email" });
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const copy = COPY[intent];

  async function continueWithGoogle(): Promise<void> {
    if (!clerk.loaded || clerk.client === undefined) return;
    setError(null);
    setBusy(true);
    capture(`${funnel(intent)}_started`, { method: "google" });
    try {
      const flow = intent === "sign-up" ? clerk.client.signUp : clerk.client.signIn;
      await flow.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/app",
      });
    } catch (err) {
      setError(clerkErrorMessage(err));
      setBusy(false);
    }
  }

  async function sendCode(): Promise<void> {
    if (!clerk.loaded || clerk.client === undefined) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError("That doesn't look like an email address.");
      return;
    }
    setError(null);
    setBusy(true);
    capture(`${funnel(intent)}_started`, { method: "email_code" });
    try {
      const signIn = await clerk.client.signIn.create({ identifier: email });
      const factor = signIn.supportedFirstFactors?.find(
        (f): f is EmailCodeFactor => f.strategy === "email_code"
      );
      if (factor === undefined) {
        setError("Email code sign-in is not enabled for this account.");
        setBusy(false);
        return;
      }
      await signIn.prepareFirstFactor({
        strategy: "email_code",
        emailAddressId: factor.emailAddressId,
      });
      capture("auth_code_sent", { mode: "sign-in" });
      setPhase({ name: "code", mode: "sign-in" });
    } catch (signInErr) {
      const identifierNotFound =
        isClerkAPIResponseError(signInErr) &&
        signInErr.errors.some((e) => e.code === "form_identifier_not_found");
      if (!identifierNotFound) {
        setError(clerkErrorMessage(signInErr));
        setBusy(false);
        return;
      }
      if (intent === "sign-in") {
        setError("No account for that email yet. Check the address, or create an account below.");
        setBusy(false);
        return;
      }
      try {
        const signUp = await clerk.client.signUp.create({ emailAddress: email });
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        capture("auth_code_sent", { mode: "sign-up" });
        setPhase({ name: "code", mode: "sign-up" });
      } catch (signUpErr) {
        setError(clerkErrorMessage(signUpErr));
      }
    }
    setBusy(false);
  }

  async function verifyCode(): Promise<void> {
    if (!clerk.loaded || clerk.client === undefined || phase.name !== "code") return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the six-digit code from the email.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (phase.mode === "sign-in") {
        const result = await clerk.client.signIn.attemptFirstFactor({
          strategy: "email_code",
          code: code.trim(),
        });
        if (result.status === "complete" && result.createdSessionId !== null) {
          capture("signin_completed", { method: "email_code" });
          await clerk.setActive({ session: result.createdSessionId });
          await navigate("/app");
          return;
        }
        setError(`Sign-in incomplete (status: ${result.status ?? "unknown"}). Try resending.`);
      } else {
        let signUp = await clerk.client.signUp.attemptEmailAddressVerification({
          code: code.trim(),
        });
        if (signUp.status === "missing_requirements" && signUp.missingFields.length === 0) {
          signUp = await signUp.update({});
        }
        if (signUp.status === "complete" && signUp.createdSessionId !== null) {
          capture("signup_completed", { method: "email_code" });
          await clerk.setActive({ session: signUp.createdSessionId });
          await navigate("/app");
          return;
        }
        const missing = signUp.missingFields.join(", ");
        setError(
          `Account creation incomplete (status: ${signUp.status ?? "unknown"}${
            missing !== "" ? `, missing: ${missing}` : ""
          }). This is a setup gap on our side - tell us what this says.`
        );
      }
    } catch (err) {
      setError(clerkErrorMessage(err));
    }
    setBusy(false);
  }

  if (phase.name === "code") {
    return (
      <AuthShell>
        <StepCard step={copy.step}>
          <StepTitle>Check your inbox.</StepTitle>
          <StepBody>
            We sent a six-digit code to{" "}
            <span style={{ color: "var(--bs-gunmetal)", fontWeight: 600 }}>{email}</span>. Enter it
            here to {phase.mode === "sign-up" ? "create your account" : "sign in"}.
          </StepBody>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <label htmlFor="bs-code" style={stepLabel}>
              CODE
            </label>
            <input
              id="bs-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void verifyCode();
              }}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
            />
            {error !== null && <span style={errorText}>{error}</span>}
            <button
              onClick={() => void verifyCode()}
              disabled={busy}
              style={{ ...azureButton, opacity: busy ? 0.45 : 1 }}
            >
              {phase.mode === "sign-up" ? "Create account" : "Sign in"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <button
              onClick={() => {
                setPhase({ name: "email" });
                setCode("");
                setError(null);
              }}
              style={linkButton}
            >
              Use a different email
            </button>
            <button onClick={() => void sendCode()} style={linkButton}>
              Resend code
            </button>
          </div>
          <span style={footnote}>The code works once and expires quickly.</span>
        </StepCard>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <StepCard step={copy.step}>
        <StepTitle>{copy.title}</StepTitle>
        <StepBody>{copy.body}</StepBody>
        <button
          onClick={() => void continueWithGoogle()}
          disabled={busy}
          style={{ ...oauthButton, opacity: busy ? 0.45 : 1 }}
        >
          <GoogleMark />
          Continue with Google
        </button>
        <div style={dividerStyle}>
          <span style={dividerRule} />
          OR
          <span style={dividerRule} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <label htmlFor="bs-email" style={stepLabel}>
            EMAIL
          </label>
          <input
            id="bs-email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void sendCode();
            }}
            style={inputStyle}
          />
          {error !== null && <span style={errorText}>{error}</span>}
          <button
            onClick={() => void sendCode()}
            disabled={busy}
            style={{ ...azureButton, opacity: busy ? 0.45 : 1 }}
          >
            Email me a code
          </button>
          <div id="clerk-captcha" />
        </div>
        <SwapLink intent={intent} />
        <LegalConsent />
      </StepCard>
    </AuthShell>
  );
}
