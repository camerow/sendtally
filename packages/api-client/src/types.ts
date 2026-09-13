import type { hc, InferResponseType } from "hono/client";
import type { AppType } from "@sendtally/sync-service/app";

export type { LogClimbInput, LogSessionInput, ProjectInput } from "@sendtally/sync-service/app";

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
