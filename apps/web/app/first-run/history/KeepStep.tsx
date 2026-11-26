import React from "react";
import { keepEyebrow, useMembership } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { keepCopy, useHistoryCard } from "@sendtally/features/settings";
import { MembershipCheckout } from "../../billing/components/MembershipCheckout";
import { MembershipPanel } from "../../billing/components/MembershipPanel";
import type { StepComponent } from "../types";
import { useMember } from "../useMember";
import { WizardFrame } from "../WizardFrame";

/** H5: membership, once per wizard, offered with the user's own counts and the trial's end (T25 option A). */
export const KeepStep: StepComponent = ({ wizard, api }) => {
  const vm = useHistoryCard(api);
  const membership = useMembership(api);
  const eyebrow = keepEyebrow(membership.state.status === "ready" ? membership.state.data : null);
  const joined = useMember();
  const moved = React.useRef(false);

  React.useEffect(() => {
    if (!joined || moved.current) return;
    moved.current = true;
    wizard.next();
  }, [joined, wizard]);

  return (
    <WizardFrame
      wizard={wizard}
      skip={false}
      footer={
        <button type="button" className="history-link" onClick={() => wizard.next()}>
          {t("sessions.notNow")}
        </button>
      }
    >
      {vm === null ? (
        <span className="load-state-loading">{t("common.loading")}</span>
      ) : (
        <MembershipPanel {...keepCopy(vm)} eyebrow={eyebrow}>
          <MembershipCheckout stay />
        </MembershipPanel>
      )}
    </WizardFrame>
  );
};
