import { AuthenticateWithRedirectCallback } from "@clerk/react-router";
import React from "react";
import { AuthShell, StepBody, StepCard, StepTitle } from "../auth/components/AuthShell";
import { pageMeta } from "../lib/seo";
import { t, upper } from "@sendtally/features/i18n";

export function meta(): Array<Record<string, string>> {
  return pageMeta({ title: t("web.auth.signInTitle"), path: "/sso-callback", noindex: true });
}

export default function SsoCallback(): React.ReactElement {
  return (
    <AuthShell>
      <StepCard step={upper(t("web.auth.stepSignIn"))}>
        <StepTitle>{t("web.auth.verifyingTitle")}</StepTitle>
        <StepBody>{t("web.auth.ssoBody")}</StepBody>
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl="/app"
          signUpForceRedirectUrl="/app"
        />
      </StepCard>
    </AuthShell>
  );
}
