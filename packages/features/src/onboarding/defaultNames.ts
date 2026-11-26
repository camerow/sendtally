import { toLocalDate, type CalendarDate, type WorkoutKind } from "@sendtally/core/hang";
import { formatDate, t, type MessageKey } from "../i18n";

const WORKOUT_NAMES: Record<WorkoutKind, MessageKey> = {
  hangboard: "onboarding.plan.workout.defaultHangboard",
  climbing: "onboarding.plan.workout.defaultClimbing",
  strength: "onboarding.plan.workout.defaultStrength",
  mobility: "onboarding.plan.workout.defaultMobility",
  other: "onboarding.plan.workout.defaultOther",
};

/** "Strength workout": named for the kind of its first exercise, strength before there is one. */
export const defaultWorkoutName = (firstKind: WorkoutKind | undefined): string =>
  t(WORKOUT_NAMES[firstKind ?? "strength"]);

/** "November block": the month it starts in. */
export const defaultBlockName = (start: CalendarDate): string =>
  t("onboarding.plan.block.defaultName", {
    month: formatDate(toLocalDate(start), { month: "long" }),
  });

/** What the user typed, unless they typed nothing, which falls back to the default. */
export const nameOr = (typed: string | null, fallback: string): string =>
  typed === null || typed.trim() === "" ? fallback : typed.trim();
