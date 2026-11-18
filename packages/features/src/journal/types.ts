import type {
  Activity,
  EntryKind,
  HangHistoryRow,
  JournalEntry,
  Plan,
  SessionRow,
  SessionTag,
  ClimbSummary,
  HangHistoryPart,
  SessionWithClimbs,
} from "@sendtally/api-client";
import type { Discipline } from "@sendtally/core";
import type { Focus, Membership, WorkoutKind } from "@sendtally/core/hang";
import type { ClimbLogVM, ClimbStatusFilter, ClimbingSessionVM, GradeFilter } from "../climbs/log";
import type { GradeScales } from "../sessions/grades";
import type { TrendRange } from "../trends/types";
import type { BlockRecap } from "../training/recap";

export type { EntryKind, JournalEntry };

export const ENTRY_KINDS = ["journal", "trip", "injury"] as const;

/** Only these span dates; the composer swaps a field group on the rest. */
export const SPANNING_KINDS: EntryKind[] = ["trip", "injury"];

export const ENTRY_BODY_MAX = 10000;

/**
 * One log holds sessions, other training and entries. `at` is what the list sorts and groups on,
 * and `tags` is lifted to the top so the tag filter works over both without
 * knowing which it is looking at. A trip in a grouped log holds what was logged
 * inside its dates in `inside`; everywhere else it is empty. A session of a block's workouts
 * names the block and week in `blockTag`, and a finished block is a row on its last day.
 */
export type LogItem = { key: string; at: string; tags: SessionTag[]; blockTag?: string } & (
  | { type: "session"; session: SessionRow }
  | { type: "hang"; hang: HangHistoryRow }
  | { type: "activity"; activity: Activity }
  | { type: "entry"; entry: JournalEntry; inside: LogItem[] }
  | { type: "block"; recap: BlockRecap }
);

/** The plan and finished blocks the log reads to tag sessions and mark blocks done. */
export type LogTraining = {
  plan: Pick<Plan, "blocks" | "memberships">;
  finished: readonly BlockRecap[];
};

/** A trip's dates, or a draft's before it is saved: `id` is null until then. */
export type TripSpan = { id: string | null; occurred_at: string; ends_at: string | null };

/** What a composer holds while it is being filled in. Strings throughout: forms edit strings. */
export type EntryDraft = {
  kind: EntryKind;
  occurredAt: string;
  endsAt: string;
  title: string;
  body: string;
  fingerprints: string[];
  tags: string[];
  /** Set only while writing an update on a thread. */
  parentId: string;
  severity: number | null;
};

/** The kinds of row the Log's Show filter picks between; none picked is every one. */
export const LOG_ROW_TYPES = ["climbing", "training", "journal", "trip", "injury"] as const;

export type LogRowType = (typeof LOG_ROW_TYPES)[number];

/** An effort range on the 1-10 scale, both ends inclusive. */
export type EffortRange = { lo: number; hi: number };

/** Everything the Log can be narrowed by. Empty lists and nulls narrow nothing. */
export type LogFilter = {
  show: readonly LogRowType[];
  when: TrendRange;
  effort: EffortRange | null;
  tags: readonly string[];
  discipline: Discipline | null;
  grade: GradeFilter | null;
  outcome: ClimbStatusFilter;
  setting: "indoor" | "outdoor" | null;
  /** A gym or crag id. */
  place: string | null;
  categories: readonly WorkoutKind[];
  exercise: string | null;
  block: string | null;
  workout: string | null;
  foci: readonly Focus[];
  search: string;
};

/** What the Log reads besides its rows to match them: the climbs in each session, the parts, the plan and the names of places. */
export type LogContext = {
  climbs: readonly ClimbSummary[];
  sessions: readonly SessionWithClimbs[];
  hangParts: readonly HangHistoryPart[];
  memberships: readonly Pick<Membership, "id" | "workoutId" | "blockId">[];
  places: ReadonlyMap<string, string>;
  scales: GradeScales;
};

/** The dated list, each session carrying only the climbs that pass, or one row per climb once a grade or outcome is set. */
export type LogView =
  | { kind: "dated"; items: LogItem[]; climbing: ReadonlyMap<string, ClimbingSessionVM> }
  | { kind: "climbs"; log: ClimbLogVM };

/** One active filter under the bar, and the filter left once it is dropped. */
export type LogPill = { key: string; label: string; without: LogFilter };
