import type { SignInOutcome } from "./types";

type OAuthResult = {
  createdSessionId: string | null;
  signUp?: { createdSessionId: string | null };
};

// Clerk turns an unknown Google or Apple identity into a sign-up by transfer, and the
// session then comes from the sign-up rather than the sign-in.
export function oauthOutcome(result: OAuthResult): SignInOutcome {
  return result.createdSessionId !== null &&
    result.signUp?.createdSessionId === result.createdSessionId
    ? "signed-up"
    : "signed-in";
}
