import { describe, expect, it } from "@jest/globals";
import { gradeFormatter } from "@sendtally/features/sessions";
import { changeText } from "../summary/summaryText";
import { headlineLabel, metricText } from "./exerciseText";

describe("grade metrics", () => {
  it("read a value as a grade in its discipline", () => {
    const boulders = gradeFormatter("boulder", "yds");
    expect(metricText(5, "topGrade", "kg", boulders)).toBe("V5");
    expect(metricText(4.25, "averageGrade", "kg", boulders)).toBe("V4.3");
    expect(headlineLabel("averageGrade")).toBe("Average send grade");
  });

  it("read a change in grades", () => {
    expect(changeText({ metric: "topGrade", by: 1 }, "kg")).toBe("+1 grade");
    expect(changeText({ metric: "averageGrade", by: -0.42 }, "kg")).toBe("−0.4 grades");
  });
});
