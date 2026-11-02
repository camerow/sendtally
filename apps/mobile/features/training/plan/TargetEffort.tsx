import React from "react";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { EffortBars } from "../components/EffortBars";
import { SheetSection } from "../components/SheetSection";

export type TargetEffortProps = { value: number | null; onChange: (rpe: number | null) => void };

/** The effort a plan aims for: optional, ten bars, clearable. */
export function TargetEffort({ value, onChange }: TargetEffortProps): React.ReactElement {
  return (
    <SheetSection
      label={value === null ? t("plan.targetEffort") : t("plan.targetValue", { n: value })}
      aside={
        value !== null && (
          <Button
            label={t("hang.clear")}
            onPress={() => onChange(null)}
            variant="link"
            height={32}
          />
        )
      }
    >
      <EffortBars value={value} onChange={onChange} />
    </SheetSection>
  );
}
