import { describe, expect, it } from "vitest";
import type { SessionDetail } from "@sendtally/api-client";
import {
  convertGrade,
  draftFromSession,
  draftProblem,
  draftSummary,
  durationLabel,
  durationMinutes,
  emptyDraft,
  gradeOptions,
  newClimb,
  nextClimbKey,
  toLogSessionInput,
  vGradeOf,
  withClimbDiscipline,
  withClimbScale,
  withTag,
  withoutTag,
  withClimbOutcome,
  withTries,
  withStartTime,
} from "./transforms";
import { DEFAULT_GRADE_PREFS, sendStyleLabel, sendStylesFor } from "./types";
import type { ClimbDraft, GradeScale, LogSessionDraft } from "./types";

function atScale(d: LogSessionDraft, scale: GradeScale): LogSessionDraft {
  return { ...d, climbs: d.climbs.map((c) => withClimbScale(c, scale)) };
}

function draft(overrides: Partial<LogSessionDraft> = {}): LogSessionDraft {
  return {
    name: "Tuesday board night",
    date: "2026-08-26",
    startTime: "18:30",
    endTime: "20:00",
    location: "indoor",
    tags: [],
    notes: "",
    rpe: null,
    climbs: [
      {
        key: "a",
        scale: "v",
        grade: "V4",
        name: "Cave traverse",
        kind: "send",
        style: "redpoint",
        tries: 2,
        note: "",
      },
      {
        key: "b",
        scale: "v",
        grade: "V6",
        name: "",
        kind: "attempt",
        style: "redpoint",
        tries: 4,
        note: "",
      },
    ],
    ...overrides,
  };
}

describe("gradeOptions", () => {
  it("lists V0-V17 and the Font ladder without the sub-4 grades", () => {
    expect(gradeOptions("v")).toHaveLength(18);
    expect(gradeOptions("v")[0]).toBe("V0");
    expect(gradeOptions("font")).toContain("6C+");
    expect(gradeOptions("font")).not.toContain("3");
  });
});

describe("gradeOptions for routes", () => {
  it("lists the YDS and French ladders", () => {
    expect(gradeOptions("yds")[0]).toBe("5.5");
    expect(gradeOptions("yds")).toContain("5.12a");
    expect(gradeOptions("french")).toContain("7a+");
    expect(gradeOptions("yds")).toHaveLength(gradeOptions("french").length);
  });
});

describe("vGradeOf", () => {
  it("parses both scales", () => {
    expect(vGradeOf("V7", "v")).toBe(7);
    expect(vGradeOf("6C+", "font")).toBe(5);
    expect(vGradeOf("V99", "v")).toBeUndefined();
    expect(vGradeOf("banana", "font")).toBeUndefined();
  });
});

describe("convertGrade", () => {
  it("converts between scales and keeps unknown grades as-is", () => {
    expect(convertGrade("V4", "v", "font")).toBe("6B");
    expect(convertGrade("7A", "font", "v")).toBe("V6");
    expect(convertGrade("mystery", "v", "font")).toBe("mystery");
  });

  it("converts route grades between YDS and French", () => {
    expect(convertGrade("5.12a", "yds", "french")).toBe("7a+");
    expect(convertGrade("6c", "french", "yds")).toBe("5.11b");
  });

  it("crosses disciplines through the effort scale", () => {
    expect(convertGrade("V4", "v", "yds")).toBe("5.12b");
    expect(convertGrade("5.13a", "yds", "v")).toBe("V7");
  });
});

describe("route drafts", () => {
  it("summarises the top route in its own scale and validates route grades", () => {
    const routes = atScale(draft(), "yds");
    expect(routes.climbs.map((c) => c.grade)).toEqual(["5.12b", "5.12d"]);
    expect(draftSummary(routes)).toContain("TOP 5.12d");
    expect(draftProblem(routes)).toBeNull();
    expect(draftProblem({ ...routes, climbs: [{ ...routes.climbs[0]!, grade: "5.10" }] })).toBe(
      "Every climb needs a grade."
    );
  });

  it("starts a new route climb at a sensible default", () => {
    expect(newClimb("k", "yds").grade).toBe("5.10b");
    expect(newClimb("k", "french").grade).toBe("6a");
  });

  it("sends route grades to the API as entered", () => {
    const input = toLogSessionInput(atScale(draft(), "french"));
    expect(input.climbs.map((c) => c.grade)).toEqual([
      { scale: "french", value: "7b" },
      { scale: "french", value: "7c" },
    ]);
  });

  it("rebuilds a route session draft in the scale it was logged in", () => {
    const routeSession = session({
      climbs: [
        {
          ...session().climbs[0]!,
          vGrade: 2,
          grade: { scale: "yds", value: "5.11a" },
        },
        {
          ...session().climbs[1]!,
          vGrade: 4,
          grade: { scale: "yds", value: "5.12a" },
        },
      ],
    });
    const d = draftFromSession(routeSession);
    expect(d.climbs.map((c) => c.scale)).toEqual(["yds", "yds"]);
    expect(d.climbs.map((c) => c.grade)).toEqual(["5.11a", "5.12a"]);
    expect(atScale(d, "french").climbs.map((c) => c.grade)).toEqual(["6b+", "7a+"]);
  });
});

describe("withClimbScale", () => {
  it("converts one climb's grade label and leaves its siblings alone", () => {
    const [first, second] = draft().climbs as [ClimbDraft, ClimbDraft];
    const font = withClimbScale(first, "font");
    expect(font.scale).toBe("font");
    expect(font.grade).toBe("6B");
    expect(second.grade).toBe("V6");
  });

  it("is a no-op when the climb is already in that scale", () => {
    const [first] = draft().climbs as [ClimbDraft];
    expect(withClimbScale(first, "v")).toBe(first);
  });
});

describe("withClimbDiscipline", () => {
  it("moves a climb onto the scale the user prefers for that discipline", () => {
    const [boulder] = draft().climbs as [ClimbDraft];
    const route = withClimbDiscipline(boulder, "route", DEFAULT_GRADE_PREFS);
    expect(route.scale).toBe("yds");
    expect(route.grade).toBe("5.12b");
    expect(withClimbDiscipline(route, "boulder", DEFAULT_GRADE_PREFS).grade).toBe("V4");
  });

  it("honours a non-default preference", () => {
    const [boulder] = draft().climbs as [ClimbDraft];
    const route = withClimbDiscipline(boulder, "route", { boulder: "font", route: "french" });
    expect(route.scale).toBe("french");
    expect(route.grade).toBe("7b");
  });
});

describe("mixed sessions", () => {
  it("validates and summarises a draft holding both boulders and routes", () => {
    const mixed = draft({
      climbs: [
        {
          key: "a",
          scale: "v",
          grade: "V4",
          name: "",
          kind: "send",
          style: "redpoint",
          tries: 1,
          note: "",
        },
        {
          key: "b",
          scale: "yds",
          grade: "5.12d",
          name: "",
          kind: "attempt",
          style: "redpoint",
          tries: 3,
          note: "",
        },
      ],
    });
    expect(draftProblem(mixed)).toBeNull();
    expect(draftSummary(mixed)).toContain("TOP 5.12d");
    expect(toLogSessionInput(mixed).climbs.map((c) => c.grade)).toEqual([
      { scale: "v", value: 4 },
      { scale: "yds", value: "5.12d" },
    ]);
  });
});

describe("send styles", () => {
  const boulder = (): ClimbDraft => ({
    key: "a",
    scale: "v",
    grade: "V4",
    name: "",
    kind: "send",
    style: "redpoint",
    tries: 4,
    note: "",
  });

  it("offers sent and flash on boulders, redpoint, flash and onsight on routes", () => {
    expect(sendStylesFor("boulder")).toEqual(["redpoint", "flash"]);
    expect(sendStylesFor("route")).toEqual(["redpoint", "flash", "onsight"]);
    expect(sendStyleLabel("boulder", "redpoint")).toBe("Sent");
    expect(sendStyleLabel("route", "redpoint")).toBe("Redpoint");
  });

  it("settles the try count at one for a flash or an onsight", () => {
    expect(withClimbOutcome(boulder(), { kind: "send", style: "flash" }).tries).toBe(1);
    expect(withClimbOutcome(boulder(), { kind: "send", style: "redpoint" }).tries).toBe(4);
  });

  it("flashes a send stepped down to one try and unflashes one stepped up", () => {
    expect(withTries(boulder(), 1).style).toBe("flash");
    expect(withTries(withTries(boulder(), 1), 2)).toMatchObject({ style: "redpoint", tries: 2 });
    expect(withTries(withClimbOutcome(boulder(), { kind: "attempt" }), 1).kind).toBe("attempt");
  });

  it("keeps the try count on an attempt", () => {
    const attempt = withClimbOutcome(boulder(), { kind: "attempt" });
    expect(attempt).toMatchObject({ kind: "attempt", tries: 4 });
  });

  it("drops an onsight when a route becomes a boulder", () => {
    const onsighted: ClimbDraft = { ...boulder(), scale: "yds", grade: "5.11a", style: "onsight" };
    expect(withClimbScale(onsighted, "v").style).toBe("redpoint");
    expect(withClimbScale(onsighted, "french").style).toBe("onsight");
  });

  it("sends the style only on a send", () => {
    const both = draft({
      climbs: [
        {
          key: "a",
          scale: "v",
          grade: "V4",
          name: "",
          kind: "send",
          style: "flash",
          tries: 1,
          note: "",
        },
        {
          key: "b",
          scale: "v",
          grade: "V4",
          name: "",
          kind: "attempt",
          style: "redpoint",
          tries: 3,
          note: "",
        },
      ],
    });
    const climbs = toLogSessionInput(both).climbs;
    expect(climbs[0]).toMatchObject({ style: "flash" });
    expect(climbs[1]).not.toHaveProperty("style");
  });

  it("reads a one-try send logged before styles existed back as a flash", () => {
    const legacy = draftFromSession(
      session({
        climbs: [
          {
            time: "2026-08-26T18:30:00.000Z",
            name: "",
            vGrade: 4,
            kind: "send",
            tries: 1,
            angle: null,
            grade: { scale: "v", value: 4 },
            note: null,
            link: null,
          },
        ],
      })
    );
    expect(legacy.climbs[0]?.style).toBe("flash");
  });
});

describe("durationMinutes", () => {
  it("derives duration and wraps past midnight", () => {
    expect(durationMinutes("18:30", "20:00")).toBe(90);
    expect(durationMinutes("23:00", "01:00")).toBe(120);
    expect(durationMinutes("bad", "20:00")).toBeUndefined();
    expect(durationMinutes("09:00", "00:30")).toBeUndefined();
    expect(durationMinutes("18:00", "18:00")).toBeUndefined();
  });

  it("labels durations", () => {
    expect(durationLabel(90)).toBe("1h 30m");
    expect(durationLabel(60)).toBe("1h");
    expect(durationLabel(45)).toBe("45m");
  });
});

describe("emptyDraft", () => {
  it("starts on today with no times", () => {
    const d = emptyDraft(new Date(2026, 7, 26, 20, 2));
    expect(d.date).toBe("2026-08-26");
    expect(d.startTime).toBe("");
    expect(d.endTime).toBe("");
    expect(d.climbs).toHaveLength(1);
    expect(d.rpe).toBeNull();
  });
});

describe("withTag / withoutTag", () => {
  it("adds a trimmed tag and ignores one it already carries", () => {
    const tagged = withTag(draft(), "  Endurance ");
    expect(tagged.tags).toEqual(["Endurance"]);
    expect(withTag(tagged, "endurance").tags).toEqual(["Endurance"]);
  });

  it("ignores an empty tag", () => {
    expect(withTag(draft(), "   ").tags).toEqual([]);
  });

  it("removes a tag whatever its casing", () => {
    expect(withoutTag(draft({ tags: ["Bishop"] }), "bishop").tags).toEqual([]);
  });
});

describe("draftSummary", () => {
  it("summarises climbs, results, top grade, and duration", () => {
    expect(draftSummary(draft())).toBe("2 climbs · 1 send, 1 attempt · TOP V6 · 1h 30m");
  });

  it("uses the active scale for the top grade", () => {
    expect(draftSummary(atScale(draft(), "font"))).toContain("TOP 7A");
  });
});

describe("draftProblem", () => {
  it("accepts a complete draft", () => {
    expect(draftProblem(draft())).toBeNull();
  });

  it("flags missing climbs, bad times, and over-long sessions", () => {
    expect(draftProblem(draft({ climbs: [] }))).toContain("climb");
    expect(draftProblem(draft({ endTime: "" }))).toBeNull();
    expect(draftProblem(draft({ startTime: "", endTime: "" }))).toBeNull();
    expect(toLogSessionInput(draft({ startTime: "", endTime: "" }))).not.toHaveProperty(
      "startTime"
    );
    expect(toLogSessionInput(draft({ startTime: "", endTime: "" }))).not.toHaveProperty("endTime");
    expect(draftProblem(draft({ startTime: "06:00", endTime: "23:00" }))).toContain("12 hours");
  });

  it("names an end before the start rather than blaming the 12-hour rule", () => {
    expect(draftProblem(draft({ startTime: "09:00", endTime: "00:30" }))).toBe(
      "End time is before the start time."
    );
  });

  it("still accepts a session that runs past midnight", () => {
    expect(draftProblem(draft({ startTime: "22:00", endTime: "01:00" }))).toBeNull();
  });
});

describe("withStartTime", () => {
  it("moves the end time by the same amount", () => {
    const moved = withStartTime(draft({ startTime: "18:30", endTime: "20:00" }), "17:15");
    expect(moved).toMatchObject({ startTime: "17:15", endTime: "18:45" });
  });

  it("wraps the end past midnight", () => {
    const moved = withStartTime(draft({ startTime: "18:30", endTime: "20:00" }), "23:30");
    expect(moved.endTime).toBe("01:00");
  });

  it("leaves the end alone when the current pair makes no sense", () => {
    const moved = withStartTime(draft({ startTime: "09:00", endTime: "00:30" }), "10:00");
    expect(moved).toMatchObject({ startTime: "10:00", endTime: "00:30" });
  });
});

describe("toLogSessionInput tags", () => {
  it("omits tags when the draft has none and sends them when it does", () => {
    expect(toLogSessionInput(draft()).tags).toBeUndefined();
    expect(toLogSessionInput(draft({ tags: ["Endurance", "Home"] })).tags).toEqual([
      "Endurance",
      "Home",
    ]);
  });
});

describe("toLogSessionInput", () => {
  it("builds the API payload with per-climb grades", () => {
    expect(toLogSessionInput(draft())).toEqual({
      name: "Tuesday board night",
      date: "2026-08-26",
      startTime: "18:30",
      endTime: "20:00",
      location: "indoor",
      climbs: [
        {
          name: "Cave traverse",
          grade: { scale: "v", value: 4 },
          kind: "send",
          style: "redpoint",
          tries: 2,
        },
        { grade: { scale: "v", value: 6 }, kind: "attempt", tries: 4 },
      ],
    });
  });

  it("carries the RPE override and Font grades", () => {
    const input = toLogSessionInput(atScale(draft({ rpe: 8, name: "  " }), "font"));
    expect(input.rpe).toBe(8);
    expect(input.name).toBeUndefined();
    expect(input.climbs[0]?.grade).toEqual({ scale: "font", value: "6B" });
  });
});

function session(overrides: Partial<SessionDetail> = {}): SessionDetail {
  return {
    fingerprint: "manual-1",
    board: null,
    source: "manual",
    location: "indoor",
    gym_id: null,
    area_id: null,
    area: null,
    name: "Tuesday board night",
    start_at: "2026-08-26T18:30:00.000Z",
    end_at: "2026-08-26T20:00:00.000Z",
    times: "both",
    climb_count: 2,
    top_grade: 6,
    top_send_grade: 4,
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    entries: [],
    rpe: 7,
    title: "Tuesday board night",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    tags: [{ id: "t1", name: "Endurance", slug: "endurance" }],
    climbs: [
      {
        time: "2026-08-26T18:30:00.000Z",
        name: "Cave traverse",
        vGrade: 4,
        kind: "send",
        tries: 2,
        angle: null,
        grade: { scale: "v", value: 4 },
        note: null,
        link: null,
      },
      {
        time: "2026-08-26T20:00:00.000Z",
        name: "",
        vGrade: 6,
        kind: "attempt",
        tries: 4,
        angle: null,
        grade: { scale: "v", value: 6 },
        note: null,
        link: null,
      },
    ],
    ...overrides,
  };
}

describe("draftFromSession", () => {
  it("rebuilds the draft a session was logged from", () => {
    expect(draftFromSession(session())).toEqual({
      name: "Tuesday board night",
      date: "2026-08-26",
      startTime: "18:30",
      endTime: "20:00",
      location: "indoor",
      tags: ["Endurance"],
      notes: "",
      rpe: 7,
      climbs: [
        {
          key: "climb-1",
          scale: "v",
          grade: "V4",
          name: "Cave traverse",
          kind: "send",
          style: "redpoint",
          tries: 2,
          note: "",
        },
        {
          key: "climb-2",
          scale: "v",
          grade: "V6",
          name: "",
          kind: "attempt",
          style: "redpoint",
          tries: 4,
          note: "",
        },
      ],
    });
  });

  it("round-trips back to the same API payload, bar the now-pinned RPE", () => {
    const input = toLogSessionInput(draftFromSession(session()));
    expect(input).toEqual({
      name: "Tuesday board night",
      date: "2026-08-26",
      startTime: "18:30",
      endTime: "20:00",
      rpe: 7,
      location: "indoor",
      tags: ["Endurance"],
      climbs: [
        {
          name: "Cave traverse",
          grade: { scale: "v", value: 4 },
          kind: "send",
          style: "redpoint",
          tries: 2,
        },
        { grade: { scale: "v", value: 6 }, kind: "attempt", tries: 4 },
      ],
    });
  });

  it("keeps the scale the climbs were entered in", () => {
    const fontSession = session({
      climbs: session().climbs.map((c) => ({
        ...c,
        grade: { scale: "font" as const, value: c.vGrade === 4 ? "6B" : "7A" },
      })),
    });
    const d = draftFromSession(fontSession);
    expect(d.climbs.map((c) => c.scale)).toEqual(["font", "font"]);
    expect(d.climbs.map((c) => c.grade)).toEqual(["6B", "7A"]);
  });

  it("orders climbs by the time they were logged, not by array order", () => {
    const reversed = session({ climbs: [...session().climbs].reverse() });
    expect(draftFromSession(reversed).climbs.map((c) => c.grade)).toEqual(["V4", "V6"]);
  });

  it("falls back to the V grade for a climb stored without an entered grade", () => {
    const legacy = session({
      climbs: session().climbs.map(({ grade: _grade, ...c }) => c),
    });
    expect(draftFromSession(legacy).climbs.map((c) => c.grade)).toEqual(["V4", "V6"]);
  });

  it("defaults an unnamed, unlocated session to a usable draft", () => {
    const bare = session({ name: null, location: null, tags: [] });
    const d = draftFromSession(bare);
    expect(d.name).toBe("");
    expect(d.location).toBe("indoor");
    expect(d.tags).toEqual([]);
  });

  it("produces a draft with no problems to report", () => {
    expect(draftProblem(draftFromSession(session()))).toBeNull();
  });
});

describe("toLogSessionInput climb notes", () => {
  it("sends a note only for a named climb, trimmed", () => {
    const withNotes: LogSessionDraft = {
      ...emptyDraft(new Date("2026-09-09T19:00:00")),
      climbs: [
        {
          key: "a",
          scale: "v",
          grade: "V4",
          name: "Moonraker",
          kind: "attempt",
          style: "redpoint" as const,
          tries: 3,
          note: "  Heel slipped off the crux again.  ",
        },
        {
          key: "b",
          scale: "v",
          grade: "V2",
          name: "",
          kind: "send",
          style: "redpoint" as const,
          tries: 1,
          note: "nowhere to keep this",
        },
        {
          key: "c",
          scale: "v",
          grade: "V5",
          name: "Torque",
          kind: "attempt",
          style: "redpoint" as const,
          tries: 2,
          note: "   ",
        },
      ],
    };
    expect(toLogSessionInput(withNotes).climbs.map((c) => c.note)).toEqual([
      "Heel slipped off the crux again.",
      undefined,
      undefined,
    ]);
  });

  it("reads a stored note back into the draft so an edit keeps it", () => {
    const stored = session();
    const draft = draftFromSession({
      ...stored,
      climbs: [{ ...stored.climbs[0]!, note: "Stuck on the crossover" }, stored.climbs[1]!],
    });
    expect(draft.climbs.map((c) => c.note)).toEqual(["Stuck on the crossover", ""]);
    expect(toLogSessionInput(draft).climbs[0]?.note).toBe("Stuck on the crossover");
  });
});

describe("toLogSessionInput project flags", () => {
  it("sends the flag only for climbs the user toggled", () => {
    const draft: LogSessionDraft = {
      ...emptyDraft(new Date("2026-09-09T19:00:00")),
      climbs: [
        {
          key: "a",
          scale: "v",
          grade: "V4",
          name: "Moonraker",
          kind: "send",
          style: "redpoint" as const,
          tries: 1,
          note: "",
          project: true,
        },
        {
          key: "b",
          scale: "v",
          grade: "V5",
          name: "Torque",
          kind: "attempt",
          style: "redpoint" as const,
          tries: 2,
          note: "",
          project: false,
        },
        {
          key: "c",
          scale: "v",
          grade: "V2",
          name: "",
          kind: "send",
          style: "redpoint" as const,
          tries: 1,
          note: "",
        },
      ],
    };
    expect(toLogSessionInput(draft).climbs.map((c) => c.project)).toEqual([true, false, undefined]);
  });
});

describe("nextClimbKey", () => {
  it("continues past the highest key of a picked-up draft", () => {
    const climbs = [newClimb("climb-1", "v"), newClimb("climb-2", "v")];
    expect(nextClimbKey(climbs)).toBe("climb-3");
    expect(nextClimbKey([climbs[1]!])).toBe("climb-3");
    expect(nextClimbKey([])).toBe("climb-1");
  });
});

describe("endurance climbs", () => {
  const endurance = { unit: "moves" as const, target: 32, laps: [32, 32, 24] };

  it("sends the circuit as a one-try redpoint send whatever the draft holds", () => {
    const [first] = toLogSessionInput(
      draft({
        climbs: [
          {
            key: "a",
            scale: "v",
            grade: "V4",
            name: "",
            kind: "attempt",
            style: "flash",
            tries: 5,
            note: "",
            project: true,
            endurance,
          },
        ],
      })
    ).climbs;
    expect(first).toMatchObject({ kind: "send", style: "redpoint", tries: 1, endurance });
    expect(first?.project).toBeUndefined();
  });

  it("reads the circuit back off the stored climb", () => {
    const stored = session({
      climbs: [
        {
          time: "2026-08-26T18:30:00.000Z",
          name: "Red 40",
          vGrade: 3,
          kind: "attempt",
          tries: 9,
          angle: null,
          grade: { scale: "v", value: 3 },
          note: null,
          link: null,
          endurance,
        },
      ],
    });
    expect(draftFromSession(stored).climbs[0]).toMatchObject({
      kind: "send",
      style: "redpoint",
      tries: 1,
      endurance,
    });
  });
});

describe("outdoor crag and climb links", () => {
  const outdoor = (): LogSessionDraft => {
    const base = draft({ location: "outdoor", area: { id: "a1", name: "Buttermilks" } });
    return { ...base, climbs: base.climbs.map((c, i) => (i === 0 ? { ...c, climbId: "c1" } : c)) };
  };

  it("sends the crag and each linked climb", () => {
    const input = toLogSessionInput(outdoor());
    expect(input.areaId).toBe("a1");
    expect(input.climbs[0]?.climbId).toBe("c1");
    expect(input.climbs[1]).not.toHaveProperty("climbId");
  });

  it("leaves them out of an indoor session", () => {
    const input = toLogSessionInput({ ...outdoor(), location: "indoor" });
    expect(input).not.toHaveProperty("areaId");
    expect(input.climbs[0]).not.toHaveProperty("climbId");
  });

  it("prefills the crag and links when editing", () => {
    const base = session();
    const edited = draftFromSession({
      ...base,
      location: "outdoor",
      area_id: "a1",
      area: { id: "a1", name: "Buttermilks", slug: "buttermilks" },
      climbs: base.climbs.map((c, i) =>
        i === 0 ? { ...c, link: { id: "c1", name: "Cave traverse", slug: "cave-traverse" } } : c
      ),
    });
    expect(edited.area).toEqual({ id: "a1", name: "Buttermilks" });
    expect(edited.climbs[0]?.climbId).toBe("c1");
    expect(edited.climbs[1]).not.toHaveProperty("climbId");
  });
});
