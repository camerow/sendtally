import React from "react";
import { clamp, parseNumber } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { SheetSection } from "../components/SheetSection";
import { Stepper } from "../components/Stepper";

const STEP = 5;
const MAX = 600;
const FIRST = 60;

export type MinutesFieldProps = {
  value: number | null;
  onChange: (minutes: number | null) => void;
};

/** How long it usually takes, optional: empty until set, cleared by stepping below five. */
export function MinutesField({ value, onChange }: MinutesFieldProps): React.ReactElement {
  const set = (n: number): void => onChange(n < STEP ? null : clamp(Math.round(n), STEP, MAX));
  return (
    <SheetSection label={t("plan.minutes")}>
      <Stepper
        value={value === null ? "" : String(value)}
        placeholder="–"
        onCommit={(text) => {
          const n = text.trim() === "" ? 0 : parseNumber(text);
          if (n !== null) set(n);
        }}
        onStep={(dir) => set(value === null ? (dir > 0 ? FIRST : 0) : value + dir * STEP)}
        label={t("plan.minutes")}
        decreaseLabel={t("plan.fewerMinutes")}
        increaseLabel={t("plan.moreMinutes")}
        surface="plain"
        inputWidth={72}
        keyboard="number-pad"
      />
    </SheetSection>
  );
}
