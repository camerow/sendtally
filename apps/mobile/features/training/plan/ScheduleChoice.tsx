import React from "react";
import { clamp, parseNumber } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { Segmented } from "../components/Segmented";
import { SheetSection } from "../components/SheetSection";
import { Stepper } from "../components/Stepper";
import { DayToggles } from "../planner/DayToggles";
import type { ScheduleMode } from "./types";
import type { PlanItemForm } from "./usePlanItemForm";

/** Set weekdays, or a number of times a week on whichever days suit. */
export function ScheduleChoice({ form }: { form: PlanItemForm }): React.ReactElement {
  const { draft } = form;
  const setPerWeek = (n: number): void => form.update({ perWeek: clamp(Math.round(n), 1, 7) });
  return (
    <>
      <SheetSection label={t("plan.when")}>
        <Segmented<ScheduleMode>
          value={draft.mode}
          onChange={(mode) => form.update({ mode })}
          options={[
            { value: "days", label: t("plan.onDays") },
            { value: "perWeek", label: t("plan.timesAWeek") },
          ]}
        />
      </SheetSection>
      {draft.mode === "days" ? (
        <DayToggles days={draft.days} onToggle={form.toggleDay} />
      ) : (
        <SheetSection label={t("plan.timesAWeek")}>
          <Stepper
            value={String(draft.perWeek)}
            onCommit={(text) => {
              const n = parseNumber(text);
              if (n !== null) setPerWeek(n);
            }}
            onStep={(dir) => setPerWeek(draft.perWeek + dir)}
            label={t("plan.timesAWeek")}
            decreaseLabel={t("plan.fewerTimes")}
            increaseLabel={t("plan.moreTimes")}
            surface="plain"
            inputWidth={64}
            keyboard="number-pad"
            inSheet
          />
        </SheetSection>
      )}
    </>
  );
}
