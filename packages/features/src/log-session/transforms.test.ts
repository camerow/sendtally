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
  toLogSessionInput,
  vGradeOf,
  withScale,
  withTag,
  withoutTag,
} from "./transforms";
import type { LogSessionDraft } from "./types";

function draft(overrides: Partial<LogSessionDraft> = {}): LogSessionDraft {
  return {
    name: "Tuesday board night",
    date: "2026-08-26",
    startTime: "18:30",
    endTime: "20:00",
    location: "indoor",
    tags: [],
    scale: "v",
    rpe: null,
    climbs: [
      { key: "a", grade: "V4", name: "Cave traverse", kind: "send", tries: 2 },
      { key: "b", grade: "V6", name: "", kind: "attempt", tries: 4 },
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
});

describe("withScale", () => {
  it("converts every climb's grade label", () => {
    const font = withScale(draft(), "font");
    expect(font.scale).toBe("font");
    expect(font.climbs.map((c) => c.grade)).toEqual(["6B", "7A"]);
  });
});

describe("durationMinutes", () => {
  it("derives duration and wraps past midnight", () => {
    expect(durationMinutes("18:30", "20:00")).toBe(90);
    expect(durationMinutes("23:00", "01:00")).toBe(120);
    expect(durationMinutes("bad", "20:00")).toBeUndefined();
  });

  it("labels durations", () => {
    expect(durationLabel(90)).toBe("1H 30M");
    expect(durationLabel(60)).toBe("1H");
    expect(durationLabel(45)).toBe("45M");
  });
});

describe("emptyDraft", () => {
  it("defaults to a 90-minute window ending now", () => {
    const d = emptyDraft(new Date(2026, 7, 26, 20, 2));
    expect(d.date).toBe("2026-08-26");
    expect(d.startTime).toBe("18:30");
    expect(d.endTime).toBe("20:00");
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
    expect(draftSummary(draft())).toBe("2 CLIMBS · 1 SEND, 1 ATTEMPT · TOP V6 · 1H 30M");
  });

  it("uses the active scale for the top grade", () => {
    expect(draftSummary(withScale(draft(), "font"))).toContain("TOP 7A");
  });
});

describe("draftProblem", () => {
  it("accepts a complete draft", () => {
    expect(draftProblem(draft())).toBeNull();
  });

  it("flags missing climbs, bad times, and over-long sessions", () => {
    expect(draftProblem(draft({ climbs: [] }))).toContain("climb");
    expect(draftProblem(draft({ endTime: "" }))).toContain("time");
    expect(draftProblem(draft({ startTime: "18:00", endTime: "07:00" }))).toContain("12 hours");
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
        { name: "Cave traverse", grade: { scale: "v", value: 4 }, kind: "send", tries: 2 },
        { grade: { scale: "v", value: 6 }, kind: "attempt", tries: 4 },
      ],
    });
  });

  it("carries the RPE override and Font grades", () => {
    const input = toLogSessionInput(withScale(draft({ rpe: 8, name: "  " }), "font"));
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
    name: "Tuesday board night",
    start_at: "2026-08-26T18:30:00.000Z",
    end_at: "2026-08-26T20:00:00.000Z",
    climb_count: 2,
    top_grade: 6,
    top_send_grade: 4,
    rpe: 7,
    title: "Tuesday board night",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    inProgress: false,
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
      },
      {
        time: "2026-08-26T20:00:00.000Z",
        name: "",
        vGrade: 6,
        kind: "attempt",
        tries: 4,
        angle: null,
        grade: { scale: "v", value: 6 },
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
      scale: "v",
      rpe: 7,
      climbs: [
        { key: "climb-1", grade: "V4", name: "Cave traverse", kind: "send", tries: 2 },
        { key: "climb-2", grade: "V6", name: "", kind: "attempt", tries: 4 },
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
        { name: "Cave traverse", grade: { scale: "v", value: 4 }, kind: "send", tries: 2 },
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
    expect(d.scale).toBe("font");
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
