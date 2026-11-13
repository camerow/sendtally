import React from "react";
import {
  clock,
  type ItemDone,
  type SessionItem,
  type SetDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseName, setKey, type SetAt } from "@sendtally/features/workouts";
import { LetterBadge } from "../components/LetterBadge";
import { RestPreview } from "./RestPreview";
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
}: SetsCardProps): React.ReactElement {
  const name = exerciseName(item.exercise);
  const { name: doseName, setRestS = 0 } = item.dose;
  return (
    <section className="player-card">
      <div className="player-card-head">
        <h2 className="player-card-name">{name}</h2>
        {item.turn !== undefined && (
          <span className="player-card-turn">
            <LetterBadge dose={item.turn} />
            {doseName !== undefined && <span className="player-card-meta">{doseName}</span>}
          </span>
        )}
        {setRestS > 0 && (
          <span className="player-card-meta">{t("plan.chipRest", { value: clock(setRestS) })}</span>
        )}
      </div>
      <div className="set-row set-row--head" aria-hidden="true">
        <span className="set-col-n train-label">{t("activities.colSet")}</span>
        <span className="set-col-target train-label">{t("activities.colTarget")}</span>
        <span className="set-col-done train-label">{t("activities.colDone")}</span>
        <span className="set-tick" />
      </div>
      {done.sets.map((set, i) => (
        <React.Fragment key={i}>
          {holdRow(i) || (
            <SetRow
              n={i + 1}
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
              go={go(i) || undefined}
            />
          )}
          {restUnder(i) ||
            (i < done.sets.length - 1 && setRestS > 0 && <RestPreview seconds={setRestS} />)}
        </React.Fragment>
      ))}
    </section>
  );
}
