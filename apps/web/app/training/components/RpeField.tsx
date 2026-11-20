import React from "react";
import type { SetDone } from "@sendtally/core/hang";
import { withRpe } from "@sendtally/features/activities";
import { formatNumber } from "@sendtally/features/i18n";
import { NumberField } from "../../components/NumberField";

export type RpeFieldProps = {
  set: SetDone;
  /** Shown dim while the set is unrated. */
  target: number | undefined;
  label: string;
  onChange: (set: SetDone) => void;
};

/** How hard a set felt, 1 to 10, its target dim until it is rated. */
export function RpeField({ set, target, label, onChange }: RpeFieldProps): React.ReactElement {
  return (
    <NumberField
      compact
      label={`${label} · RPE`}
      value={set.rpe ?? null}
      placeholder={target === undefined ? "–" : formatNumber(target)}
      onChange={(n) => onChange(withRpe(set, n))}
      mode={{ kind: "number", step: 1, max: 10 }}
    />
  );
}
