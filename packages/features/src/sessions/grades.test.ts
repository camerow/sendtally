import { describe, expect, it } from "vitest";
import type { SessionRow } from "@sendtally/api-client";
import { climbGradeLabel, gradeFormatter, sessionGradeLabel, sessionGradeLabels } from "./grades";
import { DEFAULT_GRADE_SCALES as SCALES } from "../settings/transforms";

function session(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    fingerprint: "fp",
    board: "tension",
    source: "board",
    location: null,
    gym_id: null,
    area_id: null,
    name: null,
    start_at: "2026-08-08T18:00:00.000Z",
    end_at: "2026-08-08T19:00:00.000Z",
    times: "both",
    climb_count: 3,
    send_count: 0,
    top_grade: 6,
    top_send_grade: 6,
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
    ...overrides,
  };
}

describe("sessionGradeLabels", () => {
  it("shows only the send when the hardest climb was sent", () => {
    expect(sessionGradeLabels(session(), SCALES)).toEqual([{ kind: "sent", label: "SENT V6" }]);
  });

  it("shows the harder attempt separately from the hardest send", () => {
    expect(sessionGradeLabels(session({ top_grade: 8, top_send_grade: 6 }), SCALES)).toEqual([
      { kind: "sent", label: "SENT V6" },
      { kind: "tried", label: "TRIED V8" },
    ]);
  });

  it("shows only the attempt when nothing was sent", () => {
    expect(sessionGradeLabels(session({ top_grade: 8, top_send_grade: -1 }), SCALES)).toEqual([
      { kind: "tried", label: "TRIED V8" },
    ]);
  });

  it("prefers the stored labels so route sessions read in their own scale", () => {
    expect(
      sessionGradeLabels(
        session({
          top_grade: 4,
          top_send_grade: 3,
          top_grade_label: "5.12a",
          top_send_grade_label: "5.11d",
        }),
        SCALES
      )
    ).toEqual([
      { kind: "sent", label: "SENT 5.11d" },
      { kind: "tried", label: "TRIED 5.12a" },
    ]);
  });

  it("shows nothing when no grades are known", () => {
    expect(sessionGradeLabels(session({ top_grade: -1, top_send_grade: -1 }), SCALES)).toEqual([]);
  });
});

describe("climbGradeLabel", () => {
  const font = { boulder: "font", route: "french" } as const;

  it("shows every climb in the climber's scale for its discipline", () => {
    const climbs = [
      { vGrade: 4, grade: { scale: "yds", value: "5.12a" } },
      { vGrade: 3, grade: { scale: "french", value: "7a" } },
      { vGrade: 4, grade: { scale: "font", value: "6B" } },
      { vGrade: 5 },
    ] as const;
    expect(climbs.map((c) => climbGradeLabel(c, SCALES))).toEqual(["5.12a", "5.11d", "V4", "V5"]);
    expect(climbs.map((c) => climbGradeLabel(c, font))).toEqual(["7a+", "7a", "6B", "6C"]);
  });

  it("keeps a grade it cannot convert as logged", () => {
    expect(climbGradeLabel({ vGrade: -1 }, SCALES)).toBe("V?");
    expect(climbGradeLabel({ vGrade: -1 }, font)).toBe("V?");
  });
});

describe("sessionGradeLabel", () => {
  const font = { boulder: "font", route: "french" } as const;

  it("reads a session's stored label in the climber's scale", () => {
    expect(sessionGradeLabel("V6", 6, font)).toBe("7A");
    expect(sessionGradeLabel("7A", 6, SCALES)).toBe("V6");
    expect(sessionGradeLabel("5.11d", 3, font)).toBe("7a");
    expect(sessionGradeLabel("7a", 3, SCALES)).toBe("5.11d");
    expect(sessionGradeLabel("6a", 0, SCALES)).toBe("5.10b");
  });

  it("falls back to the V grade when the row has no label", () => {
    expect(sessionGradeLabel(null, 6, SCALES)).toBe("V6");
    expect(sessionGradeLabel(null, 6, font)).toBe("7A");
  });
});

describe("gradeFormatter", () => {
  it("labels boulder ranks as V grades with one decimal averages", () => {
    const f = gradeFormatter("boulder", { boulder: "v", route: "yds" });
    expect(f.label(4)).toBe("V4");
    expect(f.average(4.25)).toBe("V4.3");
  });

  it("labels route ranks in the chosen route scale and rounds averages to a grade", () => {
    const yds = gradeFormatter("route", { boulder: "v", route: "yds" });
    expect(yds.label(13)).toBe("5.12a");
    expect(yds.average(13.6)).toBe("5.12b");
    expect(gradeFormatter("route", { boulder: "v", route: "french" }).label(13)).toBe("7a+");
  });
});
