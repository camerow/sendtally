import type { hc, InferRequestType, InferResponseType } from "hono/client";
import type { AppType } from "@sendtally/api/app";

export type {
  Area,
  AreaClimb,
  AreaClimbInput,
  AreaInput,
  AreaSummary,
  Circuit,
  CircuitColour,
  Gym,
  GymInput,
  ImportBody,
  LogClimbInput,
  LogSessionInput,
  ProjectInput,
} from "@sendtally/api/app";

import type { LogClimbInput as ClimbInput } from "@sendtally/api/app";

export type CircuitRef = NonNullable<ClimbInput["circuit"]>;

type Client = ReturnType<typeof hc<AppType>>;

type Ok<T> = InferResponseType<T, 200>;

export type ConnectionStatus = Ok<Client["v1"]["status"]["$get"]>;

export type GradeScales = ConnectionStatus["gradeScales"];

export type Entitlements = Ok<Client["v1"]["entitlements"]["$get"]>;

export type Membership = Entitlements["membership"];

export type StoreMembership = NonNullable<Membership["store"]>;

export type SessionDetail = Ok<Client["v1"]["sessions"][":fingerprint"]["$get"]>["session"];

export type SessionRow = Omit<Ok<Client["v1"]["sessions"]["$get"]>["sessions"][number], "climbs">;

export type SessionClimb = SessionDetail["climbs"][number];

export type SessionWithClimbs = SessionRow & { climbs: SessionClimb[] };

export type SessionTag = SessionDetail["tags"][number];

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
