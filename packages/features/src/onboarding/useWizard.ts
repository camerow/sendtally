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
  update: (change: (state: WizardState) => WizardState) => void;
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

function enter(state: WizardState, step: StepId): WizardState {
  if (step !== "H5" && step !== "P6") return { ...state, step };
  return { ...state, step, memory: { ...state.memory, membershipShown: true } };
}

/** The membership offer just came on screen: the app sends this once, as the step lands on H5 or P6. */
export function paywallOnEnter(path: OnboardingPath | null, step: StepId, capture: Capture): void {
  if (path !== null && (step === "H5" || step === "P6"))
    capture("paywall_shown", { source: "onboarding", path, step });
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

/** Each action is a pure change of the state as it is when React applies it, so two in one handler both land. */
export function wizardOf(state: WizardState, deps: WizardDeps): Wizard {
  const { send, capture, update } = deps;
  const { path, step, order, trail, memory } = state;
  const reorder = (s: WizardState, way: HistoryWay): WizardState => ({
    ...s,
    memory: { ...s.memory, way },
    order:
      s.path === null ? s.order : remainingSteps(s.path, way, deps.progress, s.memory, deps.member),
  });
  const setWay = (way: HistoryWay): void => update((s) => reorder(s, way));
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
      update((s) => choosePath(s, to, deps));
    },
    answerLog: (existingLog) => {
      send({ step: "log_answered", existingLog });
      setWay(existingLog === "none" || existingLog === "skipped" ? "by_hand" : "import");
    },
    setWay,
    setDays: (days) => update((s) => ({ ...s, memory: { ...s.memory, days } })),
    next: (extra) => {
      if (path === null) return;
      capture("onboarding_step_completed", { ...extra, path, step });
      update((s) => {
        const at = s.order.indexOf(s.step);
        const from = at >= 0 ? at : Math.max(-1, ...s.trail.map((x) => s.order.indexOf(x)));
        const to = s.order[from + 1];
        return to === undefined ? s : { ...enter(s, to), trail: [...s.trail, s.step] };
      });
    },
    back: () =>
      update((s) => {
        const to = s.trail.at(-1);
        return to === undefined ? s : { ...s, step: to, trail: s.trail.slice(0, -1) };
      }),
    skip: () => send({ step: "skipped", path, at: step }),
    leave: () =>
      send(path === null ? { step: "skipped", path: null, at: step } : { step: "left", path }),
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

  const { path, step } = state;
  React.useEffect(() => paywallOnEnter(path, step, capture), [path, step, capture]);

  return wizardOf(state, { member, progress, capture, send, update });
}
