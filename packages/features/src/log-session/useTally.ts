import React from "react";
import type { PlanLink } from "@sendtally/api-client";
import { gymOfDraft, liveGymOfDraft } from "../gyms/draft";
import { CIRCUIT_HEX, circuitLabel } from "../gyms/transforms";
import type { Gym } from "../gyms/types";
import { t } from "../i18n";
import { elapsedClock } from "../sessions/years";
import type { RestClock } from "../workouts/useLiveRun";
import { readClimbKind } from "./climbKind";
import type { DraftStorage } from "./draftStore";
import {
  exerciseLine,
  setGroups,
  setOver,
  wallLeft,
  withExerciseDone,
  withSetEnded,
  withWallStarted,
  type TallySetGroup,
} from "./exerciseTally";
import { tallyDraft, tallyElapsedSeconds, type TallyChoice, type TallyGo } from "./tally";
import { tallyStep, type TallySelection, type TallyUndo } from "./tallySelection";
import { gradeOptions } from "./transforms";
import {
  disciplineLabel,
  type Discipline,
  type GradePrefs,
  type GradeScale,
  type LogSessionDraft,
} from "./types";
import type { LiveSession } from "./useLiveSession";

export type TallySegment = Discipline | "circuit";

/** A grade or circuit to pick, in its colour when it is a circuit. */
export type TallyChip = { key: string; label: string; colour?: string };

export type TallyInputs = {
  live: LiveSession;
  /** The workout's rest between sets, for an exercise. */
  rest: RestClock;
  /** Logs the workout exercise a player started it on, not a whole session. */
  exercise: boolean;
  gyms: readonly Gym[];
  /** Gyms and past sessions have loaded, so a new session can start at the last gym. */
  settled: boolean;
  /** The gym the last session was at, which a new one starts at. */
  lastGymId: string | undefined;
  scales: GradePrefs;
  /** Boulder or route last picked, kept across sessions. */
  kindStorage: DraftStorage;
  /** Where a grade list scrolls to first, for a scale. */
  typicalIndex: (scale: GradeScale) => number;
  /** What a new session starts with: its plan and name. */
  start?: { plan?: PlanLink; name?: string };
};

export type Tally = {
  draft: LogSessionDraft | null;
  gym: Gym | null;
  /** The gym whose circuits the tally offers, when it has any. */
  circuitGym: Gym | null;
  segment: TallySegment;
  segments: TallySegment[];
  segmentLabel: (s: TallySegment) => string;
  chips: TallyChip[];
  startIndex: number;
  selection: TallySelection;
  /** Selects a climb's row, or lets go of it when it is selected. */
  toggleRow: (key: string) => void;
  clearSelection: () => void;
  /** The grade picked, waiting for Fell or Sent. */
  active: string | null;
  /** Fell and Sent have nothing to act on. */
  off: boolean;
  pick: (chip: string) => void;
  go: (g: TallyGo) => void;
  snack: TallyUndo | null;
  undo: () => void;
  clearSnack: () => void;
  pickGym: (gymId: string | undefined) => void;
  pickSegment: (s: TallySegment) => void;
  /** The climbs, newest first, or set by set for an exercise. */
  groups: TallySetGroup[];
  /** An exercise's clock: its rest in gold, a time set counting down, or the time since Start. */
  clock: { time: string; resting: boolean; line: string };
  /** Ticks each second for an exercise, whose sets end on time. */
  now: Date;
  /** Hands an exercise's climbs back to its player. */
  done: () => void;
};

/**
 * The gym session as it happens: a grade starts a climb, then Fell or Sent for each go. For a
 * workout exercise its sets end on their last climb or their time, and rest.
 */
export function useTally({
  live,
  rest,
  exercise,
  gyms,
  settled,
  lastGymId,
  scales,
  kindStorage,
  typicalIndex,
  start,
}: TallyInputs): Tally {
  const [now, setNow] = React.useState(() => new Date());
  const [held, setHeld] = React.useState<{ set: number | undefined; selection: TallySelection }>({
    set: undefined,
    selection: null,
  });
  const [snack, setSnack] = React.useState<TallyUndo | null>(null);
  const [discipline, setDiscipline] = React.useState<Discipline>(() =>
    readClimbKind(kindStorage, []) === "route" ? "route" : "boulder"
  );
  const [onCircuit, setOnCircuit] = React.useState(true);
  const draft = live.stored?.draft ?? null;
  const set = draft?.exercise?.set;
  const selection = held.set === set ? held.selection : null;
  const setSelection = (next: TallySelection, of: number | undefined = set): void =>
    setHeld({ set: of, selection: next });

  const started = React.useRef(false);
  const plan = start?.plan;
  const name = start?.name;
  React.useEffect(() => {
    if (started.current || !settled) return;
    started.current = true;
    const gymId = gyms.some((g) => g.id === lastGymId) ? lastGymId : undefined;
    if (exercise) {
      if (draft !== null && draft.gymId === undefined && draft.climbs.length === 0 && gymId)
        live.replace({ ...draft, gymId });
      return;
    }
    if (draft === null) live.start(tallyDraft(new Date(), { gymId, plan, name }));
  }, [settled, draft, live, plan, name, gyms, lastGymId, exercise]);

  React.useEffect(() => {
    if (!exercise) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [exercise]);

  /** A set over ends, and its rest starts. */
  const settle = React.useCallback(
    (next: LogSessionDraft, at: Date): LogSessionDraft => {
      if (!setOver(next, at)) return next;
      const ended = withSetEnded(next);
      if (ended.restS > 0) rest.tick("tally", ended.restS);
      return ended.draft;
    },
    [rest]
  );
  const pending = selection?.kind === "pending";
  React.useEffect(() => {
    if (draft === null || pending || !setOver(draft, now)) return;
    live.replace(settle(draft, now));
  }, [draft, pending, now, live, settle]);

  const gym = draft === null ? null : gymOfDraft(gyms, draft.gymId);
  const circuitGym = draft === null ? null : liveGymOfDraft(gyms, draft.gymId);
  const scale = scales[discipline];
  const segment: TallySegment = circuitGym !== null && onCircuit ? "circuit" : discipline;
  const chips: TallyChip[] =
    segment === "circuit" && circuitGym !== null
      ? circuitGym.circuits.map((c) => ({
          key: c.id,
          label: circuitLabel(c),
          colour: CIRCUIT_HEX[c.colour],
        }))
      : gradeOptions(scale).map((g) => ({ key: g, label: g }));
  const choiceOf = (chip: string): TallyChoice | null => {
    if (segment !== "circuit" || circuitGym === null) return { kind: "grade", scale, grade: chip };
    const circuit = circuitGym.circuits.find((c) => c.id === chip);
    return circuit === undefined ? null : { kind: "circuit", gym: circuitGym, circuit };
  };
  const resting = rest.rest !== null;
  const left = draft?.exercise === undefined ? null : wallLeft(draft.exercise, now);

  return {
    draft,
    gym,
    circuitGym,
    segment,
    segments: circuitGym === null ? ["boulder", "route"] : ["boulder", "route", "circuit"],
    segmentLabel: (s) => (s === "circuit" ? t("gyms.circuit") : disciplineLabel(s)),
    chips,
    startIndex: segment === "circuit" ? 0 : typicalIndex(scale),
    selection,
    toggleRow: (key) =>
      setSelection(
        selection?.kind === "row" && selection.key === key ? null : { kind: "row", key }
      ),
    clearSelection: () => setSelection(null),
    active: selection?.kind === "pending" ? selection.chip : null,
    off: selection === null,
    pick: (chip) => {
      if (draft === null) return;
      rest.skip();
      setSelection({ kind: "pending", chip });
      const wall = withWallStarted(draft, new Date());
      if (wall !== draft) live.replace(wall);
    },
    go: (g) => {
      if (draft === null) return;
      const step = tallyStep(draft, selection, g, choiceOf, snack);
      if (step === null) return;
      setSelection(step.selection);
      live.replace(settle(step.draft, new Date()));
      setSnack(step.undo);
    },
    snack,
    undo: () => {
      if (snack === null || draft === null) return;
      if (snack.draft.exercise?.set !== draft.exercise?.set) rest.skip();
      live.replace(snack.draft);
      setSelection(snack.selection, snack.draft.exercise?.set);
      setSnack(null);
    },
    clearSnack: () => setSnack(null),
    pickGym: (gymId) => {
      if (draft === null) return;
      const { gymId: _gym, ...others } = draft;
      live.replace(gymId === undefined ? others : { ...others, gymId });
      setOnCircuit(true);
      setSelection(null);
    },
    pickSegment: (next) => {
      setOnCircuit(next === "circuit");
      if (next !== "circuit") {
        setDiscipline(next);
        kindStorage.write(next);
      }
      setSelection(null);
    },
    groups:
      draft === null
        ? []
        : exercise
          ? setGroups(draft)
          : [{ set: 0, label: "", climbs: [...draft.climbs].reverse() }],
    clock: {
      time: resting
        ? t("tally.restClock", { time: elapsedClock(rest.left) })
        : left === null
          ? elapsedClock(draft === null ? 0 : tallyElapsedSeconds(draft, now))
          : t("tally.timeLeft", { time: elapsedClock(left) }),
      resting,
      line: draft === null ? "" : exerciseLine(draft, resting),
    },
    now,
    done: () => {
      if (draft === null) return;
      rest.skip();
      live.replace(withExerciseDone(draft));
    },
  };
}
