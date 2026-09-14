import { useClerk } from "@clerk/react-router";
import React from "react";
import { AuthShell, StepBody, StepCard, StepTitle } from "../auth/components/AuthShell";
import { pageMeta } from "../lib/seo";
import { t, upper } from "@sendtally/features/i18n";

export function meta(): Array<Record<string, string>> {
  return pageMeta({ title: t("web.auth.signInTitle"), path: "/sign-in/verify", noindex: true });
}

type VerifyState = "verifying" | "verified-elsewhere" | "expired" | "failed";

function copyFor(state: VerifyState): { title: string; body: string } {
  switch (state) {
    case "verifying":
      return { title: t("web.auth.verifyingTitle"), body: t("web.auth.verifyingBody") };
    case "verified-elsewhere":
      return {
        title: t("web.auth.verifiedElsewhereTitle"),
        body: t("web.auth.verifiedElsewhereBody"),
      };
    case "expired":
      return { title: t("web.auth.expiredTitle"), body: t("web.auth.expiredBody") };
    case "failed":
      return { title: t("web.auth.failedTitle"), body: t("web.auth.failedBody") };
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
      <StepCard step={upper(t("web.auth.stepAccount"))}>
        <StepTitle>{title}</StepTitle>
        <StepBody>{body}</StepBody>
        {state !== "verifying" && (
          <a
            href="/sign-in"
            style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-link)" }}
          >
            {state === "verified-elsewhere"
              ? t("web.auth.signInOnThisDevice")
              : t("web.auth.backToSignIn")}
          </a>
        )}
      </StepCard>
    </AuthShell>
  );
}
