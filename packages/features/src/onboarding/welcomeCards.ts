import {
  fromUnit,
  isWork,
  startRun,
  type Run,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { kindLabel } from "../activities/format";
import { timerText, type TimerText } from "../hang/timerText";
import { hangLoadText } from "../hang/weights";
import { formatDate, formatNumber, t, type MessageKey } from "../i18n";
import { displayGrade, type GradeScales } from "../sessions/grades";
import type { ExerciseSeries } from "../statistics/exercises";
import type { LoadVM } from "../statistics/loadView";
import { doseSummary } from "../workouts/library";
import { phaseLook, type PhaseLook } from "../workouts/phaseLook";
import type { LoadBar } from "./planMaths";

export type WelcomeCardKey = "blocks" | "workouts" | "hangboard" | "metrics" | "load" | "log";

export type WelcomeCard = {
  key: WelcomeCardKey;
  title: string;
  body: string;
  /** The card read as one element: its title, its line, and where it sits in the six. */
  label: string;
};

export type WelcomeExercise = { name: string; work: string; restBeforeS: number };

export type WelcomeClimb = { gradeLabel: string; name: string; meta: string };

export type WelcomeView = {
  unit: WeightUnit;
  cards: WelcomeCard[];
  legend: { kind: WorkoutKind; name: string }[];
  week: (WorkoutKind[] | null)[];
  bars: LoadBar[];
  exercises: WelcomeExercise[];
  timer: TimerText & { run: Run; reps: number; progress: number; grip: string; look: PhaseLook };
  e1rm: ExerciseSeries;
  load: LoadVM;
  years: number[];
  climbs: WelcomeClimb[];
};

const CARDS: readonly { key: WelcomeCardKey; title: MessageKey; body: MessageKey }[] = [
  { key: "blocks", title: "billing.blocksTitle", body: "onboarding.intro.blocksBody" },
  { key: "log", title: "onboarding.intro.logTitle", body: "onboarding.intro.logBody" },
  { key: "workouts", title: "billing.workoutsTitle", body: "onboarding.intro.workoutsBody" },
  { key: "hangboard", title: "onboarding.intro.hangTitle", body: "onboarding.intro.hangBody" },
  { key: "metrics", title: "onboarding.intro.metricsTitle", body: "onboarding.intro.metricsBody" },
  { key: "load", title: "onboarding.intro.loadTitle", body: "onboarding.intro.loadBody" },
];

const SAMPLE: Record<
  WeightUnit,
  { pull: number; squat: number; deadlift: number; e1rm: number[] }
> = {
  lb: { pull: 45, squat: 135, deadlift: 225, e1rm: [245, 250, 250, 260, 265, 265, 275, 285] },
  kg: {
    pull: 20,
    squat: 60,
    deadlift: 100,
    e1rm: [110, 112.5, 112.5, 117.5, 120, 120, 125, 130],
  },
};

const WEEK: readonly (WorkoutKind | null)[] = [
  "climbing",
  "strength",
  null,
  "hangboard",
  null,
  "climbing",
  null,
];

const BLOCK_PERCENT = [70, 85, 100, 60];

const LOAD_WEEKS = [310, 365, 420, 280, 390, 455, 470, 300, 430, 480, 505, 520];

const LOAD_UP_PERCENT = 12;

const FIRST_WEEK = Date.UTC(2026, 8, 7);

const DAY_MS = 86_400_000;

const CLIMBS: readonly { grade: number; name: MessageKey; gym: boolean; day: string }[] = [
  { grade: 5, name: "onboarding.intro.sampleLeftArete", gym: true, day: "2026-11-21" },
  { grade: 4, name: "onboarding.intro.sampleOrangeSlab", gym: true, day: "2026-11-21" },
  { grade: 6, name: "onboarding.intro.sampleRoofCrack", gym: false, day: "2026-11-15" },
  { grade: 3, name: "onboarding.intro.sampleWarmUp", gym: true, day: "2026-11-12" },
];

const dayText = (ms: number): string =>
  formatDate(new Date(ms), { month: "short", day: "numeric", timeZone: "UTC" });

const isoDay = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

function exercises(unit: WeightUnit): WelcomeExercise[] {
  const sample = SAMPLE[unit];
  const dose = (sets: number, more: { reps?: number; onS?: number; weightKg?: number }): string =>
    doseSummary("strength", { sets, ...more }, unit);
  return [
    {
      name: t("billing.samplePullUp"),
      work: `${dose(4, { reps: 3 })} · ${hangLoadText(fromUnit(sample.pull, unit), unit)}`,
      restBeforeS: 0,
    },
    {
      name: t("billing.sampleSquat"),
      work: dose(3, { reps: 5, weightKg: fromUnit(sample.squat, unit) }),
      restBeforeS: 120,
    },
    {
      name: t("onboarding.intro.sampleDeadlift"),
      work: dose(3, { reps: 5, weightKg: fromUnit(sample.deadlift, unit) }),
      restBeforeS: 180,
    },
    { name: t("onboarding.intro.samplePushUp"), work: dose(3, { reps: 12 }), restBeforeS: 180 },
    { name: t("onboarding.intro.sampleSidePlank"), work: dose(3, { onS: 40 }), restBeforeS: 60 },
    { name: t("onboarding.intro.sampleDip"), work: dose(3, { reps: 8 }), restBeforeS: 60 },
  ];
}

function timer(): WelcomeView["timer"] {
  const reps = 6;
  const started = startRun(
    { name: "", kind: "hang", hangS: 7, restS: 3, reps, sets: 5, setRestS: 180 },
    0
  );
  const index = started.phases.findIndex((p) => isWork(p.kind) && p.set === 2 && p.rep === 4);
  const run: Run = { ...started, index, marks: ["ok", "ok", "ok"] };
  return {
    ...timerText(run, 4),
    run,
    reps,
    progress: 0.55,
    grip: [t("onboarding.intro.sampleGrip"), t("hang.edgeMm", { n: 20 })].join(" · "),
    look: phaseLook(true, false),
  };
}

function e1rm(unit: WeightUnit): ExerciseSeries {
  return {
    key: "deadlift",
    name: t("onboarding.intro.sampleDeadlift"),
    metric: "load",
    sessions: SAMPLE[unit].e1rm.map((value, i) => {
      const kg = fromUnit(value, unit);
      return {
        activityId: `sample-${i}`,
        date: isoDay(FIRST_WEEK + (7 * i + 1) * DAY_MS),
        best: { sets: 1, reps: 1, weightKg: kg },
        value: kg,
        e1rmKg: kg,
        volumeKg: kg,
      };
    }),
  };
}

function load(): LoadVM {
  const average = LOAD_WEEKS.reduce((n, v) => n + v, 0) / LOAD_WEEKS.length;
  const bars = LOAD_WEEKS.map((value, i) => {
    const axis = dayText(FIRST_WEEK + 7 * i * DAY_MS);
    const text = formatNumber(value);
    return { axis, value, text, readout: axis, spoken: `${axis}: ${text}`, under: false };
  });
  const tick = (i: number): string => bars[i]?.axis ?? "";
  return {
    state: "load",
    caption: t("statistics.loadPerWeek"),
    headline: formatNumber(Math.round(average)),
    unit: t("statistics.loadAverageWeek"),
    sentence: t("statistics.loadUp", {
      pct: formatNumber(LOAD_UP_PERCENT),
      prior: t("statistics.loadPrior3m"),
    }),
    bars,
    average,
    averageText: formatNumber(Math.round(average)),
    ticks: [tick(0), tick(Math.floor((bars.length - 1) / 2)), tick(bars.length - 1)],
    note: null,
    leftOutLine: null,
    leftOut: [],
  };
}

/** The signed-out welcome: six cards of what sendtally does, each drawn from sample data in `unit` and `scales`. */
export function welcomeCards(unit: WeightUnit, scales: GradeScales): WelcomeView {
  const last = BLOCK_PERCENT.length - 1;
  return {
    unit,
    cards: CARDS.map(({ key, title, body }, i) => ({
      key,
      title: t(title),
      body: t(body),
      label: t("onboarding.intro.cardLabel", {
        title: t(title),
        body: t(body),
        n: i + 1,
        total: CARDS.length,
      }),
    })),
    legend: [
      { kind: "climbing", name: kindLabel("climbing") },
      { kind: "strength", name: kindLabel("strength") },
      { kind: "hangboard", name: t("onboarding.intro.sampleHangboard") },
    ],
    week: WEEK.map((kind) => (kind === null ? null : [kind])),
    bars: BLOCK_PERCENT.map((pct, i) => ({
      label: formatNumber(pct / 100, { style: "percent" }),
      value: pct,
      deload: i === last,
    })),
    exercises: exercises(unit),
    timer: timer(),
    e1rm: e1rm(unit),
    load: load(),
    years: [2026, 2025, 2024],
    climbs: CLIMBS.map(({ grade, name, gym, day }) => ({
      gradeLabel: displayGrade({ scale: "v", value: grade }, scales),
      name: t(name),
      meta: [
        t(gym ? "onboarding.intro.sampleHomeGym" : "trends.outside"),
        dayText(Date.parse(day)),
      ].join(" · "),
    })),
  };
}
