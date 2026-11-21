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

/** The history path's four stages: the question, bringing climbs in (any way), the reveal, the offer. */
const HISTORY_STAGE: Partial<Record<StepId, number>> = {
  H1: 1,
  H2i: 2,
  H2s: 2,
  H3i: 2,
  H2h: 2,
  H4: 3,
  H5: 4,
  H6: 4,
};

/** Where the frame's progress stands: history's fixed four stages, else the place in the path's order. */
/** The plan path's six stages; P7 closes it with no bar, and a member who skips P6 still counts six. */
const PLAN_STAGE: Partial<Record<StepId, number>> = {
  P1: 1,
  P2: 2,
  P3: 3,
  P4: 4,
  P5: 5,
  P6: 6,
  P7: 6,
};

const STAGES: Record<OnboardingPath, { table: Partial<Record<StepId, number>>; total: number }> = {
  history: { table: HISTORY_STAGE, total: 4 },
  plan: { table: PLAN_STAGE, total: 6 },
};

export function stepPosition(
  path: OnboardingPath | null,
  step: StepId,
  order: readonly StepId[]
): { n: number; total: number } {
  if (step === "choose") return { n: 0, total: 0 };
  const stages = path === null ? undefined : STAGES[path];
  const stage = stages?.table[step];
  return stages === undefined || stage === undefined
    ? { n: order.indexOf(step) + 1, total: order.length }
    : { n: stage, total: stages.total };
}

const END: Record<OnboardingPath, StepId> = { history: "H6", plan: "P7" };

export function historySteps(way: HistoryWay | null): StepId[] {
  return way === null ? ["H1"] : [...HISTORY[way]];
}

function pathSteps(
  path: OnboardingPath,
  way: HistoryWay | null,
  progress: OnboardingProgress
): StepId[] {
  if (path === "plan") {
    const done = PLAN_DONE_BY.flatMap(([fact, steps]) => (progress[fact] ? steps : []));
    return PLAN.filter((step) => !done.includes(step));
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
