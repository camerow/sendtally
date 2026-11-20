import React from "react";
import {
  intervalPhases,
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
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { PhaseBar } from "../components/PhaseBar";
import { SupersetMembers } from "../components/SupersetMembers";
import { useSessionTarget } from "../components/sessionTarget";
import { RestPreview } from "../players/RestPreview";

export type BodyPreviewProps = {
  /** This session's items, as Start runs them. */
  items: readonly SessionItem[];
  /** The rest between exercises the workout sets. */
  exerciseRestS: number;
  unit: WeightUnit;
  /** What an exercise's target is counted in: the workout's kind, or its climbing measure. */
  kindOf: (exercise: string) => TargetKind;
  eachSide: (exercise: string) => boolean;
  /** Where an exercise's history opens, when it has a page. */
  historyOf: (exercise: string) => string | undefined;
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
  historyOf,
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
  const history = (item: SessionItem): string | undefined =>
    item.checklist === undefined ? historyOf(item.exercise) : undefined;
  return (
    <div className="body-preview">
      {timed && (
        <div className="body-bar">
          <PhaseBar phases={intervalPhases(intervalsOf(items)).slice(1)} height={14} />
        </div>
      )}
      {blocksOf(items).map((block, b) => {
        const first = block[0] ?? 0;
        const item = items[first];
        if (item === undefined) return null;
        const group = block.length > 1 ? item.group : undefined;
        const open = history(item);
        return (
          <React.Fragment key={first}>
            {b > 0 && <RestPreview seconds={restAfterItem(items, first - 1, exerciseRestS)} />}
            {group === undefined ? (
              <ExerciseBlock
                head={
                  <ExerciseHead
                    name={itemTitle(item)}
                    target={target(item)}
                    {...(open !== undefined && { history: open })}
                  />
                }
              />
            ) : (
              <ExerciseBlock head={<ExerciseHead name={supersetRoundsTitle(group.rounds)} />}>
                {block.map((m, letter) => {
                  const member = items[m];
                  if (member === undefined) return null;
                  const to = history(member);
                  return (
                    <React.Fragment key={m}>
                      {letter > 0 && <RestPreview seconds={group.restBetweenS} />}
                      <SupersetMembers
                        members={[
                          {
                            letter: letterOf(letter),
                            name: itemTitle(member),
                            target: target(member, true),
                            ...(to !== undefined && { history: to }),
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
    </div>
  );
}
