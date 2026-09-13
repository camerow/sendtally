import React from "react";
import type { ClimbSummary } from "@sendtally/api-client";
import {
  climbOutcome,
  disciplineOf,
  gradeOptions,
  withClimbOutcome,
  type ClimbDraft,
  type Discipline,
  type GradeScale,
} from "@sendtally/features/log-session";
import { ClimbNameField } from "./ClimbNameField";
import { DisciplineToggle } from "./DisciplineToggle";
import { Glyph } from "./Glyph";
import { OutcomeControl } from "./OutcomeControl";
import { ProjectToggle } from "./ProjectToggle";
import { TriesStepper } from "./TriesStepper";
import { CROSS, columnHead, inputStyle, stepperButton } from "./styles";

export type ClimbCardProps = {
  climb: ClimbDraft;
  scale: GradeScale;
  removable: boolean;
  project: boolean;
  suggestions: ClimbSummary[];
  onChange: (climb: ClimbDraft) => void;
  onChangeDiscipline: (discipline: Discipline) => void;
  onChangeName: (name: string) => void;
  onPick: (climb: ClimbSummary) => void;
  onToggleProject: () => void;
  onRemove: () => void;
};

export function ClimbCard({
  climb,
  scale,
  removable,
  project,
  suggestions,
  onChange,
  onChangeDiscipline,
  onChangeName,
  onPick,
  onToggleProject,
  onRemove,
}: ClimbCardProps): React.ReactElement {
  return (
    <div className="climb-card">
      <div className="climb-card-main">
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
        <ClimbNameField
          value={climb.name}
          scale={scale}
          suggestions={suggestions}
          onChange={onChangeName}
          onPick={onPick}
        />
        <TriesStepper
          tries={climb.tries}
          disabled={climb.kind === "send" && climb.style !== "redpoint"}
          onChange={(tries) => onChange({ ...climb, tries })}
        />
        <button
          type="button"
          aria-label="Remove climb"
          disabled={!removable}
          onClick={onRemove}
          style={{
            ...stepperButton,
            width: 32,
            height: 32,
            border: "none",
            color: "rgba(64,63,76,0.45)",
            opacity: removable ? 1 : 0,
          }}
        >
          <Glyph d={CROSS} width={1.7} />
        </button>
      </div>
      <div className="climb-card-result">
        <span style={columnHead}>DISCIPLINE</span>
        <DisciplineToggle value={disciplineOf(climb.scale)} onChange={onChangeDiscipline} />
      </div>
      <div className="climb-card-result">
        <span style={columnHead}>RESULT</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <OutcomeControl
            discipline={disciplineOf(climb.scale)}
            outcome={climbOutcome(climb)}
            onChange={(outcome) => onChange(withClimbOutcome(climb, outcome))}
          />
          <ProjectToggle
            project={project}
            named={climb.name.trim() !== ""}
            onToggle={onToggleProject}
          />
        </div>
      </div>
    </div>
  );
}
