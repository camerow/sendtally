import { describe, expect, it } from "vitest";
import { gradeFormatter } from "../sessions";
import { changeText } from "../activities/summaryText";
import { headlineLabel, metricText, volumeLine } from "./exerciseText";

describe("grade metrics", () => {
  it("read a value as a grade in its discipline", () => {
    const boulders = gradeFormatter("boulder", { boulder: "v", route: "yds" });
    expect(metricText(5, "topGrade", "kg", boulders)).toBe("V5");
    expect(metricText(4.25, "averageGrade", "kg", boulders)).toBe("V4.3");
    expect(headlineLabel("averageGrade")).toBe("Average send grade");
  });

  it("read a change in grades", () => {
    expect(changeText({ metric: "topGrade", by: 1 }, "kg")).toBe("+1 grade");
    expect(changeText({ metric: "averageGrade", by: -0.42 }, "kg")).toBe("−0.4 grades");
  });
});

describe("volume", () => {
  it("reads the score, its change, and what it is made of", () => {
    const boulders = gradeFormatter("boulder", { boulder: "v", route: "yds" });
    expect(metricText(1234, "volume", "kg")).toBe("1,234");
    expect(headlineLabel("volume")).toBe("Total volume score");
    expect(changeText({ metric: "volume", by: -3 }, "kg")).toBe("−3");
    const session = {
      activityId: "a",
      date: "2026-10-01",
      best: {},
      value: 23,
      e1rmKg: null,
      volumeKg: 0,
      average: { grade: 3.6, sends: 5 },
    };
    expect(volumeLine(session, boulders)).toBe("Average V3.6 · 5 sent");
  });
});
