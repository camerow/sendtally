import React from "react";
import { Button } from "@sendtally/design";
import { useMembership } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { useOnePress } from "@sendtally/features/settings";
import { ClosingOffer } from "../../billing/components/ClosingOffer";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { MemberWeek } from "./MemberWeek";

/** P7: the plan is ready; a free account sees the trial and what members get, a member the week. */
export const DoneStep: StepComponent = ({ wizard, api, finish }) => {
  const member = useMembership(api).active === true;
  const once = useOnePress(true);
  return (
    <WizardFrame
      wizard={wizard}
      bar={false}
      footer={
        <Button
          variant="azure"
          onClick={once(() => wizard.complete(member ? "member" : "later", "plan"))}
        >
          {t("common.done")}
        </Button>
      }
    >
      <div className="closing">
        <h1 className="wizard-title">{t("onboarding.plan.done.title")}</h1>
        {member ? (
          <MemberWeek api={api} />
        ) : (
          <ClosingOffer api={api} onJoin={once(() => finish?.("later", "plan"))} />
        )}
      </div>
    </WizardFrame>
  );
};
