import type { Entitlements } from "@sendtally/api-client";
import { fromUnit, type WeightUnit } from "@sendtally/core/hang";
import { hangLoadText, hangLoadValue } from "../hang/weights";
import { formatDate, t } from "../i18n";
import type { LoadBar } from "../onboarding/planMaths";
import type { MadeCounts } from "../training/locks";
import { doseSummary } from "../workouts/library";
import { isMember, keepEyebrow, trialRunning } from "./access";

type MembersGetCard = { key: "blocks" | "workouts"; title: string; body: string };

type SampleExercise = { name: string; work: string; yours: boolean };

export type MembersGet = {
  heading: string;
  line: string;
  cards: MembersGetCard[];
  bars: LoadBar[];
  exercises: [SampleExercise, SampleExercise];
  restS: number;
};

type TrialPanel = { eyebrow: string; headline: string; note: string };

const SAMPLE: Record<WeightUnit, { bars: number[]; pull: number; squat: number }> = {
  lb: { bars: [20, 25, 30, 15], pull: 45, squat: 135 },
  kg: { bars: [10, 12.5, 15, 7.5], pull: 20, squat: 60 },
};

const shortDate = (iso: string): string =>
  formatDate(new Date(iso), { month: "short", day: "numeric" });

function lockedLine({ workouts, blocks, exercises }: MadeCounts): string {
  const parts = [
    workouts > 0 ? t("billing.madeWorkouts", { count: workouts }) : null,
    blocks > 0 ? t("billing.madeBlocks", { count: blocks }) : null,
    exercises > 0 ? t("billing.madeExercises", { count: exercises }) : null,
  ].filter((p) => p !== null);
  const [a = "", b = "", c = ""] = parts;
  if (parts.length === 0) return t("billing.needsMembership");
  const things =
    parts.length === 1
      ? a
      : parts.length === 2
        ? t("billing.listTwo", { a, b })
        : t("billing.listThree", { a, b, c });
  return t("billing.lockedNotDeleted", { things, count: workouts + blocks + exercises });
}

function line(entitlements: Entitlements, made: MadeCounts | null, now: Date): string | null {
  if (trialRunning(entitlements, now))
    return t("billing.needsMembershipAfter", { date: shortDate(entitlements.trial.endsAt) });
  return made === null ? null : lockedLine(made);
}

export function membersGet(
  entitlements: Entitlements,
  made: MadeCounts | null,
  unit: WeightUnit,
  now: Date = new Date()
): MembersGet | null {
  if (isMember(entitlements, now)) return null;
  const said = line(entitlements, made, now);
  if (said === null) return null;
  const sample = SAMPLE[unit];
  const last = sample.bars.length - 1;
  return {
    heading: t("billing.membersGet"),
    line: said,
    cards: [
      { key: "blocks", title: t("billing.blocksTitle"), body: t("billing.blocksBody") },
      { key: "workouts", title: t("billing.workoutsTitle"), body: t("billing.workoutsBody") },
    ],
    bars: sample.bars.map((value, i) => ({
      label: hangLoadValue(fromUnit(value, unit), unit),
      value,
      deload: i === last,
    })),
    exercises: [
      {
        name: t("billing.samplePullUp"),
        work: `${doseSummary("strength", { sets: 4, reps: 3 }, unit)} · ${hangLoadText(fromUnit(sample.pull, unit), unit)}`,
        yours: true,
      },
      {
        name: t("billing.sampleSquat"),
        work: doseSummary(
          "strength",
          { sets: 3, reps: 5, weightKg: fromUnit(sample.squat, unit) },
          unit
        ),
        yours: false,
      },
    ],
    restS: 120,
  };
}

export function trialPanel(entitlements: Entitlements, now: Date = new Date()): TrialPanel | null {
  if (isMember(entitlements, now) || !trialRunning(entitlements, now)) return null;
  return {
    eyebrow: keepEyebrow(entitlements, now),
    headline: t("billing.daysFree"),
    note: t("billing.noCardNeeded"),
  };
}

export const alwaysFree = (): string[] => [
  t("billing.freeLogging"),
  t("billing.freeHistory"),
  t("billing.freeBuiltIns"),
  t("billing.freeStrava"),
];
