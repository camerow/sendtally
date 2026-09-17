import React from "react";
import { t } from "@sendtally/features/i18n";
import { Glyph } from "./Glyph";
import { MINUS, PLUS, stepperButton } from "./styles";

export type TriesStepperProps = {
  tries: number;
  size?: number;
  onChange: (tries: number) => void;
};

export function TriesStepper({
  tries,
  size = 30,
  onChange,
}: TriesStepperProps): React.ReactElement {
  const button = { ...stepperButton, width: size, height: size };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
      <button
        type="button"
        aria-label={t("logSession.fewerTries")}
        disabled={tries <= 1}
        onClick={() => onChange(tries - 1)}
        style={{ ...button, opacity: tries <= 1 ? 0.4 : 1 }}
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
        }}
      >
        {tries}
      </span>
      <button
        type="button"
        aria-label={t("logSession.moreTries")}
        disabled={tries >= 99}
        onClick={() => onChange(tries + 1)}
        style={{ ...button, opacity: tries >= 99 ? 0.4 : 1 }}
      >
        <Glyph d={PLUS} />
      </button>
    </div>
  );
}
