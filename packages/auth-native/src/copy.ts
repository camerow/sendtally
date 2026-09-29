import { t } from "@sendtally/features/i18n";
import type { FlowCopy, Intent, IntentSwap, Phase } from "./types";

export function swapFor(intent: Intent): IntentSwap {
  return intent === "sign-in"
    ? {
        to: "sign-up",
        prompt: t("auth.signInSwapPrompt"),
        label: t("auth.signInSwapLabel"),
      }
    : {
        to: "sign-in",
        prompt: t("auth.signUpSwapPrompt"),
        label: t("common.signIn"),
      };
}

export function copyFor(intent: Intent, phase: Phase, email: string): FlowCopy {
  if (phase.name === "code") {
    return {
      title: t("auth.checkInbox"),
      body:
        phase.mode === "second-factor"
          ? t("auth.secondFactorBody", { email })
          : t("auth.codeSentBody", { email }),
      submitLabel: phase.mode === "sign-up" ? t("common.createAccount") : t("common.signIn"),
    };
  }
  if (phase.name === "password") {
    return {
      title: t("auth.signInHeading"),
      body: t("auth.passwordBody", { email }),
      submitLabel: t("common.signIn"),
    };
  }
  return intent === "sign-in"
    ? { title: t("auth.signInHeading"), body: t("auth.signInBody"), submitLabel: t("auth.login") }
    : {
        title: t("auth.signUpHeading"),
        body: t("auth.signUpBody"),
        submitLabel: t("auth.continue"),
      };
}
