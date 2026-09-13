import React from "react";
import { Glyph } from "./Glyph";
import { MINUS, PLUS, stepperButton } from "./styles";

export type TriesStepperProps = {
  tries: number;
  size?: number;
  /** A flash or an onsight is one try; there is nothing to step. */
  disabled?: boolean;
  onChange: (tries: number) => void;
};

export function TriesStepper({
  tries,
  size = 30,
  disabled = false,
  onChange,
}: TriesStepperProps): React.ReactElement {
  const button = { ...stepperButton, width: size, height: size };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
      <button
        type="button"
        aria-label="Fewer tries"
        disabled={disabled || tries <= 1}
        onClick={() => onChange(tries - 1)}
        style={{ ...button, opacity: disabled || tries <= 1 ? 0.4 : 1 }}
      >
        <Glyph d={MINUS} />
      </button>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          fontSize: 15,
          width: 18,
          textAlign: "center",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        {tries}
      </span>
      <button
        type="button"
        aria-label="More tries"
        disabled={disabled}
        onClick={() => onChange(Math.min(99, tries + 1))}
        style={{ ...button, opacity: disabled ? 0.4 : 1 }}
      >
        <Glyph d={PLUS} />
      </button>
    </div>
  );
}
