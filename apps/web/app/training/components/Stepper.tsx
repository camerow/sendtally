import React from "react";

export type StepperProps = {
  onStep: (direction: 1 | -1) => void;
  decreaseLabel: string;
  increaseLabel: string;
  /** The value between − and +: plain text, or a box to type in. */
  children: React.ReactNode;
  /** On the dark timer. */
  dark?: boolean;
  /** Small round buttons for a value inside a set row. */
  compact?: boolean;
  canDecrease?: boolean;
  canIncrease?: boolean;
};

/** − value +, for a number stepped more often than typed. */
export function Stepper({
  onStep,
  decreaseLabel,
  increaseLabel,
  children,
  dark = false,
  compact = false,
  canDecrease = true,
  canIncrease = true,
}: StepperProps): React.ReactElement {
  const button = (direction: 1 | -1, label: string, glyph: string, enabled: boolean) => (
    <button
      type="button"
      className="stepper-button"
      aria-label={label}
      disabled={!enabled}
      onClick={() => onStep(direction)}
    >
      {glyph}
    </button>
  );
  return (
    <span
      className={["stepper", dark && "stepper--dark", compact && "stepper--compact"]
        .filter(Boolean)
        .join(" ")}
    >
      {button(-1, decreaseLabel, "−", canDecrease)}
      {children}
      {button(1, increaseLabel, "+", canIncrease)}
    </span>
  );
}
