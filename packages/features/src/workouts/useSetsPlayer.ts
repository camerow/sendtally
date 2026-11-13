import React from "react";
import { doneAsPrescribed, type ItemDone, type SetDone } from "@sendtally/core/hang";
import type { Activity, Exercise } from "@sendtally/api-client";
import { lapPlanOf } from "../activities/climbing";
import { changeSet, previousSets } from "../activities/done";
import { tallyMeasuresOf } from "../exercises/measure";
import type { TallyMeasure } from "../exercises/types";
import { eachSideOf } from "../exercises/sides";
import { lapSets } from "../log-session/exerciseLaps";
import { exerciseSets, startExercise } from "../log-session/exerciseTally";
import type { LiveSession } from "../log-session/useLiveSession";
import type { Hold } from "./holdClock";
import { exerciseName } from "./library";
import type { LiveRunStore } from "./liveRun";
import { runParams, type WorkoutRun } from "./runParams";
import {
  allSets,
  isLifting,
  itemDone,
  restAfterTick,
  setKey,
  withPrevious,
  type SetAt,
} from "./setsRun";
import { useHold, useRest, type HoldClock, type RestClock } from "./useLiveRun";

export type SetsPlayerInputs = {
  run: WorkoutRun;
  store: LiveRunStore;
  /** The workout tally, where a climbing item's climbs are logged. */
  tally: LiveSession;
  /** Logged activities, for last time's sets; null until they load. */
  activities: readonly Pick<Activity, "workoutId" | "done">[] | null;
  /** The exercise library, for which items log on the tally and which go each side; null until it loads. */
  exercises: readonly Pick<Exercise, "name" | "kind" | "measure" | "eachSide">[] | null;
};

export type SetsPlayer = {
  startedAt: number;
  /** What each item has done so far, last time's sets filled in where nothing was typed. */
  shown: ItemDone[];
  ticked: ReadonlySet<string>;
  /** The first set not ticked yet, the one a hold can start on. */
  current: SetAt | null;
  rest: RestClock;
  hold: HoldClock;
  tallyOf: (item: number) => TallyMeasure | null;
  previous: (exercise: string) => SetDone[];
  lifting: (item: number) => boolean;
  nameOf: (item: number) => string;
  sided: (exercise: string) => boolean;
  /** A finished card folds until it is opened again. */
  folded: (item: number) => boolean;
  open: (item: number) => void;
  toggle: (at: SetAt) => void;
  change: (item: number, set: number, value: SetDone) => void;
  /** Ends the hold, recording what it counted on its set, which ticks itself. */
  endHold: (h: Hold, seconds: number | null) => void;
  /** The sets a climbing item logged on the tally. */
  climbedSets: (item: number) => SetDone[];
  /** Puts a climbing item on the tally; the caller then opens it. */
  startClimbing: (item: number, measure: TallyMeasure) => void;
  /** What the run did, and the sets it left unticked, for its review. */
  finished: () => { done: ItemDone[]; off: string[] };
  /** Whether what it needs to finish has loaded. */
  loaded: boolean;
};

/**
 * A lifting workout as a set table on a clock from Start: tick each set as it is done, rest in
 * line after it, hold timed sets in their row. A climbing item logs on the workout tally and its
 * climbs come back as its sets. Kept in `store` so the run outlasts the page.
 */
export function useSetsPlayer({
  run,
  store,
  tally,
  activities,
  exercises,
}: SetsPlayerInputs): SetsPlayer {
  const [resumed] = React.useState(() => {
    const live = store.resumed("/workout/sets", run.workoutId);
    return live?.state.player === "sets" ? { ...live.state, startedAt: live.startedAt } : null;
  });
  const climbs = tally.stored?.draft.climbs ?? [];
  const [startedAt] = React.useState(() => resumed?.startedAt ?? Date.now());
  const [done, setDone] = React.useState<ItemDone[]>(
    () => resumed?.done ?? doneAsPrescribed(run.items)
  );
  const [ticked, setTicked] = React.useState<ReadonlySet<string>>(() => new Set(resumed?.ticked));
  const [opened, setOpened] = React.useState<ReadonlySet<number>>(new Set());
  const rest = useRest(store);
  React.useEffect(() => {
    store.write({
      title: run.title,
      workoutId: run.workoutId,
      pathname: "/workout/sets",
      params: runParams(run),
      startedAt,
      state: { player: "sets", done, ticked: [...ticked] },
    });
  }, [store, run, startedAt, done, ticked]);
  const tallyMeasure = tallyMeasuresOf(exercises ?? [], run.kind);
  const tallyOf = (item: number): TallyMeasure | null =>
    tallyMeasure(run.items[item]?.exercise ?? "");
  const sets = allSets(run.items).filter((at) => tallyOf(at.item) === null);
  const previous = (exercise: string): SetDone[] =>
    activities === null || run.workoutId === null
      ? []
      : previousSets(activities, run.workoutId, exercise);
  const lifting = (item: number): boolean => isLifting(run.kind, run.items[item]);
  const shown = withPrevious(done, lifting, previous);
  const current = sets.find((at) => !ticked.has(setKey(at))) ?? null;
  const nameOf = (item: number): string => exerciseName(run.items[item]?.exercise ?? "");

  const toggle = (at: SetAt): void => {
    const key = setKey(at);
    const next = new Set(ticked);
    const ticking = !next.delete(key);
    if (ticking) next.add(key);
    setTicked(next);
    setOpened((was) => new Set([...was].filter((i) => i !== at.item)));
    const after = ticking ? restAfterTick(run.items, next, at, run.exerciseRestS) : null;
    if (after === null) rest.skip();
    else rest.tick(after.at, after.seconds, after.next === null ? undefined : nameOf(after.next));
  };
  const change = (item: number, set: number, value: SetDone): void =>
    setDone((all) => changeSet(all, item, set, value));
  const endHold = (h: Hold, seconds: number | null): void => {
    store.writeHold(null);
    const at = sets.find((x) => setKey(x) === h.at);
    const set = at === undefined ? undefined : shown[at.item]?.sets[at.set];
    if (at === undefined || set === undefined || seconds === null) return;
    change(at.item, at.set, { ...set, onS: seconds });
    if (!ticked.has(h.at)) toggle(at);
  };
  const hold = useHold(store, (h) => endHold(h, h.targetS));
  const climbedSets = (item: number): SetDone[] =>
    tallyOf(item) === "laps"
      ? lapSets(climbs, item)
      : exerciseSets(
          climbs,
          item,
          tallyOf(item) === "wallTime" ? run.items[item]?.dose.onS : undefined
        );

  return {
    startedAt,
    shown,
    ticked,
    current,
    rest,
    hold,
    tallyOf,
    previous,
    lifting,
    nameOf,
    sided: eachSideOf(exercises ?? []),
    folded: (item) => itemDone(run.items, ticked, item) && !opened.has(item),
    open: (item) => setOpened((was) => new Set([...was, item])),
    toggle,
    change,
    endHold,
    climbedSets,
    startClimbing: (item, measure) => {
      const at = run.items[item];
      if (at === undefined) return;
      if (tally.stored?.draft.exercise?.item !== item)
        tally.replace(
          startExercise(
            tally.stored?.draft ?? null,
            {
              item,
              name: nameOf(item),
              sets: at.dose.sets,
              ...(measure === "climbs" && at.dose.reps !== undefined
                ? { climbs: at.dose.reps }
                : {}),
              ...(measure === "wallTime" ? { onS: at.dose.onS ?? 0 } : {}),
              ...(measure === "laps" ? { lap: lapPlanOf(at.dose) } : {}),
              restS: at.dose.setRestS ?? 0,
            },
            new Date()
          )
        );
      rest.skip();
    },
    finished: () => {
      rest.skip();
      hold.stop();
      return {
        done: shown.map((d) =>
          tallyOf(d.item) === null ? d : { ...d, sets: climbedSets(d.item) }
        ),
        off: sets.map(setKey).filter((key) => !ticked.has(key)),
      };
    },
    loaded: activities !== null && exercises !== null,
  };
}
