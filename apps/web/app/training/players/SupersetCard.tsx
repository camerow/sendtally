import React from "react";
import {
  letterOf,
  type ItemDone,
  type SessionItem,
  type SetDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseName,
  memberSetLabel,
  restPreviewAfter,
  roundOn,
  setKey,
  supersetRoundTitle,
  targetText,
  type RunGroup,
  type SetAt,
} from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { RpeField } from "../components/RpeField";
import { SetDoneFields } from "../components/SetDoneFields";
import { SetRow } from "../components/SetRow";
import { SupersetMembers } from "../components/SupersetMembers";
import { useSessionTarget } from "../components/sessionTarget";
import { RestPreview } from "./RestPreview";

export type SupersetCardProps = {
  group: RunGroup;
  /** The run's items, sets as many as each has now. */
  items: readonly SessionItem[];
  done: readonly ItemDone[];
  lifting: (item: number) => boolean;
  ticked: ReadonlySet<string>;
  selected: SetAt | null;
  unit: WeightUnit;
  onChange: (at: SetAt, value: SetDone) => void;
  onToggle: (at: SetAt) => void;
  holdRow: (at: SetAt) => React.ReactNode;
  go: (at: SetAt) => React.ReactNode;
  restUnder: (at: SetAt) => React.ReactNode;
  onSelect: (at: SetAt) => void;
  onRemoveSet: (at: SetAt) => void;
  /** One more round, for every member. */
  onAddRound: () => void;
  onFold: () => void;
  menu: readonly MoreMenuItem[];
  /** Where a member's exercise history opens; undefined where it has no page of its own. */
  history: (item: number) => string | undefined;
};

/**
 * A superset as one card: its members said once at the top, then round by round, A1, B1, C1,
 * then A2. Every set is live in any order; a rest between members shows only when the superset
 * has one, and the rest after a round between.
 */
export function SupersetCard({
  group,
  items,
  done,
  lifting,
  ticked,
  selected,
  unit,
  onChange,
  onToggle,
  holdRow,
  go,
  restUnder,
  onSelect,
  onRemoveSet,
  onAddRound,
  onFold,
  menu,
  history,
}: SupersetCardProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const setsOf = (m: number): number => done.find((d) => d.item === m)?.sets.length ?? 0;
  const rounds = Math.max(...group.members.map(setsOf));
  const title = supersetRoundTitle(roundOn(items, ticked, group), rounds);
  const nameOf = (m: number): string => exerciseName(items[m]?.exercise ?? "");
  return (
    <ExerciseBlock
      head={
        <>
          <ExerciseHead name={title} onFold={onFold} menu={menu} />
          <SupersetMembers
            members={group.members.map((item, letter) => {
              const to = history(item);
              return {
                letter: letterOf(letter),
                name: nameOf(item),
                target: targetText(items[item]?.dose ?? { sets: 0 }, "strength", unit, {
                  round: true,
                  sessionRpe,
                }),
                ...(to !== undefined && { history: to }),
              };
            })}
          />
        </>
      }
      add={{ label: t("workouts.addRound"), onPress: onAddRound }}
    >
      {Array.from({ length: rounds }, (_, set) => (
        <React.Fragment key={set}>
          <span className="train-label train-label--small superset-round">
            {t("workouts.roundN", { n: set + 1 })}
          </span>
          {group.members.map((item, letter) => {
            const at = { item, set };
            const value = done.find((d) => d.item === item)?.sets[set];
            if (value === undefined) return null;
            const name = nameOf(item);
            const rest = restPreviewAfter(group, (m) => setsOf(m), letter, set);
            const on = ticked.has(setKey(at));
            const label = t("activities.setOf", { exercise: name, n: set + 1 });
            const targetRpe = items[item]?.dose.targetRpe;
            const timer = on ? null : go(at);
            return (
              <React.Fragment key={item}>
                {holdRow(at) || (
                  <SetRow
                    position={memberSetLabel(letter, set)}
                    name={name}
                    label={label}
                    ticked={on}
                    onToggle={() => onToggle(at)}
                    selected={selected?.item === item && selected.set === set}
                    onSelect={() => onSelect(at)}
                    onRemove={() => onRemoveSet(at)}
                    removeLabel={t("activities.removeSet", { n: set + 1 })}
                    {...(targetRpe !== undefined && {
                      rpe: on ? (
                        <RpeField
                          set={value}
                          target={targetRpe}
                          label={label}
                          onChange={(v) => onChange(at, v)}
                        />
                      ) : null,
                    })}
                  >
                    <SetDoneFields
                      set={value}
                      lifting={lifting(item)}
                      unit={unit}
                      label={label}
                      {...(timer ? { go: timer } : {})}
                      onChange={(v) => onChange(at, v)}
                    />
                  </SetRow>
                )}
                {restUnder(at) || (rest !== null && <RestPreview seconds={rest} />)}
              </React.Fragment>
            );
          })}
        </React.Fragment>
      ))}
    </ExerciseBlock>
  );
}
