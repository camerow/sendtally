import React from "react";
import type { ClimbSummary } from "@sendtally/api-client";
import { gradeOptions, type ClimbDraft, type GradeScale } from "@sendtally/features/log-session";
import { ClimbNameField } from "./ClimbNameField";
import { ProjectToggle } from "./ProjectToggle";
import { ResultControl } from "./ResultControl";
import { TriesStepper } from "./TriesStepper";
import { chipStyle, monoLabel } from "./styles";

export type ClimbEditorSheetProps = {
  climb: ClimbDraft;
  index: number;
  count: number;
  scale: GradeScale;
  project: boolean;
  suggestions: ClimbSummary[];
  onChange: (climb: ClimbDraft) => void;
  onChangeName: (name: string) => void;
  onPick: (climb: ClimbSummary) => void;
  onToggleProject: () => void;
  onRemove: () => void;
  onClose: () => void;
};

export function ClimbEditorSheet({
  climb,
  index,
  count,
  scale,
  project,
  suggestions,
  onChange,
  onChangeName,
  onPick,
  onToggleProject,
  onRemove,
  onClose,
}: ClimbEditorSheetProps): React.ReactElement {
  const rail = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    rail.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [climb.grade]);

  return (
    <div className="climb-sheet-backdrop" onClick={onClose}>
      <div
        className="climb-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Climb ${index + 1} of ${count}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="climb-sheet-handle" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ ...monoLabel, color: "var(--text-label-accent)" }}>
            CLIMB {index + 1} OF {count}
          </span>
          {count > 1 && (
            <button type="button" onClick={onRemove} className="climb-sheet-remove">
              REMOVE
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span style={monoLabel}>GRADE</span>
          <div ref={rail} className="climb-sheet-rail">
            {gradeOptions(scale).map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={g === climb.grade}
                onClick={() => onChange({ ...climb, grade: g })}
                style={{
                  ...chipStyle(g === climb.grade),
                  flex: "none",
                  padding: "0 14px",
                  height: 40,
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span style={monoLabel}>
            NAME <span style={{ color: "rgba(64,63,76,0.45)" }}>· OPTIONAL</span>
          </span>
          <ClimbNameField
            value={climb.name}
            scale={scale}
            suggestions={suggestions}
            inline
            onChange={onChangeName}
            onPick={onPick}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ResultControl kind={climb.kind} full onChange={(kind) => onChange({ ...climb, kind })} />
          <TriesStepper
            tries={climb.tries}
            size={40}
            onChange={(tries) => onChange({ ...climb, tries })}
          />
        </div>
        <ProjectToggle
          project={project}
          named={climb.name.trim() !== ""}
          onToggle={onToggleProject}
        />
        <button type="button" onClick={onClose} className="climb-sheet-done">
          Done
        </button>
      </div>
    </div>
  );
}
