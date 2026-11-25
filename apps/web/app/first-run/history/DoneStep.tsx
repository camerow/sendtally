import React from "react";
import { Button } from "@sendtally/design";
import { useMembership } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { useHistoryCard } from "@sendtally/features/settings";
import { ClosingOffer } from "../../billing/components/ClosingOffer";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { HistoryCard } from "./components/HistoryCard";

/** H6: the log is ready; a free account sees the trial and what members get, a member the card. */
export const DoneStep: StepComponent = ({ wizard, api, finish }) => {
  const vm = useHistoryCard(api);
  const member = useMembership(api).active === true;
  return (
    <WizardFrame
      wizard={wizard}
      bar={false}
      footer={
        <Button variant="azure" onClick={() => wizard.complete(member ? "member" : "later", "log")}>
          {t("common.done")}
        </Button>
      }
    >
      <div className="closing">
        <h1 className="wizard-title">{t("onboarding.history.done.title")}</h1>
        {member ? (
          vm !== null && (
            <HistoryCard vm={vm} label={t("onboarding.history.card.soFar")} slim max={4} />
          )
        ) : (
          <ClosingOffer api={api} onJoin={() => finish?.("later", "log")} />
        )}
      </div>
    </WizardFrame>
  );
};
