import React from "react";
import type { SetDone } from "@sendtally/core/hang";
import { withRpe } from "@sendtally/features/activities";
import { formatNumber } from "@sendtally/features/i18n";
import type { FieldSlot } from "../../../components/useFieldOrder";
import { NumberField } from "../components/NumberField";

export type RpeFieldProps = {
  set: SetDone;
  /** Shown dim while the set is unrated. */
  target: number | undefined;
  slot: FieldSlot;
  label: string;
  onChange: (set: SetDone) => void;
};

/** How hard a set felt, 1 to 10 on the keypad, its target dim until it is rated. */
export function RpeField({
  set,
  target,
  slot,
  label,
  onChange,
}: RpeFieldProps): React.ReactElement {
  return (
    <NumberField
      {...slot}
      label="RPE"
      accessibilityLabel={`${label} · RPE`}
      compact
      fill
      value={set.rpe ?? null}
      placeholder={target === undefined ? "–" : formatNumber(target)}
      step={1}
      max={10}
      onChange={(n) => onChange(withRpe(set, n))}
    />
  );
}
