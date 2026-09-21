import { describe, expect, it } from "vitest";
import type { ClimbSummary, SessionWithClimbs } from "@sendtally/api-client";
import { projectDetailVM, projectsOverview } from "./projects";

const NOW = new Date("2026-09-11T12:00:00.000Z");

const climb = (overrides: Partial<ClimbSummary>): ClimbSummary => ({
  slug: "moonraker",
  name: "Moonraker",
  grade: { scale: "v", value: 7 },
  discipline: "boulder",
  project: true,
  sessions: 2,
  attempts: 11,
  sends: 0,
  first_at: "2026-06-03T18:00:00.000Z",
  last_at: "2026-09-04T18:00:00.000Z",
  ...overrides,
});

const session = (
  startIso: string,
  climbs: Array<{ name: string; kind?: "send" | "attempt"; tries?: number; note?: string }>,
  notes: string | null = null
): SessionWithClimbs => ({
  fingerprint: `fp-${startIso}`,
  board: null,
  source: "manual",
  location: "indoor",
  gym_id: null,
  area_id: null,
  name: "Tuesday night session",
  start_at: startIso,
  end_at: startIso,
  times: "both",
  climb_count: climbs.length,
  top_grade: 7,
  top_send_grade: -1,
  top_grade_label: null,
  top_send_grade_label: null,
  rpe: 7,
  title: "",
  notes,
  strava_activity_id: null,
  posted_at: null,
  post_state: null,
  post_error: null,
  tags: [],
  climbs: climbs.map((c) => ({
    time: startIso,
    name: c.name,
    vGrade: 7,
    kind: c.kind ?? "attempt",
    tries: c.tries ?? 1,
    angle: null,
    note: c.note ?? null,
    link: null,
  })),
});

describe("projectDetailVM", () => {
  const sessions = [
    session(
      "2026-09-04T18:00:00.000Z",
      [{ name: "Moonraker", tries: 7, note: "Stuck on the crossover" }],
      "Busy Friday, shared the wall"
    ),
    session("2026-06-03T18:00:00.000Z", [
      { name: "moonraker", tries: 4, note: "First look, every move goes" },
      { name: "Warm up", kind: "send", note: "not this climb" },
    ]),
  ];

  it("reads the sessions invested newest first and the bars oldest first", () => {
    const vm = projectDetailVM(climb({}), sessions, NOW);
    expect(vm.sessions.map((s) => [s.dateLabel, s.attempts])).toEqual([
      ["4 Sep", 7],
      ["3 Jun", 4],
    ]);
    expect(vm.sessions[0]?.note).toBe("Stuck on the crossover");
    expect(vm.bars.map((b) => b.valueLabel)).toEqual(["4", "7"]);
    expect(vm.bars[1]?.peak).toBe(true);
    expect(vm.stats.map((s) => [s.label, s.value])).toEqual([
      ["Attempts", "11"],
      ["Sessions", "2"],
      ["Running", "14 weeks"],
      ["Last tried", "4 Sep"],
    ]);
    expect(vm.storyLabel).toBeNull();
  });

  it("rolls the per-climb notes up newest first, ignoring other climbs' notes", () => {
    const vm = projectDetailVM(climb({}), sessions, NOW);
    expect(vm.notes).toEqual([
      {
        fingerprint: "fp-2026-09-04T18:00:00.000Z",
        dateLabel: "4 Sep",
        note: "Stuck on the crossover",
      },
      {
        fingerprint: "fp-2026-06-03T18:00:00.000Z",
        dateLabel: "3 Jun",
        note: "First look, every move goes",
      },
    ]);
  });

  it("leaves the notes empty when no session carries one for this climb", () => {
    const vm = projectDetailVM(
      climb({}),
      [session("2026-09-04T18:00:00.000Z", [{ name: "Moonraker" }])],
      NOW
    );
    expect(vm.notes).toEqual([]);
    expect(vm.sessions[0]?.note).toBeNull();
  });

  it("tells the send story once it goes", () => {
    const vm = projectDetailVM(climb({ sends: 1, attempts: 42, sessions: 7 }), sessions, NOW);
    expect(vm.status).toBe("sent");
    expect(vm.storyLabel).toBe("42 attempts over 7 sessions");
    expect(vm.stats[2]).toEqual({ label: "Took", value: "13 weeks" });
  });

  it("labels a project with no grade by its discipline", () => {
    const vm = projectDetailVM(
      climb({ grade: null, discipline: "route", sessions: 0, attempts: 0 }),
      [],
      NOW
    );
    expect(vm.gradeLabel).toBeNull();
    expect(vm.disciplineLabel).toBe("Route");
    expect(vm.stats[2]).toEqual({ label: "Running", value: "-" });
    expect(vm.stats[3]).toEqual({ label: "Last tried", value: "-" });
  });
});

describe("projectsOverview", () => {
  it("totals open work and averages what a send costs", () => {
    const vm = projectsOverview(
      [
        climb({}),
        climb({ slug: "blue-crux", name: "Blue Crux", first_at: "2026-04-12T18:00:00.000Z" }),
        climb({ slug: "sandbagger", name: "Sandbagger", sends: 1, attempts: 42, sessions: 7 }),
        climb({
          slug: "low-ceiling",
          name: "Low Ceiling",
          grade: { scale: "v", value: 6 },
          sends: 1,
          attempts: 10,
          sessions: 3,
        }),
        climb({ slug: "unflagged", name: "Unflagged", project: false }),
      ],
      NOW
    );
    expect(vm.open).toBe(2);
    expect(vm.sent).toBe(2);
    expect(vm.attemptsInvested).toBe(22);
    expect(vm.avgAttemptsToSend).toBe(26);
    expect(vm.longestRunning?.name).toBe("Blue Crux");
    expect(vm.longestRunning?.value).toBe("22 weeks");
    expect(vm.mostSessions?.name).toBe("Sandbagger");
    expect(vm.hardestSentLabel).toBe("V7");
  });

  it("has nothing to say without projects", () => {
    const vm = projectsOverview([climb({ project: false })], NOW);
    expect(vm).toMatchObject({
      open: 0,
      sent: 0,
      attemptsInvested: 0,
      avgAttemptsToSend: null,
      longestRunning: null,
      mostSessions: null,
      hardestSentLabel: null,
    });
  });
});
