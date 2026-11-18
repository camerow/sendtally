import React from "react";
import {
  doneAsPrescribed,
  setOf,
  type ItemDone,
  type SessionItem,
  type SetDone,
} from "@sendtally/core/hang";
import type { Activity, Exercise } from "@sendtally/api-client";
import {
  climbingLastTime,
  climbsLine,
  lapPlanOf,
  lapsLine,
  wallLine,
} from "../activities/climbing";
import { addSet, changeSet, previousSets } from "../activities/done";
import { tallyMeasuresOf } from "../exercises/measure";
import type { TallyMeasure } from "../exercises/types";
import { eachSideOf } from "../exercises/sides";
import { lapSets } from "../log-session/exerciseLaps";
import { exerciseSets, startExercise } from "../log-session/exerciseTally";
import type { LiveSession } from "../log-session/useLiveSession";
import { partPlaces, partPlanned, type FingersPart } from "./fingersPart";
import type { Hold } from "./holdClock";
import { exerciseName } from "./library";
import type { LiveRunStore } from "./liveRun";
import { newDoseFor } from "./doseFields";
import { runParams, type WorkoutRun } from "./runParams";
import {
  cardsFrom,
  finishedInOrder,
  withCardAdded,
  withCardEnded,
  withCardFold,
  withCardMoved,
  withCardRemoved,
  withCardSkipped,
  withoutSet,
  withSetBack,
  type RunCards,
} from "./runCards";
import type { Picked } from "./types";
import { useLatest } from "./useLatest";
import {
  allSets,
  isLifting,
  itemDone,
  restAfterTick,
  setKey,
  withDoneSets,
  withPrevious,
  type SetAt,
} from "./setsRun";
import { useHold, useLiveRun, useRest, type HoldClock, type RestClock } from "./useLiveRun";
import type { PlannedRun } from "./usePlannedRun";

/** A set just removed, which Undo puts back. */
export type RemovedSet = { exercise: string; set: number };

export type SetsPlayerInputs = {
  run: WorkoutRun;
  store: LiveRunStore;
  /** The workout tally, where a climbing item's climbs are logged. */
  tally: LiveSession;
  /** Logged activities, for last time's sets; null until they load. */
  activities: readonly Pick<Activity, "workoutId" | "done">[] | null;
  /** The exercise library, for which items log on the tally and which go each side; null until it loads. */
  exercises: readonly Pick<Exercise, "name" | "kind" | "measure" | "eachSide">[] | null;
  /** Which items name grips: together they are the run's fingerboard part. */
  isGrip: (exercise: string) => boolean;
};

/** A mix's fingerboard part in the player: where it sits, what its timer runs, and where it is. */
export type PartInPlayer = {
  /** Its grips' places in the run, the first where its card sits. */
  places: number[];
  planned: PlannedRun;
  /** None until its timer starts. */
  state: FingersPart | undefined;
  /** Where it is now: the timer's run while it has it, or its rows once edited. */
  change: (next: FingersPart) => void;
};

export type ClimbingItem = {
  measure: TallyMeasure;
  /** "Last time: 16 climbs · 13 sent · top V4", when there was one. */
  lastTime: string | null;
  /** What this run logged on it so far, once it has. */
  logged: string | null;
  /** Its tally is still running, minimised. */
  live: boolean;
};

export type SetsPlayer = {
  startedAt: number;
  /** What each item has done so far, last time's sets filled in where nothing was typed. */
  shown: ItemDone[];
  ticked: ReadonlySet<string>;
  /** The set last tapped, ticked or edited, else the first not ticked yet. */
  current: SetAt | null;
  /** The cards in the order they run, each keyed by its item. */
  order: readonly number[];
  /** Every item the run has by key: the workout's, then any added during it. */
  items: readonly SessionItem[];
  /** "Exercise 2 of 3": where the current set's card sits, of how many. */
  position: { at: number; of: number } | null;
  rest: RestClock;
  hold: HoldClock;
  tallyOf: (item: number) => TallyMeasure | null;
  /** A climbing item's card: how it is measured, last time, what this run logged, and whether its tally is live. */
  climbing: (item: number) => ClimbingItem | null;
  /** What a set asks: a lifting set takes last time's weight where the workout sets none. */
  target: (at: SetAt) => SetDone;
  /** The seconds a hold would run for, when the set is the current one, timed, and nothing holds yet. */
  holdTarget: (at: SetAt) => number | null;
  startHold: (at: SetAt) => void;
  previous: (exercise: string) => SetDone[];
  lifting: (item: number) => boolean;
  nameOf: (item: number) => string;
  sided: (exercise: string) => boolean;
  /** A finished card folds until it is opened again; an open one folds from its title. */
  folded: (item: number) => boolean;
  /** Skipped for now, at the end until it is opened. */
  skipped: (item: number) => boolean;
  /** One more set like the last. */
  addSet: (item: number) => void;
  /** Takes a set out; Undo puts it back. */
  removeSet: (at: SetAt) => void;
  removed: RemovedSet | null;
  undoRemove: () => void;
  /** The Undo for the set last removed has gone. */
  dismissRemoved: () => void;
  open: (item: number) => void;
  fold: (item: number) => void;
  /** Marks a set as the one being worked on, for its fill and its −. */
  focus: (at: SetAt) => void;
  skip: (item: number) => void;
  move: (item: number, by: -1 | 1) => void;
  remove: (item: number) => void;
  /** An exercise added to this run only, at the end, with the dose the editor would give it. */
  addExercise: (picked: Picked) => void;
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
  /** Its fingerboard part, when it has grips. */
  part: PartInPlayer | null;
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
  isGrip,
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
  const [cards, setCards] = React.useState<RunCards>(() =>
    cardsFrom(resumed?.cards, run.items.length)
  );
  const [focused, setFocused] = React.useState<SetAt | null>(null);
  const [removed, setRemoved] = React.useState<
    (RemovedSet & { at: SetAt; value: SetDone; wasTicked: boolean }) | null
  >(null);
  const lastRemoved = useLatest(removed);
  const latest = useLatest({ done, ticked });
  const rest = useRest(store);
  // Kept by value: grips load after the run opens, and a new list each render would write each render.
  const placesKey = partPlaces(run.items, isGrip).join(",");
  const places = React.useMemo(
    () => (placesKey === "" ? [] : placesKey.split(",").map(Number)),
    [placesKey]
  );
  const stored = useLiveRun(store);
  const fingers =
    stored?.pathname === "/workout/sets" &&
    stored.workoutId === run.workoutId &&
    stored.state.player === "sets"
      ? stored.state.fingers
      : undefined;
  React.useEffect(() => {
    // The part is the timer's while it runs, so this keeps whatever the store holds of it.
    const live = store.resumed("/workout/sets", run.workoutId)?.state;
    const part = live?.player === "sets" ? live.fingers : undefined;
    store.write({
      title: run.title,
      workoutId: run.workoutId,
      pathname: "/workout/sets",
      params: runParams(run),
      startedAt,
      state: {
        player: "sets",
        done,
        ticked: [...ticked],
        cards,
        ...(part && { fingers: part }),
        ...(places.length > 0 && { grips: places }),
      },
    });
  }, [store, run, startedAt, done, ticked, cards, places]);
  const planned = partPlanned(run, places);
  const inPart = (item: number): boolean => places.includes(item);
  const items = [...run.items.slice(0, cards.base), ...cards.added];
  const tallyMeasure = tallyMeasuresOf(exercises ?? [], run.kind);
  const tallyOf = (item: number): TallyMeasure | null => tallyMeasure(items[item]?.exercise ?? "");
  const live = withDoneSets(items, done);
  const ended = (d: readonly ItemDone[], t: ReadonlySet<string>, item: number): boolean => {
    const after = withDoneSets(items, d);
    return (after[item]?.dose.sets ?? 0) > 0 && itemDone(after, t, item);
  };
  const sets = cards.order.flatMap((key) =>
    allSets(live).filter((at) => at.item === key && tallyOf(key) === null && !inPart(key))
  );
  const previous = (exercise: string): SetDone[] =>
    activities === null || run.workoutId === null
      ? []
      : previousSets(activities, run.workoutId, exercise);
  const lifting = (item: number): boolean => isLifting(run.kind, items[item]);
  const shown = withPrevious(done, lifting, previous);
  const next = sets.find((at) => !ticked.has(setKey(at))) ?? null;
  const current = sets.find((at) => at.item === focused?.item && at.set === focused.set) ?? next;
  const nameOf = (item: number): string => exerciseName(items[item]?.exercise ?? "");
  const withFold = (item: number, fold: boolean | null): void =>
    setCards((c) => withCardFold(c, item, fold));

  const toggle = (at: SetAt): void => {
    const key = setKey(at);
    const after = new Set(ticked);
    const ticking = !after.delete(key);
    if (ticking) after.add(key);
    setTicked(after);
    const finished = sets.every((s) => s.item !== at.item || after.has(setKey(s)));
    setFocused(ticking && finished ? null : at);
    setCards((c) => withCardEnded(withCardFold(c, at.item, null), at.item, finished));
    const restAfter = ticking ? restAfterTick(live, after, at, run.exerciseRestS) : null;
    if (restAfter === null) rest.skip();
    else
      rest.tick(
        restAfter.at,
        restAfter.seconds,
        restAfter.next === null ? undefined : nameOf(restAfter.next)
      );
  };
  const change = (item: number, set: number, value: SetDone): void => {
    setDone((all) => changeSet(all, item, set, value));
    setFocused({ item, set });
  };
  const endHold = (h: Hold, seconds: number | null): void => {
    store.writeHold(null);
    const at = sets.find((x) => setKey(x) === h.at);
    const set = at === undefined ? undefined : shown[at.item]?.sets[at.set];
    if (at === undefined || set === undefined || seconds === null) return;
    change(at.item, at.set, { ...set, onS: seconds });
    if (!ticked.has(h.at)) toggle(at);
  };
  const hold = useHold(store, (h) => endHold(h, h.targetS));
  const climbedSets = (item: number): SetDone[] => {
    const draft = tally.stored?.draft;
    if (tallyOf(item) === "laps") return lapSets(climbs, item);
    if (draft === undefined) return [];
    const plannedS = tallyOf(item) === "wallTime" ? items[item]?.dose.onS : undefined;
    return exerciseSets(draft, item, plannedS, new Date());
  };

  const sided = eachSideOf(exercises ?? []);
  const holdAt = current !== null && !ticked.has(setKey(current)) ? current : next;
  const holdTarget = (at: SetAt): number | null => {
    const targetS = items[at.item]?.dose.onS;
    return hold.hold === null &&
      holdAt?.item === at.item &&
      holdAt.set === at.set &&
      targetS !== undefined &&
      targetS > 0
      ? targetS
      : null;
  };
  const climbing = (item: number): ClimbingItem | null => {
    const measure = tallyOf(item);
    const at = items[item];
    if (measure === null || at === undefined) return null;
    const logged = climbedSets(item);
    return {
      measure,
      lastTime: climbingLastTime(previous(at.exercise), measure, at.dose),
      logged:
        logged.length === 0
          ? null
          : measure === "laps"
            ? lapsLine(logged, at.dose)
            : measure === "wallTime"
              ? wallLine(logged)
              : climbsLine(logged),
      live: tally.stored?.draft.exercise?.item === item,
    };
  };

  return {
    startedAt,
    shown,
    ticked,
    current,
    order: cards.order,
    items,
    position:
      cards.order.length === 0
        ? null
        : {
            at: Math.max(0, cards.order.indexOf(current?.item ?? -1)) + 1,
            of: cards.order.length,
          },
    rest,
    hold,
    tallyOf,
    climbing,
    target: ({ item, set }) => {
      const target = setOf(items[item]?.dose ?? { sets: 0 });
      const last = previous(items[item]?.exercise ?? "")[set];
      return lifting(item) ? { ...target, weightKg: target.weightKg ?? last?.weightKg } : target;
    },
    holdTarget,
    startHold: (at) => {
      const targetS = holdTarget(at);
      if (targetS !== null)
        hold.start(setKey(at), nameOf(at.item), targetS, sided(items[at.item]?.exercise ?? ""));
    },
    previous,
    lifting,
    nameOf,
    sided,
    folded: (item) =>
      cards.shut.includes(item) ||
      (!cards.open.includes(item) &&
        (cards.skipped.includes(item) ||
          ((live[item]?.dose.sets ?? 0) > 0 && itemDone(live, ticked, item)))),
    skipped: (item) => cards.skipped.includes(item),
    addSet: (item) => {
      setDone((all) =>
        all.some((d) => d.item === item && d.sets.length > 0)
          ? addSet(all, item)
          : all.map((d) =>
              d.item === item ? { ...d, sets: [setOf(items[item]?.dose ?? { sets: 1 })] } : d
            )
      );
      withFold(item, false);
    },
    removeSet: (at) => {
      const value = done.find((d) => d.item === at.item)?.sets[at.set];
      if (value === undefined) return;
      const out = withoutSet(done, ticked, at);
      setRemoved({
        exercise: nameOf(at.item),
        set: at.set + 1,
        at,
        value,
        wasTicked: ticked.has(setKey(at)),
      });
      setDone(out.done);
      setTicked(out.ticked);
      setCards((c) => withCardEnded(c, at.item, ended(out.done, out.ticked, at.item)));
      setFocused(null);
      rest.skip();
    },
    removed: removed && { exercise: removed.exercise, set: removed.set },
    undoRemove: () => {
      const was = lastRemoved.current;
      if (was === null) return;
      const now = latest.current;
      const back = withSetBack(now.done, now.ticked, was.at, was.value, was.wasTicked);
      setDone(back.done);
      setTicked(back.ticked);
      setCards((c) => withCardEnded(c, was.at.item, ended(back.done, back.ticked, was.at.item)));
      setRemoved(null);
    },
    dismissRemoved: () => setRemoved(null),
    open: (item) => {
      setCards((c) => ({ ...c, skipped: c.skipped.filter((k) => k !== item) }));
      withFold(item, false);
    },
    fold: (item) => withFold(item, true),
    focus: setFocused,
    skip: (item) => {
      setCards((c) => withCardSkipped(c, item));
      withFold(item, null);
    },
    move: (item, by) => setCards((c) => withCardMoved(c, item, by)),
    remove: (item) => {
      setCards((c) => withCardRemoved(c, item));
      if (focused?.item === item) setFocused(null);
    },
    addExercise: ({ exercise, kind, measure, dose }) => {
      const key = cards.base + cards.added.length;
      const item = { exercise, dose: dose ?? newDoseFor(kind, measure) };
      setCards((c) => withCardAdded(c, item));
      setDone((all) => [...all, ...doneAsPrescribed([item]).map((d) => ({ ...d, item: key }))]);
    },
    toggle,
    change,
    endHold,
    climbedSets,
    startClimbing: (item, measure) => {
      const at = items[item];
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
      const ran = shown.flatMap((d) =>
        inPart(d.item) ? [] : [tallyOf(d.item) === null ? d : { ...d, sets: climbedSets(d.item) }]
      );
      const climbed = ran.flatMap((d) =>
        tallyOf(d.item) === null ? [] : d.sets.map((_, set) => setKey({ item: d.item, set }))
      );
      return finishedInOrder(cards, ran, new Set([...ticked, ...climbed]));
    },
    loaded: activities !== null && exercises !== null,
    part:
      planned === null
        ? null
        : {
            places,
            planned,
            state: fingers,
            change: (next) => {
              const now = store.resumed("/workout/sets", run.workoutId);
              if (now?.state.player === "sets")
                store.writeAsIs({ ...now, state: { ...now.state, fingers: next } });
            },
          },
  };
}
