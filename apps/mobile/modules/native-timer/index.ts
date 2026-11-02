import { requireOptionalNativeModule } from "expo";

export type CueSound = "tick" | "work" | "rest" | "finish";

export type StepLook = "work" | "rest" | "ready" | "done";

export type NativeTimerStep = {
  look: StepLook;
  /** "Hang", "Set rest", "Lift", "Done". */
  label: string;
  /** In place of the countdown for a step with no clock: "Tap to log", "Open to save". */
  hint: string | null;
  /** "Set 2 of 6", "Lap 3 of 5", "then Pull-ups". */
  setLine: string;
  startsAt: number;
  /** Null for a step that waits for the user; the schedule stops there. */
  endsAt: number | null;
  /** 0 to 1 through the whole run at the start of this step. */
  runShare: number;
  cues: { at: number; sound: CueSound }[];
};

/** What the operating system shows and plays while the app is minimised. */
export type NativeTimerPayload = {
  /** `startedAt` of the live run; a new id is a new run. */
  runId: string;
  title: string;
  meta: string;
  muted: boolean;
  /** Upcoming steps in order, the current one first. */
  steps: NativeTimerStep[];
  /** Set while paused: the current step frozen with this many seconds left. */
  pausedLeftS: number | null;
  /** Set while paused: 0 to 1 through the current step, for a frozen bar. */
  pausedShare: number | null;
  /** "Paused", shown in place of the label while paused. */
  pausedText: string;
  /** "Next", the kicker over the next step's label. */
  nextText: string;
  /** "Open sendtally", shown once the step on screen has run out with no update. */
  openHint: string;
};

type NativeTimerModule = {
  sync: (payload: string | null) => void;
  areActivitiesEnabled: () => boolean;
};

const native = requireOptionalNativeModule<NativeTimerModule>("NativeTimer");

/** Shows, moves on, or ends the system timer. The same payload twice changes nothing. */
export function sync(payload: NativeTimerPayload | null): void {
  native?.sync(payload === null ? null : JSON.stringify(payload));
}

/** Whether iOS Live Activities are allowed for the app; always true elsewhere. */
export function areActivitiesEnabled(): boolean {
  return native?.areActivitiesEnabled() ?? false;
}
