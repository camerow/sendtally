import React from "react";
import {
  sendStyleLabel,
  sendStylesFor,
  type ClimbOutcome,
  type ClimbStyle,
  type Discipline,
} from "@sendtally/features/log-session";
import { Glyph } from "./Glyph";
import { CHECK, CROSS } from "./styles";

const STYLE_FILL: Record<ClimbStyle, { background: string; color: string }> = {
  redpoint: { background: "var(--bs-azure-ink)", color: "var(--bs-white)" },
  flash: { background: "var(--bs-gold)", color: "var(--bs-gunmetal)" },
  onsight: { background: "var(--bs-petal-ink)", color: "var(--bs-white)" },
};

const ATTEMPT_FILL = { background: "var(--bs-gunmetal)", color: "var(--bs-white)" };

type Segment = { key: string; label: string; glyph: string; outcome: ClimbOutcome };

function segmentsFor(discipline: Discipline): Segment[] {
  const sends = sendStylesFor(discipline).map((style) => ({
    key: style,
    label: sendStyleLabel(discipline, style),
    glyph: CHECK,
    outcome: { kind: "send", style } as const,
  }));
  return [
    ...sends,
    { key: "attempt", label: "ATTEMPT", glyph: CROSS, outcome: { kind: "attempt" } },
  ];
}

function fillFor(outcome: ClimbOutcome): { background: string; color: string } {
  return outcome.kind === "attempt" ? ATTEMPT_FILL : STYLE_FILL[outcome.style];
}

function matches(a: ClimbOutcome, b: ClimbOutcome): boolean {
  if (a.kind === "attempt" || b.kind === "attempt") return a.kind === b.kind;
  return a.style === b.style;
}

export function OutcomeControl({
  discipline,
  outcome,
  full = false,
  onChange,
}: {
  discipline: Discipline;
  outcome: ClimbOutcome;
  full?: boolean;
  onChange: (outcome: ClimbOutcome) => void;
}): React.ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label="Result"
      className={full ? "climb-result climb-result--full" : "climb-result"}
    >
      {segmentsFor(discipline).map((segment) => {
        const active = matches(segment.outcome, outcome);
        const fill = fillFor(segment.outcome);
        return (
          <button
            key={segment.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(segment.outcome)}
            className="climb-result-segment"
            style={{
              background: active ? fill.background : "transparent",
              color: active ? fill.color : "rgba(64,63,76,0.65)",
            }}
          >
            <Glyph d={segment.glyph} size={13} width={2} />
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
