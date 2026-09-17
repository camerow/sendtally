import React from "react";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { CircuitDot } from "../../components/CircuitDot";
import { Glyph } from "./Glyph";
import { CHECK, CHEVRON, CROSS, FLAG, MINUS, PLUS } from "./styles";

export type ClimbLedgerRowProps = {
  climb: ClimbDraft;
  project: boolean;
  onPress: () => void;
  /** Given by the live card: tries change in place, without opening the editor. */
  onChangeTries?: (tries: number) => void;
};

export function ClimbLedgerRow({
  climb,
  project,
  onPress,
  onChangeTries,
}: ClimbLedgerRowProps): React.ReactElement {
  const named = climb.name.trim() !== "";
  const send = climb.kind === "send";
  const firstGo = send && climb.style !== "redpoint";
  const circuit = climb.circuit;
  const wall = climb.wall ?? "";
  const title = named
    ? climb.name
    : circuit === undefined
      ? t("logSession.unnamed")
      : circuit.label;
  const step = (tries: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeTries?.(tries);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        onPress();
      }}
      className="climb-ledger-row"
    >
      {circuit === undefined ? (
        <span className="climb-ledger-grade">{climb.grade}</span>
      ) : (
        <CircuitDot colour={circuit.colour} />
      )}
      <span className="climb-ledger-text">
        <span
          className="climb-ledger-name"
          style={
            named || circuit !== undefined ? {} : { fontWeight: 400, color: "rgba(64,63,76,0.45)" }
          }
        >
          {project && <Glyph d={FLAG} size={12} width={1.8} filled />}
          {title}
        </span>
        {wall !== "" && <span className="climb-ledger-wall">{wall}</span>}
      </span>
      <span
        className="climb-ledger-result"
        style={{
          background: firstGo
            ? "var(--bs-gold)"
            : send
              ? "var(--bs-azure-ink)"
              : "var(--bs-gunmetal)",
          color: firstGo ? "var(--bs-gunmetal)" : "var(--bs-white)",
        }}
        aria-label={send ? t("logSession.send") : t("logSession.attempt")}
      >
        <Glyph d={send ? CHECK : CROSS} size={send ? 12 : 11} width={2.2} />
      </span>
      {onChangeTries === undefined ? (
        <span className="climb-ledger-tries">×{climb.tries}</span>
      ) : (
        <span className="climb-ledger-stepper">
          <button
            type="button"
            aria-label={t("logSession.fewerTries")}
            disabled={climb.tries <= 1}
            onClick={step(climb.tries - 1)}
          >
            <Glyph d={MINUS} />
          </button>
          <span className="climb-ledger-tries">×{climb.tries}</span>
          <button
            type="button"
            aria-label={t("logSession.moreTries")}
            disabled={climb.tries >= 99}
            onClick={step(climb.tries + 1)}
          >
            <Glyph d={PLUS} />
          </button>
        </span>
      )}
      <Glyph d={CHEVRON} size={14} />
    </div>
  );
}
