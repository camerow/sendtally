import type { Plan } from "@sendtally/api-client";
import {
  addDays,
  blockWeekOn,
  byDate,
  gripSeries,
  newBestBy,
  setupOf,
  type Block,
  type CalendarDate,
} from "@sendtally/core/hang";
import { setChange, type SetChange } from "../activities/summary";
import { t } from "../i18n";
import { exerciseSeries } from "../statistics/exercises";
import {
  itemEffort,
  loggedKind,
  trainingDay,
  type LoggedItem,
  type TrainingDay,
  type TrainingLog,
} from "./days";
import { blockMembers } from "./blocks";
import type { Occurrence } from "./plan";

export type DoneCount = { done: number; planned: number };

/** One block week: its sessions done of planned, and the average effort of those done. */
export type BlockWeek = DoneCount & { week: number; effort: number | null };

/**
 * One workout of the block: its sessions done of planned, and how its lead exercise moved, or
 * for a hangboard workout its completed load on its grip and setup, and whether it set a best.
 */
export type BlockWorkout = DoneCount & {
  membershipId: string;
  workoutId: string;
  change: SetChange | null;
  best: boolean;
};

export type BlockRecap = DoneCount & {
  block: Block;
  missed: number;
  /** Sessions up to and including today, done of planned. */
  soFar: DoneCount;
  effort: number | null;
  weeks: BlockWeek[];
  workouts: BlockWorkout[];
};

const membershipOf = (item: LoggedItem): string | null =>
  item.kind === "climb"
    ? item.session.membership_id
    : item.kind === "hang"
      ? item.session.membershipId
      : item.activity.membershipId;

/** The session that did a plan: logged against it, else logged on its own as its kind. */
const doneBy = (day: TrainingDay, o: Occurrence): LoggedItem | undefined =>
  day.logged.find((i) => membershipOf(i) === o.membership.id) ??
  day.logged.find((i) => membershipOf(i) === null && loggedKind(i) === o.workout?.kind);

const average = (values: readonly number[]): number | null =>
  values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;

type Ran = { o: Occurrence; effort: number | null };

const count = (ran: readonly Ran[]): DoneCount => ({
  done: ran.filter((r) => r.o.status === "done").length,
  planned: ran.length,
});

const effortOf = (ran: readonly Ran[]): number | null =>
  average(ran.flatMap((r) => (r.effort === null ? [] : [r.effort])));

/** How the lead exercise's best set moved from the first session of the plan to the last. */
function progress(log: TrainingLog, membershipId: string): SetChange | null {
  const [lead] = exerciseSeries(log.activities.filter((a) => a.membershipId === membershipId));
  const first = lead?.sessions[0];
  const last = lead?.sessions.at(-1);
  if (lead === undefined || first === undefined || last === undefined || first === last)
    return null;
  return setChange(last.best, first.best, lead.metric);
}

/** How a hangboard plan's completed load moved on its latest grip and setup, and if it set a best. */
function hangProgress(
  log: TrainingLog,
  membershipId: string
): { change: SetChange | null; best: boolean } {
  const ran = log.hangs.filter((h) => h.membershipId === membershipId).sort(byDate);
  const latest = ran.at(-1);
  if (latest === undefined) return { change: null, best: false };
  const done = gripSeries(ran, latest.gripId, setupOf(latest)).filter((h) => h.pct >= 100);
  const first = done[0];
  const last = done.at(-1);
  return {
    change:
      first === undefined || last === undefined || first === last
        ? null
        : { metric: "load", by: last.loadKg - first.loadKg },
    best: ran.some((h) => newBestBy(log.hangs, h) !== null),
  };
}

/** A block's sessions week by week and workout by workout, with the effort of those done. */
export function blockRecap(log: TrainingLog, block: Block, today: CalendarDate): BlockRecap {
  const ran = Array.from({ length: block.weeks * 7 }, (_, i) =>
    trainingDay(log, addDays(block.start, i), today)
  ).flatMap((day) =>
    day.plans
      .filter((o) => o.membership.blockId === block.id)
      .map((o): Ran => {
        const by = o.status === "done" ? doneBy(day, o) : undefined;
        return { o, effort: by === undefined ? null : itemEffort(by) };
      })
  );
  return {
    block,
    ...count(ran),
    missed: ran.filter((r) => r.o.status === "missed").length,
    soFar: count(ran.filter((r) => r.o.date <= today)),
    effort: effortOf(ran),
    weeks: Array.from({ length: block.weeks }, (_, i) => {
      const week = ran.filter((r) => r.o.week === i + 1);
      return { week: i + 1, ...count(week), effort: effortOf(week) };
    }),
    workouts: blockMembers(log.plan, block).map((m) => {
      const hang = hangProgress(log, m.id);
      return {
        membershipId: m.id,
        workoutId: m.workoutId,
        ...count(ran.filter((r) => r.o.membership.id === m.id)),
        change: hang.change ?? progress(log, m.id),
        best: hang.best,
      };
    }),
  };
}

/** How many of the block's planned sessions were done, over all its days. */
export function blockDone(log: TrainingLog, block: Block, today: CalendarDate): DoneCount {
  const { done, planned } = blockRecap(log, block, today);
  return { done, planned };
}

/** "Winter base · W4" for a session logged from one of a block's workouts; null otherwise. */
export function blockTagOf(
  plan: Pick<Plan, "blocks" | "memberships">,
  membershipId: string | null,
  date: CalendarDate
): string | null {
  const m = plan.memberships.find((x) => x.id === membershipId);
  const block = plan.blocks.find((b) => b.id === m?.blockId);
  if (block === undefined) return null;
  const week = blockWeekOn(block, date);
  return week === null ? block.name : `${block.name} · ${t("plan.weekShort", { n: week })}`;
}
