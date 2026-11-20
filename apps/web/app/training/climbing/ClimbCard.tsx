import React from "react";
import type { SessionItem, WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { setClimbOf, wallLeft, type Tally } from "@sendtally/features/log-session";
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
import { SET_COLUMNS } from "../components/setColumns";
import { useSessionTarget } from "../components/sessionTarget";
import { RestPreview } from "../players/RestPreview";
import { ClimbReadRow } from "./ClimbReadRow";
import { ClimbRow } from "./ClimbRow";
import { GradePicker } from "./GradePicker";
import { WallClock } from "./WallClock";

export type ClimbCardProps = {
  item: SessionItem;
  plan: ClimbPlan;
  rows: readonly ClimbSet[];
  unit: WeightUnit;
  /** The tally, while it is on this card; its current set takes the grades picked. */
  tally: Tally | null;
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
        <span className="train-label climb-attempts">{t("climbs.attempts")}</span>
      </span>
      <span className={`train-label ${SET_COLUMNS.tick}`}>{t("common.sent")}</span>
    </div>
  );
}

/** A climbing exercise: a row per climb in each set, the grades under the set being climbed. */
export function ClimbCard({
  item,
  plan,
  rows,
  unit,
  tally,
  restUnder,
  about,
  history,
  onFold,
  menu,
  onEdit,
}: ClimbCardProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const restS = item.dose.setRestS ?? 0;
  const ex = tally?.draft?.exercise;
  const left = ex === undefined ? null : wallLeft(ex, tally?.now ?? new Date());
  const selected = tally?.selection?.kind === "row" ? tally.selection.key : null;
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={exerciseName(item.exercise)}
          target={targetText(item.dose, plan.onS === undefined ? "climbs" : "wallTime", unit, {
            sessionRpe,
          })}
          about={about}
          {...(history !== undefined && { history })}
          onFold={onFold}
          menu={menu}
        />
      }
    >
      {rows.map((row, i) => {
        const live = tally !== null && row.state === "current";
        const rest =
          restUnder(row.set - 1) ||
          (i < rows.length - 1 && restS > 0 && <RestPreview seconds={restS} />);
        return (
          <React.Fragment key={row.set}>
            <div className="climb-set-head">
              <span className="train-label">{t("tally.setLabel", { set: row.set })}</span>
              {live ? (
                <button
                  type="button"
                  className="text-button climb-end-set"
                  aria-label={t("workouts.endSet", { set: row.set })}
                  onClick={tally.endSet}
                >
                  {t("tally.endSet")}
                </button>
              ) : (
                row.state === "done" && <span className="climb-set-done">{t("common.done")}</span>
              )}
            </div>
            {live ? (
              <div>
                {row.climbs.length > 0 && <Headings />}
                {row.climbs.map((c, n) => (
                  <ClimbRow
                    key={c.key}
                    position={n + 1}
                    climb={c}
                    selected={selected === c.key}
                    onSelect={() => tally.toggleRow(c.key)}
                    onRemove={() => tally.remove(c.key)}
                    onTries={(tries) => tally.setTries(c.key, tries)}
                    onFlip={() => tally.flip(c.key)}
                    onEdit={() => onEdit(c.key)}
                  />
                ))}
                <GradePicker tally={tally} />
              </div>
            ) : (
              <div>
                {row.climbs.map((c, n) => (
                  <ClimbReadRow key={c.key} position={n + 1} climb={setClimbOf(c)} />
                ))}
              </div>
            )}
            {live && plan.onS !== undefined && left !== null && (
              <WallClock
                targetS={plan.onS}
                left={left}
                running={ex?.setStartedAt !== undefined}
                onToggle={tally.toggleWall}
              />
            )}
            {rest}
          </React.Fragment>
        );
      })}
    </ExerciseBlock>
  );
}
