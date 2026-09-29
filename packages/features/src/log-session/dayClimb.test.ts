import { describe, expect, it, vi } from "vitest";
import type { LogSessionInput, SessionDetail, SessionRow } from "@sendtally/api-client";
import { logClimbOnDay, sessionOnDay, type DayClimbApi } from "./dayClimb";
import { newClimb } from "./transforms";

const row = (over: Partial<SessionDetail>): SessionDetail => ({
  fingerprint: "manual-1",
  board: null,
  source: "manual",
  location: "indoor",
  gym_id: null,
  area_id: null,
  area: null,
  name: "Tuesday night session",
  start_at: "2026-09-27T18:00:00.000Z",
  end_at: "2026-09-27T19:30:00.000Z",
  times: "both",
  climb_count: 1,
  top_grade: 4,
  top_send_grade: 4,
  top_grade_label: "V4",
  top_send_grade_label: "V4",
  notes: null,
  entries: [],
  rpe: 6,
  rpe_source: "computed",
  title: "Tuesday night session",
  strava_activity_id: null,
  posted_at: null,
  post_state: null,
  post_error: null,
  tags: [],
  climbs: [
    {
      time: "2026-09-27T18:00:00.000Z",
      name: "Jug Life",
      vGrade: 4,
      kind: "send",
      tries: 1,
      angle: null,
      note: null,
      link: null,
      grade: { scale: "v", value: 4 },
    },
  ],
  ...over,
});

function fakeApi(sessions: SessionDetail[]): DayClimbApi & { sent: unknown[] } {
  const sent: unknown[] = [];
  const byId = new Map(sessions.map((s) => [s.fingerprint, s]));
  return {
    sent,
    sessions: vi.fn(async () => ({ sessions: sessions as SessionRow[] })),
    session: vi.fn(async (fp: string) => ({ session: byId.get(fp)! })),
    logSession: vi.fn(async (input: LogSessionInput) => {
      sent.push(["POST", input]);
      return { session: row({ fingerprint: "manual-new" }) };
    }),
    updateLoggedSession: vi.fn(async (fp: string, input: LogSessionInput) => {
      sent.push(["PUT", fp, input]);
      return { session: byId.get(fp)! };
    }),
  } as DayClimbApi & { sent: unknown[] };
}

const climb = { ...newClimb("climb-9", "v"), grade: "V5", name: "Crimp Reaper" };

describe("sessionOnDay", () => {
  it("picks the latest logged session of the day and never a board one", () => {
    const sessions = [
      row({ fingerprint: "early", start_at: "2026-09-27T09:00:00.000Z" }),
      row({ fingerprint: "late", start_at: "2026-09-27T20:00:00.000Z" }),
      row({ fingerprint: "board", source: "board", start_at: "2026-09-27T22:00:00.000Z" }),
      row({ fingerprint: "other", start_at: "2026-09-26T20:00:00.000Z" }),
    ];
    expect(sessionOnDay(sessions, "2026-09-27")?.fingerprint).toBe("late");
    expect(sessionOnDay(sessions, "2026-09-20")).toBeNull();
  });
});

describe("logClimbOnDay", () => {
  it("starts a bare unscored session on a day with none", async () => {
    const api = fakeApi([]);
    await logClimbOnDay(api, climb, "2026-09-20", []);
    const [[method, input]] = api.sent as [[string, LogSessionInput]];
    expect(method).toBe("POST");
    expect(input).toEqual({
      date: "2026-09-20",
      unscored: true,
      climbs: [expect.objectContaining({ name: "Crimp Reaper", grade: { scale: "v", value: 5 } })],
    });
  });

  it("appends to that day's session and scores a computed effort again", async () => {
    const api = fakeApi([row({})]);
    await logClimbOnDay(api, climb, "2026-09-27", []);
    const [[method, fp, input]] = api.sent as [[string, string, LogSessionInput]];
    expect([method, fp]).toEqual(["PUT", "manual-1"]);
    expect(input.rpe).toBeUndefined();
    expect(input.name).toBe("Tuesday night session");
    expect(input.climbs.map((c) => c.name)).toEqual(["Jug Life", "Crimp Reaper"]);
  });

  it("keeps an effort the climber gave and leaves an unscored session unscored", async () => {
    const given = fakeApi([row({ rpe: 8, rpe_source: "user" })]);
    await logClimbOnDay(given, climb, "2026-09-27", []);
    expect((given.sent[0] as [string, string, LogSessionInput])[2].rpe).toBe(8);

    const bare = fakeApi([row({ rpe_source: "none", location: null })]);
    await logClimbOnDay(bare, climb, "2026-09-27", []);
    expect((bare.sent[0] as [string, string, LogSessionInput])[2]).toMatchObject({
      unscored: true,
    });
  });
});
