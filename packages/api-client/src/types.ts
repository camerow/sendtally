export type ConnectionStatus = {
  strava: {
    athleteId: number;
    status: string;
    postingEnabled: boolean;
    postSince: string | null;
  } | null;
};

export type StoreMembership = {
  store: string;
  productId?: string;
  expiresAt: string | null;
  willRenew: boolean;
};

export type Membership = {
  active: boolean;
  web: boolean;
  store: StoreMembership | null;
};

export type Entitlements = { membership: Membership };

export type PostState = "pending" | "posted" | "failed";

export type PostOutcome = "posted" | "updated" | "skipped" | "failed";

export type GradeScale = "v" | "font" | "yds" | "french";

export type ClimbGrade =
  | { scale: "v"; value: number }
  | { scale: "font"; value: string }
  | { scale: "yds"; value: string }
  | { scale: "french"; value: string };

export type SessionClimb = {
  time: string;
  name: string;
  vGrade: number;
  kind: "send" | "attempt";
  tries: number;
  angle: number | null;
  grade?: ClimbGrade;
};

export type SessionTag = { id: string; name: string; slug: string };

export type Discipline = "boulder" | "route";

export type ProjectInput = {
  name: string;
  discipline?: Discipline;
  grade?: ClimbGrade;
  beta?: string;
};

export type ClimbSummary = {
  slug: string;
  name: string;
  grade: ClimbGrade | null;
  discipline: Discipline;
  project: boolean;
  beta: string | null;
  beta_updated_at: string | null;
  sessions: number;
  attempts: number;
  sends: number;
  first_at: string;
  last_at: string;
};

export type TagSummary = SessionTag & { session_count: number };

export type SessionSource = "board" | "manual";

export type SessionLocation = "indoor" | "outdoor";

export type SessionRow = {
  fingerprint: string;
  board: string | null;
  source: SessionSource;
  location: SessionLocation | null;
  name: string | null;
  start_at: string;
  end_at: string;
  climb_count: number;
  top_grade: number;
  top_send_grade: number;
  top_grade_label: string | null;
  top_send_grade_label: string | null;
  rpe: number;
  title: string;
  notes: string | null;
  strava_activity_id: number | null;
  posted_at: string | null;
  post_state: PostState | null;
  post_error: string | null;
  inProgress: boolean;
  tags: SessionTag[];
};

export type LogClimbInput = {
  name?: string;
  grade: ClimbGrade;
  kind?: "send" | "attempt";
  tries?: number;
  project?: boolean;
};

export type LogSessionInput = {
  name?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  rpe?: number;
  location: SessionLocation;
  tags?: string[];
  notes?: string;
  climbs: LogClimbInput[];
};

export type SessionDetail = SessionRow & { climbs: SessionClimb[] };

export type SessionWithClimbs = SessionRow & { climbs: SessionClimb[] };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }
}
