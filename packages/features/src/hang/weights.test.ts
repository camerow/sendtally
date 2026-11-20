import { describe, expect, it } from "vitest";
import { fromUnit } from "@sendtally/core/hang";
import { hangLoadText, loadChange, loadLabel, weightText } from "./weights";

describe("weights", () => {
  it("writes a weight in the user's unit with one minus sign", () => {
    expect(weightText(100, "kg")).toBe("100 kg");
    expect(weightText(-20, "kg")).toBe("−20 kg");
    expect(hangLoadText(-5, "kg")).toBe("−5 kg");
    expect(weightText(fromUnit(45, "lb"), "lb")).toContain("45");
  });

  it("calls no added load BW on a hang and keeps a ground pull's weight plain", () => {
    expect(hangLoadText(0, "kg")).toBe("BW");
    expect(loadLabel("hang", 0, "lb")).toBe("BW");
    expect(loadLabel("pull", 20, "kg")).toBe("20 kg");
  });

  it("reads a change as the difference of the two loads it compares", () => {
    expect(loadChange(1, "lb")).toBe("+2.2 lb");
    expect(loadChange(0, "lb")).toBe("Same");
  });
});
