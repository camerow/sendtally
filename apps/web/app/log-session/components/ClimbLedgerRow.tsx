import React from "react";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { Glyph } from "./Glyph";
import { CHECK, CHEVRON, CROSS, FLAG } from "./styles";

export type ClimbLedgerRowProps = {
  climb: ClimbDraft;
  project: boolean;
  onPress: () => void;
};

export function ClimbLedgerRow({
  climb,
  project,
  onPress,
}: ClimbLedgerRowProps): React.ReactElement {
  const named = climb.name.trim() !== "";
  const send = climb.kind === "send";
  return (
    <button type="button" onClick={onPress} className="climb-ledger-row">
      <span className="climb-ledger-grade">{climb.grade}</span>
      <span
        className="climb-ledger-name"
        style={named ? {} : { fontWeight: 400, color: "rgba(64,63,76,0.45)" }}
      >
        {project && <Glyph d={FLAG} size={12} width={1.8} filled />}
        {named ? climb.name : "Unnamed"}
      </span>
      <span
        className="climb-ledger-result"
        style={{ background: send ? "var(--bs-azure-ink)" : "var(--bs-gunmetal)" }}
        aria-label={send ? "Send" : "Attempt"}
      >
        <Glyph d={send ? CHECK : CROSS} size={send ? 12 : 11} width={2.2} />
      </span>
      <span className="climb-ledger-tries">×{climb.tries}</span>
      <Glyph d={CHEVRON} size={14} />
    </button>
  );
}
