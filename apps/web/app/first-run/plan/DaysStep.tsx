import React from "react";
import type { Weekday } from "@sendtally/core/hang";
import { Button } from "@sendtally/design";
import { t } from "@sendtally/features/i18n";
import { WeekdayChips } from "../../training/schedule/WeekdayChips";
import type { StepComponent } from "../types";
import { WizardFrame } from "../WizardFrame";
import { WeekCard } from "./components/WeekCard";

/** P1: the days the user can train, held in memory until P3 puts workouts on them. */
export const DaysStep: StepComponent = ({ wizard }) => {
  const days = wizard.memory.days as readonly Weekday[];
  const toggle = (day: Weekday): void =>
    wizard.setDays(
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b)
    );
  return (
    <WizardFrame
      wizard={wizard}
      footer={
        <Button
          variant="azure"
          disabled={days.length === 0}
          onClick={() => wizard.next({ count: days.length })}
        >
          {t("onboarding.firstRun.continue")}
        </Button>
      }
    >
      <h1 className="wizard-title">{t("onboarding.plan.days.title")}</h1>
      <WeekCard
        week={Array.from({ length: 7 }, (_, i) => (days.includes(i as Weekday) ? [] : null))}
        meta={t("onboarding.plan.days.perWeek", { count: days.length })}
        empty={t("onboarding.plan.days.empty")}
      />
      <WeekdayChips days={days} onToggle={toggle} />
    </WizardFrame>
  );
};
