import React from "react";
import {
  enduranceLapCountLabel,
  enduranceOf,
  enduranceSummaryLabel,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { Glyph } from "./Glyph";
import { CHECK, CHEVRON, CROSS, FLAG, MINUS, PLUS } from "./styles";

export type ClimbLedgerRowProps = {
  climb: ClimbDraft;
  project: boolean;
  onPress: () => void;
  /** Given by the live card: tries change in place, without opening the editor. */
  onChangeTries?: (tries: number) => void;
  /** Given by the live card: the mark toggles between sent and attempt. */
  onToggleSent?: () => void;
};

function Row({
  label,
  onPress,
  className,
  children,
}: {
  label?: string;
  onPress: () => void;
  className: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        onPress();
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/** A circuit of laps has no result badge and no try count: the laps themselves are the record. */
function EnduranceLedgerRow({
  climb,
  onPress,
}: {
  climb: ClimbDraft;
  onPress: () => void;
}): React.ReactElement {
  const endurance = enduranceOf(climb);
  const named = climb.name.trim() !== "";
  const title = named ? climb.name : t("endurance.title");
  const meta = `${enduranceLapCountLabel(endurance.laps.length)} · ${enduranceSummaryLabel(endurance)}`;
  return (
    <Row
      onPress={onPress}
      label={`${title}, ${climb.grade}, ${meta}`}
      className="climb-ledger-row climb-ledger-row--endurance"
    >
      <span style={{ display: "inline-flex", color: "var(--bs-petal-ink)" }}>
        <Icon name="endurance" size={16} strokeWidth={2.4} />
      </span>
      <span className="climb-ledger-text">
        <span
          className="climb-ledger-name"
          style={named ? {} : { fontWeight: 400, color: "rgba(64,63,76,0.45)" }}
        >
          {title}
        </span>
        <span className="climb-ledger-meta">{meta}</span>
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
          fontSize: 14,
          color: "var(--bs-gunmetal)",
        }}
      >
        {climb.grade}
      </span>
      <Glyph d={CHEVRON} size={14} />
    </Row>
  );
}

export function ClimbLedgerRow({
  climb,
  project,
  onPress,
  onChangeTries,
  onToggleSent,
}: ClimbLedgerRowProps): React.ReactElement {
  if (climb.endurance !== undefined) return <EnduranceLedgerRow climb={climb} onPress={onPress} />;
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
  const resultStyle: React.CSSProperties = {
    background: firstGo ? "var(--bs-gold)" : send ? "var(--bs-azure-ink)" : "var(--bs-gunmetal)",
    color: firstGo ? "var(--bs-gunmetal)" : "var(--bs-white)",
  };
  const mark = <Glyph d={send ? CHECK : CROSS} size={send ? 12 : 11} width={2.2} />;
  return (
    <Row onPress={onPress} className="climb-ledger-row">
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
      {onToggleSent === undefined ? (
        <span
          className="climb-ledger-result"
          style={resultStyle}
          aria-label={send ? t("logSession.send") : t("logSession.attempt")}
        >
          {mark}
        </span>
      ) : (
        <button
          type="button"
          className="climb-ledger-result climb-ledger-result--toggle"
          style={resultStyle}
          aria-label={send ? t("logSession.sentTapToAttempt") : t("logSession.attemptTapToSent")}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSent();
          }}
        >
          {mark}
        </button>
      )}
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
    </Row>
  );
}
