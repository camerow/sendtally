import type { hc, InferRequestType, InferResponseType } from "hono/client";
import type { AppType } from "@sendtally/api/app";

export type {
  Activity,
  ActivityInput,
  ActivityKind,
  ActivityPostState,
  ActivityRecord,
  Area,
  AreaClimb,
  AreaClimbInput,
  AreaInput,
  AreaSummary,
  Block,
  BlockInput,
  BuiltInExerciseEntry,
  BuiltInGripEntry,
  BuiltInItemSpec,
  BuiltInLibrary,
  BuiltInWorkoutEntry,
  Circuit,
  CircuitColour,
  Dose,
  Exercise,
  ExerciseInput,
  Gym,
  GymInput,
  CalendarDate,
  Grip,
  HangData,
  HangHistoryPart,
  HangHistoryRow,
  HangKind,
  HangPart,
  HangPostState,
  HangSession,
  HangSessionRecord,
  HangSettings,
  HangWorkout,
  ImportBody,
  Item,
  ItemDone,
  LibraryEntry,
  LibraryPicture,
  LibraryType,
  Loads,
  LogClimbInput,
  LogSessionInput,
  Membership,
  MembershipDays,
  MembershipInput,
  Plan,
  PlanChange,
  PlanLink,
  ProjectInput,
  Protocol,
  SessionItem,
  SetDone,
  SkipReason,
  ThemeName,
  TimeUnit,
  TimeUnits,
  WeekChange,
  WeekChangeInput,
  WeightUnit,
  Weekday,
  Workout,
  WorkoutInput,
  WorkoutKind,
  WorkoutRecord,
} from "@sendtally/api/app";

import type {
  Activity,
  HangHistoryPart,
  HangHistoryRow,
  LogClimbInput as ClimbInput,
} from "@sendtally/api/app";

export type CircuitRef = NonNullable<ClimbInput["circuit"]>;

type Client = ReturnType<typeof hc<AppType>>;

type Ok<T> = InferResponseType<T, 200>;

export type ConnectionStatus = Ok<Client["v1"]["status"]["$get"]>;

export type GradeScales = ConnectionStatus["gradeScales"];

type LibraryItemRoutes = Client["v1"]["moderation"]["library"][":type"][":id"];

/** A moderator's edit to a built-in's text and status. */
export type LibraryEdit = InferRequestType<LibraryItemRoutes["$put"]>["json"];

/** One logged edit to a built-in, by whom, with the state before and after it. */
type LibraryItemView = Extract<Ok<LibraryItemRoutes["$get"]>, { changes: unknown }>;

export type LibraryChange = LibraryItemView["changes"][number];

/** A picture on a built-in as moderation sees it, published or not. */
export type LibraryMediaRow = LibraryItemView["media"][number];

/** A picture ready to upload: its 1600 px file, its 144 px square, and the large one's size. */
export type PictureUpload = InferRequestType<LibraryItemRoutes["media"]["$post"]>["form"];

/** A moderator's edit to one picture. */
export type MediaEdit = InferRequestType<
  Client["v1"]["moderation"]["library"]["media"][":id"]["$patch"]
>["json"];
export type TrainingReminderSettings = ConnectionStatus["trainingReminders"];
export type FirstRunStep = InferRequestType<
  Client["v1"]["preferences"]["first-run"]["$put"]
>["json"];

export type Entitlements = Ok<Client["v1"]["entitlements"]["$get"]>;

export type MembershipStatus = Entitlements["membership"];

export type StoreMembership = NonNullable<MembershipStatus["store"]>;

export type SessionDetail = Ok<Client["v1"]["sessions"][":fingerprint"]["$get"]>["session"];

export type SessionRow = Omit<Ok<Client["v1"]["sessions"]["$get"]>["sessions"][number], "climbs">;

export type SessionClimb = SessionDetail["climbs"][number];

export type SessionWithClimbs = SessionRow & { climbs: SessionClimb[] };

/** The log: climbing sessions, and hangboard sessions and other training beside them but never as them. */
export type SessionLog = {
  sessions: SessionRow[];
  hangSessions: HangHistoryRow[];
  /** Workouts' fingerboard parts, each counted as its activity and read only for grips and minutes. */
  hangParts: HangHistoryPart[];
  activities: Activity[];
};

export type SessionLogWithClimbs = {
  sessions: SessionWithClimbs[];
  hangSessions: HangHistoryRow[];
  /** Workouts' fingerboard parts, each counted as its activity and read only for grips and minutes. */
  hangParts: HangHistoryPart[];
  activities: Activity[];
};

export type SessionTag = SessionDetail["tags"][number];

export type SessionArea = SessionDetail["areas"][number];

export type JournalEntry = Ok<Client["v1"]["entries"]["$get"]>["entries"][number];

export type EntryDetail = Ok<Client["v1"]["entries"][":id"]["$get"]>["entry"];

export type EntryKind = JournalEntry["kind"];

export type EntryInput = {
  kind: EntryKind;
  occurred_at: string;
  ends_at?: string | null;
  title?: string | null;
  body: string;
  fingerprints?: string[];
  parent_id?: string | null;
  severity?: number | null;
  status?: "ongoing" | "resolved" | null;
  tags?: string[];
};

export type ImportResult = { imported: number; skipped: number };

export type TagSummary = Ok<Client["v1"]["tags"]["$get"]>["tags"][number];

export type ClimbSummary = Ok<Client["v1"]["climbs"]["$get"]>["climbs"][number];

/** A note on a climb's page with no session behind it. */
export type ClimbNote = ClimbSummary["notes"][number];
export type ClimbChange = {
  name?: string;
  working?: boolean;
  areaId?: string | null;
  areaClimbId?: string | null;
  grade?: NonNullable<ClimbSummary["grade"]>;
};

export type ClimbGrade = NonNullable<ClimbSummary["grade"]>;

export type GradeScale = ClimbGrade["scale"];

export type Discipline = ClimbSummary["discipline"];

export type PostOutcome = Ok<
  Client["v1"]["sessions"][":fingerprint"]["strava"]["$post"]
>["outcome"];

export type PostState = NonNullable<SessionRow["post_state"]>;

export type SessionSource = SessionRow["source"];

export type SessionLocation = NonNullable<SessionRow["location"]>;

type Areas = Client["v1"]["areas"];
type AreaClimbs = Client["v1"]["area-climbs"];

export type AreaRedirect = { redirect: string };

export type AreaPage = Exclude<Ok<Areas[":slug"]["$get"]>, AreaRedirect>;

export type AreaClimbPage = Exclude<Ok<AreaClimbs[":slug"]["$get"]>, AreaRedirect>;

export type AreaClimbSession = AreaClimbPage["sessions"][number];

export type AreaDraft = NonNullable<Ok<Areas[":id"]["draft"]["$get"]>["draft"]>;

export type AreaDraftInput = InferRequestType<Areas[":id"]["draft"]["$put"]>["json"];

export type AreaClimbDraftInput = InferRequestType<AreaClimbs[":id"]["draft"]["$put"]>["json"];

export type AreaSimilarInput = InferRequestType<Areas["similar"]["$post"]>["json"];

export type ContentReportInput = InferRequestType<Areas["reports"]["$post"]>["json"];

type Moderation = Client["v1"]["moderation"];

export type ModerationQueue = Ok<Moderation["queue"]["$get"]>;

export type CreationItem = ModerationQueue["creations"]["items"][number];

export type ModerationCreations = ModerationQueue["creations"];

export type BulkCreationsInput = InferRequestType<Moderation["creations"]["bulk"]["$post"]>["json"];

export type CreationRef = BulkCreationsInput["items"][number];

export type CreationResult = Extract<
  Ok<Moderation["creations"]["bulk"]["$post"]>,
  { results: unknown }
>["results"][number];

export type RevisionItem = ModerationQueue["revisions"]["items"][number];

export type RevisionConflict = RevisionItem["conflicts"][number];

export type DuplicateItem = ModerationQueue["duplicates"]["items"][number];

export type ReportItem = ModerationQueue["reports"]["items"][number];

export type Role = ConnectionStatus["role"];

/** The request never got an answer: offline, or the server could not be reached. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super("could not reach the server", { cause });
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    /** The parsed error body, for a response that says more than its message. */
    public readonly body: unknown = null
  ) {
    super(message);
  }
}
