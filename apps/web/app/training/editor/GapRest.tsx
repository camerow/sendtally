import React from "react";
import { t } from "@sendtally/features/i18n";
import { NumberField } from "../../components/NumberField";

export type GapRestProps = {
  /** The exercise it rests after, as the user reads it. */
  after: string;
  seconds: number;
  onChange: (seconds: number) => void;
};

/** The rest between two exercise cards, where it falls. */
export function GapRest({ after, seconds, onChange }: GapRestProps): React.ReactElement {
  return (
    <div className="rest-divider">
      <span>{t("hang.rest")}</span>
      <NumberField
        compact
        label={t("workouts.restAfter", { name: after })}
        value={seconds}
        mode={{ kind: "time", max: 3600 }}
        onChange={onChange}
      />
    </div>
  );
}
