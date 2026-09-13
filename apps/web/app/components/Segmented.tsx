import React from "react";

export type SegmentedOption<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}): React.ReactElement {
  return (
    <div role="radiogroup" aria-label={label} className="segmented">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className="segmented-option"
            style={{
              background: active ? "var(--bs-gold)" : "transparent",
              color: active ? "var(--bs-gunmetal)" : "rgba(64,63,76,0.65)",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
