import React from "react";
import { t } from "@sendtally/features/i18n";
import { Icon } from "./Icon";

export type SegmentedOption<T extends string> = { value: T; label: string; locked?: boolean };

export type SegmentedProps<T extends string> = {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** A locked option wears a lock and calls this instead of being chosen. */
  onLocked?: (value: T) => void;
  /** The chosen option white on a soft track, for a switch inside a card or filter row. */
  soft?: boolean;
};

/** Mobile's switch: the chosen option dark on a white track. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  onLocked,
  soft = false,
}: SegmentedProps<T>): React.ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={soft ? "segmented segmented--soft" : "segmented"}
    >
      {options.map((option) => {
        const locked = option.locked === true;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            aria-label={locked ? t("common.membersOnly", { label: option.label }) : undefined}
            onClick={() => (locked ? onLocked?.(option.value) : onChange(option.value))}
            className="segmented-option"
          >
            {locked && <Icon name="lock" size={13} strokeWidth={2.2} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
