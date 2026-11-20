import { describe, expect, it } from "vitest";
import { effortTile } from "./summaryText";

describe("effortTile", () => {
  it("reads RPE with its metric, over the target with its scale or the RPE's word", () => {
    expect(effortTile(7, 8)).toEqual({ value: "RPE 7", label: "Target RPE 8/10" });
    expect(effortTile(null, 8)).toEqual({ value: "RPE –", label: "Target RPE 8/10" });
    expect(effortTile(7, null)).toEqual({ value: "RPE 7", label: "Hard" });
    expect(effortTile(null, null)).toEqual({ value: "RPE –", label: "not rated" });
  });
});
