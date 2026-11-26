import React from "react";

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedProps<T extends string> = {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The chosen option white on a soft track, for a switch inside a card or filter row. */
  soft?: boolean;
};

/** Mobile's switch: the chosen option dark on a white track. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  soft = false,
}: SegmentedProps<T>): React.ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={soft ? "segmented segmented--soft" : "segmented"}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className="segmented-option"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
