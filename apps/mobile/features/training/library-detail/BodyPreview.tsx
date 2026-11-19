import React from "react";
import { View } from "react-native";
import {
  intervalsOf,
  letterOf,
  restAfterItem,
  type SessionItem,
  type WeightUnit,
} from "@sendtally/core/hang";
import {
  itemTitle,
  supersetRoundsTitle,
  targetText,
  type TargetKind,
  type TargetText,
} from "@sendtally/features/workouts";
import { IntervalsBar } from "../components/IntervalsBar";
import { RestPreview } from "../rest/RestPreview";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { SupersetMembers } from "../sets/SupersetMembers";
import { useSessionTarget } from "../sets/sessionTarget";

export type BodyPreviewProps = {
  /** This session's items, as Start runs them. */
  items: readonly SessionItem[];
  /** The rest between exercises the workout sets. */
  exerciseRestS: number;
  unit: WeightUnit;
  /** What an exercise's target is counted in: the workout's kind, or its climbing measure. */
  kindOf: (exercise: string) => TargetKind;
  eachSide: (exercise: string) => boolean;
  /** Opens an exercise's history, when it has a screen. */
  openExercise?: (name: string) => (() => void) | undefined;
};

/** Item indexes as blocks: one exercise, or a superset's neighbouring members. */
const blocksOf = (items: readonly SessionItem[]): number[][] =>
  items.reduce<number[][]>((blocks, item, i) => {
    const last = blocks[blocks.length - 1];
    const prev = last?.[last.length - 1];
    if (last !== undefined && prev !== undefined && item.group !== undefined)
      if (items[prev]?.group?.id === item.group.id) return [...blocks.slice(0, -1), [...last, i]];
    return [...blocks, [i]];
  }, []);

/** This session's exercises, each the shared block with its head only, and the rests between. */
export function BodyPreview({
  items,
  exerciseRestS,
  unit,
  kindOf,
  eachSide,
  openExercise,
}: BodyPreviewProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const target = (item: SessionItem, round = false): TargetText =>
    item.checklist === undefined
      ? targetText(item.dose, kindOf(item.exercise), unit, {
          eachSide: eachSide(item.exercise),
          round,
          sessionRpe,
        })
      : { work: item.checklist.lines.join(" · "), rpe: undefined };
  const timed = items.length > 0 && items.every((item) => item.dose.onS !== undefined);
  const history = (item: SessionItem): (() => void) | undefined =>
    item.checklist === undefined ? openExercise?.(item.exercise) : undefined;
  return (
    <View style={{ gap: 4 }}>
      {timed && (
        <View style={{ flexDirection: "row", paddingVertical: 8 }}>
          <IntervalsBar intervals={intervalsOf(items)} height={14} />
        </View>
      )}
      {blocksOf(items).map((block, b) => {
        const first = block[0] ?? 0;
        const item = items[first];
        if (item === undefined) return null;
        const group = block.length > 1 ? item.group : undefined;
        return (
          <React.Fragment key={first}>
            {b > 0 && <RestPreview seconds={restAfterItem(items, first - 1, exerciseRestS)} />}
            {group === undefined ? (
              <ExerciseBlock
                head={
                  <ExerciseHead
                    name={itemTitle(item)}
                    target={target(item)}
                    {...(history(item) !== undefined && { onHistory: history(item) })}
                  />
                }
              />
            ) : (
              <ExerciseBlock head={<ExerciseHead name={supersetRoundsTitle(group.rounds)} />}>
                {block.map((m, letter) => {
                  const member = items[m];
                  if (member === undefined) return null;
                  const open = history(member);
                  return (
                    <React.Fragment key={m}>
                      {letter > 0 && <RestPreview seconds={group.restBetweenS} />}
                      <SupersetMembers
                        members={[
                          {
                            letter: letterOf(letter),
                            name: itemTitle(member),
                            target: target(member, true),
                            ...(open !== undefined && { onHistory: open }),
                          },
                        ]}
                      />
                    </React.Fragment>
                  );
                })}
              </ExerciseBlock>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
