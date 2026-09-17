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
import { Icon } from "../../components/Icon";
import { CircuitFields } from "../../gyms/components/CircuitFields";
import { ClimbKindSelect } from "./ClimbKindSelect";
import { ClimbNameField } from "./ClimbNameField";
import { ClimbNoteField } from "./ClimbNoteField";
import { DisciplineToggle } from "./DisciplineToggle";
import { OutcomeSelect } from "./OutcomeControl";
import { ProjectToggle } from "./ProjectToggle";
import { TriesStepper } from "./TriesStepper";
import { inputStyle, monoLabel } from "./styles";

const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.6;

/**
 * A downward drag on the grip (handle and title row) follows the pointer and dismisses past a
 * distance or a flick. The grip is the only drag surface because the panel scroll would
 * otherwise fight the browser for vertical touches.
 */
function startDrag(
  down: React.PointerEvent<HTMLElement>,
  panel: HTMLElement | null,
  onClose: () => void
): void {
  if (down.button !== 0 || panel === null) return;
  if ((down.target as HTMLElement).closest("button") !== null) return;
  const grip = down.currentTarget;
  const origin = { y: down.clientY, at: performance.now() };
  grip.setPointerCapture?.(down.pointerId);
  panel.style.transition = "none";

  const move = (e: PointerEvent): void => {
    panel.style.transform = `translateY(${Math.max(0, e.clientY - origin.y)}px)`;
  };
  const end = (e: PointerEvent): void => {
    grip.removeEventListener("pointermove", move);
    grip.removeEventListener("pointerup", end);
    grip.removeEventListener("pointercancel", end);
    const dy = Math.max(0, e.clientY - origin.y);
    const velocity = dy / Math.max(1, performance.now() - origin.at);
    if (e.type !== "pointercancel" && (dy > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY)) {
      onClose();
      return;
    }
    panel.style.transition = "transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    panel.style.transform = "";
  };
  grip.addEventListener("pointermove", move);
  grip.addEventListener("pointerup", end);
  grip.addEventListener("pointercancel", end);
}

export type ClimbEditorSheetProps = {
  climb: ClimbDraft;
  index: number;
  count: number;
  scale: GradeScale;
  /** With a gym that has circuits, a climb can be placed on one of them instead of graded. */
  gym?: Gym | null;
  prefs: GradePrefs;
  project: boolean;
  /** Defaults to "not the last climb"; a live session lets the last one go too. */
  removable?: boolean;
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
  gym = null,
  prefs,
  project,
  removable = count > 1,
  suggestions,
  onChange,
  onChangeName,
  onPick,
  onToggleProject,
  onRemove,
  onClose,
}: ClimbEditorSheetProps): React.ReactElement {
  const named = climb.name.trim() !== "";
  const onCircuit = gym !== null && climb.circuit !== undefined;
  const dialog = React.useRef<HTMLDialogElement>(null);
  const panel = React.useRef<HTMLDivElement>(null);
  const pressedBackdrop = React.useRef(false);

  React.useEffect(() => {
    const el = dialog.current;
    if (el !== null && !el.open) el.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="climb-sheet"
      aria-label={t("logSession.climbOf", { n: index + 1, total: count })}
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
        <div
          className="climb-sheet-grip"
          onPointerDown={(e) => startDrag(e, panel.current, onClose)}
        >
          <div className="climb-sheet-handle" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={monoLabel}>{t("logSession.climbOf", { n: index + 1, total: count })}</span>
            {removable && (
              <button
                type="button"
                onClick={onRemove}
                className="climb-sheet-remove"
                aria-label={t("logSession.removeClimb")}
              >
                <Icon name="trash" size={18} strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
        {gym !== null && (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <label htmlFor="climb-kind" style={monoLabel}>
              {t("logSession.climbKind")}
            </label>
            <ClimbKindSelect
              id="climb-kind"
              climb={climb}
              gym={gym}
              prefs={prefs}
              onChange={onChange}
            />
          </div>
        )}
        {onCircuit ? (
          <CircuitFields climb={climb} gym={gym} onChange={onChange} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <label htmlFor="climb-grade" style={monoLabel}>
              {t("common.grade")}
            </label>
            <select
              id="climb-grade"
              name="grade"
              value={climb.grade}
              onChange={(e) => onChange({ ...climb, grade: e.target.value })}
              className="log-session-control"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                height: 46,
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
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span style={monoLabel}>
            {t("logSession.name")}{" "}
            <span style={{ color: "rgba(64,63,76,0.45)" }}>{t("common.optional")}</span>
          </span>
          <ClimbNameField
            value={climb.name}
            scale={scale}
            suggestions={suggestions}
            inline
            placeholder={
              !onCircuit
                ? t("logSession.climbNamePlaceholder")
                : t("logSession.circuitClimbNamePlaceholder")
            }
            onChange={onChangeName}
            onPick={onPick}
          />
        </div>
        {gym === null && (
          <DisciplineToggle
            value={disciplineOf(climb.scale)}
            onChange={(d) => onChange(withClimbGrading(climb, d, prefs, gym))}
          />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <OutcomeSelect
            discipline={disciplineOf(climb.scale)}
            outcome={climbOutcome(climb)}
            onChange={(outcome) => onChange(withClimbOutcome(climb, outcome))}
          />
          <TriesStepper
            tries={climb.tries}
            size={40}
            onChange={(tries) => onChange(withTries(climb, tries))}
          />
        </div>
        <ProjectToggle project={project} named={named} onToggle={onToggleProject} />
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <span style={monoLabel}>
            {named ? t("logSession.noteOptional") : t("logSession.noteNeedsName")}
          </span>
          {named && (
            <ClimbNoteField
              note={climb.note}
              name={climb.name}
              onChange={(note) => onChange({ ...climb, note })}
            />
          )}
        </div>
        <button type="button" onClick={onClose} className="climb-sheet-done">
          {t("common.save")}
        </button>
      </div>
    </dialog>
  );
}
