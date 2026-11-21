import React from "react";
import { Button } from "@sendtally/design";
import { useMembership } from "@sendtally/features/billing";
import { formatDate, formatNumber, t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { useHistoryCard } from "@sendtally/features/settings";
import { MenuRow, type MenuRowProps } from "../../components/MenuRow";
import { LIVE_PATH } from "../../live-session/startLive";
import { useStartLive } from "../../live-session/useStartLiveSession";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { HistoryCard } from "./components/HistoryCard";

/** H6: the log is ready; on to the plan path, a live session today, or the Log. */
export const DoneStep: StepComponent = ({ wizard, api }) => {
  const vm = useHistoryCard(api);
  const { state } = useQuery(queries.status(api));
  const membership = useMembership(api);
  const startLive = useStartLive();
  const member = membership.active === true;
  const outcome = member ? "member" : "later";
  const endsAt =
    membership.state.status === "ready" ? membership.state.data.trial.endsAt : undefined;
  const planDone = state.status === "ready" && state.data.onboarding.progress.scheduledBlocks;
  const climbs = vm?.climbs ?? 0;
  const openLog = (): void => wizard.complete(outcome, "log");
  const rows: MenuRowProps[] = [
    ...(planDone
      ? []
      : [
          {
            icon: "train" as const,
            title: t("onboarding.chooser.planTitle"),
            hint: t("onboarding.history.done.planHint"),
            onPress: () => {
              wizard.complete(outcome, "other_path");
              wizard.choose("plan", "end_screen");
            },
          },
        ]),
    {
      icon: "climb",
      title: t("onboarding.history.done.logToday"),
      hint: t("onboarding.history.done.logTodayHint"),
      onPress: () => {
        wizard.complete(outcome, "live_session");
        startLive(LIVE_PATH, true);
      },
    },
    {
      icon: "sessions",
      title: t("onboarding.history.done.openLog"),
      hint:
        wizard.memory.way === "import"
          ? t("sessions.sessionCount", { count: vm?.sessions ?? 0 })
          : `${formatNumber(climbs)} ${t("onboarding.history.reveal.climbsWord", { count: climbs })}`,
      onPress: openLog,
    },
  ];
  return (
    <WizardFrame wizard={wizard} bar={false} onClose={openLog}>
      <h1 className="wizard-title">{t("onboarding.history.done.title")}</h1>
      {vm !== null && (
        <HistoryCard vm={vm} label={t("onboarding.history.card.soFar")} slim max={4} />
      )}
      <div className="done-rows">
        {rows.map((r) => (
          <MenuRow key={r.title} {...r} />
        ))}
      </div>
      {!member && endsAt !== undefined && (
        <div className="done-trial">
          <span className="done-trial-text">
            <span className="done-trial-ends">
              {t("billing.freeTrialEnds", {
                date: formatDate(new Date(endsAt), { month: "short", day: "numeric" }),
              })}
            </span>
            <span className="done-trial-keep">{t("onboarding.membership.keepWhatYouBuilt")}</span>
          </span>
          <Button variant="azure" size="sm" href="/app/membership">
            {t("billing.becomeAMember")}
          </Button>
        </div>
      )}
    </WizardFrame>
  );
};
