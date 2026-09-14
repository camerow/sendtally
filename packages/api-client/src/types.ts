import type { hc, InferResponseType } from "hono/client";
import type { AppType } from "@sendtally/api/app";

export type { LogClimbInput, LogSessionInput, ProjectInput } from "@sendtally/api/app";

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
  fingerprint?: string | null;
  parent_id?: string | null;
  severity?: number | null;
  status?: "ongoing" | "resolved" | null;
  tags?: string[];
};

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

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}
