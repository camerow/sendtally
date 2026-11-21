import React from "react";
import { t } from "@sendtally/features/i18n";

/** Marks an exercise or workout the user made, not one from the library. */
export function YoursTag(): React.ReactElement {
  return <span className="plan-path-yours">{t("onboarding.plan.yours")}</span>;
}
