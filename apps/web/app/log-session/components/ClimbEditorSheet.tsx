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
import { OutcomeControl } from "./OutcomeControl";
import { ProjectToggle } from "./ProjectToggle";
import { TriesStepper } from "./TriesStepper";
import { chipStyle, monoLabel } from "./styles";

const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.6;

/**
 * A downward drag on the grip (handle and title row) follows the pointer and dismisses past a
 * distance or a flick. The grip is the only drag surface because the rail and the panel scroll
 * would otherwise fight the browser for vertical touches.
 */
function useDragToDismiss(
  panel: React.RefObject<HTMLDivElement | null>,
  onClose: () => void
): { onPointerDown: (e: React.PointerEvent<HTMLElement>) => void } {
  const start = React.useRef<{ y: number; at: number } | null>(null);
  const onPointerDown = (down: React.PointerEvent<HTMLElement>): void => {
    if (down.button !== 0) return;
    start.current = { y: down.clientY, at: performance.now() };
    const grip = down.currentTarget;
    grip.setPointerCapture?.(down.pointerId);
    const el = panel.current;
    if (el) el.style.transition = "none";

    const move = (e: PointerEvent): void => {
      if (start.current === null || !el) return;
      el.style.transform = `translateY(${Math.max(0, e.clientY - start.current.y)}px)`;
    };
    const end = (e: PointerEvent): void => {
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", end);
      grip.removeEventListener("pointercancel", end);
      if (start.current === null) return;
      const dy = Math.max(0, e.clientY - start.current.y);
      const velocity = dy / Math.max(1, performance.now() - start.current.at);
      start.current = null;
      if (e.type !== "pointercancel" && (dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY)) {
        onClose();
        return;
      }
      if (el) {
        el.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)";
        el.style.transform = "";
      }
    };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", end);
    grip.addEventListener("pointercancel", end);
  };
  return { onPointerDown };
}

export type ClimbEditorSheetProps = {
  climb: ClimbDraft;
  index: number;
  count: number;
  scale: GradeScale;
  project: boolean;
  suggestions: ClimbSummary[];
  onChange: (climb: ClimbDraft) => void;
  onChangeDiscipline: (discipline: Discipline) => void;
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
  onChangeDiscipline,
  onChangeName,
  onPick,
  onToggleProject,
  onRemove,
  onClose,
}: ClimbEditorSheetProps): React.ReactElement {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const panel = React.useRef<HTMLDivElement>(null);
  const rail = React.useRef<HTMLDivElement>(null);
  const pressedBackdrop = React.useRef(false);
  const grip = useDragToDismiss(panel, onClose);

  React.useEffect(() => {
    const el = dialog.current;
    if (el !== null && !el.open) el.showModal();
  }, []);

  React.useEffect(() => {
    const track = rail.current;
    const chip = track?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (track && chip) {
      track.scrollLeft = chip.offsetLeft - (track.clientWidth - chip.offsetWidth) / 2;
    }
  }, [climb.grade]);

  return (
    <dialog
      ref={dialog}
      className="climb-sheet"
      aria-label={`Climb ${index + 1} of ${count}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedBackdrop.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={panel} className="climb-sheet-panel">
        <div className="climb-sheet-grip" onPointerDown={grip.onPointerDown}>
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
        <DisciplineToggle value={disciplineOf(climb.scale)} onChange={onChangeDiscipline} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <OutcomeControl
            discipline={disciplineOf(climb.scale)}
            outcome={climbOutcome(climb)}
            full
            onChange={(outcome) => onChange(withClimbOutcome(climb, outcome))}
          />
          <TriesStepper
            tries={climb.tries}
            size={40}
            disabled={climb.kind === "send" && climb.style !== "redpoint"}
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
    </dialog>
  );
}
