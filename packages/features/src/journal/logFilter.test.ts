import { describe, expect, it } from "vitest";
import type {
  Activity,
  ClimbSummary,
  HangHistoryPart,
  HangHistoryRow,
  JournalEntry,
  SessionClimb,
  SessionWithClimbs,
} from "@sendtally/api-client";
import { DEFAULT_GRADE_SCALES as SCALES } from "../settings/transforms";
import { NO_LOG_FILTER, filterLog, logFilterPills, updateLogFilter } from "./logFilter";
import { logItems } from "./transforms";
import type { LogContext, LogFilter, LogItem, LogView } from "./types";

const NOW = new Date("2026-11-18T20:00:00.000Z");

const session = (
  fingerprint: string,
  start_at: string,
  over: Partial<SessionWithClimbs> = {}
): SessionWithClimbs => ({
  fingerprint,
  board: null,
  source: "manual",
  location: "indoor",
  gym_id: "riverside",
  area_id: null,
  name: null,
  start_at,
  end_at: start_at,
  times: "both",
  climb_count: 0,
  send_count: 0,
  top_grade: 5,
  top_send_grade: 5,
  top_grade_label: null,
  top_send_grade_label: null,
  notes: null,
  rpe: 7,
  rpe_source: "computed",
  title: "T",
  strava_activity_id: null,
  posted_at: null,
  post_state: null,
  post_error: null,
  membership_id: null,
  week: null,
  focus: null,
  tags: [],
  climbs: [],
  ...over,
});

const logged = (name: string, over: Partial<SessionClimb> = {}): SessionClimb =>
  ({ name, kind: "attempt", tries: 1, ...over }) as SessionClimb;

const climb = (
  id: string,
  name: string,
  v: number,
  over: Partial<ClimbSummary> = {}
): ClimbSummary => ({
  id,
  slug: id,
  name,
  grade: { scale: "v", value: v },
  discipline: "boulder",
  project: false,
  area_climb_id: null,
  area: null,
  sessions: 1,
  attempts: 1,
  sends: 1,
  first_at: "2026-11-17T18:00:00.000Z",
  last_at: "2026-11-17T18:00:00.000Z",
  sent_at: "2026-11-17T18:00:00.000Z",
  notes: [],
  ...over,
});

const hang = (id: string, date: string, over: Partial<HangHistoryRow> = {}): HangHistoryRow => ({
  id,
  workoutId: "repeaters",
  gripId: "half",
  gripName: "Half crimp",
  date,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe: 7,
  edgeMm: 20,
  protocol: {
    name: "Repeaters",
    kind: "hang",
    hangS: 7,
    restS: 3,
    reps: 6,
    sets: 4,
    setRestS: 120,
  },
  stravaActivityId: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  postState: null,
  postError: null,
  updatedAt: `${date}T19:00:00.000Z`,
  ...over,
});

const activity = (id: string, date: string, over: Partial<Activity> = {}): Activity => ({
  id,
  kind: "strength",
  title: "Upper body pull",
  date,
  startTime: "18:00",
  minutes: 50,
  rpe: 6,
  notes: null,
  workoutId: "pull",
  membershipId: null,
  week: null,
  focus: "strength",
  done: [{ item: 0, exercise: "Pull-ups", sets: [] }],
  ...over,
});

const entry = (id: string, over: Partial<JournalEntry>): JournalEntry => ({
  id,
  kind: "journal",
  occurred_at: "2026-11-10",
  ends_at: null,
  title: null,
  body: "",
  fingerprints: [],
  parent_id: null,
  severity: null,
  status: null,
  created_at: "2026-11-10T20:00:00.000Z",
  updated_at: "2026-11-10T20:00:00.000Z",
  tags: [],
  ...over,
});

const crimp = climb("crimp", "Crimp ladder", 6, { project: true, sent_at: null, sends: 0 });
const arete = climb("arete", "Blue arete", 5);
const slab = climb("slab", "Slab traverse", 4);
const prow = climb("prow", "The Prow", 3, {
  area: { id: "pine", name: "Pine Ridge" },
  last_at: "2026-10-02T10:00:00.000Z",
});

const evening = session("evening", "2026-11-17T18:00:00.000Z", {
  name: "Evening session",
  tags: [{ id: "t1", name: "Comp prep", slug: "comp-prep" }],
  climbs: [
    logged("Crimp ladder", { tries: 4 }),
    logged("Blue arete", { kind: "send", tries: 3 }),
    logged("Slab traverse", { kind: "send", style: "flash" }),
  ],
});
const fourByFour = session("4x4", "2026-11-14T18:00:00.000Z", {
  name: "4x4s",
  membership_id: "m-4x4",
  focus: "power_endurance",
  rpe: 9,
});
const tripDay = session("trip-day", "2026-10-02T10:00:00.000Z", {
  location: "outdoor",
  gym_id: null,
  area_id: "pine",
  climbs: [logged("The Prow", { kind: "send", style: "onsight" })],
});

const sessions = [evening, fourByFour, tripDay];
const hangs = [hang("repeaters", "2026-11-16")];
const activities = [
  activity("pull", "2026-11-18", { membershipId: "m-pull" }),
  activity("core", "2026-11-17", {
    title: "Max hangs + core",
    startTime: "16:00",
    workoutId: "core",
    rpe: 8,
    done: [{ item: 0, exercise: "Hanging leg raise", sets: [] }],
  }),
  activity("hips", "2026-11-12", {
    kind: "mobility",
    title: "Hips and shoulders",
    workoutId: null,
    rpe: null,
    focus: null,
    done: [],
  }),
];
const part: HangHistoryPart = {
  ...hang("core-part", "2026-11-17", { gripId: "half", gripName: "Half crimp" }),
  workoutId: "core",
  activityId: "core",
};
const entries = [
  entry("thoughts", { title: "Rest week thoughts" }),
  entry("trip", {
    kind: "trip",
    title: "Pine Ridge",
    occurred_at: "2026-10-01",
    ends_at: "2026-10-03",
  }),
];

const training = {
  plan: {
    blocks: [
      {
        id: "winter",
        name: "Winter base",
        description: "",
        start: "2026-11-02",
        weeks: 6,
        focus: null,
      },
    ],
    memberships: [
      {
        id: "m-4x4",
        workoutId: "4x4",
        blockId: "winter",
        weekdays: [],
        start: "2026-11-02",
        position: 0,
      },
      {
        id: "m-pull",
        workoutId: "pull",
        blockId: "winter",
        weekdays: [],
        start: "2026-11-02",
        position: 1,
      },
    ],
  },
  finished: [],
};

const items: LogItem[] = logItems(sessions, entries, hangs, activities, training);

const ctx: LogContext = {
  climbs: [crimp, arete, slab, prow],
  sessions,
  hangParts: [part],
  memberships: training.plan.memberships,
  places: new Map([
    ["riverside", "Riverside"],
    ["pine", "Pine Ridge"],
  ]),
  scales: SCALES,
};

const view = (patch: Partial<LogFilter>): LogView =>
  filterLog(items, updateLogFilter(NO_LOG_FILTER, patch), ctx, NOW);

const keys = (v: LogView): string[] => {
  if (v.kind !== "dated") throw new Error("expected the dated list");
  return v.items.flatMap((i) =>
    i.type === "entry" ? [i.key, ...i.inside.map((x) => `  ${x.key}`)] : [i.key]
  );
};

const climbsUnder = (v: LogView, fingerprint: string): string[] =>
  v.kind === "dated" ? (v.climbing.get(fingerprint)?.climbs.map((c) => c.name) ?? []) : [];

describe("filterLog", () => {
  it("lists every row once, newest first, trips holding what falls inside them", () => {
    expect(keys(view({}))).toEqual([
      "activity:pull",
      "session:evening",
      "activity:core",
      "hang:repeaters",
      "session:4x4",
      "activity:hips",
      "entry:thoughts",
      "entry:trip",
      "  session:trip-day",
    ]);
  });

  it("keeps a climbing workout run on the wall as its one session", () => {
    const v = view({ workout: "4x4" });
    expect(keys(v)).toEqual(["session:4x4"]);
  });

  it("never lists a workout's fingerboard part as a row of its own", () => {
    expect(keys(view({ show: ["training"] }))).not.toContain("hang:core-part");
    expect(keys(view({ search: "half crimp" }))).toEqual(["activity:core", "hang:repeaters"]);
  });

  it("shows only the types lit in Show", () => {
    expect(keys(view({ show: ["journal"] }))).toEqual(["entry:thoughts"]);
    expect(keys(view({ show: ["climbing"] }))).toEqual([
      "session:evening",
      "session:4x4",
      "session:trip-day",
    ]);
  });

  it("lists trips with everything they hold when Show is only Trips", () => {
    expect(keys(view({ show: ["trip"] }))).toEqual(["entry:trip", "  session:trip-day"]);
  });

  it("narrows by when", () => {
    expect(keys(view({ when: "1m" }))).toEqual([
      "activity:pull",
      "session:evening",
      "activity:core",
      "hang:repeaters",
      "session:4x4",
      "activity:hips",
      "entry:thoughts",
    ]);
  });

  it("narrows by effort, leaving out rows with none", () => {
    expect(keys(view({ effort: { lo: 8, hi: 9 } }))).toEqual(["activity:core", "session:4x4"]);
  });

  it("narrows by tag", () => {
    expect(keys(view({ tags: ["comp-prep"] }))).toEqual(["session:evening"]);
  });

  it("narrows climbing by where, lighting Climbing", () => {
    expect(keys(view({ setting: "outdoor" }))).toEqual(["session:trip-day"]);
    expect(keys(view({ place: { kind: "gym", id: "riverside" } }))).toEqual([
      "session:evening",
      "session:4x4",
    ]);
  });

  it("narrows by discipline, keeping only sessions with a climb of it", () => {
    const v = view({ discipline: "route" });
    expect(keys(v)).toEqual([]);
  });

  it("narrows training by category and exercise, lighting Training", () => {
    expect(keys(view({ categories: ["mobility"] }))).toEqual(["activity:hips"]);
    expect(keys(view({ categories: ["hangboard"] }))).toEqual(["hang:repeaters"]);
    expect(keys(view({ exercise: "pull-ups" }))).toEqual(["activity:pull"]);
    expect(keys(view({ exercise: "half crimp" }))).toEqual(["activity:core", "hang:repeaters"]);
  });

  it("narrows both types by block, workout and focus from the plan", () => {
    expect(keys(view({ block: "winter" }))).toEqual(["activity:pull", "session:4x4"]);
    expect(keys(view({ workout: "pull" }))).toEqual(["activity:pull"]);
    expect(keys(view({ foci: ["power_endurance"] }))).toEqual(["session:4x4"]);
  });

  it("shows a session found by one climb with only that climb", () => {
    const v = view({ search: "crimp" });
    expect(keys(v)).toEqual(["session:evening", "activity:core", "hang:repeaters"]);
    expect(climbsUnder(v, "evening")).toEqual(["Crimp ladder"]);
  });

  it("shows every climb of a session found by its own name", () => {
    const v = view({ search: "evening" });
    expect(climbsUnder(v, "evening")).toEqual(["Crimp ladder", "Blue arete", "Slab traverse"]);
  });

  it("finds workouts, journal titles, blocks and places by search", () => {
    expect(keys(view({ search: "upper body" }))).toEqual(["activity:pull"]);
    expect(keys(view({ search: "rest week" }))).toEqual(["entry:thoughts"]);
    expect(keys(view({ search: "pine ridge" }))).toEqual(["entry:trip", "  session:trip-day"]);
  });

  it("switches to one row per climb with a grade or outcome, and back without", () => {
    const flat = view({ outcome: "sent" });
    expect(flat.kind).toBe("climbs");
    if (flat.kind !== "climbs") return;
    expect(flat.log.groups.flatMap((g) => g.rows.map((r) => r.name))).toEqual([
      "Blue arete",
      "Slab traverse",
      "The Prow",
    ]);
    const graded = view({ grade: { scale: "v", from: "V5", to: "V6" } });
    expect(graded.kind === "climbs" && graded.log.groups.map((g) => g.key)).toEqual([
      "pinned",
      "2026-11",
    ]);
    expect(view({ grade: null, outcome: "all" }).kind).toBe("dated");
  });

  it("narrows the per-climb list by the session filters too", () => {
    const v = view({ outcome: "sent", setting: "outdoor" });
    expect(v.kind === "climbs" && v.log.groups.flatMap((g) => g.rows.map((r) => r.name))).toEqual([
      "The Prow",
    ]);
  });

  it("says nothing matches with an empty list", () => {
    expect(keys(view({ search: "nothing like this" }))).toEqual([]);
  });
});

describe("updateLogFilter", () => {
  it("clears a type's group when Show leaves it out", () => {
    const set = updateLogFilter(NO_LOG_FILTER, { outcome: "sent", categories: ["strength"] });
    expect(set.show).toEqual(["climbing", "training"]);
    const next = updateLogFilter(set, { show: ["training"] });
    expect(next.outcome).toBe("all");
    expect(next.categories).toEqual(["strength"]);
  });
});

describe("logFilterPills", () => {
  const names = {
    tag: (s: string) => s,
    place: () => "Riverside",
    block: () => "Winter base",
    workout: () => "Max hangs",
    exercise: () => "Half crimp",
  };

  it("names each active filter, and drops one with its pill", () => {
    const filter = updateLogFilter(NO_LOG_FILTER, {
      grade: { scale: "v", from: "V4", to: "V6" },
      outcome: "sent",
      place: { kind: "gym", id: "riverside" },
    });
    const pills = logFilterPills(filter, names);
    expect(pills.map((p) => p.label)).toEqual(["Climbing", "V4 to V6", "Sent", "Riverside"]);
    expect(pills[2]?.without.outcome).toBe("all");
  });

  it("dropping a Show pill clears its group", () => {
    const filter = updateLogFilter(NO_LOG_FILTER, { outcome: "sent" });
    const [show] = logFilterPills(filter, names);
    expect(show?.without).toEqual(NO_LOG_FILTER);
  });

  it("has no pills with nothing set", () => {
    expect(logFilterPills(NO_LOG_FILTER, names)).toEqual([]);
  });
});

describe("filterLog's When", () => {
  it("keeps a row later today than now, and cuts a year at its end", () => {
    const tonight = logItems(
      [],
      [entry("tonight", { occurred_at: "2026-11-18", title: "Tonight" })]
    );
    const early = new Date("2026-11-18T06:00:00.000Z");
    const shown = (when: LogFilter["when"]) => {
      const v = filterLog(tonight, { ...NO_LOG_FILTER, when }, ctx, early);
      return v.kind === "dated" ? v.items.length : -1;
    };
    expect(shown("7d")).toBe(1);
    expect(shown("y2025")).toBe(0);
  });
});
