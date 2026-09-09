import { describe, expect, it } from "vitest";
import type { SessionRow } from "@sendtally/api-client";
import { climbGradeLabel, gradeFormatter, routeScaleOf, sessionGradeLabels } from "./grades";

function session(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    fingerprint: "fp",
    board: "tension",
    source: "board",
    location: null,
    name: null,
    start_at: "2026-08-08T18:00:00.000Z",
    end_at: "2026-08-08T19:00:00.000Z",
    climb_count: 3,
    top_grade: 6,
    top_send_grade: 6,
    top_grade_label: null,
    top_send_grade_label: null,
    rpe: 7,
    title: "T",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    inProgress: false,
    tags: [],
    ...overrides,
  };
}

describe("sessionGradeLabels", () => {
  it("shows only the send when the hardest climb was sent", () => {
    expect(sessionGradeLabels(session())).toEqual([{ kind: "sent", label: "SENT V6" }]);
  });

  it("shows the harder attempt separately from the hardest send", () => {
    expect(sessionGradeLabels(session({ top_grade: 8, top_send_grade: 6 }))).toEqual([
      { kind: "sent", label: "SENT V6" },
      { kind: "tried", label: "TRIED V8" },
    ]);
  });

  it("shows only the attempt when nothing was sent", () => {
    expect(sessionGradeLabels(session({ top_grade: 8, top_send_grade: -1 }))).toEqual([
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
        })
      )
    ).toEqual([
      { kind: "sent", label: "SENT 5.11d" },
      { kind: "tried", label: "TRIED 5.12a" },
    ]);
  });

  it("shows nothing when no grades are known", () => {
    expect(sessionGradeLabels(session({ top_grade: -1, top_send_grade: -1 }))).toEqual([]);
  });
});

describe("climbGradeLabel", () => {
  it("formats the grade a climb was logged in and falls back to V", () => {
    expect(climbGradeLabel({ vGrade: 4, grade: { scale: "yds", value: "5.12a" } })).toBe("5.12a");
    expect(climbGradeLabel({ vGrade: 3, grade: { scale: "french", value: "7a" } })).toBe("7a");
    expect(climbGradeLabel({ vGrade: 4, grade: { scale: "font", value: "6B" } })).toBe("6B");
    expect(climbGradeLabel({ vGrade: 5 })).toBe("V5");
    expect(climbGradeLabel({ vGrade: -1 })).toBe("V?");
  });
});

describe("gradeFormatter", () => {
  it("labels boulder ranks as V grades with one decimal averages", () => {
    const f = gradeFormatter("boulder", "yds");
    expect(f.label(4)).toBe("V4");
    expect(f.average(4.25)).toBe("V4.3");
  });

  it("labels route ranks in the chosen route scale and rounds averages to a grade", () => {
    const yds = gradeFormatter("route", "yds");
    expect(yds.label(13)).toBe("5.12a");
    expect(yds.average(13.6)).toBe("5.12b");
    expect(gradeFormatter("route", "french").label(13)).toBe("7a+");
  });
});

describe("routeScaleOf", () => {
  it("picks the scale most of the route climbs were logged in, defaulting to YDS", () => {
    expect(routeScaleOf([])).toBe("yds");
    expect(
      routeScaleOf([
        { vGrade: 3, grade: { scale: "french", value: "7a" } },
        { vGrade: 3, grade: { scale: "french", value: "6c" } },
        { vGrade: 3, grade: { scale: "yds", value: "5.11d" } },
      ])
    ).toBe("french");
  });
});
