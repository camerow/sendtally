import React from "react";
import type { Weekday } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { Wizard } from "@sendtally/features/settings";
import { Button } from "../../training/components/Button";
import { Title } from "../../training/components/Title";
import { WizardFrame } from "../WizardFrame";
import { WeekCard } from "./components/WeekCard";

/** P1: the days the user can train, held on the device until P3 puts workouts on them. */
export function DaysStep({ wizard }: { wizard: Wizard }): React.ReactElement {
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
          variant="primary"
          height={54}
          label={t("onboarding.firstRun.continue")}
          disabled={days.length === 0}
          onPress={() => wizard.next({ count: days.length })}
        />
      }
    >
      <Title size={34}>{t("onboarding.plan.days.title")}</Title>
      <WeekCard
        week={Array.from({ length: 7 }, (_, i) => (days.includes(i as Weekday) ? [] : null))}
        meta={t("onboarding.plan.days.perWeek", { count: days.length })}
        empty={t("onboarding.plan.days.empty")}
        onToggle={toggle}
      />
    </WizardFrame>
  );
}
