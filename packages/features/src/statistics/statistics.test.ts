import { describe, expect, it } from "vitest";
import type { Activity as Logged, HangHistoryRow, SessionLog } from "@sendtally/api-client";
import { summariseActivity, type Activity } from "./activity";
import { overviewVM } from "./overview";

type Kind = "climb" | "hang" | "strength";
const KINDS: readonly Kind[] = ["climb", "hang", "strength"];
const TODAY = "2026-10-22";

const act = (kind: Kind, date: string, minutes = 60, rpe: number | null = 6): Activity<Kind> => ({
  kind,
  date,
  minutes,
  rpe,
});

type SessionRow = SessionLog["sessions"][number];

function climbing(
  start: string,
  end: string,
  rpe: number,
  extra: Partial<SessionRow> = {}
): SessionRow {
  return {
    fingerprint: `fp-${start}`,
    board: null,
    source: "manual",
    location: "indoor",
    gym_id: null,
    area_id: null,
    name: null,
    start_at: start,
    end_at: end,
    times: "both",
    climb_count: 3,
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
    variation: null,
    tags: [],
    ...extra,
  };
}

function hang(date: string, rpe: number | null, pct = 100): HangHistoryRow {
  return {
    id: `h-${date}`,
    workoutId: "rep73",
    gripId: "half",
    gripName: null,
    date,
    loadKg: 4,
    pct,
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
    variation: null,
    done: [],
    postState: null,
    postError: null,
    updatedAt: `${date}T19:00:00.000Z`,
  };
}

describe("summariseActivity", () => {
  it("buckets twelve Monday weeks ending with this one, per kind", () => {
    const s = summariseActivity(
      [
        act("climb", "2026-10-19"),
        act("hang", "2026-10-22", 20),
        act("strength", "2026-10-18", 30),
        act("climb", "2026-08-03"),
        act("climb", "2026-08-02"),
      ],
      KINDS,
      TODAY
    );
    expect(s.weeks).toHaveLength(12);
    expect(s.weeks[0]?.start).toBe("2026-08-03");
    expect(s.weeks[11]?.start).toBe("2026-10-19");
    expect(s.weeks[11]?.sessions).toEqual({ climb: 1, hang: 1, strength: 0 });
    expect(s.weeks[10]?.sessions).toEqual({ climb: 0, hang: 0, strength: 1 });
    expect(s.weeks[0]?.sessions.climb).toBe(1);
    expect(s.sessions).toBe(4);
    expect(s.minutes).toEqual({ climb: 120, hang: 20, strength: 30 });
  });

  it("averages effort across kinds and skips unscored sessions", () => {
    const s = summariseActivity(
      [
        act("climb", "2026-10-20", 60, 8),
        act("hang", "2026-10-21", 20, 5),
        act("hang", TODAY, 20, null),
      ],
      KINDS,
      TODAY
    );
    expect(s.weeks[11]?.effort).toBe(6.5);
    expect(s.weeks[10]?.effort).toBeNull();
  });

  it("counts the streak back from last week while this one is still empty", () => {
    const weeks = ["2026-10-14", "2026-10-07", "2026-09-30", "2026-09-16"];
    expect(
      summariseActivity(
        weeks.map((d) => act("climb", d)),
        KINDS,
        TODAY
      ).streak
    ).toBe(3);
    expect(
      summariseActivity(
        [...weeks, TODAY].map((d) => act("hang", d)),
        KINDS,
        TODAY
      ).streak
    ).toBe(4);
    expect(summariseActivity([act("climb", "2026-10-01")], KINDS, TODAY).streak).toBe(0);
  });

  it("leaves out sessions outside the window and kinds it was not asked for", () => {
    const s = summariseActivity(
      [act("climb", "2026-08-02"), act("climb", "2026-10-26"), act("strength", TODAY)],
      ["climb", "hang"],
      TODAY
    );
    expect(s.sessions).toBe(0);
    expect(s.minutes).toEqual({ climb: 0, hang: 0 });
  });
});

describe("overviewVM", () => {
  const log: SessionLog = {
    activities: [],
    sessions: [
      climbing("2026-10-20T18:00:00Z", "2026-10-20T20:30:00Z", 7),
      climbing("2026-09-01T18:00:00Z", "2026-09-01T19:00:00Z", 5),
      climbing("2026-10-21T18:00:00Z", "2026-10-21T19:00:00Z", 6, { rpe_source: "none" }),
    ],
    hangSessions: [hang("2026-10-22", 9), hang("2026-10-15", null, 50)],
  };
  const vm = overviewVM(log, TODAY);

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

  it("totals climbing time, time on the edge and where the time went", () => {
    expect(vm.stats).toEqual([
      { label: "Sessions", value: "5" },
      { label: "Week streak", value: "2" },
      { label: "Climbing time", value: "4h 30m" },
      { label: "On the edge", value: "6m" },
    ]);
    expect(vm.kinds.map((k) => [k.kind, k.time])).toEqual([
      ["climbing", "4h 30m"],
      ["hangboard", "31m"],
      ["strength", "0m"],
      ["mobility", "0m"],
      ["other", "0m"],
    ]);
  });
});

describe("overviewVM with other training", () => {
  const logged = (kind: Logged["kind"], date: string, minutes: number): Logged => ({
    id: `${kind}-${date}`,
    kind,
    title: kind,
    date,
    startTime: null,
    minutes,
    rpe: 6,
    notes: null,
    workoutId: null,
    membershipId: null,
    week: null,
    variation: null,
    done: [],
  });
  const vm = overviewVM(
    {
      sessions: [],
      hangSessions: [],
      activities: [
        logged("strength", TODAY, 50),
        logged("mobility", "2026-10-20", 30),
        logged("mobility", "2026-10-13", 20),
        logged("other", "2026-10-14", 40),
        logged("other", "2026-10-14", 15),
      ],
    },
    TODAY
  );

  it("counts each activity under its own kind", () => {
    expect(vm.sessions).toBe(5);
    expect(vm.kinds.map((k) => [k.kind, k.minutes])).toEqual([
      ["climbing", 0],
      ["hangboard", 0],
      ["strength", 50],
      ["mobility", 50],
      ["other", 55],
    ]);
    expect(vm.weeks[11]?.label).toBe("Week of Oct 19: Strength 1, Mobility 1");
    expect(vm.stats[1]).toEqual({ label: "Week streak", value: "2" });
  });
});
