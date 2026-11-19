import React from "react";
import type { ItemDone, SessionItem, SetDone, WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseName, setKey, targetText, type SetAt } from "@sendtally/features/workouts";
import { useFieldOrder } from "../../../components/useFieldOrder";
import type { About } from "../components/AboutButton";
import type { DetailMenuRow } from "../components/types";
import { RestPreview } from "../rest/RestPreview";
import { ExerciseBlock } from "./ExerciseBlock";
import { ExerciseHead } from "./ExerciseHead";
import { RpeField } from "./RpeField";
import { SetDoneFields } from "./SetDoneFields";
import { SetHeadings } from "./SetHeadings";
import { SetRow } from "./SetRow";
import { holdsOnly } from "./setColumns";

export type SetsCardProps = {
  item: SessionItem;
  done: ItemDone;
  lifting: boolean;
  /** Done each side: its target reads "a side". */
  eachSide?: boolean;
  ticked: ReadonlySet<string>;
  selected: SetAt | null;
  unit: WeightUnit;
  onChange: (set: number, value: SetDone) => void;
  onToggle: (set: number) => void;
  /** A set running on its timer, in place of its row. */
  holdRow: (set: number) => React.ReactNode;
  /** ▶ for a set, when it is the current one and timed. */
  go: (set: number) => React.ReactNode;
  /** What shows under a set: the rest its tick started, if it is running, else its rest to come. */
  restUnder: (set: number) => React.ReactNode;
  /** The exercise's description behind an info button beside its name; none without one. */
  about?: About | undefined;
  onHistory?: () => void;
  onSelect: (set: number) => void;
  onRemoveSet: (set: number) => void;
  onAddSet: () => void;
  /** Its title folds it. */
  onFold: () => void;
  /** Its ··· menu: skip, move, remove. */
  menu: readonly DetailMenuRow[];
};

/** One exercise of the run: its target once in the head, then a row per set on the set grid. */
export function SetsCard({
  item,
  done,
  lifting,
  eachSide = false,
  ticked,
  selected,
  unit,
  onChange,
  onToggle,
  holdRow,
  go,
  restUnder,
  about,
  onHistory,
  onSelect,
  onRemoveSet,
  onAddSet,
  onFold,
  menu,
}: SetsCardProps): React.ReactElement {
  const name = exerciseName(item.exercise);
  const { setRestS, targetRpe } = item.dose;
  const rated = targetRpe !== undefined;
  const tickedSets = done.sets.flatMap((_, i) =>
    ticked.has(setKey({ item: done.item, set: i })) ? [String(i)] : []
  );
  const rpeOrder = useFieldOrder(tickedSets);
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={name}
          target={targetText(item.dose, "strength", unit, { eachSide })}
          about={about}
          {...(onHistory !== undefined && { onHistory })}
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
      <SetHeadings
        position={t("activities.colSet")}
        fields={holdsOnly(done.sets) ? t("workouts.dose.hold") : t("activities.colDone")}
        rpe={rated}
      />
      {done.sets.map((set, i) => {
        const on = ticked.has(setKey({ item: done.item, set: i }));
        const label = t("activities.setOf", { exercise: name, n: i + 1 });
        return (
          <React.Fragment key={i}>
            {holdRow(i) || (
              <SetRow
                position={String(i + 1)}
                label={label}
                ticked={on}
                onToggle={() => onToggle(i)}
                selected={selected?.item === done.item && selected.set === i}
                onSelect={() => onSelect(i)}
                onRemove={() => onRemoveSet(i)}
                removeLabel={t("activities.removeSet", { n: i + 1 })}
                testID={`set-row-${done.item}-${i}`}
                {...(rated && {
                  rpe: on ? (
                    <RpeField
                      set={set}
                      target={targetRpe}
                      slot={rpeOrder.slot(String(i))}
                      label={label}
                      onChange={(value) => onChange(i, value)}
                    />
                  ) : null,
                })}
              >
                <SetDoneFields
                  set={set}
                  lifting={lifting}
                  unit={unit}
                  label={label}
                  {...(!on && go(i) ? { go: go(i) } : {})}
                  onChange={(value) => onChange(i, value)}
                />
              </SetRow>
            )}
            {restUnder(i) ||
              (i < done.sets.length - 1 && setRestS !== undefined && setRestS > 0 && (
                <RestPreview seconds={setRestS} />
              ))}
          </React.Fragment>
        );
      })}
    </ExerciseBlock>
  );
}
