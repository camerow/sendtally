import { describe, expect, it } from "vitest";
import type {
  Activity as Logged,
  HangHistoryRow,
  SessionClimb,
  SessionWithClimbs,
} from "@sendtally/api-client";
import { summariseActivity, type Activity } from "./activity";
import { monthSummaryVM } from "./month";
import { overviewVM } from "./overview";
import { topSendVM } from "./topSend";

type Kind = "climb" | "hang" | "strength";
const KINDS: readonly Kind[] = ["climb", "hang", "strength"];
const TODAY = "2026-10-22";

const act = (kind: Kind, date: string, rpe: number | null = 6): Activity<Kind> => ({
  kind,
  date,
  rpe,
});

type ClimbSpec = Partial<SessionClimb> & { vGrade: number };

function climbing(
  start: string,
  rpe: number,
  climbs: ClimbSpec[] = [],
  extra: Partial<SessionWithClimbs> = {}
): SessionWithClimbs {
  return {
    fingerprint: `fp-${start}`,
    board: null,
    source: "manual",
    location: "indoor",
    gym_id: null,
    area_id: null,
    name: null,
    start_at: start,
    end_at: start,
    times: "both",
    climb_count: climbs.length,
    send_count: 0,
    top_grade: 0,
    top_send_grade: 0,
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    rpe,
    rpe_source: "user",
    title: "",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    membership_id: null,
    week: null,
    tags: [],
    climbs: climbs.map((c, i) => ({
      time: start,
      name: `c-${start}-${i}`,
      kind: "send",
      tries: 1,
      style: "redpoint",
      angle: null,
      note: null,
      link: null,
      ...c,
    })),
    ...extra,
  };
}

function hang(date: string, rpe: number | null): HangHistoryRow {
  return {
    id: `h-${date}`,
    workoutId: "rep73",
    gripId: "half",
    gripName: null,
    date,
    loadKg: 4,
    pct: 100,
    misses: 0,
    rpe,
    edgeMm: 20,
    protocol: {
      name: "Repeaters 7:3",
      kind: "hang",
      hangS: 7,
      restS: 3,
      reps: 6,
      sets: 6,
      setRestS: 180,
    },
    stravaActivityId: null,
    membershipId: null,
    week: null,
    done: [],
    postState: null,
    postError: null,
    updatedAt: `${date}T19:00:00.000Z`,
  };
}

describe("summariseActivity", () => {
  it("buckets Monday weeks ending with this one, per kind", () => {
    const s = summariseActivity(
      [
        act("climb", "2026-10-19"),
        act("hang", "2026-10-22"),
        act("strength", "2026-10-18"),
        act("climb", "2026-08-03"),
        act("climb", "2026-08-02"),
      ],
      KINDS,
      TODAY,
      12
    );
    expect(s.weeks).toHaveLength(12);
    expect(s.weeks[0]?.start).toBe("2026-08-03");
    expect(s.weeks[11]?.start).toBe("2026-10-19");
    expect(s.weeks[11]?.sessions).toEqual({ climb: 1, hang: 1, strength: 0 });
    expect(s.weeks[10]?.sessions).toEqual({ climb: 0, hang: 0, strength: 1 });
    expect(s.weeks[0]?.sessions.climb).toBe(1);
    expect(s.sessions).toBe(4);
  });

  it("averages effort across kinds and skips unscored sessions", () => {
    const s = summariseActivity(
      [act("climb", "2026-10-20", 8), act("hang", "2026-10-21", 5), act("hang", TODAY, null)],
      KINDS,
      TODAY,
      12
    );
    expect(s.weeks[11]?.effort).toBe(6.5);
    expect(s.weeks[10]?.effort).toBeNull();
  });

  it("leaves out sessions outside the window and kinds it was not asked for", () => {
    const s = summariseActivity(
      [act("climb", "2026-08-02"), act("climb", "2026-10-26"), act("strength", TODAY)],
      ["climb", "hang"],
      TODAY,
      12
    );
    expect(s.sessions).toBe(0);
  });
});

describe("overviewVM", () => {
  const log = {
    activities: [],
    sessions: [
      climbing("2026-10-20T18:00:00Z", 7),
      climbing("2026-09-01T18:00:00Z", 5),
      climbing("2026-10-21T18:00:00Z", 6, [], { rpe_source: "none" }),
    ],
    hangSessions: [hang("2026-10-22", 9), hang("2026-10-15", null)],
  };
  const vm = overviewVM(log, TODAY, "12w");

  it("splits sessions by kind and reads unscored climbing as no effort", () => {
    expect(vm.sessions).toBe(5);
    expect(vm.perWeek).toBe("0.4");
    expect(vm.perWeekCaption).toBe("a week, 5 sessions");
    expect(vm.weeks[11]?.sessions).toEqual({
      climbing: 2,
      hangboard: 1,
      strength: 0,
      mobility: 0,
      other: 0,
    });
    expect(vm.weeks[11]?.effort).toBe(8);
    expect(vm.mostInAWeek).toBe(3);
    expect(vm.effortNow).toBe("8.0");
    expect(vm.effortChange).toBe("▲ 3.0 since Aug 31");
    expect(vm.kinds.map((k) => k.kind)).toEqual(["climbing", "hangboard"]);
  });

  it("labels every fourth week and this one", () => {
    expect(vm.weeks.map((w) => w.axis)).toEqual([
      "Aug 3",
      "",
      "",
      "",
      "Aug 31",
      "",
      "",
      "",
      "Sep 28",
      "",
      "",
      "Now",
    ]);
    expect(vm.weeks[11]?.label).toBe("Week of Oct 19: Climbing 2, Hangboard 1");
  });

  it("reads a year as 52 weeks", () => {
    const year = overviewVM(log, TODAY, "1y");
    expect(year.weeks).toHaveLength(52);
    expect(year.perWeek).toBe("0.1");
  });

  it("shows climbing alone when asked", () => {
    const climbingOnly = overviewVM(log, TODAY, "12w", ["climbing"]);
    expect(climbingOnly.sessions).toBe(3);
    expect(climbingOnly.weeks[11]?.effort).toBe(7);
    expect(climbingOnly.kinds.map((k) => k.kind)).toEqual(["climbing"]);
    expect(climbingOnly.weeks[10]?.label).toBe("Week of Oct 12: Climbing 0");
  });
});

describe("overviewVM with other training", () => {
  const logged = (kind: Logged["kind"], date: string): Logged => ({
    id: `${kind}-${date}`,
    kind,
    title: kind,
    date,
    startTime: null,
    minutes: 30,
    rpe: 6,
    notes: null,
    workoutId: null,
    membershipId: null,
    week: null,
    done: [],
  });
  const vm = overviewVM(
    {
      sessions: [],
      hangSessions: [],
      activities: [
        logged("strength", TODAY),
        logged("mobility", "2026-10-20"),
        logged("mobility", "2026-10-13"),
        logged("other", "2026-10-14"),
        logged("other", "2026-10-14"),
      ],
    },
    TODAY,
    "12w"
  );

  it("counts each activity under its own kind", () => {
    expect(vm.sessions).toBe(5);
    expect(vm.kinds.map((k) => k.kind)).toEqual(["strength", "mobility", "other"]);
    expect(vm.weeks[11]?.label).toBe("Week of Oct 19: Strength 1, Mobility 1");
  });
});

describe("topSendVM", () => {
  const FIRST = "2026-10-05";
  const purple = { id: "p", label: "", colour: "purple" } as const;

  it("takes the hardest indoor send of each week and skips outdoor, attempts and laps", () => {
    const vm = topSendVM(
      [
        climbing("2026-10-06T18:00:00Z", 6, [
          { vGrade: 3 },
          { vGrade: 5 },
          { vGrade: 9, kind: "attempt" },
        ]),
        climbing("2026-10-08T18:00:00Z", 6, [{ vGrade: 8 }], { location: "outdoor" }),
        climbing("2026-10-20T18:00:00Z", 6, [
          { vGrade: 6, circuit: purple },
          { vGrade: 7, endurance: { unit: "moves", target: 20, laps: [20] } },
        ]),
      ],
      FIRST,
      3
    );
    expect(vm.weeks).toEqual([
      { rank: 5, label: "V5", circuit: null },
      null,
      { rank: 6, label: "Purple", circuit: "purple" },
    ]);
    expect(vm.now).toBe("Purple");
    expect(vm.from).toBe("from V5");
  });

  it("is empty with no indoor send", () => {
    const vm = topSendVM([], FIRST, 3);
    expect(vm.weeks).toEqual([null, null, null]);
    expect(vm.now).toBeNull();
    expect(vm.from).toBeNull();
  });
});

describe("monthSummaryVM", () => {
  const log = {
    activities: [],
    sessions: [
      climbing("2026-10-20T18:00:00Z", 7),
      climbing("2026-09-30T18:00:00Z", 5),
      climbing("2026-10-21T18:00:00Z", 6, [], { rpe_source: "none" }),
    ],
    hangSessions: [hang("2026-10-22", 8), hang("2026-10-01", null)],
  };

  it("counts this month's sessions and averages the scored ones", () => {
    const vm = monthSummaryVM(log, TODAY);
    expect(vm.month).toBe("October");
    expect(vm.line).toBe("4 sessions · effort 7.5");
    expect(vm.weeks).toHaveLength(8);
    expect(vm.weeks.at(-1)).toBe(3);
  });

  it("keeps to the kinds asked for, and says only the count with nothing scored", () => {
    expect(monthSummaryVM(log, TODAY, ["climbing"]).line).toBe("2 sessions · effort 7.0");
    expect(monthSummaryVM({ ...log, sessions: [] }, TODAY, ["climbing"]).line).toBe("0 sessions");
  });
});
