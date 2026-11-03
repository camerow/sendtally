import {
  defaultEffortConfig,
  isEndurance,
  score,
  topGradeLabel,
  type Climb,
  type ClimbKind,
  type ClimbStyle,
  type Endurance,
  type Session,
} from "./effort";
import { effortGrade, parseGrade, type Grade } from "./grades";
import type { Focus } from "./hang/plan";

export const CIRCUIT_COLOURS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "black",
  "white",
] as const;

export type CircuitColour = (typeof CIRCUIT_COLOURS)[number];

export type CircuitRef = { id: string; label: string; colour: CircuitColour };

/** A climb as the log-session form sends it, once the API's defaults are applied. */
export type ManualClimbForm = {
  name: string;
  grade: Grade;
  circuit?: CircuitRef | undefined;
  wall?: string | undefined;
  kind: ClimbKind;
  style?: ClimbStyle | undefined;
  tries: number;
  userClimbId?: string | undefined;
  endurance?: Endurance | undefined;
};

export type ManualSessionForm = {
  name?: string | undefined;
  date: string;
  startTime?: string | undefined;
  endTime?: string | undefined;
  rpe?: number | undefined;
  location?: "indoor" | "outdoor" | undefined;
  unscored?: boolean | undefined;
  gymId?: string | undefined;
  areaId?: string | undefined;
  climbs: ManualClimbForm[];
  membershipId?: string | null | undefined;
  week?: number | null | undefined;
  focus?: Focus | null | undefined;
};

/** A scored session as it is stored: what the server writes, and what the app shows until it has. */
export type ManualSessionRow = {
  fingerprint: string;
  /** Absent leaves the plan link as it was. */
  membership_id?: string | null;
  week?: number | null;
  focus?: Focus | null;
  location: "indoor" | "outdoor" | null;
  gym_id: string | null;
  area_id: string | null;
  name: string | null;
  start_at: string;
  end_at: string;
  times: "both" | "start" | "end" | "none";
  climb_count: number;
  send_count: number;
  top_grade: number;
  top_send_grade: number;
  top_grade_label: string | null;
  top_send_grade_label: string | null;
  rpe: number;
  rpe_source: "user" | "computed" | "none";
  title: string;
  summary: string;
  climbs_json: string;
};

const DEFAULT_START = "12:00";
const DEFAULT_DURATION_MINUTES = 90;

function minutesOf(hhmm: string): number {
  return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
}

export function sessionMinutes(body: {
  startTime?: string | undefined;
  endTime?: string | undefined;
}): number {
  if (body.startTime === undefined || body.endTime === undefined) return DEFAULT_DURATION_MINUTES;
  const diff = minutesOf(body.endTime) - minutesOf(body.startTime);
  return diff < 0 ? diff + 24 * 60 : Math.max(diff, 1);
}

function normalisedGrade(grade: Grade): Grade {
  if (grade.scale === "v") return grade;
  return parseGrade(grade.scale, grade.value) ?? grade;
}

function timesOf(body: ManualSessionForm): ManualSessionRow["times"] {
  if (body.startTime !== undefined) return body.endTime === undefined ? "start" : "both";
  return body.endTime === undefined ? "none" : "end";
}

function locationOf(body: ManualSessionForm): ManualSessionRow["location"] {
  if (body.location !== undefined) return body.location;
  if (body.areaId !== undefined) return "outdoor";
  return body.gymId === undefined ? null : "indoor";
}

function rpeSourceOf(body: ManualSessionForm): ManualSessionRow["rpe_source"] {
  if (body.unscored === true) return "none";
  return body.rpe === undefined ? "computed" : "user";
}

function toSession(body: ManualSessionForm): Session {
  const durationMs = sessionMinutes(body) * 60_000;
  const start =
    body.startTime === undefined && body.endTime !== undefined
      ? new Date(
          Math.max(
            Date.parse(`${body.date}T${body.endTime}:00Z`) - durationMs,
            Date.parse(`${body.date}T00:00:00Z`)
          )
        )
      : new Date(`${body.date}T${body.startTime ?? DEFAULT_START}:00Z`);
  const end = new Date(start.getTime() + durationMs);
  const step = durationMs / Math.max(body.climbs.length - 1, 1);
  const climbs: Climb[] = body.climbs.map((c, i) => {
    const grade = normalisedGrade(c.grade);
    return {
      time: new Date(start.getTime() + Math.round(step * i)),
      vGrade: effortGrade(grade),
      name: c.name,
      kind: c.kind,
      ...(c.style === undefined ? {} : { style: c.style }),
      tries: c.tries,
      grade,
      ...(c.endurance === undefined ? {} : { endurance: c.endurance }),
    };
  });
  return { start, end, climbs };
}

// The shape `climbs_json` holds: every climb the user logged, as written by
// buildManualSession and read back by the session endpoints.
export type StoredClimb = {
  time: string;
  name: string;
  vGrade: number;
  kind: ClimbKind;
  style?: ClimbStyle;
  tries: number;
  angle: number | null;
  grade?: Grade;
  circuit?: CircuitRef;
  wall?: string;
  endurance?: Endurance;
  userClimbId?: string;
};

function placeOf(climb: ManualSessionForm["climbs"][number] | undefined): Partial<StoredClimb> {
  if (climb === undefined) return {};
  const wall = climb.wall?.trim() ?? "";
  return {
    ...(climb.circuit === undefined ? {} : { circuit: climb.circuit }),
    ...(wall === "" ? {} : { wall }),
    ...(climb.userClimbId === undefined ? {} : { userClimbId: climb.userClimbId }),
  };
}

export function parseClimbs(climbsJson: string | null | undefined): StoredClimb[] {
  return climbsJson == null ? [] : (JSON.parse(climbsJson) as StoredClimb[]);
}

export function historySession(row: {
  start_at: string;
  end_at: string;
  climbs_json?: string | null;
}): Session | null {
  if (row.climbs_json == null) return null;
  return {
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    climbs: parseClimbs(row.climbs_json).map((c) => ({
      time: new Date(c.time),
      vGrade: c.vGrade,
      name: c.name,
      kind: c.kind,
      tries: c.tries,
      ...(c.endurance === undefined ? {} : { endurance: c.endurance }),
    })),
  };
}

function planLinkOf(
  body: ManualSessionForm
): Pick<ManualSessionRow, "membership_id" | "week" | "focus"> {
  return {
    ...(body.membershipId === undefined
      ? {}
      : { membership_id: body.membershipId, week: body.week ?? null }),
    ...(body.focus === undefined ? {} : { focus: body.focus }),
  };
}

type Scored = Pick<
  ManualSessionRow,
  | "climb_count"
  | "send_count"
  | "top_grade"
  | "top_send_grade"
  | "top_grade_label"
  | "top_send_grade_label"
  | "rpe"
  | "title"
  | "summary"
>;

function scored(session: Session, history: Session[], rpe?: number): Scored {
  const result = score(session, history, defaultEffortConfig(), rpe);
  const graded = session.climbs.filter((c) => !isEndurance(c));
  const sends = graded.filter((c) => c.kind === "send");
  return {
    climb_count: session.climbs.length,
    send_count: sends.length,
    top_grade: graded.reduce((hi, c) => (c.vGrade > hi ? c.vGrade : hi), -1),
    top_send_grade: sends.reduce((hi, c) => (c.vGrade > hi ? c.vGrade : hi), -1),
    top_grade_label: topGradeLabel(graded) ?? null,
    top_send_grade_label: topGradeLabel(sends) ?? null,
    rpe: result.rpe,
    title: result.title,
    summary: result.summary,
  };
}

/** A stored climb at another grade, scored at it from then on. */
export function withGrade<T extends StoredClimb>(climb: T, grade: Grade): T {
  const normalised = normalisedGrade(grade);
  return { ...climb, grade: normalised, vGrade: effortGrade(normalised) };
}

/** A stored session scored again from its climbs, as after one of them was regraded. */
export function rescoredSession(
  row: Pick<
    ManualSessionRow,
    "start_at" | "end_at" | "name" | "rpe" | "rpe_source" | "climbs_json"
  >,
  history: Session[]
): Scored {
  const session: Session = {
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    climbs: parseClimbs(row.climbs_json).map(({ time, angle: _angle, ...c }) => ({
      ...c,
      time: new Date(time),
    })),
  };
  const result = scored(session, history, row.rpe_source === "user" ? row.rpe : undefined);
  return { ...result, title: row.name ?? result.title };
}

export function buildManualSession(
  fingerprint: string,
  body: ManualSessionForm,
  history: Session[]
): ManualSessionRow {
  const session = toSession(body);
  const result = scored(session, history, body.rpe);
  return {
    fingerprint,
    location: locationOf(body),
    gym_id: body.gymId ?? null,
    area_id: body.areaId ?? null,
    name: body.name ?? null,
    start_at: session.start.toISOString(),
    end_at: session.end.toISOString(),
    times: timesOf(body),
    ...result,
    rpe_source: rpeSourceOf(body),
    title: body.name ?? result.title,
    ...planLinkOf(body),
    climbs_json: JSON.stringify(
      session.climbs.map((c, i): StoredClimb => ({
        time: c.time.toISOString(),
        name: c.name,
        vGrade: c.vGrade,
        kind: c.kind,
        ...(c.style === undefined ? {} : { style: c.style }),
        tries: c.tries,
        angle: null,
        grade: c.grade,
        ...(c.endurance === undefined ? {} : { endurance: c.endurance }),
        ...placeOf(body.climbs[i]),
      }))
    ),
  };
}
