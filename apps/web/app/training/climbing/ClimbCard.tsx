import React from "react";
import type { SessionItem, WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { wallLeft, type ClimbDraft, type Tally } from "@sendtally/features/log-session";
import { elapsedClock } from "@sendtally/features/sessions";
import { useDisplayScales } from "@sendtally/features/settings";
import {
  exerciseName,
  targetText,
  type ClimbPlan,
  type ClimbRow as ClimbSet,
} from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import type { About } from "../components/AboutButton";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { onControl } from "../components/SetRow";
import { SET_COLUMNS } from "../components/setColumns";
import { useSessionTarget } from "../components/sessionTarget";
import { RestPreview } from "../players/RestPreview";
import { climbGradeText } from "./ClimbGrade";
import { ClimbRow } from "./ClimbRow";
import { GradePicker } from "./GradePicker";
import { WallClock } from "./WallClock";

export type ClimbCardProps = {
  item: SessionItem;
  plan: ClimbPlan;
  rows: readonly ClimbSet[];
  unit: WeightUnit;
  /** The workout tally: every climb's row changes on it, whichever card it is on. */
  tally: Tally;
  /** The grade picker is on this card, under its picked set. */
  picking: boolean;
  /** A press on the card outside its controls moves the grade picker to it. */
  onPress: () => void;
  onPressSet: (set: number) => void;
  onAddSet: () => void;
  /** A climb taken out, for its Undo, with its grade as the climber reads it. */
  onRemoved: (climb: ClimbDraft, grade: string) => void;
  /** The rest a set's end started, under it while it runs. */
  restUnder: (set: number) => React.ReactNode;
  about?: About | undefined;
  /** Where its history opens. */
  history?: string | undefined;
  onFold: () => void;
  menu: readonly MoreMenuItem[];
  onEdit: (key: string) => void;
};

function Headings(): React.ReactElement {
  return (
    <div className={`${SET_COLUMNS.row} climb-headings`} aria-hidden="true">
      <span className={SET_COLUMNS.position} />
      <span className={SET_COLUMNS.lead}>
        <span className="train-label climb-grade">{t("common.grade")}</span>
        <span className="climb-edit-space" />
        <span className="train-label climb-attempts">{t("climbs.attempts")}</span>
      </span>
      <span className={`train-label ${SET_COLUMNS.tick}`}>{t("common.sent")}</span>
    </div>
  );
}

/** A climbing exercise: a row per climb in every set, the grades under the set they go to. */
export function ClimbCard({
  item,
  plan,
  rows,
  unit,
  tally,
  picking,
  onPress,
  onPressSet,
  onAddSet,
  onRemoved,
  restUnder,
  about,
  history,
  onFold,
  menu,
  onEdit,
}: ClimbCardProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const restS = item.dose.setRestS ?? 0;
  const ex = picking ? tally.draft?.exercise : undefined;
  const left = ex === undefined ? null : wallLeft(ex, tally.now);
  const selected = tally.selection?.kind === "row" ? tally.selection.key : null;
  const scales = useDisplayScales();
  const clear = tally.clearSelection;
  React.useEffect(() => {
    if (selected === null) return;
    const onClick = (e: MouseEvent): void => {
      if (e.target instanceof Element && !onControl(e.target) && !e.target.closest(".set-item"))
        clear();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [selected, clear]);
  const headed = rows.find((r) => r.climbs.length > 0)?.set;
  const name = exerciseName(item.exercise);
  return (
    <div
      className="climb-card"
      onClick={(e) => {
        if (!onControl(e.target)) onPress();
      }}
    >
      <ExerciseBlock
        head={
          <ExerciseHead
            name={name}
            target={targetText(item.dose, plan.onS === undefined ? "climbs" : "wallTime", unit, {
              sessionRpe,
            })}
            about={about}
            {...(history !== undefined && { history })}
            onFold={onFold}
            menu={menu}
          />
        }
        add={{
          label: t("activities.addSet"),
          accessibilityLabel: t("activities.addSetTo", { exercise: name }),
          onPress: onAddSet,
        }}
      >
        {rows.map((row, i) => {
          const rest =
            restUnder(row.set - 1) ||
            (i < rows.length - 1 && restS > 0 && <RestPreview seconds={restS} />);
          return (
            <React.Fragment key={row.set}>
              <button
                type="button"
                className="climb-set-head"
                aria-label={t("workouts.climbInSet", { set: row.set })}
                onClick={() => onPressSet(row.set)}
              >
                <span className="train-label">{t("tally.setLabel", { set: row.set })}</span>
                {row.state === "done" &&
                  (row.onS === null ? (
                    <span className="climb-set-done">{t("common.done")}</span>
                  ) : (
                    <span className="climb-set-time">{`${elapsedClock(row.onS)} · ${t("common.done")}`}</span>
                  ))}
              </button>
              <div>
                {row.set === headed && <Headings />}
                {row.climbs.map((c, n) => (
                  <ClimbRow
                    key={c.key}
                    position={n + 1}
                    climb={c}
                    selected={selected === c.key}
                    onSelect={() => tally.toggleRow(c.key)}
                    onRemove={() => {
                      tally.remove(c.key);
                      onRemoved(c, climbGradeText(c, scales));
                    }}
                    onTries={(tries) => tally.setTries(c.key, tries)}
                    onFlip={() => tally.flip(c.key)}
                    onEdit={() => onEdit(c.key)}
                  />
                ))}
                {picking && row.picked && <GradePicker tally={tally} />}
              </div>
              {ex !== undefined &&
                row.state === "current" &&
                plan.onS !== undefined &&
                left !== null && (
                  <WallClock
                    targetS={plan.onS}
                    left={left}
                    running={ex.setStartedAt !== undefined}
                    onToggle={tally.toggleWall}
                  />
                )}
              {rest}
            </React.Fragment>
          );
        })}
      </ExerciseBlock>
    </div>
  );
}
