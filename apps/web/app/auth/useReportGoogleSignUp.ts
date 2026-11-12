import React from "react";
import { useSearchParams } from "react-router";
import { adsConversion, capture } from "../lib/analytics";

export const GOOGLE_SIGN_UP_PARAM = "signup";

// Clerk sends a brand new Google account to its sign-up redirect, which carries this
// parameter, and a returning one to the plain sign-in redirect.
export function useReportGoogleSignUp(): void {
  const [params, setParams] = useSearchParams();
  const reported = React.useRef(false);
  const isNewGoogleAccount = params.get(GOOGLE_SIGN_UP_PARAM) === "google";

  React.useEffect(() => {
    if (!isNewGoogleAccount || reported.current) return;
    reported.current = true;
    capture("signup_completed", { method: "google" });
    adsConversion("signUp");
    setParams(
      (current) => {
        current.delete(GOOGLE_SIGN_UP_PARAM);
        return current;
      },
      { replace: true }
    );
  }, [isNewGoogleAccount, setParams]);
}
