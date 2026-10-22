import React from "react";
import type { TrainingBlock } from "@sendtally/api-client";
import {
  addDays,
  blockEnd,
  endChoiceOf,
  endOf,
  loadKey,
  minDate,
  occurrences,
  occursOn,
  type CalendarDate,
  type Loads,
  type Schedule,
  type Weekday,
  type Workout,
} from "@sendtally/core/hang";
import { randomUUID } from "expo-crypto";
import { useBlocks } from "../blocks/useBlocks";
import { useHangData } from "../data/HangDataContext";
import { useReminderPrompt } from "../reminders/ReminderPromptProvider";
import { plannerSummary } from "./plannerSummary";
import { DEFAULT_WEEKS, endChoice } from "./scheduleDraft";
import type { EndMode, PlannerRequest } from "./types";

export type PlannerDraft = {
  workoutId: string | null;
  picking: boolean;
  grips: string[];
  loads: Loads;
  days: Weekday[];
  start: CalendarDate;
  minStart: CalendarDate;
  endMode: EndMode;
  weeks: number;
  last: CalendarDate;
  targetRpe: number | null;
  blockId: string | null;
};

function draftFor(
  request: PlannerRequest,
  today: CalendarDate,
  gripOf: (id: string) => string | null
): PlannerDraft {
  if (request.mode === "edit") {
    const s = request.schedule;
    const end = endChoiceOf(s);
    return {
      workoutId: s.workoutId,
      picking: false,
      grips: [s.gripId],
      loads: {},
      days: s.days,
      start: s.start,
      minStart: minDate(s.start, today),
      endMode: end.mode,
      weeks: end.mode === "weeks" ? end.weeks : DEFAULT_WEEKS,
      last: end.mode === "date" ? end.last : addDays(s.start, DEFAULT_WEEKS * 7 - 1),
      targetRpe: s.targetRpe ?? null,
      blockId: s.blockId ?? null,
    };
  }
  const grip = request.gripId ?? (request.workoutId === null ? null : gripOf(request.workoutId));
  return {
    workoutId: request.workoutId,
    picking: request.workoutId === null,
    grips: grip === null ? [] : [grip],
    loads: {},
    days: request.days,
    start: request.start,
    minStart: today,
    endMode: "weeks",
    weeks: DEFAULT_WEEKS,
    last: addDays(request.start, DEFAULT_WEEKS * 7 - 1),
    targetRpe: null,
    blockId: request.blockId ?? null,
  };
}

export type Planner = {
  isEdit: boolean;
  draft: PlannerDraft;
  workout: Workout | undefined;
  block: TrainingBlock | undefined;
  end: CalendarDate | null;
  summary: string;
  ready: boolean;
  shaded: (d: CalendarDate) => boolean;
  update: (patch: Partial<PlannerDraft>) => void;
  pickWorkout: (w: Workout) => void;
  toggleGrip: (id: string) => void;
  toggleDay: (day: Weekday) => void;
  setLoad: (gripId: string, kg: number) => void;
  loadFor: (gripId: string) => number;
  save: () => void;
  remove: () => void;
};

/** The Plan a block / Edit schedule sheet's state, and what saving it writes. */
export function usePlanner(request: PlannerRequest, onDone: () => void): Planner {
  const { model, actions, today } = useHangData();
  const prompt = useReminderPrompt();
  const [draft, setDraft] = React.useState(() =>
    draftFor(request, today, (id) => {
      const w = model.workout(id);
      return w === undefined ? null : model.defaultGrip(w);
    })
  );
  const isEdit = request.mode === "edit";
  const workout =
    draft.workoutId === null || draft.picking ? undefined : model.workout(draft.workoutId);
  const block = useBlocks().find((b) => b.id === draft.blockId);
  const start = block?.start ?? draft.start;
  const end = block === undefined ? endOf(draft.start, endChoice(draft)) : blockEnd(block);
  const span = { start, end, days: draft.days, skip: [] };
  const dates = workout !== undefined && (end === null || end > start) ? occurrences(span) : [];
  const update = (patch: Partial<PlannerDraft>): void => setDraft((d) => ({ ...d, ...patch }));
  const loadFor = (gripId: string): number =>
    workout === undefined
      ? 0
      : (draft.loads[loadKey(workout.id, gripId)] ?? model.load(workout, gripId));

  const save = (): void => {
    if (workout === undefined || draft.grips.length === 0 || dates.length === 0) return;
    const fields = {
      workoutId: workout.id,
      days: draft.days,
      start,
      end,
      targetRpe: draft.targetRpe,
      blockId: draft.blockId,
    };
    const schedules: Schedule[] =
      request.mode === "edit"
        ? [{ ...request.schedule, ...fields, gripId: draft.grips[0] ?? request.schedule.gripId }]
        : draft.grips.map((gripId) => ({ id: randomUUID(), gripId, skip: [], ...fields }));
    if (Object.keys(draft.loads).length > 0) void actions.setLoads(draft.loads);
    void actions.saveSchedules(schedules);
    onDone();
    if (!isEdit) prompt();
  };

  return {
    isEdit,
    draft,
    workout,
    block,
    end,
    summary: plannerSummary({
      workout,
      grips: draft.grips.length,
      days: draft.days,
      dates,
      ongoing: end === null,
    }),
    ready: workout !== undefined && draft.grips.length > 0 && dates.length > 0,
    shaded: (d) => occursOn(span, d),
    update,
    pickWorkout: (w) =>
      update({
        workoutId: w.id,
        picking: false,
        grips:
          w.id === draft.workoutId && draft.grips.length > 0 ? draft.grips : [model.defaultGrip(w)],
      }),
    toggleGrip: (id) =>
      update({
        grips: isEdit
          ? [id]
          : draft.grips.includes(id)
            ? draft.grips.filter((g) => g !== id)
            : [...draft.grips, id],
      }),
    toggleDay: (day) =>
      update({
        days: draft.days.includes(day)
          ? draft.days.filter((d) => d !== day)
          : [...draft.days, day].sort(),
      }),
    setLoad: (gripId, kg) => {
      if (workout !== undefined)
        update({ loads: { ...draft.loads, [loadKey(workout.id, gripId)]: kg } });
    },
    loadFor,
    save,
    remove: () => {
      if (request.mode === "edit") void actions.deleteSchedule(request.schedule.id);
      onDone();
    },
  };
}
