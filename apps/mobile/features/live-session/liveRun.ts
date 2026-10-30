import type { Href } from "expo-router";
import React from "react";
import { currentPhase, type HangSetup, type ItemDone, type Run } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseName } from "@sendtally/features/workouts";
import { exerciseTallyStorage } from "../../lib/exerciseTallyStorage";
import { liveRunStorage } from "../../lib/liveRunStorage";
import { phaseLabel } from "../training/timer/timerText";

/** Where a player is: the timer's run, or the sets and items ticked so far. */
export type RunState =
  | { player: "timer"; run: Run; setups?: HangSetup[]; laps?: boolean }
  | { player: "sets"; done: ItemDone[]; ticked: string[] }
  | { player: "checklist"; ticked: number[]; count: number };

const PLAYERS = [
  "/workout/timer",
  "/workout/intervals",
  "/workout/sets",
  "/workout/checklist",
] as const;

export type PlayerPath = (typeof PLAYERS)[number];

/** The one workout running in a player, and the route that opens it again. */
export type LiveRun = {
  title: string;
  workoutId: string | null;
  pathname: PlayerPath;
  params: Record<string, string>;
  startedAt: number;
  state: RunState;
};

export function parseLiveRun(raw: string | null): LiveRun | null {
  if (raw === null) return null;
  try {
    const run: unknown = JSON.parse(raw);
    if (typeof run !== "object" || run === null) return null;
    const { title, pathname, params, startedAt, state } = run as Partial<LiveRun>;
    const valid =
      typeof title === "string" &&
      PLAYERS.some((p) => p === pathname) &&
      typeof params === "object" &&
      typeof startedAt === "number" &&
      typeof state?.player === "string";
    return valid ? (run as LiveRun) : null;
  } catch {
    return null;
  }
}

export const readLiveRun = (): LiveRun | null => parseLiveRun(liveRunStorage.read());

export function writeLiveRun(run: LiveRun): void {
  liveRunStorage.write(JSON.stringify(run));
}

/** The stored run of the player at `pathname` for this workout, to pick up where it was. */
export function resumedRun(pathname: PlayerPath, workoutId: string | null): LiveRun | null {
  const run = readLiveRun();
  return run?.pathname === pathname && run.workoutId === workoutId ? run : null;
}

/** The run is over, saved or thrown away: it leaves the bar, and its climbing tally goes too. */
export function clearLiveRun(): void {
  liveRunStorage.remove();
  exerciseTallyStorage.remove();
}

export function useLiveRun(): LiveRun | null {
  const raw = React.useSyncExternalStore(liveRunStorage.subscribe, liveRunStorage.read);
  return React.useMemo(() => parseLiveRun(raw), [raw]);
}

/** Opens the run again; `end` ends it on the way, straight to its review. */
export function liveRunHref(run: LiveRun, end = false): Href {
  return {
    pathname: run.pathname,
    params: end ? { ...run.params, end: "1" } : run.params,
  };
}

/** Where the run is, for the live bar: "Set 2 of 5 · Hang", "Ring row · Set 1 of 3", "2 of 5 done". */
export function liveRunSummary({ state }: LiveRun): string {
  if (state.player === "timer") {
    const { set } = currentPhase(state.run);
    const sets = { set, sets: state.run.sets };
    const where = state.laps === true ? t("tally.lapOf", sets) : t("hang.setOf", sets);
    return `${where} · ${phaseLabel(state.run, state.laps === true)}`;
  }
  if (state.player === "checklist")
    return t("plan.doneOf", { done: state.ticked.length, planned: state.count });
  for (const d of state.done) {
    const set = d.sets.findIndex((_, s) => !state.ticked.includes(`${d.item}:${s}`));
    if (set !== -1)
      return `${exerciseName(d.exercise)} · ${t("hang.setOf", { set: set + 1, sets: d.sets.length })}`;
  }
  return t("tally.allSetsDone");
}
