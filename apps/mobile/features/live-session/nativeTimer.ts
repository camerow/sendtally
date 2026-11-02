import {
  currentPhase,
  isWork,
  phasesSeconds,
  phaseProgress,
  remainingInPhase,
  upcomingPhases,
  type Phase,
  type Run,
} from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import type { CueSound, NativeTimerPayload, NativeTimerStep } from "../../modules/native-timer";
import { COUNT_IN_S, SWITCH_S, holdEndsAt, type Hold } from "../training/hold/holdClock";
import type { Rest } from "../training/rest/restCountdown";
import { restThen } from "../training/rest/restThen";
import { nextText } from "../training/timer/timerText";
import type { LiveRun } from "./liveRun";

type Cue = { at: number; sound: CueSound };

const COUNTDOWN_FROM = 3;

/** Whether the live run has a clock counting down now: the screen stays on, the system shows it. */
export function isCounting(live: LiveRun | null, now: number): boolean {
  if (live === null) return false;
  if (live.hold !== undefined) return live.hold.pausedAt === null && now < holdEndsAt(live.hold);
  if (live.rest !== undefined) return now < live.rest.endsAt;
  if (live.state.player !== "timer") return false;
  const { run } = live.state;
  return run.finished === null && run.pausedAt === null && currentPhase(run).taps === 0;
}

/** What the system timer shows for the live run, or null when it has no clock. */
export function nativeTimerOf(live: LiveRun | null, now: number): NativeTimerPayload | null {
  if (live === null) return null;
  const base = {
    runId: String(live.startedAt),
    title: live.title,
    meta: live.meta ?? "",
    pausedText: t("hang.paused"),
    nextText: t("hang.next"),
    openHint: t("hang.staleOpen"),
  };
  if (live.hold !== undefined && now < holdEndsAt(live.hold))
    return withNextOf({ ...base, muted: false, ...holdSteps(live.hold, now) });
  if (live.rest !== undefined && now < live.rest.endsAt)
    return {
      ...base,
      muted: false,
      steps: withNext(restSteps(live.rest)),
      pausedLeftS: null,
      pausedShare: null,
    };
  if (live.state.player !== "timer") return null;
  const { run, muted = false, laps = false, loads = [] } = live.state;
  return {
    ...base,
    meta: live.meta ?? kindLabel(laps ? "climbing" : "hangboard"),
    muted,
    steps: runSteps(run, now, laps, loads),
    pausedLeftS: run.pausedAt === null ? null : Math.ceil(remainingInPhase(run, now)),
    pausedShare: run.pausedAt === null ? null : phaseProgress(run, now),
  };
}

function phaseLabel(index: number, phase: Phase, laps: boolean): string {
  if (phase.kind === "ready") return index > 0 ? t("hang.phaseRest") : t("hang.phaseReady");
  if (phase.kind === "hang" && laps) return t("hang.phaseClimb");
  const label = {
    hang: t("hang.phaseHang"),
    rest: t("hang.phaseRest"),
    setrest: t("hang.phaseSetRest"),
    pull: t("hang.phaseLift"),
  }[phase.kind];
  return label;
}

const lookOf = (index: number, phase: Phase): NativeTimerStep["look"] =>
  isWork(phase.kind) ? "work" : phase.kind === "ready" && index === 0 ? "ready" : "rest";

/** Ticks on the last three seconds, a tone as each phase after the first starts. */
function phaseCues(index: number, phase: Phase, startsAt: number, endsAt: number | null): Cue[] {
  const start: Cue[] =
    index > 0 ? [{ at: startsAt, sound: isWork(phase.kind) ? "work" : "rest" }] : [];
  if (endsAt === null) return start;
  const ticks = Array.from({ length: COUNTDOWN_FROM }, (_, i) => ({
    at: endsAt - (COUNTDOWN_FROM - i) * 1000,
    sound: "tick" as const,
  })).filter((c) => c.at >= startsAt);
  return [...start, ...ticks];
}

/** The app's Next row for the phase after; a lift with no load known reads only Lift. */
function nextOf(run: Run, index: number, loads: readonly string[]): string {
  const next = run.phases[index + 1];
  const load = next === undefined ? "" : (loads["item" in next ? Number(next.item) : 0] ?? "");
  if (next?.kind === "pull" && next.taps > 0 && load === "") return t("hang.phaseLift");
  return nextText(next, load);
}

/** Each step names the one after it, for steps with no Next row of their own. */
const withNext = (steps: Omit<NativeTimerStep, "next">[]): NativeTimerStep[] =>
  steps.map((step, i) => ({ ...step, next: steps[i + 1]?.label ?? null }));

const withNextOf = <T extends { steps: Omit<NativeTimerStep, "next">[] }>(
  p: T
): Omit<T, "steps"> & { steps: NativeTimerStep[] } => ({ ...p, steps: withNext(p.steps) });

function runSteps(
  run: Run,
  now: number,
  laps: boolean,
  loads: readonly string[]
): NativeTimerStep[] {
  const { phases, finishesAt } = upcomingPhases(run, now);
  const total = phasesSeconds(run.phases);
  const share = (index: number): number =>
    total === 0 ? 0 : Math.min(1, phasesSeconds(run.phases.slice(0, index)) / total);
  const steps = phases.map(({ index, phase, startsAt, endsAt }): NativeTimerStep => ({
    look: lookOf(index, phase),
    label: phaseLabel(index, phase, laps),
    hint: endsAt === null && phase.taps > 0 ? t("hang.tapToLog") : null,
    next: nextOf(run, index, loads),
    setLine:
      index === 0
        ? t("hang.setsAhead", { count: run.sets })
        : laps
          ? t("tally.lapOf", { set: phase.set, sets: run.sets })
          : t("hang.setOf", { set: phase.set, sets: run.sets }),
    startsAt,
    endsAt,
    runShare: share(index),
    cues: phaseCues(index, phase, startsAt, endsAt),
  }));
  return finishesAt === null ? steps : [...steps, doneStep(finishesAt)];
}

const doneStep = (at: number): NativeTimerStep => ({
  look: "done",
  label: t("common.done"),
  hint: t("hang.openToSave"),
  next: null,
  setLine: "",
  startsAt: at,
  endsAt: null,
  runShare: 1,
  cues: [{ at, sound: "finish" }],
});

function restSteps(rest: Rest): Omit<NativeTimerStep, "next">[] {
  return [
    {
      look: "rest",
      label: t("hang.phaseRest"),
      hint: null,
      setLine: restThen(rest) ?? "",
      startsAt: rest.endsAt - rest.seconds * 1000,
      endsAt: rest.endsAt,
      runShare: 0,
      cues: [],
    },
    {
      look: "work",
      label: rest.next ?? t("hang.nextSet"),
      hint: t("hang.staleOpen"),
      setLine: "",
      startsAt: rest.endsAt,
      endsAt: null,
      runShare: 0,
      cues: [{ at: rest.endsAt, sound: "work" }],
    },
  ];
}

/** A tick each second of the count-in, a tone as each side starts and as it ends. */
export const holdCues = (h: Hold): Cue[] => {
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
};

type Part = Pick<NativeTimerStep, "look" | "label" | "setLine" | "startsAt"> & { endsAt: number };

function holdSteps(
  h: Hold,
  now: number
): Pick<NativeTimerPayload, "pausedLeftS" | "pausedShare"> & {
  steps: Omit<NativeTimerStep, "next">[];
} {
  const s = (n: number): number => h.zeroAt + n * 1000;
  const part = (
    look: Part["look"],
    label: string,
    setLine: string,
    from: number,
    to: number
  ): Part => ({ look, label, setLine, startsAt: s(from), endsAt: s(to) });
  const right = h.targetS + SWITCH_S;
  const parts: Part[] = [
    part("ready", t("hang.phaseReady"), h.name, -COUNT_IN_S, 0),
    ...(h.sides
      ? [
          part("work", h.name, t("activities.holdLeft"), 0, h.targetS),
          part("rest", t("activities.holdSwitch"), h.name, h.targetS, right),
          part("work", h.name, t("activities.holdRight"), right, right + h.targetS),
        ]
      : [part("work", h.name, "", 0, h.targetS)]),
  ];
  const cues = holdCues(h);
  const at = h.pausedAt ?? now;
  const steps = parts
    .filter((p) => p.endsAt > at)
    .map((p): Omit<NativeTimerStep, "next"> => ({
      ...p,
      hint: null,
      runShare: 0,
      cues: cues.filter((c) => c.at >= p.startsAt && c.at < p.endsAt),
    }));
  const end = holdEndsAt(h);
  const over: Omit<NativeTimerStep, "next"> = {
    look: "done",
    label: t("common.done"),
    hint: t("hang.staleOpen"),
    setLine: h.name,
    startsAt: end,
    endsAt: null,
    runShare: 1,
    cues: cues.filter((c) => c.at >= end),
  };
  const [current] = steps;
  if (h.pausedAt === null || current === undefined)
    return { steps: [...steps, over], pausedLeftS: null, pausedShare: null };
  return {
    steps: [{ ...current, endsAt: null, cues: [] }],
    pausedLeftS: Math.ceil(((current.endsAt ?? at) - at) / 1000),
    pausedShare: (at - current.startsAt) / ((current.endsAt ?? at) - current.startsAt),
  };
}
