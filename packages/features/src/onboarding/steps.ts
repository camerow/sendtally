import type { HistoryWay, OnboardingPath, OnboardingProgress, StepId } from "./types";

const HISTORY: Record<HistoryWay, readonly StepId[]> = {
  import: ["H1", "H2i", "H3i", "H4", "H6"],
  by_hand: ["H1", "H2h", "H4", "H6"],
};

const PLAN: readonly StepId[] = ["P1w", "P5", "P7"];

/** The builder and Shape the weeks: opened from a step, they return to it and count no progress. */
const SIDE_STEPS: readonly StepId[] = ["P2", "P4"];

export const isSideStep = (step: StepId): boolean => SIDE_STEPS.includes(step);

/** The history path's three stages: the question, bringing climbs in (any way), the reveal; H6 closes it. */
const HISTORY_STAGE: Partial<Record<StepId, number>> = {
  H1: 1,
  H2i: 2,
  H2s: 2,
  H3i: 2,
  H2h: 2,
  H4: 3,
  H6: 3,
};

/** The plan path's two stages: Build your week and the reveal; P7 closes it. */
const PLAN_STAGE: Partial<Record<StepId, number>> = { P1w: 1, P5: 2, P7: 2 };

const STAGES: Record<OnboardingPath, { table: Partial<Record<StepId, number>>; total: number }> = {
  history: { table: HISTORY_STAGE, total: 3 },
  plan: { table: PLAN_STAGE, total: 2 },
};

/** Where the frame's progress stands; none on the chooser or a side step. */
export function stepPosition(
  path: OnboardingPath | null,
  step: StepId
): { n: number; total: number } {
  const stages = path === null ? undefined : STAGES[path];
  const stage = stages?.table[step];
  return stages === undefined || stage === undefined
    ? { n: 0, total: 0 }
    : { n: stage, total: stages.total };
}

const END: Record<OnboardingPath, StepId> = { history: "H6", plan: "P7" };

export function historySteps(way: HistoryWay | null): StepId[] {
  return way === null ? ["H1"] : [...HISTORY[way]];
}

/** The steps of a path still to do: its order, less what the data already holds. */
export function remainingSteps(
  path: OnboardingPath,
  way: HistoryWay | null,
  progress: OnboardingProgress
): StepId[] {
  if (path === "plan") return PLAN.filter((step) => step !== "P1w" || !progress.scheduledBlocks);
  if (!progress.sessions) return historySteps(way);
  const byHand = historySteps("by_hand");
  return byHand.slice(byHand.indexOf("H2h"));
}

export function resumeStep(
  path: OnboardingPath,
  way: HistoryWay | null,
  progress: OnboardingProgress
): StepId {
  return remainingSteps(path, way, progress)[0] ?? END[path];
}
