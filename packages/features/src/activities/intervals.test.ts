import { describe, expect, it } from "vitest";
import { cleanDetail, detailFromTemplate, detailSummary, templateOf } from "./detail";
import { stepDose, withMeasure, type IntervalsDetail } from "./intervals";

const flow: IntervalsDetail = {
  kind: "intervals",
  rounds: 2,
  steps: [
    { label: " 90/90 ", measure: "time", seconds: 60, restAfter: 10, cue: "  " },
    { label: "Couch stretch", measure: "time", seconds: 45, side: "each", restAfter: 0 },
    { label: "", measure: "time", seconds: 30, restAfter: 0 },
    { label: "Swing", measure: "count", count: 15, loadKg: 24, restAfter: 30, cue: " Hips " },
  ],
  stepsDone: [
    { round: 0, step: 1, side: "L" },
    { round: 0, step: 3, heldSeconds: 4 },
  ],
};

describe("intervals bodies", () => {
  it("saves named steps only, trimmed, and keeps what was done where the step still exists", () => {
    expect(cleanDetail(flow)).toEqual({
      kind: "intervals",
      rounds: 2,
      steps: [
        { label: "90/90", measure: "time", seconds: 60, restAfter: 10 },
        { label: "Couch stretch", measure: "time", seconds: 45, side: "each", restAfter: 0 },
        { label: "Swing", measure: "count", count: 15, loadKg: 24, restAfter: 30, cue: "Hips" },
      ],
      stepsDone: [{ round: 0, step: 1, side: "L" }],
    });
    expect(cleanDetail({ ...flow, steps: [{ ...flow.steps[2]!, label: " " }] })).toBeNull();
  });

  it("turns a run into a template and back with nothing done", () => {
    const template = templateOf(flow);
    expect(template).not.toHaveProperty("stepsDone");
    expect(detailFromTemplate(template)).toMatchObject({ kind: "intervals", stepsDone: [] });
  });

  it("summarises rounds, steps and the time it takes", () => {
    const clean = cleanDetail(flow);
    expect(detailSummary(clean)).toBe("2 rounds · 3 steps · 7 min");
  });

  it("switches between time and count, and describes a step's dose", () => {
    const swing = flow.steps[3]!;
    expect(withMeasure(swing, "time")).toEqual({
      label: "Swing",
      measure: "time",
      seconds: 30,
      loadKg: 24,
      restAfter: 30,
      cue: " Hips ",
    });
    expect(stepDose(swing, "kg")).toBe("× 15 · 24 kg");
    expect(stepDose(flow.steps[1]!, "kg")).toBe("0:45 · each side");
  });
});
