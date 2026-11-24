import React from "react";
import {
  doneAsPrescribed,
  isChecklist,
  restAfterItem,
  setOf,
  type ItemDone,
  type SessionItem,
  type SetDone,
} from "@sendtally/core/hang";
import type { Activity, Exercise } from "@sendtally/api-client";
import { climbingLastTime, climbsLine, lapPlanOf, lapsLine } from "../activities/climbing";
import { addSet, changeSet, previousSets } from "../activities/done";
import { tallyMeasuresOf } from "../exercises/measure";
import type { TallyMeasure } from "../exercises/types";
import { eachSideOf } from "../exercises/sides";
import { allLapsDone, lapSets, withLapBack } from "../log-session/exerciseLaps";
import {
  allSetsDone,
  exerciseSets,
  nextSet,
  setsPlannedFor,
  startExercise,
  withClimbBack,
  withSetAdded,
  withSetPressed,
} from "../log-session/exerciseTally";
import { tallyDraft } from "../log-session/tally";
import type { ClimbDraft, LogSessionDraft } from "../log-session/types";
import { climbedKeys, type ClimbPlan } from "./climbRows";
import type { LiveSession } from "../log-session/useLiveSession";
import { partPlaces, partPlanned, type FingersPart } from "./fingersPart";
import type { Hold } from "./holdClock";
import { itemTitle } from "./checklist";
import type { LiveRunStore } from "./liveRun";
import { newDoseFor } from "./doseFields";
import { runParams, type RunFinish, type WorkoutRun } from "./runParams";
import {
  cardsFrom,
  finishedInOrder,
  withCardAdded,
  withCardEnded,
  withCardFold,
  withUnitMoved,
  withCardRemoved,
  withCardSkipped,
  withoutSet,
  withSetBack,
  type RunCards,
} from "./runCards";
import type { Picked } from "./types";
import { useLatest } from "./useLatest";
import {
  afterKey,
  allSets,
  exercisePosition,
  isLifting,
  itemDone,
  restAfterTick,
  setKey,
  withDoneSets,
  withPrevious,
  type SetAt,
} from "./setsRun";
import {
  restAfterGroupTick,
  runGroupsOf,
  supersetMembers,
  withRunGroups,
  type RunGroup,
} from "./groups";
import { unitMovedOrder } from "./unitMove";
import { useHold, useLiveRun, useRest, type HoldClock, type RestClock } from "./useLiveRun";
import type { PlannedRun } from "./usePlannedRun";

/** Where the exercise tally before inline climbing kept its rest; a run resumed from it moves the rest under its set. */
const OLD_TALLY_REST = "tally";

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
};

export type SetsPlayer = {
  startedAt: number;
  /** What each item has done so far, last time's sets filled in where nothing was typed. */
  shown: ItemDone[];
  ticked: ReadonlySet<string>;
  /** The set picked from its number or name, for its fill and its Remove; ticking and typing leave it. */
  selected: SetAt | null;
  /** The cards in the order they run, each keyed by its item. */
  order: readonly number[];
  /** Every item the run has by key: the workout's, then any added during it. */
  items: readonly SessionItem[];
  /** "Exercise 2 of 3": where the current set's card sits, of how many. */
  position: { at: number; of: number } | null;
  rest: RestClock;
  hold: HoldClock;
  tallyOf: (item: number) => TallyMeasure | null;
  /** A climbing item's card: how it is measured, last time, and what this run logged. */
  climbing: (item: number) => ClimbingItem | null;
  /** The seconds an open timed set's hold would run for; its ▶ shows on every one, idle while another holds. */
  holdTarget: (at: SetAt) => number | null;
  startHold: (at: SetAt) => void;
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
  /** Selects a set, or unselects it when it already is. */
  select: (at: SetAt) => void;
  skip: (item: number) => void;
  move: (item: number, by: -1 | 1) => void;
  /** Whether a card, or the superset it is in, has a place to move to that way. */
  canMove: (item: number, by: -1 | 1) => boolean;
  remove: (item: number) => void;
  /** An exercise added to this run only, at the end, with the dose the editor would give it. */
  addExercise: (picked: Picked) => void;
  toggle: (at: SetAt) => void;
  change: (item: number, set: number, value: SetDone) => void;
  /** Ends the hold, recording what it counted on its set, which ticks itself. */
  endHold: (h: Hold, seconds: number | null) => void;
  /** The sets a climbing item logged on the tally. */
  climbedSets: (item: number) => SetDone[];
  /** The climbing card the tally is on, whose picked set takes the grades picked. */
  climbAt: number | null;
  /** The draft with the tally on a climbing card, which a change on it builds on; it moves no focus. */
  draftOn: (item: number) => LogSessionDraft;
  /** The Undo of a climb removed from the tally, which puts it back where it was. */
  climbRemoved: (climb: ClimbDraft) => () => void;
  /** The Undo of a lap's −, wherever the tally is by then. */
  lapBack: (item: number) => void;
  /** What a climbing item asks of each set, for its rows. */
  climbPlan: (item: number) => ClimbPlan;
  /** The sets or laps a climbing item asks for now, after any Add set, Add lap or −. */
  setsPlanned: (item: number) => number;
  /** Moves the tally onto a climbing card, from a press on it. */
  climbOn: (item: number) => void;
  /** A climbing set's line pressed: the grades picked go to that set, a set to come ending those before it. */
  pressSet: (item: number, set: number) => void;
  /** A checklist's typed lines, one set each; null for an exercise. */
  checklist: (item: number) => string[] | null;
  /** The supersets as the cards stand now: neighbours sharing a group. */
  groups: RunGroup[];
  /** The items with each one's sets as many as it has now. */
  live: SessionItem[];
  /** What the run did, and the sets it left unticked, for its review. */
  finished: () => RunFinish;
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
    return live?.state.player === "sets"
      ? { ...live.state, startedAt: live.startedAt, lastTickAt: live.lastTickAt }
      : null;
  });
  const [staleAt] = React.useState(() =>
    resumed === null ? (tally.stored?.savedAt.getTime() ?? null) : null
  );
  const stale = staleAt !== null && tally.stored?.savedAt.getTime() === staleAt;
  const draft = stale ? null : (tally.stored?.draft ?? null);
  const climbs = draft?.climbs ?? [];
  const discardTally = tally.discard;
  React.useEffect(() => {
    if (stale) discardTally();
  }, [stale, discardTally]);
  const [startedAt] = React.useState(() => resumed?.startedAt ?? Date.now());
  const [done, setDone] = React.useState<ItemDone[]>(
    () => resumed?.done ?? doneAsPrescribed(run.items)
  );
  const [ticked, setTicked] = React.useState<ReadonlySet<string>>(() => new Set(resumed?.ticked));
  const [tickedAt, setLastTickAt] = React.useState(resumed?.lastTickAt);
  const [cards, setCards] = React.useState<RunCards>(() =>
    cardsFrom(resumed?.cards, run.items.length)
  );
  const [selected, setSelected] = React.useState<SetAt | null>(null);
  const [removed, setRemoved] = React.useState<
    (RemovedSet & { parts: { at: SetAt; value: SetDone; wasTicked: boolean }[] }) | null
  >(null);
  const logged = climbs.length + climbs.reduce((n, c) => n + (c.endurance?.laps.length ?? 0), 0);
  const lastTickAt = ticked.size === 0 && logged === 0 ? undefined : tickedAt;
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
  const climbed = React.useMemo(() => climbedKeys(draft), [draft]);
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
      lastTickAt,
      state: {
        player: "sets",
        done,
        ticked: [...ticked],
        cards,
        ...(part && { fingers: part }),
        ...(places.length > 0 && { grips: places }),
        ...(climbed.length > 0 && { climbed }),
      },
    });
  }, [store, run, startedAt, lastTickAt, done, ticked, cards, places, climbed]);
  const planned = partPlanned(run, places);
  const inPart = (item: number): boolean => places.includes(item);
  const partOpen =
    places.length > 0 &&
    (fingers === undefined || ("run" in fingers && fingers.run.finished === null));
  const items = [...run.items.slice(0, cards.base), ...cards.added];
  const tallyMeasure = tallyMeasuresOf(exercises ?? [], run.kind, isGrip);
  const listAt = (item: number): boolean => {
    const at = items[item];
    return at !== undefined && isChecklist(at);
  };
  const tallyOf = (item: number): TallyMeasure | null =>
    listAt(item) ? null : tallyMeasure(items[item]?.exercise ?? "");
  const live = withDoneSets(items, done);
  const ended = (d: readonly ItemDone[], t: ReadonlySet<string>, item: number): boolean => {
    const after = withDoneSets(items, d);
    return (after[item]?.dose.sets ?? 0) > 0 && itemDone(after, t, item);
  };
  const groups = runGroupsOf(cards.order, live, (k) => tallyOf(k) === null);
  const groupOf = (item: number): RunGroup | undefined =>
    groups.find((g) => g.members.includes(item));
  const unitOf = (item: number): number[] => groupOf(item)?.members ?? [item];
  // A superset goes round by round: A1 B1 C1, then A2 B2 C2.
  const roundOrder = (g: RunGroup): SetAt[] => {
    const rounds = Math.max(...g.members.map((m) => live[m]?.dose.sets ?? 0));
    return Array.from({ length: rounds }, (_, set) =>
      g.members.flatMap((item) => (set < (live[item]?.dose.sets ?? 0) ? [{ item, set }] : []))
    ).flat();
  };
  const sets = cards.order.flatMap((key) => {
    const g = groupOf(key);
    if (g !== undefined) return g.members[0] === key ? roundOrder(g) : [];
    return allSets(live).filter((at) => at.item === key && tallyOf(key) === null && !inPart(key));
  });
  const previous = (exercise: string): SetDone[] =>
    activities === null || run.workoutId === null
      ? []
      : previousSets(activities, run.workoutId, exercise);
  const lifting = (item: number): boolean => isLifting(run.kind, items[item]);
  const shown = withPrevious(done, lifting, previous);
  const next = sets.find((at) => !ticked.has(setKey(at))) ?? null;
  /** The fingerboard part while it is still to do and comes before the set being worked on. */
  const partFirst =
    partOpen &&
    places[0] !== undefined &&
    (next === null || cards.order.indexOf(places[0]) < cards.order.indexOf(next.item))
      ? places[0]
      : null;
  const nameOf = (item: number): string => {
    const at = items[item];
    return at === undefined ? "" : itemTitle(at);
  };
  const withFold = (item: number, fold: boolean | null): void =>
    setCards((c) => withCardFold(c, item, fold));

  const toggle = (at: SetAt): void => {
    const key = setKey(at);
    const after = new Set(ticked);
    const ticking = !after.delete(key);
    if (ticking) after.add(key);
    setTicked(after);
    if (ticking) setLastTickAt(() => Date.now());
    const finished = sets.every((s) => s.item !== at.item || after.has(setKey(s)));
    setCards((c) => withCardEnded(withCardFold(c, at.item, null), at.item, finished));
    const inGroup = groupOf(at.item);
    const restAfter = !ticking
      ? null
      : inGroup === undefined
        ? restAfterTick(live, after, at, run.exerciseRestS)
        : restAfterGroupTick(live, after, at, inGroup, run.exerciseRestS);
    if (restAfter === null) rest.skip();
    else rest.tick(restAfter.at, restAfter.seconds);
  };
  const change = (item: number, set: number, value: SetDone): void => {
    setDone((all) => changeSet(all, item, set, value));
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
    if (tallyOf(item) === "laps") return lapSets(climbs, item);
    if (draft === null) return [];
    const plannedS = tallyOf(item) === "wallTime" ? items[item]?.dose.onS : undefined;
    return exerciseSets(draft, item, plannedS, new Date());
  };

  const sided = eachSideOf(exercises ?? []);
  const holdTarget = (at: SetAt): number | null => {
    const targetS = items[at.item]?.dose.onS;
    return !ticked.has(setKey(at)) && targetS !== undefined && targetS > 0 ? targetS : null;
  };
  const setsPlanned = (item: number): number => {
    const asked = items[item]?.dose.sets ?? 0;
    return draft === null ? asked : setsPlannedFor(draft, item, asked);
  };
  const climbPlan = (item: number): ClimbPlan => {
    const dose = items[item]?.dose ?? { sets: 0 };
    const measure = tallyOf(item);
    const perSet = dose.repsMax ?? dose.reps;
    return {
      sets: setsPlanned(item),
      ...(measure === "climbs" && perSet !== undefined ? { climbs: perSet } : {}),
      ...(measure === "wallTime" ? { onS: dose.onS ?? 0 } : {}),
    };
  };
  const climbDone = (item: number): boolean => {
    const sets = setsPlanned(item);
    const ex = draft?.exercise?.item === item ? draft.exercise : undefined;
    if (tallyOf(item) === "laps")
      return ex !== undefined && draft !== null
        ? allLapsDone(draft)
        : draft !== null && lapSets(climbs, item).length >= sets;
    return ex !== undefined ? allSetsDone(ex) : nextSet(climbs, item) > sets;
  };
  const doneOf = (item: number): boolean =>
    tallyOf(item) === null
      ? (live[item]?.dose.sets ?? 0) > 0 && itemDone(live, ticked, item)
      : climbDone(item);
  const [chosen, setChosen] = React.useState<number | null>(null);
  const climbable = (k: number | null): k is number =>
    k !== null &&
    cards.order.includes(k) &&
    tallyOf(k) !== null &&
    !cards.shut.includes(k) &&
    !cards.skipped.includes(k);
  const on = draft?.exercise;
  const climbAt =
    (climbable(chosen) && (cards.open.includes(chosen) || !climbDone(chosen))
      ? chosen
      : (cards.order.find((k) => climbable(k) && !climbDone(k)) ??
        (on !== undefined && climbable(on.item) ? on.item : undefined))) ?? null;
  const startOf = (item: number): LogSessionDraft | null => {
    const at = items[item];
    const measure = tallyOf(item);
    if (at === undefined || measure === null) return null;
    const { climbs: perSet, onS, sets } = climbPlan(item);
    return startExercise(
      draft,
      {
        item,
        name: nameOf(item),
        sets,
        ...(perSet === undefined ? {} : { climbs: perSet }),
        ...(onS === undefined ? {} : { onS }),
        ...(measure === "laps" ? { lap: lapPlanOf(at.dose) } : {}),
        restS: at.dose.setRestS ?? 0,
      },
      new Date()
    );
  };
  const begin = useLatest((item: number): void => {
    const started = startOf(item);
    if (started !== null) tally.replace(started);
  });
  const draftOn = (item: number): LogSessionDraft =>
    on?.item === item && draft !== null
      ? draft
      : (startOf(item) ?? draft ?? tallyDraft(new Date()));
  /** A press that moves the grades to a card: the card they leave stays as it was, open. */
  const tallyOn = (item: number): LogSessionDraft => {
    if (on?.item === item && draft !== null) return draft;
    const was = climbAt;
    if (was !== null && was !== item && !cards.shut.includes(was)) withFold(was, false);
    setChosen(item);
    return draftOn(item);
  };
  const draftNow = useLatest(draft);
  const onClimbAt =
    on !== undefined &&
    on.item === climbAt &&
    (on.lap !== undefined) === (tallyOf(climbAt) === "laps");
  const restAt = rest.rest?.at;
  React.useEffect(() => {
    if (restAt !== OLD_TALLY_REST || on === undefined) return;
    const running = store.read()?.rest;
    if (running !== undefined)
      store.writeRest({ ...running, at: setKey({ item: on.item, set: Math.max(0, on.set - 2) }) });
  }, [restAt, on, store]);
  const known = exercises !== null;
  React.useEffect(() => {
    if (known && climbAt !== null && !onClimbAt) begin.current(climbAt);
  }, [known, climbAt, onClimbAt, begin]);
  const climbsEnded = cards.order.filter((k) => tallyOf(k) !== null && climbDone(k));
  const settleClimbs = useLatest((): void => {
    const fresh = climbsEnded.filter((k) => !cards.ended.includes(k));
    const undone = cards.ended.filter((k) => tallyOf(k) !== null && !climbsEnded.includes(k));
    if (fresh.length === 0 && undone.length === 0) return;
    setCards((c) =>
      undone.reduce(
        (x, k) => withCardEnded(x, k, false),
        fresh.reduce((x, k) => withCardEnded(x, k, true), c)
      )
    );
    const last = fresh.at(-1);
    const next = cards.order.find((k) => k !== last && !doneOf(k) && !fresh.includes(k));
    if (last !== undefined && next !== undefined)
      rest.tick(afterKey(last), restAfterItem(items, last, run.exerciseRestS));
  });
  const endedKey = climbsEnded.join(",");
  React.useEffect(() => settleClimbs.current(), [endedKey, settleClimbs]);
  const loggedBefore = React.useRef(logged);
  React.useEffect(() => {
    if (logged > loggedBefore.current) setLastTickAt(Date.now());
    loggedBefore.current = logged;
  }, [logged]);

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
            : climbsLine(logged),
    };
  };

  /** The card the run is on; -1 once nothing is left, where the header names no position. */
  const positionOn =
    partFirst ??
    (climbAt !== null && next !== null
      ? (cards.order.find((k) => k === climbAt || k === next.item) ?? -1)
      : (next?.item ?? climbAt ?? -1));
  return {
    startedAt,
    shown,
    ticked,
    selected,
    order: cards.order,
    items,
    position:
      positionOn === -1
        ? null
        : exercisePosition(
            cards.order,
            positionOn,
            (k) => (listAt(k) ? null : (groupOf(k)?.id ?? String(k))),
            (k) => inPart(k) && !partOpen
          ),
    rest,
    hold,
    tallyOf,
    climbing,
    holdTarget,
    startHold: (at) => {
      const targetS = holdTarget(at);
      if (targetS !== null && hold.hold === null)
        hold.start(setKey(at), nameOf(at.item), targetS, sided(items[at.item]?.exercise ?? ""));
    },
    lifting,
    nameOf,
    sided,
    folded: (item) =>
      cards.shut.includes(item) ||
      (!cards.open.includes(item) && (cards.skipped.includes(item) || doneOf(item))),
    skipped: (item) => cards.skipped.includes(item),
    // In a superset a set is a round: it is added to every member, and goes from every member.
    addSet: (item) => {
      if (tallyOf(item) !== null) {
        tally.replace(withSetAdded(tallyOn(item)));
        withFold(item, false);
        return;
      }
      const members = groupOf(item)?.members ?? [item];
      setDone((all) =>
        members.reduce(
          (acc, m) =>
            acc.some((d) => d.item === m && d.sets.length > 0)
              ? addSet(acc, m)
              : acc.map((d) =>
                  d.item === m ? { ...d, sets: [setOf(items[m]?.dose ?? { sets: 1 })] } : d
                ),
          all
        )
      );
      for (const m of members) withFold(m, false);
    },
    removeSet: (at) => {
      const members = groupOf(at.item)?.members ?? [at.item];
      const parts = members.flatMap((item) => {
        const value = done.find((d) => d.item === item)?.sets[at.set];
        const set = { item, set: at.set };
        return value === undefined ? [] : [{ at: set, value, wasTicked: ticked.has(setKey(set)) }];
      });
      if (parts.length === 0) return;
      const out = parts.reduce((acc, p) => withoutSet(acc.done, acc.ticked, p.at), {
        done,
        ticked: new Set(ticked),
      });
      setRemoved({
        exercise: supersetMembers(members.map((m) => nameOf(m))),
        set: at.set + 1,
        parts,
      });
      setDone(out.done);
      setTicked(out.ticked);
      setCards((c) =>
        members.reduce((x, m) => withCardEnded(x, m, ended(out.done, out.ticked, m)), c)
      );
      setSelected(null);
      rest.skip();
    },
    removed: removed && { exercise: removed.exercise, set: removed.set },
    undoRemove: () => {
      const was = lastRemoved.current;
      if (was === null) return;
      const now = latest.current;
      const back = was.parts.reduce(
        (acc, p) => withSetBack(acc.done, acc.ticked, p.at, p.value, p.wasTicked),
        { done: now.done, ticked: new Set(now.ticked) }
      );
      setDone(back.done);
      setTicked(back.ticked);
      setCards((c) =>
        was.parts.reduce(
          (x, p) => withCardEnded(x, p.at.item, ended(back.done, back.ticked, p.at.item)),
          c
        )
      );
      setRemoved(null);
    },
    dismissRemoved: () => setRemoved(null),
    open: (item) => {
      setCards((c) => ({ ...c, skipped: c.skipped.filter((k) => k !== item) }));
      withFold(item, false);
      if (tallyOf(item) !== null) setChosen(item);
    },
    fold: (item) => withFold(item, true),
    select: (at) => setSelected((was) => (was?.item === at.item && was.set === at.set ? null : at)),
    skip: (item) => {
      setCards((c) => withCardSkipped(c, item));
      withFold(item, null);
    },
    move: (item, by) => setCards((c) => withUnitMoved(c, unitOf(item), by, unitOf)),
    canMove: (item, by) => unitMovedOrder(cards.order, unitOf(item), by, unitOf) !== cards.order,
    remove: (item) => {
      setCards((c) => withCardRemoved(c, item));
      if (selected?.item === item) setSelected(null);
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
    climbAt,
    climbPlan,
    draftOn,
    climbRemoved: (climb) => {
      const at = draft?.climbs.indexOf(climb) ?? 0;
      return () => {
        const now = draftNow.current;
        if (now !== null) tally.replace(withClimbBack(now, climb, at));
      };
    },
    lapBack: (item) => {
      const now = draftNow.current;
      if (now !== null) tally.replace(withLapBack(now, item));
    },
    setsPlanned,
    climbOn: (item) => {
      if (climbAt !== item || on?.item !== item) tally.replace(tallyOn(item));
    },
    pressSet: (item, set) => {
      const out = withSetPressed(tallyOn(item), set, new Date());
      tally.replace(out.draft);
      if (out.rest !== null) rest.tick(setKey({ item, set: out.rest.set - 1 }), out.rest.seconds);
    },
    checklist: (item) => items[item]?.checklist?.lines ?? null,
    groups,
    live,
    finished: () => {
      rest.skip();
      hold.stop();
      const climbedOf = (d: ItemDone): SetDone[] | null => {
        if (tallyOf(d.item) === null) return null;
        const sets = climbedSets(d.item);
        return sets.length === 0 ? null : sets;
      };
      const checked = (d: ItemDone, lines: string[]): ItemDone => ({
        item: d.item,
        exercise: d.exercise,
        sets: [],
        checklist: {
          lines,
          checked: lines.flatMap((_, set) =>
            ticked.has(setKey({ item: d.item, set })) ? [set] : []
          ),
        },
      });
      const each = shown.flatMap((d) => (inPart(d.item) ? [] : [{ d, sets: climbedOf(d) }]));
      const ran = each.map(({ d, sets }) => {
        const lines = items[d.item]?.checklist?.lines;
        return lines === undefined ? { ...d, sets: sets ?? d.sets } : checked(d, lines);
      });
      const climbed = each.flatMap(({ d, sets }) =>
        sets === null ? [] : sets.map((_, set) => setKey({ item: d.item, set }))
      );
      return {
        ...finishedInOrder(cards, withRunGroups(ran, groups), new Set([...ticked, ...climbed])),
        lastTickAt,
      };
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
