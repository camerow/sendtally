import React from "react";
import {
  blockEnded,
  blockWeekOn,
  isDated,
  type Block,
  type CalendarDate,
  type DatedBlock,
  type Membership,
} from "@sendtally/core/hang";
import { blockMembers } from "./blocks";
import type { TrainingLog } from "./days";
import type { PlanActions } from "./usePlanActions";
import { usePlanDraft, type PlanDraftState } from "./usePlanDraft";
import { hasDays, scheduleOf, type DaySchedule, type DayToggle } from "./weekDays";

/** What the week shown on a block page is handed, read or in Edit mode. */
export type BlockWeekState = {
  plan: PlanDraftState["plan"];
  editing: boolean;
  onToggle: (membershipId: string, change: DayToggle) => void;
  onSchedules: (schedules: readonly DaySchedule[]) => void;
  onPickWeek: (week: number) => void;
  onMove: (membershipId: string, by: -1 | 1) => void;
  onEditDays?: () => void;
};

/** A block that exists, as its page reads it. */
export type BlockPageState = {
  block: Block;
  /** As saved, without the draft. */
  saved: Block;
  dated: DatedBlock | null;
  ended: boolean;
  /** This week of the block; none outside it. */
  current: number | null;
  /** The week picked, this week when it opened. */
  shown: number;
  /** A template with a workout on a day, so it can be scheduled. */
  schedulable: boolean;
  editing: boolean;
  weekProps: BlockWeekState;
};

export type BlockPageData = {
  draft: PlanDraftState;
  members: Membership[];
  /** None while it loads or once it is gone. */
  page: BlockPageState | null;
  /** Copies it into a template under `name`; the copy's id, or none when the copy failed. */
  saveAsTemplate: (name: string) => Promise<string | null>;
};

export type BlockPageArgs = {
  id: string;
  /** Just made by New block: it opens in Edit mode, and is removed on leaving if left empty. */
  fresh: boolean;
  log: TrainingLog;
  today: CalendarDate;
  actions: PlanActions;
  newId: () => string;
};

/**
 * One block's page: its draft for Edit mode, its state as read, the week picked, and Save as
 * template. An untitled template left with nothing in it was never really made, so leaving
 * removes it.
 */
export function useBlockPage({
  id,
  fresh,
  log,
  today,
  actions,
  newId,
}: BlockPageArgs): BlockPageData {
  const [week, setWeek] = React.useState<number | null>(null);
  const draft = usePlanDraft(log.plan, actions, fresh);
  const saved = log.plan.blocks.find((b) => b.id === id);
  const block = draft.plan.blocks.find((b) => b.id === id);
  const members = block === undefined ? [] : blockMembers(draft.plan, block);

  const empty = saved !== undefined && !isDated(saved) && saved.name === "" && members.length === 0;
  const left = React.useRef({ empty, remove: actions.deleteBlock });
  React.useEffect(() => {
    left.current = { empty, remove: actions.deleteBlock };
  });
  // Checked after unmounting settles, so React's StrictMode remount does not count as leaving.
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      setTimeout(() => {
        if (!mounted.current && left.current.empty) void left.current.remove(id);
      });
    };
  }, [id]);

  const saveAsTemplate = async (name: string): Promise<string | null> => {
    if (saved === undefined) return null;
    const copy = newId();
    if (!(await actions.copyBlock(id, copy, null))) return null;
    if (name !== saved.name) await actions.saveBlock({ ...saved, id: copy, start: null, name });
    return copy;
  };

  if (block === undefined || saved === undefined)
    return { draft, members, page: null, saveAsTemplate };
  const dated = isDated(block) ? block : null;
  const ended = blockEnded(block, today);
  const current = dated === null ? null : blockWeekOn(dated, today);
  const editing = draft.editing && !ended;
  return {
    draft,
    members,
    saveAsTemplate,
    page: {
      block,
      saved,
      dated,
      ended,
      current,
      shown: Math.min(block.weeks, week ?? current ?? 1),
      schedulable: members.some((m) => hasDays(scheduleOf(log.plan, m))),
      editing,
      weekProps: {
        plan: draft.plan,
        editing,
        onToggle: draft.toggle,
        onSchedules: draft.setSchedules,
        onPickWeek: setWeek,
        onMove: (membershipId, by) => draft.move(id, membershipId, by),
        ...(!ended && { onEditDays: draft.begin }),
      },
    },
  };
}
