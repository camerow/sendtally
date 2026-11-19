import React from "react";
import {
  letterOf,
  type ItemDone,
  type SessionItem,
  type SetDone,
  type WeightUnit,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
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
import { useFieldOrder } from "../../../components/useFieldOrder";
import { Label } from "../components/Label";
import type { DetailMenuRow } from "../components/types";
import { RestPreview } from "../rest/RestPreview";
import { ExerciseBlock } from "./ExerciseBlock";
import { ExerciseHead } from "./ExerciseHead";
import { RpeField } from "./RpeField";
import { SetDoneFields } from "./SetDoneFields";
import { SetRow } from "./SetRow";
import { SupersetMembers } from "./SupersetMembers";

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
  menu: readonly DetailMenuRow[];
  /** Opens a member's exercise history; undefined where it has no screen of its own. */
  onHistory: (item: number) => (() => void) | undefined;
};

/**
 * A superset as one card, round by round: A1, B1, C1, then A2. Every set is live in any order; a
 * rest between members shows only when the superset has one, and the rest after a round between.
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
  onHistory,
}: SupersetCardProps): React.ReactElement {
  const setsOf = (m: number): number => done.find((d) => d.item === m)?.sets.length ?? 0;
  const rounds = Math.max(...group.members.map(setsOf));
  const title = supersetRoundTitle(roundOn(items, ticked, group), rounds);
  const nameOf = (m: number): string => exerciseName(items[m]?.exercise ?? "");
  const rpeOrder = useFieldOrder(
    group.members.flatMap((item) =>
      Array.from({ length: setsOf(item) }, (_, set) => setKey({ item, set })).filter((k) =>
        ticked.has(k)
      )
    )
  );
  return (
    <ExerciseBlock
      head={
        <>
          <ExerciseHead name={title} onFold={onFold} menu={menu} />
          <SupersetMembers
            members={group.members.map((item, letter) => {
              const history = onHistory(item);
              return {
                letter: letterOf(letter),
                name: nameOf(item),
                target: targetText(items[item]?.dose ?? { sets: 0 }, "strength", unit, {
                  round: true,
                }),
                ...(history !== undefined && { onHistory: history }),
              };
            })}
          />
        </>
      }
      add={{ label: t("workouts.addRound"), onPress: onAddRound }}
    >
      {Array.from({ length: rounds }, (_, set) => (
        <React.Fragment key={set}>
          <Label small color={colors.textSecondary} style={{ paddingTop: set === 0 ? 0 : 6 }}>
            {t("workouts.roundN", { n: set + 1 })}
          </Label>
          {group.members.map((item, letter) => {
            const at = { item, set };
            const value = done.find((d) => d.item === item)?.sets[set];
            if (value === undefined) return null;
            const name = nameOf(item);
            const rest = restPreviewAfter(group, (m) => setsOf(m), letter, set);
            const on = ticked.has(setKey(at));
            const label = t("activities.setOf", { exercise: name, n: set + 1 });
            const targetRpe = items[item]?.dose.targetRpe;
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
                    testID={`set-row-${item}-${set}`}
                    {...(targetRpe !== undefined && {
                      rpe: on ? (
                        <RpeField
                          set={value}
                          target={targetRpe}
                          slot={rpeOrder.slot(setKey(at))}
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
                      {...(!on && go(at) ? { go: go(at) } : {})}
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
