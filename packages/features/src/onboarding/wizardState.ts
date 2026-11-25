import type { ConnectionStatus, FirstRunStep } from "@sendtally/api-client";
import { isSideStep, remainingSteps, stepPosition } from "./steps";
import type {
  Capture,
  HistoryWay,
  OnboardingPath,
  OnboardingProgress,
  OnboardingStatus,
  PathFrom,
  StepId,
  Wizard,
  WizardMemory,
} from "./types";

export type WizardStart = { path: OnboardingPath; from: PathFrom };

export type WizardOptions = { capture: Capture; start?: WizardStart };

export type WizardState = {
  path: OnboardingPath | null;
  step: StepId;
  order: readonly StepId[];
  trail: readonly StepId[];
  memory: WizardMemory;
};

type WizardDeps = {
  progress: OnboardingProgress;
  capture: Capture;
  send: (to: FirstRunStep) => void;
  update: (change: (state: WizardState) => WizardState) => void;
};

export const NO_PROGRESS: OnboardingProgress = {
  sessions: false,
  exercises: false,
  workouts: false,
  blockMemberships: false,
  scheduledBlocks: false,
};

const CHOOSER: WizardState = {
  path: null,
  step: "choose",
  order: [],
  trail: [],
  memory: { way: null, existingLog: null },
};

function choosePath(
  state: WizardState,
  path: OnboardingPath,
  { progress }: Pick<WizardDeps, "progress">
): WizardState {
  const order = remainingSteps(path, state.memory.way, progress);
  const [first] = order;
  if (first === undefined) return state;
  return { ...state, path, order, step: first, trail: [...state.trail, state.step] };
}

const back = (s: WizardState): WizardState => {
  const to = s.trail.at(-1);
  return to === undefined ? s : { ...s, step: to, trail: s.trail.slice(0, -1) };
};

/** Where the wizard opens: the path asked for, the path the status says is under way, or the chooser. */
export function openWizard(
  onboarding: OnboardingStatus | undefined,
  deps: Pick<WizardDeps, "progress">,
  start?: WizardStart
): WizardState {
  const path = start?.path ?? onboarding?.path ?? null;
  if (path === null) return CHOOSER;
  const opened = choosePath(CHOOSER, path, deps);
  return start === undefined ? opened : { ...opened, trail: [] };
}

/** What opening tells the server and PostHog, sent once per mount. */
export function announceOpen(
  state: WizardState,
  onboarding: OnboardingStatus | undefined,
  start: WizardStart | undefined,
  { send, capture }: Pick<WizardDeps, "send" | "capture">
): void {
  if (start === undefined) {
    if (state.step === "choose") send({ step: "started" });
    return;
  }
  send({ step: "path", ...start });
  if (start.from === "setup_card" && onboarding?.left === true && onboarding.path === start.path)
    capture("onboarding_resumed", { path: start.path, at: state.step });
}

/** The cached status as it reads once the server has taken the transition, so the gate and the setup cards move at once. */
export function patchStatus(status: ConnectionStatus, to: FirstRunStep): ConnectionStatus {
  const moved = (
    change: Partial<OnboardingStatus>,
    firstRun = status.firstRun
  ): ConnectionStatus => ({ ...status, firstRun, onboarding: { ...status.onboarding, ...change } });
  if (to.step === "path") return moved({ path: to.path });
  if (to.step === "left") return moved({ left: true }, false);
  if (to.step === "skipped") return moved({ path: null, left: false }, false);
  if (to.step === "completed" && to.next !== "other_path")
    return moved({ path: null, left: false }, false);
  return status;
}

/** Each action is a pure change of the state as it is when React applies it, so two in one handler both land. */
export function wizardOf(state: WizardState, deps: WizardDeps): Wizard {
  const { send, capture, update } = deps;
  const { path, step, trail, memory } = state;
  const reorder = (s: WizardState, way: HistoryWay): WizardState => ({
    ...s,
    memory: { ...s.memory, way },
    order: s.path === null ? s.order : remainingSteps(s.path, way, deps.progress),
  });
  const setWay = (way: HistoryWay): void => update((s) => reorder(s, way));
  return {
    path,
    step,
    canGoBack: trail.length > 0,
    position: stepPosition(path, step),
    memory,
    capture,
    choose: (to, from) => {
      send({ step: "path", path: to, from });
      update((s) => choosePath(s, to, deps));
    },
    answerLog: (existingLog) => {
      send({ step: "log_answered", existingLog });
      const way = existingLog === "none" || existingLog === "skipped" ? "by_hand" : "import";
      update((s) => {
        const next = reorder(s, way);
        return { ...next, memory: { ...next.memory, existingLog } };
      });
    },
    setWay,
    open: (to) => update((s) => ({ ...s, step: to, trail: [...s.trail, s.step] })),
    next: (extra) => {
      if (path === null) return;
      capture("onboarding_step_completed", { ...extra, path, step });
      update((s) => {
        if (isSideStep(s.step)) return back(s);
        const at = s.order.indexOf(s.step);
        const from = at >= 0 ? at : Math.max(-1, ...s.trail.map((x) => s.order.indexOf(x)));
        const to = s.order[from + 1];
        return to === undefined ? s : { ...s, step: to, trail: [...s.trail, s.step] };
      });
    },
    back: () => update(back),
    skip: () => send({ step: "skipped", path, at: step }),
    leave: () =>
      send(path === null ? { step: "skipped", path: null, at: step } : { step: "left", path }),
    complete: (outcome, next) => {
      if (path !== null) send({ step: "completed", path, outcome, next });
    },
  };
}
