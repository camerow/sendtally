import React from "react";
import type { ClimbSummary } from "@sendtally/api-client";
import type { Gym } from "@sendtally/features/gyms";
import {
  climbOutcome,
  disciplineOf,
  gradeOptions,
  withClimbGrading,
  withClimbOutcome,
  withTries,
  type ClimbDraft,
  type GradePrefs,
  type GradeScale,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { CircuitFields } from "../../gyms/components/CircuitFields";
import { ClimbKindSelect } from "./ClimbKindSelect";
import { ClimbNameField } from "./ClimbNameField";
import { ClimbNoteField } from "./ClimbNoteField";
import { DisciplineToggle } from "./DisciplineToggle";
import { Glyph } from "./Glyph";
import { OutcomeControl } from "./OutcomeControl";
import { ProjectToggle } from "./ProjectToggle";
import { TriesStepper } from "./TriesStepper";
import { CROSS, columnHead, inputStyle, stepperButton } from "./styles";

export type ClimbCardProps = {
  climb: ClimbDraft;
  scale: GradeScale;
  gym?: Gym | null;
  prefs: GradePrefs;
  removable: boolean;
  project: boolean;
  suggestions: ClimbSummary[];
  onChange: (climb: ClimbDraft) => void;
  onChangeName: (name: string) => void;
  onPick: (climb: ClimbSummary) => void;
  onToggleProject: () => void;
  onRemove: () => void;
};

export function ClimbCard({
  climb,
  scale,
  gym = null,
  prefs,
  removable,
  project,
  suggestions,
  onChange,
  onChangeName,
  onPick,
  onToggleProject,
  onRemove,
}: ClimbCardProps): React.ReactElement {
  const named = climb.name.trim() !== "";
  const onCircuit = gym !== null && climb.circuit !== undefined;
  return (
    <div className="climb-card">
      <div className={onCircuit ? "climb-card-main climb-card-main--circuit" : "climb-card-main"}>
        {!onCircuit && (
          <div className="climb-card-cell">
            <span style={columnHead}>{t("common.grade")}</span>
            <select
              value={climb.grade}
              onChange={(e) => onChange({ ...climb, grade: e.target.value })}
              className="log-session-control"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                padding: "11px 8px",
              }}
            >
              {gradeOptions(scale).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="climb-card-cell">
          <span style={columnHead}>{t("logSession.nameOptional")}</span>
          <ClimbNameField
            value={climb.name}
            scale={scale}
            suggestions={suggestions}
            placeholder={
              !onCircuit
                ? t("logSession.climbNamePlaceholder")
                : t("logSession.circuitClimbNamePlaceholder")
            }
            onChange={onChangeName}
            onPick={onPick}
          />
        </div>
        <div className="climb-card-cell">
          <span style={columnHead}>{t("logSession.tries")}</span>
          <TriesStepper
            tries={climb.tries}
            onChange={(tries) => onChange(withTries(climb, tries))}
          />
        </div>
        <button
          type="button"
          aria-label={t("logSession.removeClimb")}
          disabled={!removable}
          onClick={onRemove}
          style={{
            ...stepperButton,
            width: 32,
            height: 32,
            alignSelf: "end",
            border: "none",
            color: "rgba(64,63,76,0.45)",
            opacity: removable ? 1 : 0,
          }}
        >
          <Glyph d={CROSS} width={1.7} />
        </button>
      </div>
      {gym === null ? (
        <div className="climb-card-result">
          <span style={columnHead}>{t("common.discipline")}</span>
          <DisciplineToggle
            value={disciplineOf(climb.scale)}
            onChange={(d) => onChange(withClimbGrading(climb, d, prefs, gym))}
          />
        </div>
      ) : (
        <div className="climb-card-result">
          <span style={columnHead}>{t("logSession.climbKind")}</span>
          <ClimbKindSelect
            climb={climb}
            gym={gym}
            prefs={prefs}
            style={{ height: 40, padding: "8px 12px" }}
            onChange={onChange}
          />
        </div>
      )}
      {onCircuit && <CircuitFields climb={climb} gym={gym} onChange={onChange} />}
      <div className="climb-card-result">
        <span style={columnHead}>{t("common.result")}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <OutcomeControl
            discipline={disciplineOf(climb.scale)}
            outcome={climbOutcome(climb)}
            onChange={(outcome) => onChange(withClimbOutcome(climb, outcome))}
          />
          <ProjectToggle project={project} named={named} onToggle={onToggleProject} />
        </div>
      </div>
      <div className="climb-card-result climb-card-result--note">
        {named ? (
          <>
            <span style={columnHead}>{t("common.note")}</span>
            <ClimbNoteField
              note={climb.note}
              name={climb.name}
              onChange={(note) => onChange({ ...climb, note })}
            />
          </>
        ) : (
          <span style={{ ...columnHead, gridColumn: "1 / -1" }}>
            {t("logSession.noteNeedsName")}
          </span>
        )}
      </div>
    </div>
  );
}
