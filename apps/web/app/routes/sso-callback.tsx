import { useClerk } from "@clerk/react-router";
import React from "react";
import { useNavigate } from "react-router";
import { AuthShell, StepBody, StepCard, StepTitle } from "../auth/components/AuthShell";
import { SSO_RETURN_PARAM } from "../auth/ssoReturn";
import { pageMeta } from "../lib/seo";
import { t } from "@sendtally/features/i18n";

const SIGN_IN_RETURN = `/sign-in?${SSO_RETURN_PARAM}`;

export function meta(): Array<Record<string, string>> {
  return pageMeta({ title: t("auth.signInTitle"), path: "/sso-callback", noindex: true });
}

export default function SsoCallback(): React.ReactElement {
  const clerk = useClerk();
  const navigate = useNavigate();

  // Clerk's own callback component drops this promise, so a status its handler has no branch
  // for (needs_client_trust after a transfer) throws and leaves the spinner up for good.
  React.useEffect(() => {
    if (!clerk.loaded) return;
    clerk
      .handleRedirectCallback({
        signInUrl: SIGN_IN_RETURN,
        secondFactorUrl: SIGN_IN_RETURN,
        signUpUrl: `/sign-up?${SSO_RETURN_PARAM}`,
        signInForceRedirectUrl: "/app",
        signUpForceRedirectUrl: "/app",
      })
      .catch(() => navigate(SIGN_IN_RETURN));
  }, [clerk, clerk.loaded, navigate]);

  return (
    <AuthShell>
      <StepCard step={t("auth.stepSignIn")}>
        <StepTitle>{t("auth.verifyingTitle")}</StepTitle>
        <StepBody>{t("auth.ssoBody")}</StepBody>
      </StepCard>
    </AuthShell>
  );
}
