import type { ConnectionStatus, FirstRunStep } from "@sendtally/api-client";

export type OnboardingStatus = ConnectionStatus["onboarding"];
export type OnboardingProgress = OnboardingStatus["progress"];
export type OnboardingPath = NonNullable<OnboardingStatus["path"]>;
export type StepId = Extract<FirstRunStep, { step: "skipped" }>["at"];
export type PathFrom = Extract<FirstRunStep, { step: "path" }>["from"];
export type CompletedNext = Extract<FirstRunStep, { step: "completed" }>["next"];
export type MembershipOutcome = Extract<FirstRunStep, { step: "completed" }>["outcome"];

export type ExistingLog = Extract<FirstRunStep, { step: "log_answered" }>["existingLog"];

/** How path history goes on from H1: an export to import, or climbs typed in by hand. */
export type HistoryWay = "import" | "by_hand";

type Count = number;

/** The app-side journey events (spec section 4); the API Worker sends every value event itself. */
export type OnboardingEvent =
  | {
      event: "onboarding_step_completed";
      properties: {
        path: OnboardingPath;
        step: StepId;
        count?: Count;
        sends?: Count;
        way?: HistoryWay;
        shortcut?: "step_up" | "deload" | "both" | "none";
      };
    }
  | {
      event: "import_reviewed";
      properties: { format: string; sessions: Count; issues: Count; duplicates: Count };
    }
  | {
      event: "climb_added";
      properties: {
        kind: "boulder" | "route";
        outcome: "flash" | "send" | "project";
        dated: "year" | "day";
      };
    }
  | {
      event: "onboarding_reveal_viewed";
      properties:
        | { path: "history"; sessions: Count; climbs: Count; sends: Count }
        | { path: "plan"; weeks: Count; sessions_planned: Count; reminders: "on" | "off" };
    }
  | {
      event: "paywall_shown";
      properties: { source: "onboarding"; path: OnboardingPath; step: "H5" | "P6" | "gate" };
    }
  | { event: "onboarding_resumed"; properties: { path: OnboardingPath; at: StepId } };

/** Each app hands in its own PostHog capture: posthog-react-native on mobile, the browser snippet on web. */
export type Capture = <K extends OnboardingEvent["event"]>(
  event: K,
  properties: Extract<OnboardingEvent, { event: K }>["properties"]
) => void;

/** What the wizard keeps on the device between steps: never stored, lost on a kill by design (spec section 2). */
export type WizardMemory = {
  way: HistoryWay | null;
  /** H1's answer, so the import's how-to names that app. */
  existingLog: ExistingLog | null;
  days: readonly number[];
  membershipShown: boolean;
};

export type Wizard = {
  path: OnboardingPath | null;
  step: StepId;
  /** Whether back() moves; false on the first step of a walk opened straight onto a path. */
  canGoBack: boolean;
  /** 1-based place of `step` in its path's remaining order, and that order's length, for the frame's progress. */
  position: { n: number; total: number };
  memory: WizardMemory;
  choose: (path: OnboardingPath, from: PathFrom) => void;
  /** H1's answer and which way history goes from it. */
  answerLog: (existingLog: ExistingLog) => void;
  setWay: (way: HistoryWay) => void;
  setDays: (days: readonly number[]) => void;
  /** Leaves the current step forward; `extra` rides on its onboarding_step_completed. */
  next: (
    extra?: Omit<
      Extract<OnboardingEvent, { event: "onboarding_step_completed" }>["properties"],
      "path" | "step"
    >
  ) => void;
  back: () => void;
  skip: () => void;
  /** Closes the wizard mid-path; the path's card on Plan resumes it. */
  leave: () => void;
  complete: (outcome: MembershipOutcome, next: CompletedNext) => void;
  capture: Capture;
};
