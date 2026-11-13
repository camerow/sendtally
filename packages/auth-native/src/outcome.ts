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
