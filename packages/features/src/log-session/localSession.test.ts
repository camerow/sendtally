import { describe, expect, it } from "vitest";
import type { LogSessionInput, SessionDetail, SessionWithClimbs } from "@sendtally/api-client";
import {
  localSession,
  sessionRowOf,
  sessionWithClimbsOf,
  withoutSession,
  withSession,
} from "./localSession";

const input = (over: Partial<LogSessionInput> = {}): LogSessionInput => ({
  name: "Tuesday night session",
  date: "2026-11-02",
  startTime: "18:00",
  endTime: "20:00",
  location: "indoor",
  tags: ["Endurance"],
  notes: "  Felt strong.  ",
  climbs: [
    { name: "Arete", grade: { scale: "v", value: 4 }, kind: "send", tries: 2, note: " Heel " },
    { grade: { scale: "font", value: "6C+" } },
  ],
  ...over,
});

const past = (fingerprint: string, start: string, vGrade: number): SessionWithClimbs =>
  ({
    fingerprint,
    start_at: start,
    end_at: start.replace("T18", "T20"),
    rpe_source: "computed",
    climbs: [{ time: start, vGrade, name: "", kind: "send", tries: 1 }],
  }) as SessionWithClimbs;

describe("localSession", () => {
  it("scores and stores the session the way the server will", () => {
    const session = localSession("manual-1", input(), [], []);
    expect(session).toMatchObject({
      fingerprint: "manual-1",
      source: "manual",
      name: "Tuesday night session",
      title: "Tuesday night session",
      start_at: "2026-11-02T18:00:00.000Z",
      end_at: "2026-11-02T20:00:00.000Z",
      climb_count: 2,
      send_count: 2,
      top_grade: 5,
      rpe_source: "computed",
      notes: "Felt strong.",
      post_state: null,
      strava_activity_id: null,
    });
    expect(session.rpe).toBeGreaterThanOrEqual(1);
    expect(session.climbs.map((c) => [c.name, c.kind, c.tries, c.note])).toEqual([
      ["Arete", "send", 2, "Heel"],
      ["", "send", 1, null],
    ]);
    expect(session.tags).toEqual([{ id: "local-endurance", name: "Endurance", slug: "endurance" }]);
  });

  it("takes the effort the climber gave over the computed one", () => {
    expect(localSession("manual-1", input({ rpe: 9 }), [], [])).toMatchObject({
      rpe: 9,
      rpe_source: "user",
    });
  });

  it("scores against the user's other sessions, never against itself", () => {
    const hard = Array.from({ length: 5 }, (_, i) =>
      past(`manual-h${i}`, `2026-10-0${i + 1}T18:00:00.000Z`, 10)
    );
    const alone = localSession("manual-1", input(), [], []).rpe;
    const against = localSession("manual-1", input(), hard, []).rpe;
    const self = localSession(
      "manual-1",
      input(),
      [past("manual-1", "2026-10-30T18:00:00.000Z", 10)],
      []
    );
    expect(against).not.toBe(alone);
    expect(self.rpe).toBe(alone);
  });

  it("reuses a tag the user already has", () => {
    const tag = { id: "t-1", name: "Endurance", slug: "endurance" };
    expect(localSession("manual-1", input(), [], [tag]).tags).toEqual([tag]);
  });

  it("keeps on an edit what the form does not carry", () => {
    const first = localSession("manual-1", input(), [], []);
    const previous: SessionDetail = {
      ...first,
      strava_activity_id: 42,
      post_state: "posted",
      entries: [{ id: "e-1" } as SessionDetail["entries"][number]],
      climbs: first.climbs.map((c) =>
        c.name === "Arete" ? { ...c, link: { id: "c-1" } as (typeof c)["link"] } : c
      ),
    };
    const edited = localSession("manual-1", input({ name: "Renamed" }), [], [], previous);
    expect(edited).toMatchObject({
      title: "Renamed",
      strava_activity_id: 42,
      post_state: "posted",
    });
    expect(edited.entries).toEqual(previous.entries);
    expect(edited.climbs[0]?.link).toEqual({ id: "c-1" });
  });

  it("keeps the lists newest first, and drops a deleted session from them", () => {
    const older = sessionWithClimbsOf(
      localSession("manual-1", input({ date: "2026-10-01" }), [], [])
    );
    const newer = sessionWithClimbsOf(localSession("manual-2", input(), [], []));
    const list = withSession(withSession([], older), newer);
    expect(list.map((s) => s.fingerprint)).toEqual(["manual-2", "manual-1"]);
    expect(withSession(list, { ...older, title: "Edited" }).map((s) => s.title)).toEqual([
      "Tuesday night session",
      "Edited",
    ]);
    expect(withoutSession(list, "manual-2").map((s) => s.fingerprint)).toEqual(["manual-1"]);
    expect(sessionRowOf(localSession("manual-1", input(), [], []))).not.toHaveProperty("climbs");
  });
});
