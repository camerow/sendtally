import type { Endurance } from "@sendtally/core";
import type { CircuitColour } from "@sendtally/api-client";
import type { ClimbPillKind } from "../climbs/log";
import type { PyramidRow } from "../climbs/pyramid";
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
  angleLabel: string | null;
  attempts: number;
  result: ClimbResult;
  /** How its result pill reads, as in the log: an unsent climb is a project only when it is one. */
  pill: ClimbPillKind;
  /** A send reads in its own discipline's words: boulders are SENT, routes REDPOINT. */
  resultLabel: string;
  /** What the climber wrote about this climb that session. Named climbs only. */
  note: string | null;
  /** The Areas climb this one is linked to, for a link to its page. */
  climbSlug: string | null;
  /** The name of the area the climb was at. */
  area: string | null;
  /** Present on a circuit of laps, which reads as per-lap bars rather than a result badge. */
  endurance?: Endurance;
};

export type StatVM = { label: string; value: string; accent: boolean };

export type GradeBarVM = { gradeLabel: string; count: number; height: number; peak: boolean };

export type ClimbFilter = "all" | "sent" | "flash" | "project";

export type ClimbSort = "order" | "gradeDesc" | "gradeAsc" | "attempts";

export type PostingStatus = { connected: boolean; active: boolean; since: string | null };

export type SessionDetailVM = {
  title: string;
  /** The title without its date, for a screen that dates it in its meta line. */
  name: string;
  /** Where the session was: its areas outdoors, its gym indoors; empty when neither is known. */
  place: string;
  /** Day, start time and length. */
  when: string;
  rpe: number | null;
  /** The session's UTC day, for anything that opens dated to it. */
  startDay: string;
  meta: string;
  editable: boolean;
  /** Each distinct area its climbs were at, for a link to each. */
  areas: Array<{ name: string; slug: string }>;
  /** Whether a climb names its area: on a day with two or more, or indoors, where it marks one outdoor. */
  climbAreas: boolean;
  stats: StatVM[];
  bars: GradeBarVM[];
  pyramid: PyramidRow[];
  filterCounts: Record<ClimbFilter, number>;
};

export const CLIMB_SORTS: readonly ClimbSort[] = ["order", "gradeDesc", "gradeAsc", "attempts"];

const CLIMB_SORT_KEYS = {
  order: "sessionDetail.sortOrder",
  gradeDesc: "sessionDetail.sortGradeDesc",
  gradeAsc: "sessionDetail.sortGradeAsc",
  attempts: "sessionDetail.sortAttempts",
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
