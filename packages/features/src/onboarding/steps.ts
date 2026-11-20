import type { HistoryWay, OnboardingPath, OnboardingProgress, StepId, WizardMemory } from "./types";

const HISTORY: Record<HistoryWay, readonly StepId[]> = {
  import: ["H1", "H2i", "H3i", "H4", "H5", "H6"],
  by_hand: ["H1", "H2h", "H4", "H5", "H6"],
};

const PLAN: readonly StepId[] = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"];

const PLAN_DONE_BY: readonly (readonly [keyof OnboardingProgress, readonly StepId[]])[] = [
  ["workouts", ["P2"]],
  ["blockMemberships", ["P1", "P3"]],
  ["scheduledBlocks", ["P4"]],
];

const MEMBERSHIP: Record<OnboardingPath, StepId> = { history: "H5", plan: "P6" };

const END: Record<OnboardingPath, StepId> = { history: "H6", plan: "P7" };

export function historySteps(way: HistoryWay | null): StepId[] {
  return way === null ? ["H1"] : [...HISTORY[way]];
}

export function planSteps(): StepId[] {
  return [...PLAN];
}

function pathSteps(
  path: OnboardingPath,
  way: HistoryWay | null,
  progress: OnboardingProgress
): StepId[] {
  if (path === "plan") {
    const done = PLAN_DONE_BY.flatMap(([fact, steps]) => (progress[fact] ? steps : []));
    return planSteps().filter((step) => !done.includes(step));
  }
  if (!progress.sessions) return historySteps(way);
  const byHand = historySteps("by_hand");
  return byHand.slice(byHand.indexOf("H2h"));
}

/** The steps of a path still to do: its order, less what the data already holds and a membership offer already made or not needed. */
export function remainingSteps(
  path: OnboardingPath,
  way: HistoryWay | null,
  progress: OnboardingProgress,
  memory: Pick<WizardMemory, "membershipShown">,
  member: boolean
): StepId[] {
  const steps = pathSteps(path, way, progress);
  return memory.membershipShown || member
    ? steps.filter((step) => step !== MEMBERSHIP[path])
    : steps;
}

export function resumeStep(
  path: OnboardingPath,
  way: HistoryWay | null,
  progress: OnboardingProgress,
  memory: Pick<WizardMemory, "membershipShown">,
  member: boolean
): StepId {
  return remainingSteps(path, way, progress, memory, member)[0] ?? END[path];
}
