import React from "react";
import type { ItemDone, SetDone, WeightUnit } from "@sendtally/core/hang";
import {
  addSet,
  changeSet,
  offWithout,
  removeSet,
  setKeyOf,
  shortOf,
} from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { Sheet } from "../../components/Sheet";
import { ReviewSetRow } from "./ReviewSetRow";

export type DoneDetailsProps = {
  done: readonly ItemDone[];
  /** Sets toggled off, which do not save. */
  off: readonly string[];
  /** Each item's dose, which a set short of it reads against. */
  planned: readonly (SetDone | undefined)[];
  unit: WeightUnit;
  /** The kind's colour, on each exercise's mark. */
  color: string;
  /** A hangboard workout: its sets are hang counts and loads. */
  hangs?: boolean;
  /** The load a hang set shows while it has none of its own: the session's. */
  hangLoadKg?: number;
  /** Each exercise's sets as the workout's last run did them, which a lift's target borrows. */
  previous?: (exercise: string) => readonly SetDone[];
  /** Beside the first exercise's name, such as a hangboard run's edge and weight. */
  setup?: React.ReactNode;
  onChange: (done: ItemDone[], off: string[]) => void;
  /** A set with values was removed: say so, with Undo putting it back. */
  onRemoved?: (message: string, undo: () => void) => void;
};

const offWithoutKey = (off: readonly string[], item: number, set: number): string[] =>
  off.filter((k) => k !== setKeyOf(item, set));

/**
 * What was done, to review before saving: each exercise as its sets' table, ticked when it
 * counts, amber where it fell short, a number typed in place, a set added or removed.
 */
export function DoneDetails({
  done,
  off,
  planned,
  unit,
  color,
  hangs = false,
  hangLoadKg = 0,
  previous = () => [],
  setup,
  onChange,
  onRemoved,
}: DoneDetailsProps): React.ReactElement {
  const [lastOf, setLastOf] = React.useState<ItemDone | null>(null);
  const removed = (d: ItemDone, set: number): void => {
    onChange(removeSet(done, d.item, set), offWithout(off, d.item, set));
    if (!off.includes(setKeyOf(d.item, set)))
      onRemoved?.(t("activities.setRemoved", { n: set + 1 }), () => onChange([...done], [...off]));
  };
  const remove = (d: ItemDone, set: number): void =>
    d.sets.length > 1 ? removed(d, set) : setLastOf(d);
  const toggle = (item: number, set: number): void => {
    const key = setKeyOf(item, set);
    onChange([...done], off.includes(key) ? off.filter((k) => k !== key) : [...off, key]);
  };

  return (
    <div className="form-section">
      <span className="train-label">{t("activities.sets")}</span>
      {done.map((d, index) => {
        const target = planned[d.item];
        const lifting = d.sets.some((s) => s.weightKg !== undefined) && !hangs;
        return (
          <div key={d.item} className="done-card">
            <div className="done-card-head">
              <span className="done-card-mark" style={{ background: color }} />
              <span className="done-card-name">{d.exercise}</span>
              <span className="done-card-count">
                {t("activities.setCount", { count: d.sets.length })}
              </span>
            </div>
            {index === 0 && setup}
            <div className="set-row set-row--head train-label train-label--small">
              <span className="set-col-n">{t("activities.colSet")}</span>
              <span className="set-col-target">{t("activities.colTarget")}</span>
              <span className="set-col-done">
                {hangs ? t("activities.colHangsLoad") : t("activities.colDone")}
              </span>
            </div>
            {d.sets.map((set, i) => (
              <ReviewSetRow
                key={i}
                n={i + 1}
                target={
                  target === undefined || target.onS !== undefined
                    ? target
                    : { ...target, weightKg: target.weightKg ?? previous(d.exercise)[i]?.weightKg }
                }
                done={set}
                hangs={hangs}
                lifting={lifting}
                unit={unit}
                on={!off.includes(setKeyOf(d.item, i))}
                short={shortOf(set, target, hangs)}
                label={t("activities.setOf", { exercise: d.exercise, n: i + 1 })}
                defaultLoadKg={hangLoadKg}
                onChange={(value) =>
                  onChange(changeSet(done, d.item, i, value), offWithoutKey(off, d.item, i))
                }
                onToggle={() => toggle(d.item, i)}
                onRemove={() => remove(d, i)}
              />
            ))}
            <div className="done-card-actions">
              <button
                type="button"
                className="outline-button"
                aria-label={t("activities.addSetTo", { exercise: d.exercise })}
                onClick={() => onChange(addSet(done, d.item), [...off])}
              >
                <Icon name="plus" size={16} strokeWidth={2.2} />
                {t("activities.addSet")}
              </button>
              {d.sets.length > 1 && (
                <button
                  type="button"
                  className="outline-button"
                  aria-label={t("activities.removeLastSetFrom", { exercise: d.exercise })}
                  onClick={() => remove(d, d.sets.length - 1)}
                >
                  − {t("activities.removeLastSet")}
                </button>
              )}
            </div>
          </div>
        );
      })}
      <Sheet
        open={lastOf !== null}
        title={t("activities.removeLastSetTitle", { exercise: lastOf?.exercise ?? "" })}
        onClose={() => setLastOf(null)}
        action={{
          label: t("workouts.removeExercise", { name: lastOf?.exercise ?? "" }),
          danger: true,
          onPress: () => {
            if (lastOf !== null) removed(lastOf, 0);
            setLastOf(null);
          },
        }}
      >
        <p className="sheet-body">{t("activities.removeLastSetBody")}</p>
      </Sheet>
    </div>
  );
}
