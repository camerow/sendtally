import React from "react";
import { adsConversion, capture } from "../lib/analytics";

const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;

type SignedUpUser = {
  id: string;
  createdAt: Date | null;
  externalAccounts: readonly { provider: string }[];
};

function claimReport(userId: string): boolean {
  const key = `sendtally.signup-reported.${userId}`;
  try {
    if (localStorage.getItem(key) !== null) return false;
    localStorage.setItem(key, "1");
  } catch {
    // Storage blocked: the ref in the hook still keeps it to once per page load.
  }
  return true;
}

// Google sign-up finishes on Clerk's redirect, which lands on /app whichever page it started
// from, so a just-created Google account is the only reliable sign that this was a sign-up.
export function useReportGoogleSignUp(user: SignedUpUser | null | undefined): void {
  const reported = React.useRef(false);

  React.useEffect(() => {
    if (user == null || user.createdAt == null || reported.current) return;
    const isNew = Date.now() - user.createdAt.getTime() < NEW_ACCOUNT_WINDOW_MS;
    const viaGoogle = user.externalAccounts.some((account) => account.provider === "google");
    if (!isNew || !viaGoogle) return;
    reported.current = true;
    if (!claimReport(user.id)) return;
    capture("signup_completed", { method: "google" });
    adsConversion("signUp");
  }, [user]);
}
