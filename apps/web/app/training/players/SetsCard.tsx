import React from "react";
import {
  type ItemDone,
  type SessionItem,
  type SetDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseName, setKey, type SetAt } from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import type { About } from "./AboutButton";
import { RestPreview } from "./RestPreview";
import { ExerciseCardHead } from "./ExerciseCardHead";
import { SetRow } from "./SetRow";

export type SetsCardProps = {
  item: SessionItem;
  done: ItemDone;
  /** What each set asks. */
  target: (set: number) => SetDone;
  /** Each set as the last run of this workout did it. */
  previous: readonly SetDone[];
  lifting: boolean;
  ticked: ReadonlySet<string>;
  current: SetAt | null;
  unit: WeightUnit;
  onChange: (set: number, value: SetDone) => void;
  onToggle: (set: number) => void;
  /** A set running on its timer, in place of its row. */
  holdRow: (set: number) => React.ReactNode;
  /** ▶ for a set, when it is the current one and timed. */
  go: (set: number) => React.ReactNode;
  /** What shows under a set: the rest its tick started, if it is running. */
  restUnder: (set: number) => React.ReactNode;
  /** The exercise's description behind an info button beside its name; none without one. */
  about?: About | undefined;
  onFocus: (set: number) => void;
  onRemoveSet: (set: number) => void;
  onAddSet: () => void;
  /** Its title folds it. */
  onFold: () => void;
  /** Its ··· menu: skip, move, remove. */
  menu: readonly MoreMenuItem[];
};

/** One exercise of the workout as a table of its sets, with its dose's letter when it alternates. */
export function SetsCard({
  item,
  done,
  target,
  previous,
  lifting,
  ticked,
  current,
  unit,
  onChange,
  onToggle,
  holdRow,
  go,
  restUnder,
  about,
  onFocus,
  onRemoveSet,
  onAddSet,
  onFold,
  menu,
}: SetsCardProps): React.ReactElement {
  const name = exerciseName(item.exercise);
  const { setRestS = 0, targetRpe } = item.dose;
  const rated = targetRpe !== undefined;
  return (
    <section className="player-card">
      <ExerciseCardHead item={item} about={about} onFold={onFold} menu={menu} />
      <div className="set-row set-row--head" aria-hidden="true">
        <span className="set-col-n train-label">{t("activities.colSet")}</span>
        <span className="set-col-target train-label">{t("activities.colTarget")}</span>
        <span className="set-col-done train-label">
          {rated && lifting ? t("activities.colDoneUnit", { unit }) : t("activities.colDone")}
        </span>
        {rated && <span className="set-col-rpe train-label">RPE</span>}
        <span className="set-tick" />
        <span className="set-remove" />
      </div>
      {done.sets.map((set, i) => (
        <React.Fragment key={i}>
          {holdRow(i) || (
            <SetRow
              n={i + 1}
              repsMax={item.dose.repsMax}
              target={target(i)}
              done={set}
              previous={previous[i]}
              lifting={lifting}
              ticked={ticked.has(setKey({ item: done.item, set: i }))}
              current={current?.item === done.item && current.set === i}
              unit={unit}
              label={t("activities.setOf", { exercise: name, n: i + 1 })}
              onChange={(value) => onChange(i, value)}
              onToggle={() => onToggle(i)}
              onFocus={() => onFocus(i)}
              onRemove={() => onRemoveSet(i)}
              go={go(i) || undefined}
              {...(rated && { rpe: { target: targetRpe } })}
            />
          )}
          {restUnder(i) ||
            (i < done.sets.length - 1 && setRestS > 0 && <RestPreview seconds={setRestS} />)}
        </React.Fragment>
      ))}
      <button
        type="button"
        className="outline-button player-add-set"
        aria-label={t("activities.addSetTo", { exercise: name })}
        onClick={onAddSet}
      >
        + {t("activities.addSet")}
      </button>
    </section>
  );
}
