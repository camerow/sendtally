import React from "react";
import type { SendtallyApi } from "@sendtally/api-client";
import { Button } from "@sendtally/design";
import { useMembership } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { useMemberWeek } from "@sendtally/features/settings";
import { ClosingOffer } from "../../billing/components/ClosingOffer";
import { useLibrary } from "../../training/library/useLibrary";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { WeekCard } from "./components/WeekCard";

function MemberWeek({ api }: { api: SendtallyApi }): React.ReactElement {
  const { week, sessions } = useMemberWeek(api, useLibrary().state);
  return (
    <WeekCard
      week={week}
      meta={t("onboarding.plan.week.perWeek", { count: sessions })}
      empty={t("onboarding.plan.week.empty")}
    />
  );
}

/** P7: the plan is ready; a free account sees the trial and what members get, a member the week. */
export const DoneStep: StepComponent = ({ wizard, api, finish }) => {
  const member = useMembership(api).active === true;
  return (
    <WizardFrame
      wizard={wizard}
      bar={false}
      footer={
        <Button
          variant="azure"
          onClick={() => wizard.complete(member ? "member" : "later", "plan")}
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
          <ClosingOffer api={api} onJoin={() => finish?.("later", "plan")} />
        )}
      </div>
    </WizardFrame>
  );
};
