import type { Endurance } from "@sendtally/core";
import type { CircuitColour } from "@sendtally/api-client";
import { t } from "../i18n";

export type ClimbResult = "onsight" | "flash" | "sent" | "project";

export type ClimbVM = {
  n: number;
  name: string;
  /** A gym climb's circuit colour, drawn as the dot beside its name. */
  colour?: CircuitColour;
  gradeLabel: string;
  grade: number;
  isTopSend: boolean;
  angleLabel: string;
  burns: number;
  restLabel: string;
  result: ClimbResult;
  /** A send reads in its own discipline's words: boulders are SENT, routes REDPOINT. */
  resultLabel: string;
  /** What the climber wrote about this climb that session. Named climbs only. */
  note: string | null;
  /** Present on a circuit of laps, which reads as per-lap bars rather than a result badge. */
  endurance?: Endurance;
};

export type StatVM = { label: string; value: string; accent: boolean };

export type GradeBarVM = { gradeLabel: string; count: number; height: number; peak: boolean };

export type ClimbFilter = "all" | "sent" | "flash" | "project";

export type ClimbSort = "order" | "gradeDesc" | "gradeAsc" | "burns";

export type PostStatusKind = "posted" | "pending" | "failed" | "before-start" | "off" | "legacy";

export type PostAction = "retry" | "post";

export type PostStatusVM = {
  kind: PostStatusKind;
  label: string;
  detail: string | null;
  alert: boolean;
  action: PostAction | null;
  actionLabel: string | null;
};

export type PostingStatus = { connected: boolean; active: boolean; since: string | null };

export type SessionDetailVM = {
  title: string;
  /** The session's UTC day, for anything that opens dated to it. */
  startDay: string;
  meta: string;
  editable: boolean;
  stats: StatVM[];
  bars: GradeBarVM[];
  filterCounts: Record<ClimbFilter, number>;
  post: PostStatusVM;
  stravaUrl: string | null;
};

export const CLIMB_SORTS: readonly ClimbSort[] = ["order", "gradeDesc", "gradeAsc", "burns"];

const CLIMB_SORT_KEYS = {
  order: "sessionDetail.sortOrder",
  gradeDesc: "sessionDetail.sortGradeDesc",
  gradeAsc: "sessionDetail.sortGradeAsc",
  burns: "sessionDetail.sortBurns",
} as const;

export function climbSortLabel(sort: ClimbSort): string {
  return t(CLIMB_SORT_KEYS[sort]);
}

export const BOARD_LABELS: Record<string, string> = {
  tension: "Tension Board",
  kilter: "Kilter Board",
  grasshopper: "Grasshopper Board",
  decoy: "Decoy Board",
  touchstone: "Touchstone Board",
  soill: "So iLL Board",
  aurora: "Aurora Board",
};
