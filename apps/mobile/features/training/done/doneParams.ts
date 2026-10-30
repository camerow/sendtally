import type { Href } from "expo-router";
import type { HangSetup, ItemDone, PlanLink } from "@sendtally/core/hang";
import { readPlanLink, readSession } from "../data/planLinkParams";
import { timerParams } from "../timer/startWorkout";

/** What the timer saw: every set at what it held, those it never held off, and each item's setup. */
export type TimerRun = { done: ItemDone[]; off: string[]; setups: HangSetup[]; startedAt: number };

export type DoneParams = {
  workoutId: string;
  gripId: string;
  link: PlanLink;
  /** How many sessions of the workout came before this one. */
  session: number;
  /** Null when it is logged without the timer, every set as planned. */
  run: TimerRun | null;
};

type RawParams = Partial<Record<string, string | string[]>>;

/** A hangboard workout's review, carried in its route params. */
export function donePath({ workoutId, gripId, link, session, run }: DoneParams): Href {
  return {
    pathname: "/workout/done",
    params: {
      ...timerParams(workoutId, gripId, session, link),
      ...(run === null ? {} : { run: JSON.stringify(run) }),
    },
  };
}

const str = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

function parseRun(text: string): TimerRun | null {
  try {
    const run: unknown = JSON.parse(text);
    if (typeof run !== "object" || run === null) return null;
    const { done, off, setups, startedAt } = run as Partial<TimerRun>;
    const valid =
      Array.isArray(done) &&
      Array.isArray(off) &&
      Array.isArray(setups) &&
      typeof startedAt === "number";
    return valid ? (run as TimerRun) : null;
  } catch {
    return null;
  }
}

export function readDoneParams(p: RawParams): DoneParams {
  return {
    workoutId: str(p.workoutId),
    gripId: str(p.gripId),
    link: readPlanLink(p),
    session: readSession(p),
    run: str(p.run) === "" ? null : parseRun(str(p.run)),
  };
}
