import { useClerk } from "@clerk/react-router";
import React from "react";
import { AuthShell, StepBody, StepCard, StepTitle } from "../auth/components/AuthShell";
import { pageMeta } from "../lib/seo";
import { t } from "@sendtally/features/i18n";

export function meta(): Array<Record<string, string>> {
  return pageMeta({ title: t("auth.signInTitle"), path: "/sign-in/verify", noindex: true });
}

type VerifyState = "verifying" | "verified-elsewhere" | "expired" | "failed";

function copyFor(state: VerifyState): { title: string; body: string } {
  switch (state) {
    case "verifying":
      return { title: t("auth.verifyingTitle"), body: t("auth.verifyingBody") };
    case "verified-elsewhere":
      return {
        title: t("auth.verifiedElsewhereTitle"),
        body: t("auth.verifiedElsewhereBody"),
      };
    case "expired":
      return { title: t("auth.expiredTitle"), body: t("auth.expiredBody") };
    case "failed":
      return { title: t("auth.failedTitle"), body: t("auth.failedBody") };
  }
}

export default function SignInVerify(): React.ReactElement {
  const clerk = useClerk();
  const [state, setState] = React.useState<VerifyState>("verifying");

  React.useEffect(() => {
    let cancelled = false;
    clerk
      .handleEmailLinkVerification({ redirectUrlComplete: "/app" })
      .then(() => {
        if (!cancelled) setState("verified-elsewhere");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const code = (err as { code?: string }).code;
        setState(code === "expired" ? "expired" : "failed");
      });
    return () => {
      cancelled = true;
    };
  }, [clerk]);

  const { title, body } = copyFor(state);
  return (
    <AuthShell>
      <StepCard step={t("auth.stepAccount")}>
        <StepTitle>{title}</StepTitle>
        <StepBody>{body}</StepBody>
        {state !== "verifying" && (
          <a
            href="/sign-in"
            style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-link)" }}
          >
            {state === "verified-elsewhere" ? t("auth.signInOnThisDevice") : t("auth.backToSignIn")}
          </a>
        )}
      </StepCard>
    </AuthShell>
  );
}
