import { describe, expect, it } from "vitest";
import { dots, paddedRange, plot, polyline } from "./chartGeometry";

describe("chartGeometry", () => {
  it("spreads values across the box, highest at the top", () => {
    expect(plot([1, 3], 1, 3, 100, 50, 10)).toEqual([
      [10, 40],
      [90, 10],
    ]);
    expect(plot([5], 0, 10, 100, 50, 10)).toEqual([[50, 25]]);
  });

  it("gives a flat series some air", () => {
    expect(paddedRange([20, 21], 2)).toEqual([18, 23]);
    expect(paddedRange([10, 30], 2)).toEqual([10, 30]);
  });

  it("draws points as a line and as dots", () => {
    expect(polyline([[1, 2]])).toBe("1.0,2.0");
    expect(dots([[1, 2]])).toBe("M1.0 2.0h0");
  });
});
