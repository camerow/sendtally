import { currentPhase, type HangSetup, type ItemDone, type Run } from "@sendtally/core/hang";
import { builtInGripName } from "../hang/names";
import { phaseLabel } from "../hang/timerText";
import { t } from "../i18n";
import { exerciseName } from "./library";
import type { FingersPart } from "./fingersPart";
import type { SetLoads } from "./timerView";
import { COUNT_IN_S, SWITCH_S, type Hold } from "./holdClock";
import type { Rest } from "./restCountdown";
import type { RunCards } from "./runCards";
import { readWorkoutRun } from "./runParams";

/** Where a player is: the timer's run, or the sets and items ticked so far. */
export type RunState =
  | { player: "timer"; run: Run; setups?: HangSetup[]; loads?: SetLoads }
  | {
      player: "sets";
      done: ItemDone[];
      ticked: string[];
      cards?: RunCards;
      /** The hang timer on a grip, and the grips' places in `done`. */
      fingers?: FingersPart;
      grips?: number[];
      /** Each grip's edge and load as its timer last set them, by its place in `done`. */
      gripSetups?: Record<string, HangSetup>;
      /** A climbing card's sets climbed so far, which its rows end on their own, by set key. */
      climbed?: string[];
    }
  | { player: "checklist"; ticked: number[]; count: number };

/** Each player by the path mobile opens it at; the web prefixes its own. */
export const PLAYERS = [
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
  /** When a set or line was last ticked, where the review ends a run left open. */
  lastTickAt?: number;
  state: RunState;
  /** The rest counting down between sets or items, kept while the player is minimised. */
  rest?: Rest;
  /** The timed set or line running in its row; never at once with a rest. */
  hold?: Hold;
};

/** Where a platform keeps the live run, one per signed-in user. */
export type RunStorage = {
  read: () => string | null;
  write: (value: string) => unknown;
  remove: () => void;
  subscribe: (listener: () => void) => () => void;
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
    if (!valid) return null;
    const { lastTickAt, ...rest } = run as LiveRun;
    return Number.isFinite(lastTickAt) ? { ...rest, lastTickAt } : rest;
  } catch {
    return null;
  }
}

export type LiveRunStore = {
  storage: RunStorage;
  read: () => LiveRun | null;
  /** Saves where a player is, keeping the rest or hold it has running. */
  write: (run: LiveRun) => void;
  /** Saves the run exactly as given, its rest and hold included. */
  writeAsIs: (run: LiveRun) => void;
  /** Starts, changes or ends the live run's rest. */
  writeRest: (rest: Rest | null) => void;
  /** Starts, pauses or ends the live run's hold. */
  writeHold: (hold: Hold | null) => void;
  /** The stored run of the player at `pathname` for this workout, to pick up where it was. */
  resumed: (pathname: PlayerPath, workoutId: string | null) => LiveRun | null;
  /** The run is over, saved or thrown away: it leaves the bar, and its climbing tally goes too. */
  clear: () => void;
};

/** The live run kept in `storage`; `tally` is the workout tally's own store, cleared with it. */
export function liveRunStore(storage: RunStorage, tally: { remove: () => void }): LiveRunStore {
  const read = (): LiveRun | null => parseLiveRun(storage.read());
  const resumed = (pathname: PlayerPath, workoutId: string | null): LiveRun | null => {
    const run = read();
    return run?.pathname === pathname && run.workoutId === workoutId ? run : null;
  };
  return {
    storage,
    read,
    resumed,
    write: (run) => {
      const { rest, hold } = resumed(run.pathname, run.workoutId) ?? {};
      storage.write(
        JSON.stringify({
          ...run,
          ...(rest !== undefined && { rest }),
          ...(hold !== undefined && { hold }),
        })
      );
    },
    writeAsIs: (run) => storage.write(JSON.stringify(run)),
    writeRest: (rest) => {
      const live = read();
      if (live === null) return;
      const { rest: _, ...run } = live;
      storage.write(JSON.stringify(rest === null ? run : { ...run, rest }));
    },
    writeHold: (hold) => {
      const live = read();
      if (live === null) return;
      const { hold: _, ...run } = live;
      storage.write(JSON.stringify(hold === null ? run : { ...run, hold }));
    },
    clear: () => {
      storage.remove();
      tally.remove();
    },
  };
}

/**
 * Where the run is, for the live bar: "Set 2 of 5 · Hang", "Ring row · Set 1 of 3", a checklist's
 * next open line, "2 of 5 done".
 */
export function liveRunSummary(run: LiveRun): string {
  const { name, where } = liveRunWhere(run);
  return name === null ? where : `${name} · ${where}`;
}

/** The same, split so a bar can shorten the exercise's name and keep "Set 2 of 3" whole. */
export function liveRunWhere({ state, params }: LiveRun): { name: string | null; where: string } {
  if (state.player === "timer") {
    const { set } = currentPhase(state.run);
    const sets = { set, sets: state.run.sets };
    return { name: null, where: `${t("hang.setOf", sets)} · ${phaseLabel(state.run)}` };
  }
  if (state.player === "checklist")
    return {
      name: null,
      where: t("plan.doneOf", { done: state.ticked.length, planned: state.count }),
    };
  if (
    state.fingers !== undefined &&
    "run" in state.fingers &&
    state.fingers.run.finished === null
  ) {
    const { set } = currentPhase(state.fingers.run);
    const { at } = state.fingers;
    const row = at === undefined ? undefined : state.done.find((d) => d.item === at.item);
    if (at === undefined || row === undefined)
      return {
        name: t("workouts.fingerboard"),
        where: t("hang.setOf", { set, sets: state.fingers.run.sets }),
      };
    return {
      name: builtInGripName(row.exercise),
      where: t("hang.setOf", { set: at.set + set, sets: row.sets.length }),
    };
  }
  const order = state.cards?.order ?? state.done.map((d) => d.item);
  const grips = state.grips ?? [];
  const over = [...state.ticked, ...(state.climbed ?? [])];
  const lines = readWorkoutRun(params)?.items;
  for (const d of order.flatMap((key) => state.done.filter((x) => x.item === key))) {
    const set = d.sets.findIndex((_, s) => !over.includes(`${d.item}:${s}`));
    const line = set === -1 ? undefined : lines?.[d.item]?.checklist?.lines[set];
    if (line !== undefined) return { name: null, where: line };
    if (set !== -1)
      return {
        name: grips.includes(d.item) ? builtInGripName(d.exercise) : exerciseName(d.exercise),
        where: t("hang.setOf", { set: set + 1, sets: d.sets.length }),
      };
  }
  return { name: null, where: t("tally.allSetsDone") };
}

export type HoldCue = { at: number; sound: "tick" | "work" | "rest" };

/** A tick each second of the count-in, a tone as each side starts and as it ends. */
export function holdCues(h: Pick<Hold, "zeroAt" | "targetS" | "sides">): HoldCue[] {
  const s = (n: number): number => h.zeroAt + n * 1000;
  const count = Array.from({ length: COUNT_IN_S }, (_, i) => ({
    at: s(i - COUNT_IN_S),
    sound: "tick" as const,
  }));
  const right = h.targetS + SWITCH_S;
  return [
    ...count,
    { at: s(0), sound: "work" },
    ...(h.sides
      ? [
          { at: s(h.targetS), sound: "rest" as const },
          { at: s(right), sound: "work" as const },
          { at: s(right + h.targetS), sound: "rest" as const },
        ]
      : [{ at: s(h.targetS), sound: "rest" as const }]),
  ];
}

/** Whole seconds a run has been going at `now`, from its Start. */
export const runElapsedSeconds = (startedAt: number, now: Date): number =>
  Math.max(0, Math.floor((now.getTime() - startedAt) / 1000));
