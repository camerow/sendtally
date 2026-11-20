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

export function wizardOf(state: WizardState, deps: WizardDeps): Wizard {
  const { path, step, order, trail, memory } = state;
  const { send, capture, update } = deps;
  const setWay = (way: HistoryWay): void =>
    update({
      ...state,
      memory: { ...memory, way },
      order: path === null ? order : remainingSteps(path, way, deps.progress, memory, deps.member),
    });
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
      update(choosePath(state, to, deps));
    },
    answerLog: (existingLog) => {
      send({ step: "log_answered", existingLog });
      setWay(existingLog === "none" || existingLog === "skipped" ? "by_hand" : "import");
    },
    setWay,
    setDays: (days) => update({ ...state, memory: { ...memory, days } }),
    next: (extra) => {
      if (path === null) return;
      capture("onboarding_step_completed", { ...extra, path, step });
      const to = order[order.indexOf(step) + 1];
      if (to !== undefined) update({ ...enter(state, to, capture), trail: [...trail, step] });
    },
    back: () => {
      const to = trail.at(-1);
      if (to !== undefined) update({ ...state, step: to, trail: trail.slice(0, -1) });
    },
    skip: () => send({ step: "skipped", path, at: step }),
    leave: () => send(path === null ? { step: "skipped", path, at: step } : { step: "left", path }),
    complete: (outcome, next) => {
      if (path !== null) send({ step: "completed", path, outcome, next });
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
  const [state, update] = React.useState(() => openWizard(onboarding, { progress, member }, start));

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

  return wizardOf(state, { member, progress, capture, send, update });
}
