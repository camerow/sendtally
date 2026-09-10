import { AuthenticateWithRedirectCallback } from "@clerk/react-router";
import React from "react";
import { AuthShell, StepBody, StepCard, StepTitle } from "../auth/components/AuthShell";
import { pageMeta } from "../lib/seo";

export function meta(): Array<Record<string, string>> {
  return pageMeta({ title: "sign in - sendtally", path: "/sso-callback", noindex: true });
}

export default function SsoCallback(): React.ReactElement {
  return (
    <AuthShell>
      <StepCard step="SIGN IN">
        <StepTitle>Signing you in…</StepTitle>
        <StepBody>One moment - finishing up with Google.</StepBody>
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/app"
          signUpForceRedirectUrl="/app"
        />
      </StepCard>
    </AuthShell>
  );
}
