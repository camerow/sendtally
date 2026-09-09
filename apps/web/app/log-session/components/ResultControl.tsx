import React from "react";
import { Glyph } from "./Glyph";
import { CHECK, CROSS } from "./styles";

export type ClimbKind = "send" | "attempt";

export type ResultControlProps = {
  kind: ClimbKind;
  full?: boolean;
  onChange: (kind: ClimbKind) => void;
};

const SEGMENTS: Array<{ kind: ClimbKind; label: string; glyph: string; background: string }> = [
  { kind: "send", label: "SEND", glyph: CHECK, background: "var(--bs-azure-ink)" },
  { kind: "attempt", label: "ATTEMPT", glyph: CROSS, background: "var(--bs-gunmetal)" },
];

export function ResultControl({
  kind,
  full = false,
  onChange,
}: ResultControlProps): React.ReactElement {
  return (
    <div
      role="radiogroup"
      aria-label="Result"
      className={full ? "climb-result climb-result--full" : "climb-result"}
    >
      {SEGMENTS.map((segment) => {
        const active = segment.kind === kind;
        return (
          <button
            key={segment.kind}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(segment.kind)}
            className="climb-result-segment"
            style={{
              background: active ? segment.background : "transparent",
              color: active ? "var(--bs-white)" : "rgba(64,63,76,0.65)",
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
