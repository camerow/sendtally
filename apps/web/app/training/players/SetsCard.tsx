import React from "react";
import type { ItemDone, SessionItem, SetDone, WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseName, setKey, targetText, type SetAt } from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import type { About } from "../components/AboutButton";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { RpeField } from "../components/RpeField";
import { SetDoneFields } from "../components/SetDoneFields";
import { SetHeadings } from "../components/SetHeadings";
import { SetRow } from "../components/SetRow";
import { holdsOnly } from "../components/setColumns";
import { useSessionTarget } from "../components/sessionTarget";
import { RestPreview } from "./RestPreview";

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
  /** ▶ for a set, when it is open and timed. */
  go: (set: number) => React.ReactNode;
  /** What shows under a set: the rest its tick started, if it is running, else its rest to come. */
  restUnder: (set: number) => React.ReactNode;
  /** The exercise's description behind an info button beside its name; none without one. */
  about?: About | undefined;
  history?: string | undefined;
  onSelect: (set: number) => void;
  onRemoveSet: (set: number) => void;
  onAddSet: () => void;
  /** Its title folds it. */
  onFold: () => void;
  /** Its ··· menu: skip, move, remove. */
  menu: readonly MoreMenuItem[];
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
  history,
  onSelect,
  onRemoveSet,
  onAddSet,
  onFold,
  menu,
}: SetsCardProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const name = exerciseName(item.exercise);
  const { setRestS, targetRpe } = item.dose;
  const rated = targetRpe !== undefined;
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={name}
          target={targetText(item.dose, "strength", unit, { eachSide, sessionRpe })}
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
      <SetHeadings
        position={t("activities.colSet")}
        fields={holdsOnly(done.sets) ? t("workouts.dose.hold") : t("activities.colDone")}
        rpe={rated}
      />
      {done.sets.map((set, i) => {
        const on = ticked.has(setKey({ item: done.item, set: i }));
        const label = t("activities.setOf", { exercise: name, n: i + 1 });
        const timer = on ? null : go(i);
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
                {...(rated && {
                  rpe: on ? (
                    <RpeField
                      set={set}
                      target={targetRpe}
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
                  {...(timer ? { go: timer } : {})}
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
