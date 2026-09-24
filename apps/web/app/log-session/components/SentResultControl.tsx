import React from "react";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  climbOutcome,
  disciplineOf,
  sendStyleLabel,
  withClimbOutcome,
  withTries,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import {
  firstGoStyleOf,
  resultOutcome,
  type FirstGoStyle,
} from "@sendtally/features/log-session/resultRule";
import { t } from "@sendtally/features/i18n";
import { Glyph } from "./Glyph";
import { outcomeFill } from "./OutcomeControl";
import { TriesStepper } from "./TriesStepper";
import { CHECK, CROSS, monoLabel } from "./styles";

const FIRST_GO_STYLES: readonly FirstGoStyle[] = ["onsight", "flash"];

export type SentResultControlProps = {
  climb: ClimbDraft;
  summary?: ClimbSummary;
  onChange: (climb: ClimbDraft) => void;
};

export function SentResultControl({
  climb,
  summary,
  onChange,
}: SentResultControlProps): React.ReactElement {
  const discipline = disciplineOf(climb.scale);
  const [firstGo, setFirstGo] = React.useState<FirstGoStyle>(() => firstGoStyleOf(climb));
  const outcome = climbOutcome(climb);
  const sent = outcome.kind === "send";
  const fill = outcomeFill(outcome);
  const label = sent ? sendStyleLabel(discipline, outcome.style) : t("logSession.attempt");

  const apply = (next: ClimbDraft, isSent: boolean, style: FirstGoStyle): void => {
    onChange(withClimbOutcome(next, resultOutcome(discipline, isSent, next.tries, style)));
  };

  return (
    <div className="climb-sent-group">
      <div className="climb-sent-row">
        <span className="climb-result-mark" style={fill} aria-hidden>
          <Glyph d={sent ? CHECK : CROSS} size={sent ? 13 : 12} width={2.2} />
        </span>
        <span className="climb-sent-result">
          <span style={monoLabel}>{label}</span>
          {summary !== undefined && (
            <span className="climb-sent-sends">
              {summary.sends === 0
                ? t("logSession.noSendsYet")
                : t("logSession.sendCount", { count: summary.sends })}
            </span>
          )}
        </span>
        <label className="climb-switch-label">
          <span style={monoLabel}>{t("common.sent")}</span>
          <input
            type="checkbox"
            role="switch"
            className="climb-switch"
            checked={sent}
            onChange={(e) => apply(climb, e.target.checked, firstGo)}
          />
        </label>
      </div>
      <div className="climb-sent-row">
        <span style={monoLabel}>{t("logSession.tries")}</span>
        <TriesStepper
          tries={climb.tries}
          size={34}
          onChange={(tries) => apply(withTries(climb, tries), sent, firstGo)}
        />
      </div>
      {discipline === "route" && sent && climb.tries === 1 && (
        <div className="climb-sent-row" role="radiogroup" aria-label={t("logSession.sendStyle")}>
          {FIRST_GO_STYLES.map((style) => (
            <label key={style} className="climb-style-option">
              <input
                type="radio"
                name="first-go-style"
                value={style}
                checked={outcome.kind === "send" && outcome.style === style}
                onChange={() => {
                  setFirstGo(style);
                  apply(climb, true, style);
                }}
              />
              <span>{sendStyleLabel(discipline, style)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
