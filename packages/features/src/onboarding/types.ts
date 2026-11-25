import type { ConnectionStatus, FirstRunStep } from "@sendtally/api-client";
import type { LockSource } from "../training/locks";
import type { Shortcut } from "./planMaths";

export type OnboardingStatus = ConnectionStatus["onboarding"];
export type OnboardingProgress = OnboardingStatus["progress"];
export type OnboardingPath = NonNullable<OnboardingStatus["path"]>;
export type StepId = Extract<FirstRunStep, { step: "skipped" }>["at"];
export type PathFrom = Extract<FirstRunStep, { step: "path" }>["from"];
type CompletedNext = Extract<FirstRunStep, { step: "completed" }>["next"];
type MembershipOutcome = Extract<FirstRunStep, { step: "completed" }>["outcome"];

type ExistingLog = Extract<FirstRunStep, { step: "log_answered" }>["existingLog"];

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
        sessions?: Count;
        own?: 0 | 1;
        way?: HistoryWay;
        shortcut?: Shortcut;
      };
    }
  | {
      event: "import_columns_matched";
      properties: {
        columns: Count;
        matched: Count;
        asked: Count;
        edited: Count;
        outcome: "matched" | "fallback";
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
      properties: { source: "onboarding" | LockSource };
    }
  | { event: "onboarding_resumed"; properties: { path: OnboardingPath; at: StepId } }
  | {
      event: "sign_in_failed";
      properties: {
        provider: "google" | "apple";
        reason: "cancelled" | "incomplete" | "error";
        code?: string;
      };
    };

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
};

export type Wizard = {
  path: OnboardingPath | null;
  step: StepId;
  /** Whether back() moves; false on the first step of a walk opened straight onto a path. */
  canGoBack: boolean;
  /** The path's stage `step` is at and how many it has, for the frame's progress; 0 of 0 shows none. */
  position: { n: number; total: number };
  memory: WizardMemory;
  choose: (path: OnboardingPath, from: PathFrom) => void;
  /** H1's answer and which way history goes from it. */
  answerLog: (existingLog: ExistingLog) => void;
  setWay: (way: HistoryWay) => void;
  /** Opens a side step over the current one; its next() comes back to it. */
  open: (step: StepId) => void;
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
