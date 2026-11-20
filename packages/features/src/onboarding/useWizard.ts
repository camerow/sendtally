import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import type { ConnectionStatus, FirstRunStep, SendtallyApi } from "@sendtally/api-client";
import { queries } from "../query";
import { remainingSteps } from "./steps";
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

type WizardStart = { path: OnboardingPath; from: PathFrom };

type WizardOptions = { capture: Capture; member: boolean; start?: WizardStart };

type WizardState = {
  path: OnboardingPath | null;
  step: StepId;
  order: readonly StepId[];
  trail: readonly StepId[];
  memory: WizardMemory;
};

type WizardDeps = {
  member: boolean;
  progress: OnboardingProgress;
  capture: Capture;
  send: (to: FirstRunStep) => void;
  update: (state: WizardState) => void;
};

const NO_PROGRESS: OnboardingProgress = {
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
  memory: { way: null, days: [], membershipShown: false },
};

function choosePath(
  state: WizardState,
  path: OnboardingPath,
  { progress, member }: Pick<WizardDeps, "progress" | "member">
): WizardState {
  const order = remainingSteps(path, state.memory.way, progress, state.memory, member);
  const [first] = order;
  if (first === undefined) return state;
  return { ...state, path, order, step: first, trail: [...state.trail, state.step] };
}

function enter(state: WizardState, step: StepId, capture: Capture): WizardState {
  if (state.path === null || (step !== "H5" && step !== "P6")) return { ...state, step };
  capture("paywall_shown", { source: "onboarding", path: state.path, step });
  return { ...state, step, memory: { ...state.memory, membershipShown: true } };
}

/** Where the wizard opens: the path asked for, the path the status says is under way, or the chooser. */
export function openWizard(
  onboarding: OnboardingStatus | undefined,
  deps: Pick<WizardDeps, "progress" | "member">,
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

/** Every action reads the state as it is when called, so two actions in one handler (answerLog then next) both land. */
export function wizardOf(current: () => WizardState, deps: WizardDeps): Wizard {
  const { send, capture, update } = deps;
  const { path, step, order, trail, memory } = current();
  const setWay = (way: HistoryWay): void => {
    const s = current();
    update({
      ...s,
      memory: { ...s.memory, way },
      order:
        s.path === null
          ? s.order
          : remainingSteps(s.path, way, deps.progress, s.memory, deps.member),
    });
  };
  return {
    path,
    step,
    canGoBack: trail.length > 0,
    position:
      step === "choose" ? { n: 0, total: 0 } : { n: order.indexOf(step) + 1, total: order.length },
    memory,
    capture,
    choose: (to, from) => {
      send({ step: "path", path: to, from });
      update(choosePath(current(), to, deps));
    },
    answerLog: (existingLog) => {
      send({ step: "log_answered", existingLog });
      setWay(existingLog === "none" || existingLog === "skipped" ? "by_hand" : "import");
    },
    setWay,
    setDays: (days) => {
      const s = current();
      update({ ...s, memory: { ...s.memory, days } });
    },
    next: (extra) => {
      const s = current();
      if (s.path === null) return;
      capture("onboarding_step_completed", { ...extra, path: s.path, step: s.step });
      const at = s.order.indexOf(s.step);
      const from = at >= 0 ? at : Math.max(-1, ...s.trail.map((x) => s.order.indexOf(x)));
      const to = s.order[from + 1];
      if (to !== undefined) update({ ...enter(s, to, capture), trail: [...s.trail, s.step] });
    },
    back: () => {
      const s = current();
      const to = s.trail.at(-1);
      if (to !== undefined) update({ ...s, step: to, trail: s.trail.slice(0, -1) });
    },
    skip: () => {
      const s = current();
      send({ step: "skipped", path: s.path, at: s.step });
    },
    leave: () => {
      const s = current();
      send(
        s.path === null
          ? { step: "skipped", path: null, at: s.step }
          : { step: "left", path: s.path }
      );
    },
    complete: (outcome, next) => {
      const s = current();
      if (s.path !== null) send({ step: "completed", path: s.path, outcome, next });
    },
  };
}

/** The onboarding wizard, the same on both apps: each app draws `step` and routes after `complete`, `skip` and `leave`. */
export function useWizard(api: SendtallyApi, { capture, member, start }: WizardOptions): Wizard {
  const client = useQueryClient();
  const { data } = useQuery(queries.status(api));
  const onboarding = data?.onboarding;
  // ponytail: opens on NO_PROGRESS when the status is not cached yet; the gate only opens the wizard once it is.
  const progress = onboarding?.progress ?? NO_PROGRESS;
  const [state, setState] = React.useState(() =>
    openWizard(onboarding, { progress, member }, start)
  );
  const latest = React.useRef(state);
  const update = React.useCallback((next: WizardState): void => {
    latest.current = next;
    setState(next);
  }, []);

  const send = React.useCallback(
    (to: FirstRunStep): void => {
      client.setQueryData(
        queries.status(api).queryKey,
        (status) => status && patchStatus(status, to)
      );
      void api.firstRunStep(to).catch(() => undefined);
    },
    [api, client]
  );

  const announced = React.useRef(false);
  React.useEffect(() => {
    if (announced.current) return;
    announced.current = true;
    announceOpen(state, onboarding, start, { send, capture });
  });

  return wizardOf(() => latest.current, { member, progress, capture, send, update });
}
