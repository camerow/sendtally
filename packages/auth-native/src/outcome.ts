import type { SignInOutcome } from "./types";

type OAuthResult = {
  createdSessionId: string | null;
  signUp?: { createdSessionId: string | null };
};

export function oauthOutcome(result: OAuthResult): SignInOutcome {
  return result.createdSessionId !== null &&
    result.signUp?.createdSessionId === result.createdSessionId
    ? "signed-up"
    : "signed-in";
}

type VerificationError = { code?: string; longMessage?: string; message?: string };

type SSOResult = {
  authSessionResult?: { type: string } | null;
  signIn?: { firstFactorVerification?: { error?: VerificationError | null } };
};

export function ssoFailure(result: SSOResult): {
  reason: "cancelled" | "incomplete";
  code?: string;
  message?: string;
} {
  const type = result.authSessionResult?.type;
  if (type === "cancel" || type === "dismiss") return { reason: "cancelled" };
  const error = result.signIn?.firstFactorVerification?.error ?? undefined;
  return {
    reason: "incomplete",
    code: error?.code ?? (type === undefined || type === "success" ? undefined : type),
    message: error?.longMessage ?? error?.message,
  };
}
